import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axiosConfig";
import { AuthContext } from "../context/AuthContext";
import GalleryWallCard from "../components/GalleryWallCard";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

const ExhibitionRoom = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [exhibition, setExhibition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState(null);

  useEffect(() => {
    const fetchExhibition = async () => {
      try {
        const { data } = await API.get(`/exhibitions/${id}`);
        setExhibition(data);
      } catch {
        toast.error("Failed to load exhibition");
        navigate("/exhibitions");
      } finally {
        setLoading(false);
      }
    };
    fetchExhibition();
  }, [id]);

  const handleBuy = async (artwork) => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (buyingId) return;
    setBuyingId(artwork._id);
    try {
      // ✅ FIX: was /art/${artwork._id}/buy
      await API.post(`/artworks/${artwork._id}/buy`);
      toast.success(`You bought "${artwork.title}"!`);
      setExhibition(prev => ({
        ...prev,
        artworks: prev.artworks.map(a =>
          a._id === artwork._id
            ? { ...a, isSold: true, soldPrice: artwork.price, soldWhere: "exhibition" }
            : a
        )
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Purchase failed");
    } finally {
      setBuyingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!exhibition) return (
    <div className="text-center text-gray-500 py-20">Exhibition not found.</div>
  );

  const isActive = exhibition.status === "active" || exhibition.status === "approved";

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 text-white">

      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[#6c3483] text-sm font-bold uppercase tracking-widest mb-1">
              Exhibition
            </p>
            <h1
              className="text-4xl font-black text-white"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {exhibition.title}
            </h1>
            <button
              onClick={() => navigate(`/artist/${exhibition.createdBy?._id}`)}
              className="text-gray-400 hover:text-[#6c3483] text-sm mt-2 transition"
            >
              Curated by {exhibition.createdBy?.name || "Unknown Artist"} →
            </button>
          </div>

          <div className={`px-4 py-2 rounded-full text-sm font-bold ${
            isActive
              ? "bg-green-900/40 text-green-400 border border-green-700"
              : "bg-gray-800 text-gray-400 border border-gray-700"
          }`}>
            {isActive ? "🟢 Exhibition Active" : "⚫ Exhibition Ended"}
          </div>
        </div>

        {exhibition.description && (
          <p className="text-gray-400 mt-4 max-w-2xl leading-relaxed">
            {exhibition.description}
          </p>
        )}

        {(exhibition.startDate || exhibition.endDate) && (
          <div className="flex gap-6 mt-4 text-sm text-gray-500">
            {exhibition.startDate && (
              <span>Opens: <span className="text-gray-300">{new Date(exhibition.startDate).toLocaleDateString()}</span></span>
            )}
            {exhibition.endDate && (
              <span>Closes: <span className="text-gray-300">{new Date(exhibition.endDate).toLocaleDateString()}</span></span>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-gray-800 mb-10" />

      {!isActive && (
        <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-6 text-center mb-8">
          <p className="text-2xl mb-2">🖼️</p>
          <p className="text-gray-300 font-bold text-lg">This Exhibition Has Ended</p>
          <p className="text-gray-500 text-sm mt-1">
            The artist has closed this exhibition. Browse other active exhibitions below.
          </p>
          <button
            onClick={() => navigate("/exhibitions")}
            className="mt-4 px-6 py-2 bg-[#6c3483] rounded-lg text-sm font-bold hover:bg-opacity-90 transition"
          >
            Browse Exhibitions
          </button>
        </div>
      )}

      {exhibition.artworks?.length > 0 ? (
        <GalleryWallCard
          artworks={exhibition.artworks}
          mode="exhibition"
          onBuy={isActive ? handleBuy : null}
          user={user}
        />
      ) : (
        <div className="text-center text-gray-500 py-20">
          <p className="text-4xl mb-4">🎨</p>
          <p>No artworks have been added to this exhibition yet.</p>
        </div>
      )}

      <div className="mt-12 border-t border-gray-800 pt-6">
        <button
          onClick={() => navigate("/exhibitions")}
          className="text-gray-500 hover:text-[#6c3483] text-sm transition"
        >
          ← Back to all exhibitions
        </button>
      </div>
    </div>
  );
};

export default ExhibitionRoom;