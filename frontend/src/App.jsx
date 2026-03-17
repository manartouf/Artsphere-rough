import AdminDashboard from './pages/AdminDashboard';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ArtGrid from './components/ArtGrid';
import ArtDetails from './pages/ArtDetails';
import UploadArt from './pages/UploadArt';

// Necessary Imports to prevent the crash
import CreateCollection from './pages/CreateCollection';
import RequestAuction from './pages/RequestAuction';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#1a1a2e] text-white">
        <Toaster position="top-center" />
        <Navbar />
        <Routes>
          <Route path="/" element={
            <div className="py-10">
              <div className="text-center mb-10">
                <h1 className="text-5xl font-bold text-[#6c3483] mb-4">Welcome to ArtSphere</h1>
                <p className="text-gray-400 text-xl">The future of real-time art curation.</p>
              </div>
              <ArtGrid /> 
            </div>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/art/:id" element={<ArtDetails />} />
          <Route path="/upload" element={<UploadArt />} />
          <Route path="/create-collection" element={<CreateCollection />} />
          <Route path="/request-auction" element={<RequestAuction />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;