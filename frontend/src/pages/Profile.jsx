import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosConfig';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('art');
  const [myArt, setMyArt] = useState([]);
  const [myCollections, setMyCollections] = useState([]);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    aboutMe: user?.aboutMe || '',
    lookingFor: user?.lookingFor || ''
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const artRes = await API.get('/art');
        const filteredArt = artRes.data.filter(a => {
            const artistId = a.artist?._id || a.artist?.id || a.artist;
            return artistId === user?._id;
        });
        setMyArt(filteredArt);

        if (user?.role === 'artist') {
          const collRes = await API.get('/collections/my-collections');
          setMyCollections(collRes.data);
        }
      } catch (err) {
        console.error("Error loading profile data", err);
      }
    };
    if (user) fetchProfileData();
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const { data } = await API.put(`/users/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      login(data.user, token);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 space-y-8 min-h-screen">
      <div className="bg-[#1e1e38] p-8 rounded-lg shadow-xl border border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-[#6c3483]">My Profile</h2>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 transition text-white"
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-white">
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 block text-sm">Full Name</label>
              {isEditing ? (
                <input 
                  className="w-full bg-[#16162a] border border-gray-700 p-2 rounded mt-1 outline-none focus:border-[#6c3483]"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              ) : (
                <p className="text-xl font-semibold">{user?.name}</p>
              )}
            </div>
            <div>
              <label className="text-gray-400 block text-sm">Role</label>
              <p className="capitalize text-[#6c3483] font-bold">{user?.role}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-gray-400 block text-sm">About Me</label>
              {isEditing ? (
                <textarea 
                  className="w-full bg-[#16162a] border border-gray-700 p-2 rounded mt-1 outline-none focus:border-[#6c3483] h-24"
                  value={formData.aboutMe}
                  onChange={(e) => setFormData({...formData, aboutMe: e.target.value})}
                />
              ) : (
                <p className="text-gray-300 italic">{user?.aboutMe || "No bio added yet..."}</p>
              )}
            </div>
            <div>
              <label className="text-gray-400 block text-sm">Looking For</label>
              {isEditing ? (
                <input 
                  className="w-full bg-[#16162a] border border-gray-700 p-2 rounded mt-1 outline-none focus:border-[#6c3483]"
                  value={formData.lookingFor}
                  onChange={(e) => setFormData({...formData, lookingFor: e.target.value})}
                />
              ) : (
                <p className="text-gray-300">{user?.lookingFor || "Not specified..."}</p>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <button 
            onClick={handleUpdate}
            className="w-full mt-8 bg-[#6c3483] p-3 rounded font-bold hover:bg-opacity-90 transition text-white"
          >
            Save Changes
          </button>
        )}
      </div>

      {user?.role === 'artist' && (
        <div className="bg-[#1e1e38] p-8 rounded-lg shadow-xl border border-gray-800 text-white">
          <div className="flex justify-between items-center border-b border-gray-800 mb-8">
            <div className="flex gap-8">
              <button 
                onClick={() => setActiveTab('art')}
                className={`pb-4 px-2 font-bold transition ${activeTab === 'art' ? 'border-b-2 border-[#6c3483] text-[#6c3483]' : 'text-gray-500'}`}
              >
                My Artworks ({myArt.length})
              </button>
              <button 
                onClick={() => setActiveTab('collections')}
                className={`pb-4 px-2 font-bold transition ${activeTab === 'collections' ? 'border-b-2 border-[#6c3483] text-[#6c3483]' : 'text-gray-500'}`}
              >
                My Collections ({myCollections.length})
              </button>
            </div>

            <div className="pb-4">
              {activeTab === 'art' ? (
                <button 
                  onClick={() => navigate('/upload')} 
                  className="bg-[#6c3483] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-opacity-80 transition"
                >
                  + Upload Art
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/create-collection')} 
                  className="bg-[#6c3483] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-opacity-80 transition"
                >
                  + Build Collection
                </button>
              )}
            </div>
          </div>

          {activeTab === 'art' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {myArt.map(art => (
                <div key={art._id} className="bg-[#16162a] rounded-lg overflow-hidden border border-gray-800">
                  <img src={art.imageUrl || art.image} alt={art.title} className="w-full h-40 object-cover" />
                  <div className="p-4">
                    <h3 className="font-bold truncate">{art.title}</h3>
                    <p className="text-[#6c3483]">${art.price}</p>
                  </div>
                </div>
              ))}
              {myArt.length === 0 && <p className="text-gray-500 italic">No artworks found for your profile.</p>}
            </div>
          ) : (
            <div className="space-y-6">
              {myCollections.map(coll => (
                <div key={coll._id} className="bg-[#16162a] p-6 rounded-lg border border-gray-800">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-[#6c3483]">{coll.name}</h3>
                    <button 
                      onClick={() => navigate(`/request-auction?collectionId=${coll._id}`)}
                      className="bg-white/10 text-white border border-white/20 px-3 py-1 rounded text-xs hover:bg-[#6c3483] hover:border-[#6c3483] transition"
                    >
                      Schedule Auction
                    </button>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {coll.artworks?.map(art => (
                      <img key={art._id} src={art.imageUrl || art.image} alt="" className="h-20 w-20 object-cover rounded border border-gray-700 flex-shrink-0" />
                    ))}
                  </div>
                </div>
              ))}
              {myCollections.length === 0 && <p className="text-gray-500 italic">No collections created yet.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;