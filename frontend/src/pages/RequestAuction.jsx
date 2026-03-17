import React, { useState, useEffect } from 'react';
import API from '../api/axiosConfig';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom'; // Added useLocation

const RequestAuction = () => {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(24);
  const navigate = useNavigate();
  const location = useLocation(); // Added to catch collectionId from URL

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const { data } = await API.get('/collections/my-collections');
        setCollections(data);

        // Auto-select if ID is in the URL
        const params = new URLSearchParams(location.search);
        const collId = params.get('collectionId');
        if (collId) setSelectedCollection(collId);
      } catch (err) {
        toast.error("Failed to load collections");
      }
    };
    fetchCollections();
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCollection) return toast.error("Please select a collection");

    try {
      await API.post('/auctions/request', {
        collectionId: selectedCollection,
        startTime,
        durationHours: Number(duration) // Ensure it's a number
      });
      toast.success("Auction request sent to Admin!");
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.message || "Request failed");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-[#1e1e38] rounded-xl text-white mt-10 border border-gray-800">
      <h2 className="text-3xl font-bold text-[#6c3483] mb-6">Schedule Online Auction</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-400 mb-2">Select Collection</label>
          <select 
            className="w-full p-3 bg-[#16162a] border border-gray-700 rounded text-white"
            value={selectedCollection} // Controlled component
            onChange={(e) => setSelectedCollection(e.target.value)}
            required
          >
            <option value="">-- Choose a Collection --</option>
            {collections.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-gray-400 mb-2">Start Date & Time</label>
          <input 
            type="datetime-local" 
            className="w-full p-3 bg-[#16162a] border border-gray-700 rounded text-white"
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-gray-400 mb-2">Duration (Hours)</label>
          <input 
            type="number" 
            className="w-full p-3 bg-[#16162a] border border-gray-700 rounded text-white"
            placeholder="e.g. 24"
            value={duration} // Controlled component
            onChange={(e) => setDuration(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="w-full bg-[#6c3483] py-4 rounded-lg font-bold hover:bg-opacity-90">
          Submit for Admin Approval
        </button>
      </form>
    </div>
  );
};

export default RequestAuction;