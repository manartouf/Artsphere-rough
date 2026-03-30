import axios from 'axios';

// This tells the app to use the live Render URL if it exists, otherwise use localhost
const API_URL = import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api` 
    : 'http://localhost:5000/api';

const API = axios.create({
    baseURL: API_URL, 
});

// This piece of code "intercepts" every request and adds the token
API.interceptors.request.use((req) => {
    const token = localStorage.getItem('token');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

export default API;