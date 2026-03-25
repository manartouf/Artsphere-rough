import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axiosConfig";
import { AuthContext } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import CountdownTimer from "../components/CountdownTimer";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmModal from "../components/ConfirmModal";
import toast from "react-hot-toast";

const ArtDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [art, setArt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [admired, setAdmired] = useState(false);
  const [admireCount, setAdmireCount] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchArt = async () => {
      try {
        const { data } = await API.get(`/art/${id}`);
        setArt(data);
        setAdmireCount(data.admirers?.length || 0);
        if (user) {
          setAdmired(data.admirers?.includes(user._id));
        }
      } catch {
        toast.error("Failed to load artwork");
        navigate("/browse");
      } finally {
        setLoading(false);
      }
    };
    fetchArt();
  }, [id, user]);

  // ── Admire toggle ────────────────────────────────────────
  const handleAdmire = async () => {
    if (!user) {
      toast.error("Please login to admire artworks");
      navigate("/login");
      return;
    }
    try {
      await API.put(`/art/${id}/admire`);
      setAdmired(prev => !prev);
      setAdmireCount(prev => admired ? prev - 1 : prev + 1);
    } catch {
      toast.error("Failed to update");
    }
  };

  // ── Buy now ──────────────────────────────────────────────
  const handleBuy = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setBuying(true);
    try {
      await API.post(`/art/${id}/buy`);
      toast.success("Purchase successful! 🎨");
      setArt(prev => ({ ...prev, isSold: true, soldPrice: prev.price }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Purchase failed");
    } finally {
      setBuying(false);
    }
  };

  // ── Delete artwork ───────────────────────────────────────
  const handleDelete = async () => {
    try {
      await API.delete(`/art/${id}`);
      toast.success("Artwork deleted successfully");
      navigate("/profile");
    } catch {
      toast.error("Delete failed");
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!art) return (
    <div className="text-center py-20 text-gray-500">
      <p className="text-4xl mb-4">😕</p>
      <p>Artwork not found.</p>
      <button onClick={() => navigate("/browse")} className="mt-4 text-[#6c3483] hover:underline">
        Browse artworks →
      </button>
    </div>
  );

  const displayImage = art.imageUrl || art.image || "https://via.placeholder.com/500?text=No+Image+Found";
  const isOwner = user && art.artist?._id && (user._id === art.artist._id || user.id === art.artist._id);
  const isAuctionActive = art.isAuction && art.status === "approved" && !art.isSold;
  const isFixedBuyable = !art.isAuction && art.status === "approved" && !art.isSold &&
    (art.exhibitionType === "buy" || art.exhibitionType === "hybrid" || !art.exhibitionType);
  const isViewOnly = art.exhibitionType === "view-only";

  const getArtistName = (artist) => {
    if (!artist) return "Unknown Artist";
    if (artist.name) return artist.name;
    if (typeof artist === "string") return artist;
    return "Unknown Artist";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 text-white">

      {/* Delete confirm modal */}
      {showDeleteModal && (
        <ConfirmModal
          message={`Are you sure you want to delete "${art.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        className="text-gray-500 hover:text-[#6c3483] text-sm mb-8 transition flex items-center gap-1"
      >
        ← Back
      </button>

      {/* Main layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">

        {/* Left — artwork image */}
        <div className="relative">
          <img
            src={displayImage}
            alt={art.title}
            className="w-full rounded-xl shadow-2xl border border-gray-800 object-contain max-h-[520px]"
          />

          {/* SOLD overlay */}
          {art.isSold && (
            <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center">
              <span className="text-red-500 font-black text-5xl border-4 border-red-500 px-6 py-2 rotate-[-15deg]">
                SOLD
              </span>
            </div>
          )}

          {/* Admire button */}
          <button
            onClick={handleAdmire}
            className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/70 hover:bg-black/90 px-4 py-2 rounded-full transition"
          >
            <span className={`text-xl ${admired ? "text-red-500" : "text-white"}`}>
              {admired ? "♥" : "♡"}
            </span>
            <span className="text-white text-sm font-bold">{admireCount}</span>
          </button>
        </div>

        {/* Right — details */}
        <div className="space-y-6">

          {/* Title + badges */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              {art.isSold && <StatusBadge status="sold" />}
              {art.isAuction && !art.isSold && <StatusBadge status="auction" />}
              {art.status === "pending" && <StatusBadge status="pending" />}
              {isViewOnly && <StatusBadge status="view-only" />}
              {art.exhibitionType === "hybrid" && <StatusBadge status="hybrid" />}
              {art.category && (
                <span className="text-xs bg-[#1e1e38] border border-gray-700 px-3 py-1 rounded-full text-gray-300">
                  {art.category}
                </span>
              )}
            </div>

            <h1
              className="text-4xl font-black text-white leading-tight"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {art.title}
            </h1>
          </div>

          {/* Artist info card */}
          <div
            onClick={() => art.artist?._id && navigate(`/artist/${art.artist._id}`)}
            className="flex items-center gap-3 bg-[#1e1e38] border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-[#6c3483] transition"
          >
            <div className="w-12 h-12 rounded-full bg-[#6c3483]/30 border-2 border-[#6c3483] flex items-center justify-center text-xl font-bold text-[#6c3483]">
              {art.artist?.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <p className="text-white font-bold">{getArtistName(art.artist)}</p>
              <p className="text-[#6c3483] text-xs hover:underline">View artist profile →</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-300 leading-relaxed text-lg">{art.description}</p>

          {/* ── Conditional action section ── */}

          {/* 1. SOLD */}
          {art.isSold && (
            <div className="bg-red-900/20 border border-red-800 rounded-xl p-5 space-y-1">
              <p className="text-red-400 font-bold text-lg">This artwork has been sold</p>
              <p className="text-gray-400 text-sm">
                Final price: <span className="text-white font-bold">${art.soldPrice}</span>
              </p>
            </div>
          )}

          {/* 2. Pending approval */}
          {art.status === "pending" && !art.isSold && (
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-5">
              <p className="text-yellow-400 font-bold">⏳ Awaiting Admin Approval</p>
              <p className="text-gray-400 text-sm mt-1">
                This auction request is pending. Once approved it will go live.
              </p>
            </div>
          )}

          {/* 3. Active auction */}
          {isAuctionActive && (
            <div className="bg-[#1e1e38] border border-[#6c3483] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-green-400 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Live Auction
                </span>
                {art.auctionEndTime && <CountdownTimer endTime={art.auctionEndTime} />}
              </div>
              <div>
                <p className="text-gray-400 text-sm">Current Bid</p>
                <p className="text-3xl font-black text-[#6c3483]">
                  ${art.currentBid || art.auctionStartPrice || 0}
                </p>
              </div>
              <button
                onClick={() => navigate(`/auction/${art._id}`)}
                className="w-full bg-[#6c3483] py-3 rounded-lg font-bold text-white hover:bg-opacity-90 transition"
              >
                Enter Auction Room →
              </button>
            </div>
          )}

          {/* 4. Buy now — fixed price */}
          {isFixedBuyable && !isViewOnly && (
            <div className="bg-[#1e1e38] border border-gray-800 rounded-xl p-5 space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Price</p>
                <p className="text-3xl font-black text-white">${art.price}</p>
              </div>
              {user?.role === "buyer" && (
                <button
                  onClick={handleBuy}
                  disabled={buying}
                  className="w-full bg-[#6c3483] py-3 rounded-lg font-bold text-white hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {buying ? "Processing..." : "Buy Now"}
                </button>
              )}
              {!user && (
                <button
                  onClick={() => navigate("/login")}
                  className="w-full bg-gray-700 py-3 rounded-lg font-bold text-white hover:bg-gray-600 transition"
                >
                  Login to Buy
                </button>
              )}
              {user && user.role !== "buyer" && (
                <p className="text-gray-500 text-sm text-center">
                  Only buyers can purchase artworks
                </p>
              )}
            </div>
          )}

          {/* 5. View only */}
          {isViewOnly && !art.isSold && (
            <div className="bg-gray-900/40 border border-gray-700 rounded-xl p-5 text-center">
              <StatusBadge status="view-only" />
              <p className="text-gray-400 text-sm mt-3">
                This piece is for exhibition viewing only and is not available for purchase.
              </p>
            </div>
          )}

          {/* Owner actions */}
          {isOwner && (
            <div className="border-t border-gray-800 pt-4 flex gap-3">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex-1 bg-red-600/20 text-red-400 border border-red-700 py-2 rounded-lg text-sm font-bold hover:bg-red-600 hover:text-white transition"
              >
                Delete Artwork
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtDetails;