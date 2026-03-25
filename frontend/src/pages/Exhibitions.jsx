import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosConfig";
import LoadingSpinner from "../components/LoadingSpinner";

const Exhibitions = () => {
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await API.get("/exhibitions");
        setExhibitions(data);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 text-white">

      {/* Header */}
      <div className="mb-10">
        <p className="text-[#6c3483] text-sm font-bold uppercase tracking-widest mb-2">
          ArtSphere
        </p>
        <h1
          className="text-4xl font-black text-white"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Art Exhibitions
        </h1>
        <p className="text-gray-400 mt-2">
          Explore curated collections from artists around the world.
        </p>
      </div>

      {/* Grid */}
      {exhibitions.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-4">🖼️</p>
          <p className="text-lg">No active exhibitions right now.</p>
          <p className="text-sm mt-2">Check back soon — artists are always curating new shows.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {exhibitions.map(ex => {
            const artworkCount = ex.artworks?.length || 0;
            const previewImage = ex.artworks?.[0]?.imageUrl || ex.artworks?.[0]?.image;
            const isActive = ex.status === "active" || ex.status === "approved";

            return (
              <div
                key={ex._id}
                onClick={() => navigate(`/exhibition/${ex._id}`)}
                className="bg-[#1e1e38] border border-gray-800 rounded-xl overflow-hidden cursor-pointer hover:border-[#6c3483] hover:scale-[1.02] transition-all duration-300 group"
              >
                {/* Preview image */}
                <div className="relative h-48 bg-[#16162a]">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt={ex.title}
                      className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <span className="text-4xl">🖼️</span>
                    </div>
                  )}

                  {/* Status badge */}
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold ${
                    isActive
                      ? "bg-green-900/80 text-green-400 border border-green-700"
                      : "bg-gray-900/80 text-gray-400 border border-gray-700"
                  }`}>
                    {isActive ? "🟢 Active" : "⚫ Ended"}
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 space-y-2">
                  <h3
                    className="text-lg font-bold text-white truncate"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {ex.title}
                  </h3>
                  <p className="text-[#6c3483] text-sm">
                    By {ex.createdBy?.name || "Unknown Artist"}
                  </p>
                  {ex.description && (
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {ex.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                    <span className="text-gray-500 text-xs">
                      {artworkCount} artwork{artworkCount !== 1 ? "s" : ""}
                    </span>
                    {ex.startDate && (
                      <span className="text-gray-500 text-xs">
                        {new Date(ex.startDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Exhibitions;