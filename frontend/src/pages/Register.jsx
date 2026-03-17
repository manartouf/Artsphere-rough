import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'buyer' // Default role
    });
    const [loading, setLoading] = useState(false);
    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await API.post('/auth/register', formData);
            
            // Automatically log them in after registration
            login(data.user, data.token);
            
            toast.success(`Account created! Welcome, ${data.user.name}`);
            navigate('/'); 
        } catch (err) {
            toast.error(err.response?.data?.message || "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-white">
            <div className="bg-[#1e1e38] p-8 rounded-lg shadow-xl border border-gray-800 w-full max-w-md text-center">
                <h2 className="text-3xl font-bold text-[#6c3483] mb-6">Register</h2>
                <p className="text-gray-400 mb-6">Join the future of art curation.</p>

                <form onSubmit={handleSubmit}>
                    <input 
                        name="name" type="text" placeholder="Full Name" required
                        className="w-full p-3 mb-4 bg-[#16162a] border border-gray-700 rounded focus:border-[#6c3483] outline-none text-white"
                        onChange={handleChange}
                    />
                    
                    <input 
                        name="email" type="email" placeholder="Email Address" required
                        className="w-full p-3 mb-4 bg-[#16162a] border border-gray-700 rounded focus:border-[#6c3483] outline-none text-white"
                        onChange={handleChange}
                    />
                    
                    <input 
                        name="password" type="password" placeholder="Password" required
                        className="w-full p-3 mb-4 bg-[#16162a] border border-gray-700 rounded focus:border-[#6c3483] outline-none text-white"
                        onChange={handleChange}
                    />

                    <div className="mb-6 text-left">
                        <label className="block text-sm text-gray-400 mb-2">I am joining as a:</label>
                        <select 
                            name="role" 
                            className="w-full p-3 bg-[#16162a] border border-gray-700 rounded focus:border-[#6c3483] outline-none appearance-none text-white"
                            onChange={handleChange}
                        >
                            <option value="buyer">Buyer (I want to bid on art)</option>
                            <option value="artist">Artist (I want to sell art)</option>
                        </select>
                    </div>

                    <button 
                        type="submit" disabled={loading}
                        className="w-full p-3 font-bold bg-[#6c3483] rounded hover:bg-opacity-90 transition disabled:bg-gray-600"
                    >
                        {loading ? "Creating Account..." : "Register"}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-400">
                    Already have an account? <Link to="/login" className="text-[#6c3483] font-bold">Login here</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;