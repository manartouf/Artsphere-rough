import { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const getDashboardPath = () => {
    if (user?.role === "admin") return "/admin";
    if (user?.role === "artist") return "/artist/dashboard";
    if (user?.role === "buyer") return "/buyer";
    return "/";
  };

  // ✅ Added Auctions to nav links
  const navLinks = [
    { label: "Browse",      path: "/browse" },
    { label: "Auctions",    path: "/auctions" },
    { label: "Exhibitions", path: "/exhibitions" },
    { label: "Artists",     path: "/artists" },
  ];

  return (
    <nav
      className="sticky top-0 z-50 border-b border-gray-800"
      style={{ background: "rgba(10,10,26,0.95)", backdropFilter: "blur(12px)" }}
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">

        <button onClick={() => navigate("/")} className="flex-shrink-0">
          <span className="text-2xl font-black text-[#6c3483]" style={{ fontFamily: "Georgia, serif" }}>
            ArtSphere
          </span>
        </button>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                isActive(link.path)
                  ? "text-[#6c3483] bg-[#6c3483]/10"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <NotificationBell />
              <button
                onClick={() => navigate(getDashboardPath())}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                  location.pathname.startsWith("/admin") ||
                  location.pathname.startsWith("/artist/dashboard") ||
                  location.pathname.startsWith("/buyer")
                    ? "text-[#6c3483] bg-[#6c3483]/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate("/profile")}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                  isActive("/profile")
                    ? "text-[#6c3483] bg-[#6c3483]/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Profile
              </button>
              <div className="flex items-center gap-2 px-3 py-2 bg-[#1e1e38] border border-gray-800 rounded-lg">
                <div className="w-7 h-7 rounded-full bg-[#6c3483]/40 border border-[#6c3483] flex items-center justify-center text-xs font-black text-[#6c3483]">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-white text-sm font-bold max-w-[100px] truncate">{user.name}</span>
                <span className="text-gray-600 text-xs capitalize">{user.role}</span>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 border border-gray-700 hover:border-red-700 hover:text-red-400 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-5 py-2 rounded-lg text-sm font-bold bg-[#6c3483] text-white hover:bg-opacity-90 transition"
              >
                Register
              </button>
            </>
          )}
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden flex flex-col gap-1.5 p-2">
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-800 px-4 py-4 space-y-2" style={{ background: "rgba(10,10,26,0.98)" }}>
          {navLinks.map(link => (
            <button
              key={link.path}
              onClick={() => { navigate(link.path); setMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition ${
                isActive(link.path)
                  ? "text-[#6c3483] bg-[#6c3483]/10"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.label}
            </button>
          ))}
          {user ? (
            <>
              <button onClick={() => { navigate(getDashboardPath()); setMenuOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-lg text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition">
                Dashboard
              </button>
              <button onClick={() => { navigate("/profile"); setMenuOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-lg text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition">
                Profile
              </button>
              <div className="flex items-center gap-3 px-4 py-3 bg-[#1e1e38] border border-gray-800 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-[#6c3483]/40 border border-[#6c3483] flex items-center justify-center text-sm font-black text-[#6c3483]">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-sm font-bold">{user.name}</p>
                  <p className="text-gray-500 text-xs capitalize">{user.role}</p>
                </div>
              </div>
              <button onClick={() => { logout(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-lg text-sm font-bold text-red-400 hover:bg-red-900/20 transition">
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { navigate("/login"); setMenuOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-lg text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition">
                Login
              </button>
              <button onClick={() => { navigate("/register"); setMenuOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-lg text-sm font-bold bg-[#6c3483] text-white hover:bg-opacity-90 transition">
                Register
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;