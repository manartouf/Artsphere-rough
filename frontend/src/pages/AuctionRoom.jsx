import { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../api/axiosConfig";
import { AuthContext } from "../context/AuthContext";
import GalleryWallCard from "../components/GalleryWallCard";
import LoadingSpinner from "../components/LoadingSpinner";
import CountdownTimer from "../components/CountdownTimer";
import toast from "react-hot-toast";

const AuctionRoom = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [auction, setAuction] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [currentArtIndex, setCurrentArtIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentBid, setCurrentBid] = useState(0);
  const [startingPrice, setStartingPrice] = useState(0);
  const [totalBids, setTotalBids] = useState(0);
  const [highestBidder, setHighestBidder] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);
  const [bidding, setBidding] = useState(false);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const [soldCountdown, setSoldCountdown] = useState(null);
  const countdownTimers = useRef([]);
  const bidHistoryRef = useRef(null);

  const currentArt = artworks[currentArtIndex];

  // ── Load auction ─────────────────────────────────────────
  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const { data: auctionData } = await API.get(`/auctions/${id}`);
        setAuction(auctionData);
        if (auctionData.status === "ended") setAuctionEnded(true);

        if (auctionData.collectionId?.artworks?.length > 0) {
          const arts = auctionData.collectionId.artworks;
          setArtworks(arts);

          const firstUnsoldIdx = arts.findIndex(a => !a.isSold);
          if (firstUnsoldIdx === -1) {
            setAuctionEnded(true);
            setCurrentArtIndex(0);
            return;
          }

          setCurrentArtIndex(firstUnsoldIdx);
          const artData = await API.get(`/art/${arts[firstUnsoldIdx]._id}`);
          const sp = artData.data.auctionStartPrice || artData.data.price || 0;
          setStartingPrice(sp);
          setCurrentBid(artData.data.currentBid || sp);
          setTotalBids(artData.data.bids?.length || 0);
          setBidHistory(artData.data.bids || []);
          setHighestBidder(artData.data.highestBidder || null);

          // If already has bids, start countdown
          
        }
      } catch {
        toast.error("Failed to load auction");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchAuction();

    if (user?.role === "buyer") {
      API.get("/users/wallet").then(({ data }) => setWalletBalance(data.walletBalance)).catch(() => {});
    }
  }, [id]);

  // ── Socket.io ────────────────────────────────────────────
  useEffect(() => {
    if (!auction) return;

    socketRef.current = io(import.meta.env.VITE_API_URL);
    socketRef.current.emit("joinAuction", id);

    socketRef.current.on("bidUpdate", (data) => {
      if (data.artId && currentArt && String(data.artId) !== String(currentArt._id)) return;

      setCurrentBid(data.currentBid);
      setTotalBids(data.totalBids || 0);
      if (data.highestBidder) setHighestBidder(data.highestBidder);
      if (data.bids) setBidHistory(data.bids);
      if (bidHistoryRef.current) bidHistoryRef.current.scrollTop = 0;

      // Reset and restart countdown on every new bid
      clearCountdownTimers();
      setSoldCountdown(null);
      startSoldCountdown();
    });

    socketRef.current.on("auctionEnded", () => {
      setAuctionEnded(true);
      toast("🏁 Auction has ended!", { icon: "🎨" });
    });

    return () => {
      socketRef.current?.disconnect();
      clearCountdownTimers();
    };
  }, [auction, currentArt]);

  const clearCountdownTimers = () => {
    countdownTimers.current.forEach(t => clearTimeout(t));
    countdownTimers.current = [];
  };

  const startSoldCountdown = () => {
    clearCountdownTimers();
    const t1 = setTimeout(() => setSoldCountdown("once"), 5000);
    const t2 = setTimeout(() => setSoldCountdown("twice"), 10000);
    const t3 = setTimeout(() => {
      setSoldCountdown("sold");
      handleArtworkSold();
    }, 15000);
    countdownTimers.current = [t1, t2, t3];
  };

  const handleArtworkSold = () => {
    if (highestBidder && String(user?._id) === String(highestBidder._id)) {
      toast.success(`🎉 Congratulations! You won "${currentArt?.title}" for $${currentBid}!`);
    }

    setTimeout(() => {
      setArtworks(prev => {
        const updated = [...prev];
        if (updated[currentArtIndex]) {
          updated[currentArtIndex] = { ...updated[currentArtIndex], isSold: true, soldPrice: currentBid };
        }

        const nextIdx = updated.findIndex((a, i) => i > currentArtIndex && !a.isSold);
        if (nextIdx !== -1) {
          setCurrentArtIndex(nextIdx);
          const nextArt = updated[nextIdx];
          const sp = nextArt.auctionStartPrice || nextArt.price || 0;
          setStartingPrice(sp);
          setCurrentBid(sp);
          setTotalBids(0);
          setBidHistory([]);
          setHighestBidder(null);
          setSoldCountdown(null);
          toast(`🎨 Next: "${nextArt.title}" — Bidding starts now!`);
        } else {
          setAuctionEnded(true);
          setSoldCountdown(null);
          toast("🏁 All artworks sold! Auction complete.", { icon: "🎉" });
        }
        return updated;
      });
    }, 3000);
  };

  // Bid = startingPrice + (10% of startingPrice * bid number)
  const increment = Math.ceil(startingPrice * 0.1) || 1;
  const nextBidAmount = startingPrice + increment * (totalBids + 1);

  const handlePlaceBid = async () => {
    if (!currentArt) return;

    if (walletBalance !== null && nextBidAmount > walletBalance) {
      toast.error(`Insufficient wallet balance. Your balance: $${walletBalance}`);
      return;
    }

    setBidding(true);
    try {
      await API.post(`/art/${currentArt._id}/bid`, { amount: nextBidAmount });
      toast.success(`Bid placed: $${nextBidAmount} 🎨`);
      if (user?.role === "buyer") {
        const { data } = await API.get("/users/wallet");
        setWalletBalance(data.walletBalance);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place bid");
    } finally {
      setBidding(false);
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  if (loading) return <LoadingSpinner />;
  if (!auction) return <div className="text-center text-gray-500 py-20">Auction not found.</div>;

  const isActive = auction.status === "approved" && !auctionEnded && !!currentArt && !currentArt.isSold;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 text-white">

      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[#6c3483] text-sm font-bold uppercase tracking-widest mb-1">Live Auction</p>
            <h1 className="text-4xl font-black text-white" style={{ fontFamily: "Georgia, serif" }}>
              {auction.collectionId?.name || "Auction"}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Artwork {currentArtIndex + 1} of {artworks.length} · {artworks.filter(a => a.isSold).length} sold
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${
            isActive ? "bg-green-900/40 text-green-400 border-green-700" : "bg-gray-800 text-gray-400 border-gray-700"
          }`}>
            {isActive ? <><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />LIVE</> : <>⚫ ENDED</>}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 mb-10" />

      {/* Going once / twice / SOLD */}
      {soldCountdown && (
        <div className={`rounded-xl p-6 text-center mb-8 border ${
          soldCountdown === "sold" ? "bg-red-900/30 border-red-700" : "bg-yellow-900/30 border-yellow-700"
        }`}>
          {soldCountdown === "sold" ? (
            <>
              <p className="text-5xl font-black text-red-500 animate-pulse">🔨 SOLD!</p>
              <p className="text-white font-bold text-xl mt-2">{currentArt?.title}</p>
              {highestBidder && (
                <p className="text-gray-300 text-sm mt-2">
                  Won by <span className="text-[#6c3483] font-bold">{highestBidder.name}</span> for{" "}
                  <span className="text-white font-bold">${currentBid}</span>
                </p>
              )}
            </>
          ) : soldCountdown === "twice" ? (
            <p className="text-3xl font-black text-yellow-400 animate-pulse">⚡ Going twice...</p>
          ) : (
            <p className="text-3xl font-black text-yellow-300 animate-pulse">🔔 Going once...</p>
          )}
        </div>
      )}

      {/* Auction ended */}
      {auctionEnded && !soldCountdown && (
        <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-6 text-center mb-8">
          <p className="text-2xl mb-2">🏁</p>
          <p className="text-white font-bold text-lg">Auction Has Ended</p>
          <p className="text-gray-400 text-sm mt-1">
            {artworks.filter(a => a.isSold).length} of {artworks.length} artworks sold
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        <div className="xl:col-span-2">
          {artworks.length > 0 ? (
            <GalleryWallCard
              artworks={artworks}
              mode="auction"
              currentBid={currentBid}
              user={user}
              onBid={null}
              initialIndex={currentArtIndex}
            />
          ) : (
            <div className="text-center text-gray-500 py-20 bg-[#1e1e38] rounded-xl border border-gray-800">
              <p className="text-4xl mb-4">🎨</p>
              <p>No artworks in this collection.</p>
            </div>
          )}
        </div>

        <div className="space-y-4">

          {/* Current artwork */}
          {currentArt && (
            <div className="bg-[#1e1e38] border border-gray-800 rounded-xl p-5 space-y-1">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Now Bidding</p>
              <p className="text-white font-black text-lg">{currentArt.title}</p>
              <p className="text-gray-400 text-sm">By {currentArt.artist?.name || "Unknown"}</p>
            </div>
          )}

          {/* Bid info */}
          <div className="bg-[#1e1e38] border border-gray-800 rounded-xl p-6 space-y-4">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Starting Price</p>
              <p className="text-white font-bold text-lg">${startingPrice}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Current Highest Bid</p>
              <p className="text-4xl font-black text-[#6c3483]">${currentBid}</p>
            </div>
            {highestBidder && (
              <p className="text-gray-400 text-sm">
                Leading: <span className="text-white font-bold">{highestBidder?.name || "Anonymous"}</span>
              </p>
            )}
            <p className="text-gray-500 text-xs">Bids placed: {totalBids}</p>

            {user?.role === "buyer" && walletBalance !== null && (
              <div className="border-t border-gray-800 pt-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Your Wallet</p>
                <p className={`text-xl font-black mt-1 ${walletBalance < nextBidAmount ? "text-red-400" : "text-green-400"}`}>
                  ${walletBalance}
                </p>
              </div>
            )}

            {auction.startTime && !auctionEnded && (
              <div className="border-t border-gray-800 pt-4 space-y-1">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Auction Time Remaining</p>
                <CountdownTimer
                  endTime={new Date(
                    new Date(auction.startTime).getTime() +
                    (auction.durationHours || 24) * 60 * 60 * 1000
                  ).toISOString()}
                />
              </div>
            )}
          </div>

          {/* Bid button */}
          {isActive && user?.role === "buyer" && (
            <div className="bg-[#1e1e38] border border-gray-800 rounded-xl p-6 space-y-4">
              <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">Place Your Bid</h3>
              <div className="bg-[#16162a] rounded-lg p-4 text-center space-y-1">
                <p className="text-gray-400 text-xs">Your next bid</p>
                <p className="text-3xl font-black text-[#6c3483]">${nextBidAmount}</p>
                <p className="text-gray-500 text-xs">
                  Bid #{totalBids + 1} · +${increment} per bid (10% of ${startingPrice})
                </p>
              </div>
              <button
                onClick={handlePlaceBid}
                disabled={bidding || (walletBalance !== null && nextBidAmount > walletBalance) || soldCountdown === "sold"}
                className="w-full bg-[#6c3483] py-4 rounded-lg font-black text-white text-lg hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bidding ? "Placing Bid..." : `Bid $${nextBidAmount} 🎨`}
              </button>
              {walletBalance !== null && nextBidAmount > walletBalance && (
                <p className="text-red-400 text-xs text-center">Insufficient wallet balance</p>
              )}
            </div>
          )}

          {isActive && !user && (
            <div className="bg-[#1e1e38] border border-gray-800 rounded-xl p-6 text-center space-y-3">
              <p className="text-gray-400 text-sm">Login to participate</p>
              <button onClick={() => navigate("/login")} className="w-full bg-[#6c3483] py-3 rounded-lg font-bold text-white hover:bg-opacity-90 transition">
                Login to Bid
              </button>
            </div>
          )}

          {isActive && user && user.role !== "buyer" && (
            <div className="bg-[#1e1e38] border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-gray-500 text-sm">Only buyers can place bids</p>
            </div>
          )}

          {/* Bid history */}
          <div className="bg-[#1e1e38] border border-gray-800 rounded-xl p-6">
            <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-4">Bid History</h3>
            <div ref={bidHistoryRef} className="space-y-3 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "#6c3483 #1a1a2e" }}>
              {bidHistory.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-4">No bids yet. Be the first!</p>
              ) : (
                [...bidHistory].reverse().map((bid, i) => (
                  <div key={i} className={`flex justify-between items-center py-2 border-b border-gray-800 ${i === 0 ? "text-white" : "text-gray-400"}`}>
                    <div>
                      <p className="text-sm font-bold">
                        {bid.bidder?.name || "Anonymous"}
                        {i === 0 && <span className="ml-2 text-xs text-[#6c3483] font-bold">WINNING</span>}
                      </p>
                      <p className="text-xs text-gray-600">{timeAgo(bid.time || bid.createdAt)}</p>
                    </div>
                    <span className={`font-black ${i === 0 ? "text-[#6c3483]" : ""}`}>${bid.amount}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 border-t border-gray-800 pt-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-[#6c3483] text-sm transition">← Go back</button>
      </div>
    </div>
  );
};

export default AuctionRoom;
