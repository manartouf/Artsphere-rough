import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ArtDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [art, setArt] = useState(null);

  useEffect(() => {
    const fetchArtDetails = async () => {
      try {
        const { data } = await API.get(`/art/${id}`);
        setArt(data);
      } catch (err) {
        console.error("Error fetching art details");
      }
    };
    fetchArtDetails();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this masterpiece?")) return;
    try {
      await API.delete(`/art/${id}`);
      toast.success("Artwork deleted successfully");
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const getArtistName = (artist) => {
    if (!artist) return "Unknown Artist";
    if (artist.name) return artist.name;
    if (typeof artist === 'string') return artist;
    return "Unknown Artist";
  };

  if (!art) return <div className="p-10 text-center text-white">Loading artwork details...</div>;

  const displayImage = art.imageUrl || art.image || "https://via.placeholder.com/500?text=No+Image+Found";
  
  const isOwner = user && art.artist?._id && (user._id === art.artist._id || user.id === art.artist._id);

  return (
    <div className="max-w-6xl mx-auto p-8 flex flex-col md:flex-row gap-10 text-white">
      <img src={displayImage} alt={art.title} className="w-full md:w-1/2 rounded-lg shadow-2xl border border-gray-800 object-cover" />
      <div className="space-y-6 flex-1">
        <div className="flex justify-between items-start">
          <h1 className="text-4xl font-bold text-[#6c3483]">{art.title}</h1>
          {isOwner && (
            <button 
              onClick={handleDelete}
              className="bg-red-600/20 text-red-500 border border-red-600 px-4 py-2 rounded hover:bg-red-600 hover:text-white transition"
            >
              Delete Art
            </button>
          )}
        </div>
        <p className="text-xl text-gray-400">By {getArtistName(art.artist)}</p>
        <p className="text-gray-300 leading-relaxed text-lg">{art.description}</p>
        <div className="text-3xl font-bold text-white">${art.price}</div>
        <button className="w-full py-4 bg-[#6c3483] rounded-lg font-bold text-xl hover:bg-opacity-90 transition">
          {art.isAuction ? "Place a Bid" : "Buy Now"}
        </button>
      </div>
    </div>
  );
};

export default ArtDetails;