import { useState, useEffect } from "react";
import API from "../api/axiosConfig";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["#6c3483", "#27ae60", "#e74c3c", "#f39c12", "#3498db"];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("auctions");

  const [analytics, setAnalytics] = useState(null);
  const [auctionRequests, setAuctionRequests] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newCategory, setNewCategory] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [editDuration, setEditDuration] = useState({});

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [analyticsRes, auctionsRes, exRes, usersRes, catRes, artRes] =
          await Promise.all([
            API.get("/admin/analytics"),
            API.get("/auctions/all-requests"),
            API.get("/admin/exhibitions"),
            API.get("/admin/users"),
            API.get("/admin/categories"),
            API.get("/artworks"), // ✅ FIX: was /art
          ]);

        setAnalytics(analyticsRes.data);
        setAuctionRequests(auctionsRes.data);
        setExhibitions(exRes.data);
        setUsers(usersRes.data);
        setCategories(catRes.data);
        setSales(artRes.data.filter(a => a.isSold));
      } catch {
        toast.error("Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    return () => {
      setDeleteTarget(null);
      setDeleteType(null);
    };
  }, []);

  const handleStatus = async (id, status) => {
    try {
      const duration = editDuration[id] || 24;
      await API.put(`/auctions/approve/${id}`, { status, durationHours: duration });
      toast.success(`Auction ${status}!`);
      setAuctionRequests(prev => prev.filter(r => r._id !== id));
    } catch {
      toast.error("Action failed");
    }
  };

  const handleDurationChange = (id, value) => {
    setEditDuration({ ...editDuration, [id]: value });
  };

  const handleExhibitionStatus = async (id, action) => {
    try {
      await API.put(`/admin/exhibitions/${id}/${action}`);
      toast.success(`Exhibition ${action}d!`);
      setExhibitions(prev => prev.map(e =>
        e._id === id ? { ...e, status: action === "approve" ? "approved" : "rejected" } : e
      ));
    } catch {
      toast.error("Action failed");
    }
  };

  const handleDeleteUser = async () => {
    try {
      await API.delete(`/admin/users/${deleteTarget}`);
      setUsers(prev => prev.filter(u => u._id !== deleteTarget));
      toast.success("User deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteTarget(null);
      setDeleteType(null);
    }
  };

  const handleDeleteCategory = async () => {
    try {
      await API.delete(`/admin/categories/${deleteTarget}`);
      setCategories(prev => prev.filter(c => c._id !== deleteTarget));
      toast.success("Category deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteTarget(null);
      setDeleteType(null);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      const { data } = await API.post("/admin/categories", { name: newCategory.trim() });
      setCategories(prev => [...prev, data]);
      setNewCategory("");
      toast.success("Category added!");
    } catch {
      toast.error("Category already exists or failed");
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const pendingExhibitions = exhibitions.filter(e => e.status === "pending");
  const totalRevenue = analytics?.totalRevenue || 0;

  const categoryChartData = analytics?.categoryStats?.map(c => ({
    name: c._id || "Unknown",
    artworks: c.count,
  })) || [];

  const pieData = [
    { name: "Active",           value: (analytics?.totalArtworks || 0) - (analytics?.soldCount || 0) },
    { name: "Sold",             value: analytics?.soldCount || 0 },
    { name: "Pending Auctions", value: auctionRequests.length },
  ];

  const tabs = [
    { key: "auctions",    label: `🔨 Auctions (${auctionRequests.length})` },
    { key: "analytics",   label: "📊 Analytics" },
    { key: "exhibitions", label: `🖼️ Exhibitions (${pendingExhibitions.length} pending)` },
    { key: "users",       label: `👥 Users (${users.length})` },
    { key: "categories",  label: "🏷️ Categories" },
    { key: "reports",     label: "💰 Sales Report" },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 text-white">

      {deleteTarget && (
        <ConfirmModal
          message={
            deleteType === "user"
              ? "Are you sure you want to delete this user? This cannot be undone."
              : "Are you sure you want to delete this category?"
          }
          onConfirm={deleteType === "user" ? handleDeleteUser : handleDeleteCategory}
          onCancel={() => { setDeleteTarget(null); setDeleteType(null); }}
        />
      )}

      <div className="mb-8">
        <p className="text-[#6c3483] text-sm font-bold uppercase tracking-widest mb-1">
          ArtSphere
        </p>
        <h1
          className="text-4xl font-black text-white"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Admin Control Panel
        </h1>
      </div>

      <div className="flex gap-2 flex-wrap mb-8 border-b border-gray-800 pb-4">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition ${
              activeTab === tab.key
                ? "bg-[#6c3483] text-white"
                : "bg-[#1e1e38] text-gray-400 border border-gray-700 hover:border-[#6c3483]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "auctions" && (
        <div>
          <h2 className="text-2xl font-black text-white mb-6"
            style={{ fontFamily: "Georgia, serif" }}>
            Pending Auction Requests ({auctionRequests.length})
          </h2>

          {auctionRequests.length === 0 ? (
            <div className="text-center py-16 bg-[#1e1e38] border border-gray-800 rounded-xl text-gray-500">
              <p className="text-4xl mb-4">✅</p>
              <p className="italic">No pending requests at the moment.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {auctionRequests.map(req => (
                <div
                  key={req._id}
                  className="bg-[#1e1e38] p-6 rounded-xl border border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4"
                >
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white">
                      {req.collectionId?.name || "Unnamed Collection"}
                    </h4>
                    <p className="text-gray-400 text-sm mt-1">
                      Artist: <span className="text-white">{req.artistId?.name || "Unknown Artist"}</span>
                    </p>
                    <p className="text-gray-400 text-sm">
                      Email: {req.artistId?.email || "—"}
                    </p>
                    <p className="text-[#6c3483] font-bold mt-2">
                      Duration: {req.durationHours} hours
                    </p>
                    {req.startTime && (
                      <p className="text-gray-500 text-xs mt-1">
                        Requested start: {new Date(req.startTime).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    <label className="text-xs text-gray-500">Reschedule Duration (Hours):</label>
                    <input
                      type="number"
                      className="bg-[#0f0f1a] border border-gray-700 rounded px-2 py-1 w-24 text-center text-white"
                      defaultValue={24}
                      onChange={(e) => handleDurationChange(req._id, e.target.value)}
                    />
                    <div className="flex gap-4 mt-2">
                      <button
                        onClick={() => handleStatus(req._id, "approved")}
                        className="bg-green-600 px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatus(req._id, "rejected")}
                        className="bg-red-600 px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Total Users",    value: analytics?.totalUsers || 0,          icon: "👥" },
              { label: "Total Artworks", value: analytics?.totalArtworks || 0,       icon: "🎨" },
              { label: "Total Sales",    value: analytics?.soldCount || 0,           icon: "🛍️" },
              { label: "Total Revenue",  value: `$${totalRevenue.toLocaleString()}`, icon: "💰" },
            ].map(stat => (
              <div key={stat.label} className="bg-[#1e1e38] border border-gray-800 rounded-xl p-6 text-center">
                <p className="text-3xl mb-2">{stat.icon}</p>
                <p className="text-3xl font-black text-[#6c3483]">{stat.value}</p>
                <p className="text-gray-400 text-xs uppercase tracking-wider mt-2">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#1e1e38] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-6">Artworks by Category</h3>
            {categoryChartData.length === 0 ? (
              <p className="text-gray-500 text-center py-10">No category data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryChartData}>
                  <XAxis dataKey="name" stroke="#7f8c8d" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#7f8c8d" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e1e38", border: "1px solid #4a4a6a", borderRadius: "8px" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="artworks" fill="#6c3483" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-[#1e1e38] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-6">Artwork Status Distribution</h3>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e1e38", border: "1px solid #4a4a6a", borderRadius: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 flex-shrink-0">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-gray-300 text-sm">{entry.name}</span>
                    <span className="text-white font-bold ml-auto pl-4">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "exhibitions" && (
        <div>
          <h2 className="text-2xl font-black text-white mb-6"
            style={{ fontFamily: "Georgia, serif" }}>
            Exhibition Management
          </h2>
          {exhibitions.length === 0 ? (
            <div className="text-center py-16 bg-[#1e1e38] border border-gray-800 rounded-xl text-gray-500">
              <p className="text-4xl mb-4">🖼️</p>
              <p>No exhibitions yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exhibitions.map(ex => (
                <div
                  key={ex._id}
                  className="bg-[#1e1e38] border border-gray-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-lg">{ex.title}</h4>
                    <p className="text-gray-400 text-sm">
                      By: <span className="text-white">{ex.createdBy?.name || "Unknown"}</span>
                    </p>
                    <p className="text-gray-500 text-xs mt-1">{ex.artworks?.length || 0} artworks</p>
                    <div className="mt-2"><StatusBadge status={ex.status} /></div>
                  </div>
                  {ex.status === "pending" && (
                    <div className="flex gap-3 flex-shrink-0">
                      <button
                        onClick={() => handleExhibitionStatus(ex._id, "approve")}
                        className="bg-green-600 px-5 py-2 rounded-lg font-bold hover:bg-green-700 transition text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleExhibitionStatus(ex._id, "reject")}
                        className="bg-red-600 px-5 py-2 rounded-lg font-bold hover:bg-red-700 transition text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "users" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white"
              style={{ fontFamily: "Georgia, serif" }}>
              User Management
            </h2>
            <span className="text-gray-500 text-sm">{users.length} total users</span>
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            className="w-full p-3 bg-[#16162a] border border-gray-700 rounded-lg text-white outline-none focus:border-[#6c3483] transition mb-6 placeholder-gray-500"
          />
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16 bg-[#1e1e38] border border-gray-800 rounded-xl text-gray-500">
              <p className="text-4xl mb-4">👥</p>
              <p>No users found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map(u => (
                <div
                  key={u._id}
                  className="bg-[#1e1e38] border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-[#6c3483]/30 border border-[#6c3483] flex items-center justify-center font-black text-[#6c3483] flex-shrink-0">
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white">{u.name}</p>
                    <p className="text-gray-400 text-sm truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={u.role} />
                    <button
                      onClick={() => { setDeleteTarget(u._id); setDeleteType("user"); }}
                      className="text-red-400 hover:text-red-300 text-sm font-bold border border-red-800 hover:border-red-600 px-3 py-1 rounded-lg transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "categories" && (
        <div className="max-w-xl">
          <h2 className="text-2xl font-black text-white mb-6"
            style={{ fontFamily: "Georgia, serif" }}>
            Category Management
          </h2>
          <form onSubmit={handleAddCategory} className="flex gap-3 mb-8">
            <input
              type="text"
              placeholder="New category name..."
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="flex-1 p-3 bg-[#16162a] border border-gray-700 rounded-lg text-white outline-none focus:border-[#6c3483] transition placeholder-gray-500"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-[#6c3483] rounded-lg font-bold hover:bg-opacity-90 transition flex-shrink-0"
            >
              Add
            </button>
          </form>
          {categories.length === 0 ? (
            <p className="text-gray-500 text-center py-10">No categories yet. Add one above.</p>
          ) : (
            <div className="space-y-3">
              {categories.map(cat => (
                <div
                  key={cat._id}
                  className="bg-[#1e1e38] border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between"
                >
                  <p className="text-white font-bold">{cat.name}</p>
                  <button
                    onClick={() => { setDeleteTarget(cat._id); setDeleteType("category"); }}
                    className="text-red-400 hover:text-red-300 text-sm font-bold border border-red-800 hover:border-red-600 px-3 py-1 rounded-lg transition"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "reports" && (
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-white"
              style={{ fontFamily: "Georgia, serif" }}>
              Sales Report
            </h2>
            <div className="bg-[#1e1e38] border border-gray-800 rounded-xl px-6 py-4 text-center">
              <p className="text-3xl font-black text-[#6c3483]">${totalRevenue.toLocaleString()}</p>
              <p className="text-gray-500 text-xs uppercase tracking-wider mt-1">Total Revenue</p>
            </div>
          </div>
          {sales.length === 0 ? (
            <div className="text-center py-16 bg-[#1e1e38] border border-gray-800 rounded-xl text-gray-500">
              <p className="text-4xl mb-4">💰</p>
              <p>No sales recorded yet.</p>
            </div>
          ) : (
            <div className="bg-[#1e1e38] border border-gray-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="text-left p-4">Artwork</th>
                      <th className="text-left p-4">Artist</th>
                      <th className="text-left p-4">Buyer</th>
                      <th className="text-left p-4">Price</th>
                      <th className="text-left p-4">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map(sale => (
                      <tr
                        key={sale._id}
                        className="border-b border-gray-800 hover:bg-[#16162a] transition"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={sale.imageUrl || sale.image}
                              alt={sale.title}
                              className="w-10 h-10 object-cover rounded border border-gray-700"
                            />
                            <span className="text-white font-bold truncate max-w-[120px]">
                              {sale.title}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-300">{sale.artist?.name || "—"}</td>
                        <td className="p-4 text-gray-300">{sale.buyer?.name || "—"}</td>
                        <td className="p-4 text-[#6c3483] font-black">${sale.soldPrice}</td>
                        <td className="p-4">
                          <StatusBadge status={sale.isAuction ? "auction" : "approved"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;