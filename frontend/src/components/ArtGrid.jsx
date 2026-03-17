import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosConfig';
import toast from 'react-hot-toast';

const ArtGrid = () => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArt = async () => {
      try {
        const { data } = await API.get('/art');
        setArtworks(data);
      } catch (err) {
        toast.error("Could not load gallery.");
      } finally {
        setLoading(false);
      }
    };
    fetchArt();
  }, []);

  const getArtistName = (artist) => {
    if (!artist) return "Unknown Artist";
    // If it's your data (object)
    if (artist.name) return artist.name;
    // If it's teammate's data (string)
    if (typeof artist === 'string') return artist;
    return "Unknown Artist";
  };

  if (loading) return <div className="text-center p-10 text-white">Loading masterpieces...</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
      {artworks.length > 0 ? (
        artworks.map((art) => (
          <div key={art._id} className="bg-[#1e1e38] rounded-xl overflow-hidden border border-gray-800 hover:border-[#6c3483] transition shadow-lg">
            <img 
              src={art.imageUrl || art.image || "https://via.placeholder.com/400x300?text=No+Image+Found"} 
              alt={art.title} 
              className="w-full h-64 object-cover" 
            />
            <div className="p-4">
              <h3 className="text-xl font-bold text-white">{art.title}</h3>
              <p className="text-gray-400 text-sm mb-2">By {getArtistName(art.artist)}</p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-[#6c3483] font-bold">${art.price}</span>
                <button 
                  onClick={() => navigate(`/art/${art._id}`)}
                  className="bg-[#6c3483] text-white px-4 py-1 rounded text-sm hover:bg-opacity-80"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="col-span-full text-center text-gray-500 italic">
          No art found. Time to upload some!
        </div>
      )}
    </div>
  );
};

export default ArtGrid;