import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosConfig";
import LoadingSpinner from "../components/LoadingSpinner";

const Artists = () => {
  const [artists, setArtists] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const { data } = await API.get("/art");
        const seen = new Set();
        const artistIds = [];
        data.forEach(art => {
          const id = art.artist?._id;
          if (id && !seen.has(id)) {
            seen.add(id);
            artistIds.push(id);
          }
        });

        // FIX: fetch full profiles to get correct follower counts
        const profiles = await Promise.all(
          artistIds.map(id =>
            API.get(`/users/artist/${id}`)
              .then(res => res.data.artist)
              .catch(() => null)
          )
        );

        const validArtists = profiles.filter(Boolean);
        setArtists(validArtists);
        setFiltered(validArtists);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    };
    fetchArtists();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!search.trim()) {
        setFiltered(artists);
      } else {
        setFiltered(artists.filter(a =>
          a.name?.toLowerCase().includes(search.toLowerCase())
        ));
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, artists]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 text-white">

      <div className="mb-8">
        <p className="text-[#6c3483] text-sm font-bold uppercase tracking-widest mb-2">ArtSphere</p>
        <h1 className="text-4xl font-black text-white" style={{ fontFamily: "Georgia, serif" }}>
          Discover Artists
        </h1>
        <p className="text-gray-400 mt-2">Explore talented artists and follow the ones you love.</p>
      </div>

      <input
        type="text"
        placeholder="Search artists by name..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full p-3 bg-[#1e1e38] border border-gray-700 rounded-xl text-white outline-none focus:border-[#6c3483] transition mb-8 placeholder-gray-500"
      />

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-4">🎨</p>
          <p className="text-lg">No artists found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(artist => (
            <div
              key={artist._id}
              onClick={() => navigate(`/artist/${artist._id}`)}
              className="bg-[#1e1e38] border border-gray-800 rounded-xl p-6 cursor-pointer hover:border-[#6c3483] hover:scale-[1.02] transition-all duration-300 flex flex-col items-center text-center gap-3"
            >
              <div className="w-20 h-20 rounded-full bg-[#6c3483]/30 border-2 border-[#6c3483] flex items-center justify-center text-3xl font-black text-[#6c3483]">
                {artist.avatar ? (
                  <img src={artist.avatar} alt={artist.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  artist.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p className="font-bold text-white text-lg" style={{ fontFamily: "Georgia, serif" }}>
                  {artist.name}
                </p>
                {artist.aboutMe && (
                  <p className="text-gray-400 text-xs mt-1 line-clamp-2">{artist.aboutMe}</p>
                )}
              </div>
              <span className="text-[#6c3483] text-xs font-bold">
                {artist.followers?.length || 0} followers
              </span>
              <button
                onClick={e => { e.stopPropagation(); navigate(`/artist/${artist._id}`); }}
                className="w-full py-2 rounded-lg text-sm font-bold bg-[#6c3483]/20 border border-[#6c3483]/40 text-[#6c3483] hover:bg-[#6c3483]/40 transition"
              >
                View Profile →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Artists;