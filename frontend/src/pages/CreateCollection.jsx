import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axiosConfig';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CreateCollection = () => {
  const { user } = useContext(AuthContext);
  const [myArt, setMyArt] = useState([]);
  const [selectedArt, setSelectedArt] = useState([]);
  const [name, setName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyArt = async () => {
      try {
        const { data } = await API.get('/art');
        const filtered = data.filter(art => {
          const artistId = String(art.artist?._id || art.artist?.id || art.artist);
          return artistId === String(user?._id) || artistId === String(user?.id);
        });
        setMyArt(filtered);
      } catch (err) {
        toast.error("Failed to load your artworks");
      }
    };
    if (user) fetchMyArt();
  }, [user]);

  const toggleSelect = (id) => {
    setSelectedArt(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Please enter a collection name");
    if (selectedArt.length === 0) return toast.error("Select at least one artwork");
    try {
      await API.post('/collections', {
        name: name.trim(),
        artworks: selectedArt
      });
      toast.success("Collection created!");
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 text-white min-h-screen">
      <h2 className="text-3xl font-bold text-[#6c3483] mb-6">Build New Collection</h2>
      <input
        type="text"
        value={name}
        placeholder="Collection Name"
        className="w-full p-3 bg-[#1e1e38] border border-gray-700 rounded mb-6 outline-none focus:border-[#6c3483]"
        onChange={(e) => setName(e.target.value)}
      />
      <h3 className="mb-4 text-gray-400 font-bold">Select Your Artworks ({selectedArt.length}):</h3>
      {myArt.length === 0 ? (
        <p className="text-gray-500 italic mb-8">No artworks found. Upload some artworks first.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {myArt.map(art => (
            <div
              key={art._id}
              onClick={() => toggleSelect(art._id)}
              className={`cursor-pointer border-2 rounded-lg overflow-hidden transition ${
                selectedArt.includes(art._id)
                  ? 'border-[#6c3483] opacity-100 scale-105'
                  : 'border-transparent opacity-60'
              }`}
            >
              <img src={art.imageUrl || art.image} alt="" className="h-32 w-full object-cover" />
              <div className="p-2 bg-[#1e1e38]">
                <p className="text-xs truncate font-bold">{art.title}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={handleSave}
        className="w-full bg-[#6c3483] py-4 rounded-lg font-bold hover:bg-opacity-80 transition"
      >
        Save Collection
      </button>
    </div>
  );
};

export default CreateCollection;