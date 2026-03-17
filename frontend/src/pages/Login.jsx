import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await API.post('/auth/login', { email, password });
            
            // This saves the user to the AuthContext "Brain"
            login(data.user, data.token);
            
            toast.success(`Welcome back, ${data.user.name}!`);
            navigate('/'); 
        } catch (err) {
            toast.error(err.response?.data?.message || "Login failed. Check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-white">
            <div className="bg-[#1e1e38] p-8 rounded-lg shadow-xl border border-gray-800 w-full max-w-md text-center">
                <h2 className="text-3xl font-bold text-[#6c3483] mb-6">Login</h2>
                <p className="text-gray-400 mb-6">Access your ArtSphere account.</p>
                
                <form onSubmit={handleSubmit}>
                    <input 
                        type="email" 
                        placeholder="Email Address" 
                        required
                        className="w-full p-3 mb-4 bg-[#16162a] border border-gray-700 rounded focus:border-[#6c3483] outline-none text-white"
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    
                    <input 
                        type="password" 
                        placeholder="Password" 
                        required
                        className="w-full p-3 mb-6 bg-[#16162a] border border-gray-700 rounded focus:border-[#6c3483] outline-none text-white"
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full p-3 font-bold bg-[#6c3483] rounded hover:bg-opacity-90 transition disabled:bg-gray-600"
                    >
                        {loading ? "Authenticating..." : "Login"}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-400">
                    New to ArtSphere? <Link to="/register" className="text-[#6c3483] font-bold">Register here</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;