import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api', 
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