import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosConfig";
import { AuthContext } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

const BuyerDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [purchases, setPurchases] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [toppingUp, setToppingUp] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // FIX: added followingRes
        const [purchasesRes, notifRes, walletRes, followingRes] = await Promise.all([
          API.get("/users/my-purchases"),
          API.get("/users/notifications"),
          API.get("/users/wallet"),
          API.get("/users/following"),
        ]);
        setPurchases(purchasesRes.data);
        setNotifications(notifRes.data);
        setWalletBalance(walletRes.data.walletBalance);
        setFollowing(followingRes.data);
      } catch {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const markRead = async (notifId) => {
    try {
      await API.put(`/users/notifications/${notifId}`);
      setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, read: true } : n));
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const markAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => API.put(`/users/notifications/${n._id}`)));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleUnfollow = async (artistId) => {
    try {
      await API.put(`/users/follow/${artistId}`);
      setFollowing(prev => prev.filter(a => a._id !== artistId));
      toast.success("Unfollowed");
    } catch {
      toast.error("Failed to unfollow");
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount || Number(topUpAmount) <= 0) return toast.error("Enter a valid amount");
    setToppingUp(true);
    try {
      const { data } = await API.put("/users/wallet/topup", { amount: Number(topUpAmount) });
      setWalletBalance(data.walletBalance);
      setTopUpAmount("");
      toast.success(`$${topUpAmount} added to wallet!`);
    } catch {
      toast.error("Top up failed");
    } finally {
      setToppingUp(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const totalSpent = purchases.reduce((sum, p) => sum + (p.soldPrice || p.price || 0), 0);

  const tabs = [
    { key: "overview",      label: "Overview" },
    { key: "purchases",     label: `Purchases (${purchases.length})` },
    { key: "notifications", label: `Notifications ${unreadCount > 0 ? `(${unreadCount})` : ""}` },
    { key: "following",     label: `Following (${following.length})` },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 text-white">
      <div className="mb-8">
        <p className="text-[#6c3483] text-sm font-bold uppercase tracking-widest mb-1">Buyer Dashboard</p>
        <h1 className="text-4xl font-black text-white" style={{ fontFamily: "Georgia, serif" }}>
          Welcome, {user?.name}
        </h1>
      </div>

      <div className="flex gap-2 flex-wrap mb-8 border-b border-gray-800 pb-4">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition ${
              activeTab === tab.key
                ? "bg-[#6c3483] text-white"
                : "bg-[#1e1e38] text-gray-400 border border-gray-700 hover:border-[#6c3483]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#1e1e38] border border-gray-800 rounded-xl p-6 text-center">
              <p className="text-4xl font-black text-[#6c3483]">{purchases.length}</p>
              <p className="text-gray-400 text-sm mt-2 uppercase tracking-wider">Artworks Purchased</p>
            </div>
            <div className="bg-[#1e1e38] border border-gray-800 rounded-xl p-6 text-center">
              <p className="text-4xl font-black text-[#6c3483]">{unreadCount}</p>
              <p className="text-gray-400 text-sm mt-2 uppercase tracking-wider">Unread Notifications</p>
            </div>
            <div className="bg-[#1e1e38] border border-gray-800 rounded-xl p-6 text-center">
              <p className="text-4xl font-black text-[#6c3483]">${totalSpent.toLocaleString()}</p>
              <p className="text-gray-400 text-sm mt-2 uppercase tracking-wider">Total Spent</p>
            </div>
            <div className="bg-[#1e1e38] border border-gray-800 rounded-xl p-6 text-center">
              <p className="text-4xl font-black text-green-400">
                ${walletBalance !== null ? walletBalance : "..."}
              </p>
              <p className="text-gray-400 text-sm mt-2 uppercase tracking-wider">Wallet Balance</p>
              <div className="mt-4 flex gap-2">
                <input
                  type="number"
                  placeholder="Add funds"
                  value={topUpAmount}
                  onChange={e => setTopUpAmount(e.target.value)}
                  className="flex-1 p-2 bg-[#16162a] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-[#6c3483] transition"
                />
                <button
                  onClick={handleTopUp}
                  disabled={toppingUp}
                  className="px-3 py-2 bg-green-700 rounded-lg text-white text-xs font-bold hover:bg-green-600 transition disabled:opacity-50"
                >
                  {toppingUp ? "..." : "Add"}
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Recent Purchases</h2>
              {purchases.length > 0 && (
                <button onClick={() => setActiveTab("purchases")} className="text-[#6c3483] text-sm hover:underline">
                  View all →
                </button>
              )}
            </div>
            {purchases.length === 0 ? (
              <div className="bg-[#1e1e38] border border-gray-800 rounded-xl p-10 text-center text-gray-500">
                <p className="text-4xl mb-3">🛍️</p>
                <p>You haven't purchased any artworks yet.</p>
                <button onClick={() => navigate("/browse")} className="mt-4 px-6 py-2 bg-[#6c3483] rounded-lg text-sm font-bold hover:bg-opacity-90 transition">
                  Browse Artworks
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {purchases.slice(0, 3).map(art => (
                  <div
                    key={art._id}
                    onClick={() => navigate(`/art/${art._id}`)}
                    className="bg-[#1e1e38] border border-gray-800 rounded-xl p-4 flex gap-4 items-center cursor-pointer hover:border-[#6c3483] transition"
                  >
                    <img src={art.imageUrl || art.image} alt={art.title} className="w-16 h-16 object-cover rounded-lg border border-gray-700 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{art.title}</p>
                      <p className="text-gray-400 text-sm">By {art.artist?.name || "Unknown"}</p>
                      <p className="text-[#6c3483] font-bold text-sm mt-1">
                        {art.isAuction ? `Won auction: $${art.soldPrice}` : `Paid: $${art.soldPrice || art.price}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Recent Notifications</h2>
                <button onClick={() => setActiveTab("notifications")} className="text-[#6c3483] text-sm hover:underline">View all →</button>
              </div>
              <div className="space-y-2">
                {notifications.slice(0, 3).map(n => (
                  <div key={n._id} className={`p-4 rounded-xl border transition ${n.read ? "bg-[#1e1e38] border-gray-800 text-gray-400" : "bg-[#6c3483]/10 border-[#6c3483]/40 text-white"}`}>
                    <p className="text-sm">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Purchases tab ── */}
      {activeTab === "purchases" && (
        <div>
          <h2 className="text-2xl font-black text-white mb-6" style={{ fontFamily: "Georgia, serif" }}>
            My Purchases
          </h2>
          {purchases.length === 0 ? (
            <div className="text-center py-16 bg-[#1e1e38] border border-gray-800 rounded-xl text-gray-500">
              <p className="text-4xl mb-4">🛍️</p>
              <p>You haven't purchased any artworks yet.</p>
              <button onClick={() => navigate("/browse")} className="mt-4 px-6 py-2 bg-[#6c3483] rounded-lg text-sm font-bold hover:bg-opacity-90 transition">
                Start Browsing
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map(art => (
                <div
                  key={art._id}
                  onClick={() => navigate(`/art/${art._id}`)}
                  className="bg-[#1e1e38] border border-gray-800 rounded-xl p-5 flex gap-5 items-start cursor-pointer hover:border-[#6c3483] transition"
                >
                  <img src={art.imageUrl || art.image} alt={art.title} className="w-20 h-20 object-cover rounded-lg border border-gray-700 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{art.title}</h3>
                    <p className="text-gray-400 text-sm">By {art.artist?.name || "Unknown Artist"}</p>
                    <p className="text-gray-400 text-sm">{art.category}</p>
                    <div className="mt-2 space-y-1">
                      {art.isAuction ? (
                        <>
                          <p className="text-[#6c3483] font-bold">🏆 Won Auction: ${art.soldPrice}</p>
                          <p className="text-gray-500 text-xs">Starting price: ${art.auctionStartPrice}</p>
                          <p className="text-gray-500 text-xs">Total bids: {art.bids?.length || 0}</p>
                        </>
                      ) : (
                        <p className="text-[#6c3483] font-bold">Paid: ${art.soldPrice || art.price}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-600 text-xs hidden sm:block flex-shrink-0">View →</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Notifications tab ── */}
      {activeTab === "notifications" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white" style={{ fontFamily: "Georgia, serif" }}>Notifications</h2>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-sm text-[#6c3483] hover:underline font-bold">Mark all as read</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="text-center py-16 bg-[#1e1e38] border border-gray-800 rounded-xl text-gray-500">
              <p className="text-4xl mb-4">🔔</p>
              <p>No notifications yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n._id} className={`p-5 rounded-xl border transition ${n.read ? "bg-[#1e1e38] border-gray-800" : "bg-[#6c3483]/10 border-[#6c3483]/40"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <p className={`text-sm leading-relaxed ${n.read ? "text-gray-400" : "text-white"}`}>{n.message}</p>
                    {!n.read && (
                      <button onClick={() => markRead(n._id)} className="text-xs text-[#6c3483] hover:underline font-bold flex-shrink-0">
                        Mark read
                      </button>
                    )}
                  </div>
                  {n.read && <p className="text-xs text-gray-600 mt-2">Read</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Following tab ── */}
      {activeTab === "following" && (
        <div>
          <h2 className="text-2xl font-black text-white mb-6" style={{ fontFamily: "Georgia, serif" }}>
            Artists I Follow
          </h2>
          {following.length === 0 ? (
            <div className="text-center py-16 bg-[#1e1e38] border border-gray-800 rounded-xl text-gray-500">
              <p className="text-4xl mb-4">👥</p>
              <p>You're not following any artists yet.</p>
              <button onClick={() => navigate("/artists")} className="mt-4 px-6 py-2 bg-[#6c3483] rounded-lg text-sm font-bold hover:bg-opacity-90 transition">
                Discover Artists
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {following.map(artist => (
                <div key={artist._id} className="bg-[#1e1e38] border border-gray-800 rounded-xl p-6 flex flex-col items-center text-center gap-3">
                  <div
                    onClick={() => navigate(`/artist/${artist._id}`)}
                    className="w-16 h-16 rounded-full bg-[#6c3483]/30 border-2 border-[#6c3483] flex items-center justify-center text-2xl font-black text-[#6c3483] cursor-pointer hover:opacity-80 transition"
                  >
                    {artist.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p onClick={() => navigate(`/artist/${artist._id}`)} className="font-bold text-white cursor-pointer hover:text-[#6c3483] transition">
                      {artist.name}
                    </p>
                    <p className="text-gray-400 text-xs mt-1 line-clamp-2">{artist.aboutMe || "Artist on ArtSphere"}</p>
                  </div>
                  <button
                    onClick={() => handleUnfollow(artist._id)}
                    className="w-full mt-2 py-2 rounded-lg text-sm font-bold border border-gray-700 text-gray-400 hover:border-red-700 hover:text-red-400 transition"
                  >
                    Unfollow
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BuyerDashboard;