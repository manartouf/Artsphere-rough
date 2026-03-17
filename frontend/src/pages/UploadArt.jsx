import React, { useState } from 'react';
import API from '../api/axiosConfig';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const UploadArt = () => {
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', price: '', category: 'Painting' });
  const navigate = useNavigate();

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please select an image");

    const data = new FormData();
    data.append("image", file);
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("price", formData.price);
    data.append("category", formData.category);

    // Hidden defaults to match database schema requirements
    data.append("isAuction", false);
    data.append("auctionStatus", "inactive");
    data.append("status", "approved"); // Changed to approved so it shows up instantly

    const loadingToast = toast.loading("Uploading masterpiece...");
    try {
      await API.post('/art', data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Art uploaded successfully!", { id: loadingToast });
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed.", { id: loadingToast });
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-[#1e1e38] rounded-xl border border-gray-800">
      <h2 className="text-3xl font-bold text-[#6c3483] mb-6">Upload New Masterpiece</h2>
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block mb-2 text-gray-400">Artwork Image</label>
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files[0])} 
            className="w-full text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-[#6c3483] file:text-white hover:file:bg-opacity-80" 
            required 
          />
        </div>
        <input type="text" placeholder="Title" className="w-full p-3 bg-[#16162a] rounded border border-gray-700 text-white" 
          onChange={(e) => setFormData({...formData, title: e.target.value})} required />
        <textarea placeholder="Description" className="w-full p-3 bg-[#16162a] rounded border border-gray-700 h-32 text-white" 
          onChange={(e) => setFormData({...formData, description: e.target.value})} required />
        <input type="number" placeholder="Price ($)" className="w-full p-3 bg-[#16162a] rounded border border-gray-700 text-white" 
          onChange={(e) => setFormData({...formData, price: e.target.value})} required />
        <button type="submit" className="w-full bg-[#6c3483] py-3 rounded font-bold hover:bg-opacity-90 text-white text-xl">
          Upload to Gallery
        </button>
      </form>
    </div>
  );
};

export default UploadArt;