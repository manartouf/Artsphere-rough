import React, { useState, useEffect } from 'react';
import API from '../api/axiosConfig';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [editDuration, setEditDuration] = useState({});

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      // FIX: Ensure it hits the /api/art path defined in server.js
      const { data } = await API.get('/art/admin/requests');
      setRequests(data);
    } catch (err) {
      toast.error("Failed to load auction requests");
    }
  };

  const handleStatus = async (id, status) => {
    try {
      const duration = editDuration[id] || 24; 
      // FIX: Hits the correct approval route
      await API.put(`/art/admin/approve/${id}`, { status, auctionDurationHours: duration });
      toast.success(`Auction ${status}!`);
      setRequests(requests.filter(req => req._id !== id));
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const handleDurationChange = (id, value) => {
    setEditDuration({ ...editDuration, [id]: value });
  };

  return (
    <div className="max-w-6xl mx-auto p-8 text-white">
      <h2 className="text-4xl font-bold text-[#6c3483] mb-8">Admin Control Panel</h2>
      <h3 className="text-xl mb-6 text-gray-400">Pending Auction Requests ({requests.length})</h3>

      <div className="grid gap-6">
        {requests.length === 0 ? (
          <p className="italic text-gray-500">No pending requests at the moment.</p>
        ) : (
          requests.map(req => (
            <div key={req._id} className="bg-[#1e1e38] p-6 rounded-xl border border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex-1">
                <h4 className="text-xl font-bold text-white">{req.title}</h4>
                <p className="text-gray-400 text-sm">Artist: {req.artist?.name || "Unknown Artist"}</p>
                <p className="text-[#6c3483] font-bold mt-2">Start Price: ${req.auctionStartPrice}</p>
              </div>

              <div className="flex flex-col gap-2 items-end">
                <label className="text-xs text-gray-500">Reschedule Duration (Hours):</label>
                <input 
                  type="number" 
                  className="bg-[#0f0f1a] border border-gray-700 rounded px-2 py-1 w-24 text-center"
                  defaultValue={24}
                  onChange={(e) => handleDurationChange(req._id, e.target.value)}
                />
                <div className="flex gap-4 mt-2">
                  <button 
                    onClick={() => handleStatus(req._id, 'approved')}
                    className="bg-green-600 px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleStatus(req._id, 'rejected')}
                    className="bg-red-600 px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;