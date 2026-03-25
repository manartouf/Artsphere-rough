import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axiosConfig";
import { AuthContext } from "../context/AuthContext";
import ArtCard from "../components/ArtCard";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

const ArtistProfile = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [artist, setArtist] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await API.get(`/users/artist/${id}`);
        setArtist(data.artist);
        setArtworks(data.artworks || []);
        if (user) {
          setFollowing(data.artist.followers?.some(f =>
            (f._id || f) === user._id
          ));
        }
      } catch {
        toast.error("Failed to load artist profile");
        navigate("/browse");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, user]);

  const handleFollow = async () => {
    if (!user) {
      toast.error("Please login to follow artists");
      navigate("/login");
      return;
    }
    if (user.role !== "buyer") {
      toast.error("Only buyers can follow artists");
      return;
    }
    setFollowLoading(true);
    try {
      await API.put(`/users/follow/${id}`);
      setFollowing(prev => !prev);
      setArtist(prev => ({
        ...prev,
        followers: following
          ? prev.followers.filter(f => (f._id || f) !== user._id)
          : [...(prev.followers || []), user._id]
      }));
      toast.success(following ? "Unfollowed" : "Now following!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!artist) return (
    <div className="text-center py-20 text-gray-500">
      <p className="text-4xl mb-4">😕</p>
      <p>Artist not found.</p>
    </div>
  );

  const isOwnProfile = user?._id === id || user?.id === id;
  const followerCount = artist.followers?.length || 0;
  const soldCount = artworks.filter(a => a.isSold).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 text-white">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="text-gray-500 hover:text-[#6c3483] text-sm mb-8 transition"
      >
        ← Back
      </button>

      {/* ── Profile header ── */}
      <div className="bg-[#1e1e38] border border-gray-800 rounded-2xl overflow-hidden mb-10">

        {/* Cover banner */}
        <div
          className="h-40 w-full"
          style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #6c3483 50%, #1a1a2e 100%)",
          }}
        />

        {/* Avatar + info */}
        <div className="px-8 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12">

            {/* Avatar */}
            <div
              className="w-24 h-24 rounded-full border-4 border-[#1e1e38] bg-[#6c3483]/30 flex items-center justify-center text-4xl font-black text-[#6c3483] shadow-xl"
              style={{ minWidth: "96px" }}
            >
              {artist.avatar ? (
                <img
                  src={artist.avatar}
                  alt={artist.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                artist.name?.charAt(0).toUpperCase()
              )}
            </div>

            {/* Follow button */}
            {!isOwnProfile && user?.role === "buyer" && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`px-6 py-2 rounded-full font-bold text-sm transition disabled:opacity-50 ${
                  following
                    ? "bg-gray-700 text-gray-300 border border-gray-600 hover:bg-red-900/30 hover:text-red-400 hover:border-red-700"
                    : "bg-[#6c3483] text-white hover:bg-opacity-90"
                }`}
              >
                {followLoading ? "..." : following ? "Following ✓" : "+ Follow"}
              </button>
            )}

            {/* Own profile edit hint */}
            {isOwnProfile && (
              <button
                onClick={() => navigate("/profile")}
                className="px-6 py-2 rounded-full font-bold text-sm bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600 transition"
              >
                Edit Profile →
              </button>
            )}
          </div>

          {/* Name + bio */}
          <div className="mt-4 space-y-2">
            <h1
              className="text-3xl font-black text-white"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {artist.name}
            </h1>
            <p className="text-[#6c3483] text-sm font-bold uppercase tracking-wider">
              Artist
            </p>
            {artist.aboutMe && (
              <p className="text-gray-300 leading-relaxed max-w-2xl mt-3">
                {artist.aboutMe}
              </p>
            )}
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-8 mt-6 pt-6 border-t border-gray-800">
            <div className="text-center">
              <p className="text-2xl font-black text-white">{artworks.length}</p>
              <p className="text-gray-500 text-xs uppercase tracking-wider mt-1">Artworks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-white">{followerCount}</p>
              <p className="text-gray-500 text-xs uppercase tracking-wider mt-1">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-white">{soldCount}</p>
              <p className="text-gray-500 text-xs uppercase tracking-wider mt-1">Sold</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Artworks gallery ── */}
      <div className="mb-4 flex items-center justify-between">
        <h2
          className="text-2xl font-black text-white"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Artworks
        </h2>
        <span className="text-gray-500 text-sm">{artworks.length} piece{artworks.length !== 1 ? "s" : ""}</span>
      </div>

      {artworks.length === 0 ? (
        <div className="text-center py-16 bg-[#1e1e38] border border-gray-800 rounded-xl text-gray-500">
          <p className="text-4xl mb-4">🎨</p>
          <p>No artworks uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {artworks.map(art => (
            <ArtCard key={art._id} art={art} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ArtistProfile;