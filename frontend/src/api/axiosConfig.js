import axios from 'axios';

// We manually set the Render URL here as a backup to be 100% sure
const renderURL = "https://artsphere-full-stack-real-time-art.onrender.com/api";
const localURL = "http://localhost:5000/api";

const API = axios.create({
    // If the Vercel variable exists, use it. Otherwise, use Render directly.
    baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : renderURL,
});

API.interceptors.request.use((req) => {
    const token = localStorage.getItem('token');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

export default API;