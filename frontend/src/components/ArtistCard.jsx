import { useNavigate } from "react-router-dom";

const ArtistCard = ({ artist }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/artist/${artist._id}`)}
      className="bg-[#1e1e38] border border-gray-800 rounded-xl p-5 cursor-pointer hover:border-[#6c3483] hover:scale-[1.02] transition-all duration-300 flex flex-col items-center text-center gap-3 min-w-[180px]"
    >
      {/* Avatar */}
      <div className="w-20 h-20 rounded-full bg-[#6c3483]/30 border-2 border-[#6c3483] flex items-center justify-center overflow-hidden">
        {artist.avatar ? (
          <img src={artist.avatar} alt={artist.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl text-[#6c3483] font-bold">
            {artist.name?.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div>
        <h3 className="font-bold text-white text-base">{artist.name}</h3>
        <p className="text-gray-400 text-xs mt-1 line-clamp-2">
          {artist.aboutMe || "Artist on ArtSphere"}
        </p>
      </div>

      <span className="text-[#6c3483] text-xs font-bold">
        {artist.followers?.length || 0} followers
      </span>
    </div>
  );
};

export default ArtistCard;