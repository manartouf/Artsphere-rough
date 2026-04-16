import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosConfig";
import LoadingSpinner from "../components/LoadingSpinner";
import CountdownTimer from "../components/CountdownTimer";

const Auctions = () => {
  const navigate = useNavigate();
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [endedAuctions, setEndedAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("live");

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const { data } = await API.get("/auctions/all");
        setLiveAuctions(data.live || []);
        setEndedAuctions(data.ended || []);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    };
    fetchAuctions();
  }, []);

  const getPreview = (auction) => {
    const arts = auction.collectionId?.artworks || [];
    const found = arts.find(a => a.imageUrl || a.image);
    return found?.imageUrl || found?.image || null;
  };

  const getSoldCount = (auction) =>
    (auction.collectionId?.artworks || []).filter(a => a.isSold).length;

  const getTotalRevenue = (auction) =>
    (auction.collectionId?.artworks || []).reduce((s, a) => s + (a.isSold ? (a.soldPrice || 0) : 0), 0);

  if (loading) return <LoadingSpinner />;

  const displayAuctions = activeTab === "live" ? liveAuctions : endedAuctions;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 text-white">

      <div className="mb-8 fade-up">
        <p className="text-[#6c3483] text-sm font-bold uppercase tracking-widest mb-2">ArtSphere</p>
        <h1 className="text-4xl font-black text-white" style={{ fontFamily: "Georgia, serif" }}>
          Auctions
        </h1>
        <p className="text-gray-400 mt-2">
          Join live auctions or browse past results.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setActiveTab("live")}
          className={`px-5 py-2 rounded-full text-sm font-bold transition flex items-center gap-2 ${
            activeTab === "live"
              ? "bg-green-700 text-white"
              : "bg-[#1e1e38] text-gray-400 border border-gray-700 hover:border-green-700"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Live ({liveAuctions.length})
        </button>
        <button
          onClick={() => setActiveTab("ended")}
          className={`px-5 py-2 rounded-full text-sm font-bold transition ${
            activeTab === "ended"
              ? "bg-gray-600 text-white"
              : "bg-[#1e1e38] text-gray-400 border border-gray-700 hover:border-gray-500"
          }`}
        >
          ⚫ Ended ({endedAuctions.length})
        </button>
      </div>

      {displayAuctions.length === 0 ? (
        <div className="text-center py-20 text-gray-500 bg-[#1e1e38] border border-gray-800 rounded-xl">
          <p className="text-4xl mb-4">{activeTab === "live" ? "🔨" : "⚫"}</p>
          <p className="text-lg">
            {activeTab === "live" ? "No live auctions right now." : "No ended auctions yet."}
          </p>
          {activeTab === "live" && (
            <p className="text-sm mt-2">Check back soon — artists are always scheduling new auctions.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayAuctions.map(auction => {
            const preview = getPreview(auction);
            const artworks = auction.collectionId?.artworks || [];
            const soldCount = getSoldCount(auction);
            const firstUnsold = artworks.find(a => !a.isSold);
            const revenue = getTotalRevenue(auction);
            const isLive = activeTab === "live";

            return (
              <div
                key={auction._id}
                onClick={() => {
                  if (isLive && firstUnsold) navigate(`/auction/${firstUnsold._id}`);
                  else if (!isLive && artworks[0]) navigate(`/art/${artworks[0]._id}`);
                }}
                className={`bg-[#1e1e38] border rounded-xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-all duration-300 group fade-up ${
                  isLive ? "border-gray-800 hover:border-green-600" : "border-gray-800 hover:border-gray-600"
                }`}
              >
                <div className="relative h-52 bg-[#16162a]">
                  {preview ? (
                    <img src={preview} alt={auction.collectionId?.name}
                      className={`w-full h-full object-cover transition ${isLive ? "group-hover:brightness-110" : "opacity-70 group-hover:opacity-80"}`} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl text-gray-700">
                      {isLive ? "🔨" : "⚫"}
                    </div>
                  )}
                  {!isLive && <div className="absolute inset-0 bg-black/30" />}

                  <div className={`absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
                    isLive
                      ? "bg-green-900/90 border border-green-700 text-green-400"
                      : "bg-gray-900/90 border border-gray-700 text-gray-400"
                  }`}>
                    {isLive ? (
                      <><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> LIVE</>
                    ) : "⚫ ENDED"}
                  </div>

                  <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {soldCount}/{artworks.length} sold
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-white text-xl truncate" style={{ fontFamily: "Georgia, serif" }}>
                    {auction.collectionId?.name || "Unnamed Collection"}
                  </h3>
                  <p className={`text-sm ${isLive ? "text-[#6c3483]" : "text-gray-400"}`}>
                    By {auction.artistId?.name || "Unknown Artist"}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {artworks.length} artwork{artworks.length !== 1 ? "s" : ""}
                  </p>

                  {isLive && firstUnsold?.auctionEndTime && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-gray-500 text-xs">Current slot ends:</span>
                      <CountdownTimer endTime={firstUnsold.auctionEndTime} />
                    </div>
                  )}

                  {!isLive && revenue > 0 && (
                    <p className="text-[#6c3483] font-bold text-sm">
                      Total sold: ${revenue.toLocaleString()}
                    </p>
                  )}

                  <button className={`w-full mt-2 py-2 rounded-lg text-sm font-bold transition ${
                    isLive
                      ? "bg-green-700 hover:bg-green-600 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-white"
                  }`}>
                    {isLive ? "Enter Auction →" : "View Results →"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Auctions;