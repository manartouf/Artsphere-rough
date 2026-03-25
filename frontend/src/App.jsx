import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthContext } from './context/AuthContext';
import { useContext } from 'react';

import Navbar from './components/Navbar';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Browse from './pages/Browse';
import Artists from "./pages/Artists";
import ArtDetails from './pages/ArtDetails';
import ArtistProfile from './pages/ArtistProfile';
import Exhibitions from './pages/Exhibitions';
import ExhibitionRoom from './pages/ExhibitionRoom';
import AuctionRoom from './pages/AuctionRoom';
import AdminDashboard from './pages/AdminDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import ArtistDashboard from './pages/ArtistDashboard';
import CreateCollection from './pages/CreateCollection';
import RequestAuction from './pages/RequestAuction';
import UploadArt from './pages/UploadArt';

// ── Route guards ─────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) {
    window.location.href = "/login";
    return null;
  }
  return children;
};

const RoleRoute = ({ children, role }) => {
  const { user } = useContext(AuthContext);
  if (!user) {
    window.location.href = "/login";
    return null;
  }
  if (user.role !== role) {
    window.location.href = "/";
    return null;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a1a] text-white">
        <Toaster position="top-center" />
        <Navbar />
        <Routes>

          {/* ── Public routes ── */}
          <Route path="/"               element={<Home />} />
          <Route path="/browse"         element={<Browse />} />
          <Route path="/art/:id"        element={<ArtDetails />} />
          <Route path="/artist/:id"     element={<ArtistProfile />} />
          <Route path="/exhibitions"    element={<Exhibitions />} />
          <Route path="/exhibition/:id" element={<ExhibitionRoom />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/register"       element={<Register />} />
          <Route path="/artists" element={<Artists />} />

          {/* ── Auth required ── */}
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/auction/:id" element={
            <ProtectedRoute><AuctionRoom /></ProtectedRoute>
          } />
          <Route path="/upload" element={
            <ProtectedRoute><UploadArt /></ProtectedRoute>
          } />
          <Route path="/create-collection" element={
            <ProtectedRoute><CreateCollection /></ProtectedRoute>
          } />
          <Route path="/request-auction" element={
            <ProtectedRoute><RequestAuction /></ProtectedRoute>
          } />

          {/* ── Buyer only ── */}
          <Route path="/buyer" element={
            <RoleRoute role="buyer"><BuyerDashboard /></RoleRoute>
          } />

          {/* ── Artist only ── */}
          <Route path="/artist/dashboard" element={
            <RoleRoute role="artist"><ArtistDashboard /></RoleRoute>
          } />

          {/* ── Admin only ── */}
          <Route path="/admin" element={
            <RoleRoute role="admin"><AdminDashboard /></RoleRoute>
          } />

          {/* ── 404 fallback ── */}
          <Route path="*" element={
            <div className="text-center py-20 text-gray-500">
              <p className="text-6xl mb-4">404</p>
              <p className="text-xl">Page not found</p>
              <button
                onClick={() => window.location.href = "/"}
                className="mt-6 px-6 py-3 bg-[#6c3483] rounded-lg font-bold text-white hover:bg-opacity-90 transition"
              >
                Go Home
              </button>
            </div>
          } />

        </Routes>
      </div>
    </Router>
  );
}

export default App;