import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-[#1a1a2e] border-b border-gray-800 text-white">
      <Link to="/" className="text-2xl font-bold text-[#6c3483]">ARTSPHERE</Link>
      
      <div className="flex gap-6 items-center">
        {isAuthenticated ? (
          <>
            <span className="text-gray-400">Hi, {user?.name}</span>
            
            {/* Admin specific link */}
            {user?.role === 'admin' && (
              <Link to="/admin-dashboard" className="text-[#6c3483] font-bold hover:text-white">Dashboard</Link>
            )}

            <Link to="/upload" className="hover:text-[#6c3483]">Upload Art</Link>
            <Link to="/profile" className="hover:text-[#6c3483]">Profile</Link>
            <button 
              onClick={handleLogout}
              className="bg-red-900/20 text-red-500 px-4 py-1 rounded border border-red-900/50 hover:bg-red-900/40"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-[#6c3483]">Login</Link>
            <Link to="/register" className="bg-[#6c3483] px-4 py-1 rounded">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;