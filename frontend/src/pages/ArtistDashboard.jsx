import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosConfig";
import { AuthContext } from "../context/AuthContext";
import ArtCard from "../components/ArtCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmModal from "../components/ConfirmModal";
import ImageUpload from "../components/ImageUpload";
import StatusBadge from "../components/StatusBadge";
import toast from "react-hot-toast";

const ArtistDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [myArtworks, setMyArtworks] = useState([]);
  const [mySales, setMySales] = useState([]);
  const [myExhibitions, setMyExhibitions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Edit state
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", price: "", category: "", exhibitionType: "buy" });
  const [saving, setSaving] = useState(false);

  // Upload form state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    exhibitionType: "buy",
    isAuction: false,
    auctionStartPrice: "",
    auctionDurationHours: "24",
  });

  // Exhibition form state
  const [exForm, setExForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    artworks: [],
  });
  const [submittingEx, setSubmittingEx] = useState(false);

  // ── Fetch all data ───────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [artRes, salesRes, catRes, exRes] = await Promise.all([
          API.get("/art"),
          API.get("/users/my-sales"),
          API.get("/admin/categories"),
          API.get("/exhibitions"),
        ]);

        const mine = artRes.data.filter(a => {
          const artistId = String(a.artist?._id || a.artist?.id || a.artist);
          return artistId === String(user?._id) || artistId === String(user?.id);
        });
        setMyArtworks(mine);
        setMySales(salesRes.data);
        setCategories(catRes.data);

        const myEx = exRes.data.filter(e =>
          String(e.createdBy?._id) === String(user?._id) || String(e.createdBy) === String(user?._id)
        );
        setMyExhibitions(myEx);
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  // ── Upload artwork ───────────────────────────────────────
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return toast.error("Please select an image");

    setUploading(true);
    try {
      const data = new FormData();
      data.append("image", uploadFile);
      data.append("title", uploadForm.title);
      data.append("description", uploadForm.description);
      data.append("price", uploadForm.price);
      data.append("category", uploadForm.category);
      data.append("exhibitionType", uploadForm.exhibitionType);
      data.append("isAuction", uploadForm.isAuction);
      if (uploadForm.isAuction) {
        data.append("auctionStartPrice", uploadForm.auctionStartPrice);
        data.append("auctionDurationHours", uploadForm.auctionDurationHours);
      }

      const { data: newArt } = await API.post("/art", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Artwork uploaded successfully! 🎨");
      setMyArtworks(prev => [newArt, ...prev]);
      setUploadFile(null);
      setUploadForm({
        title: "",
        description: "",
        price: "",
        category: "",
        exhibitionType: "buy",
        isAuction: false,
        auctionStartPrice: "",
        auctionDurationHours: "24",
      });
      setActiveTab("artworks");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ── Delete artwork ───────────────────────────────────────
  const handleDelete = async () => {
    try {
      await API.delete(`/art/${deleteTarget}`);
      setMyArtworks(prev => prev.filter(a => a._id !== deleteTarget));
      toast.success("Artwork deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  };

  // ── Open edit modal ──────────────────────────────────────
  const openEdit = (art) => {
    setEditTarget(art._id);
    setEditForm({
      title: art.title || "",
      description: art.description || "",
      price: art.price || "",
      category: art.category || "",
      exhibitionType: art.exhibitionType || "buy",
    });
  };

  // ── Save edit ────────────────────────────────────────────
  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: updated } = await API.put(`/art/${editTarget}`, editForm);
      setMyArtworks(prev => prev.map(a => a._id === editTarget ? { ...a, ...updated } : a));
      toast.success("Artwork updated!");
      setEditTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle exhibition ────────────────────────────────────
  const handleToggleExhibition = async (exId, currentStatus) => {
    try {
      const { data } = await API.put(`/exhibitions/${exId}/toggle`);
      setMyExhibitions(prev =>
        prev.map(e => e._id === exId ? { ...e, status: data.status } : e)
      );
      toast.success(data.status === "active" ? "Exhibition is now Live!" : "Exhibition ended");
    } catch {
      toast.error("Failed to toggle exhibition");
    }
  };

  // ── Submit exhibition ────────────────────────────────────
  const handleSubmitExhibition = async (e) => {
    e.preventDefault();
    if (exForm.artworks.length === 0) {
      return toast.error("Select at least one artwork");
    }
    setSubmittingEx(true);
    try {
      const { data } = await API.post("/exhibitions", exForm);
      setMyExhibitions(prev => [data, ...prev]);
      toast.success("Exhibition created!");
      setExForm({ title: "", description: "", startDate: "", endDate: "", artworks: [] });
      setActiveTab("exhibitions");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create exhibition");
    } finally {
      setSubmittingEx(false);
    }
  };

  const toggleArtworkSelection = (artId) => {
    setExForm(prev => ({
      ...prev,
      artworks: prev.artworks.includes(artId)
        ? prev.artworks.filter(id => id !== artId)
        : [...prev.artworks, artId],
    }));
  };

  const totalRevenue = mySales.reduce((sum, s) => sum + (s.soldPrice || 0), 0);

  const tabs = [
    { key: "overview",      label: "Overview" },
    { key: "upload",        label: "Upload Art" },
    { key: "artworks",      label: `My Artworks (${myArtworks.length})` },
    { key: "sales",         label: `My Sales (${mySales.length})` },
    { key: "exhibitions",   label: `Exhibitions (${myExhibitions.length})` },
    { key: "newexhibition", label: "+ New Exhibition" },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 text-white">

      {/* Delete modal */}
      {deleteTarget && (
        <ConfirmModal
          message="Are you sure you want to delete this artwork? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#1e1e38] border border-gray-700 rounded-xl p-8 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-black text-white mb-6" style={{ fontFamily: "Georgia, serif" }}>
              Edit Artwork
            </h3>
            <form onSubmit={handleEdit} className="space-y-4">
              <input
                type="text"
                placeholder="Title *"
                required
                value={editForm.title}
                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full p-3 bg-[#16162a] border border-gray-700 rounded-lg text-white outline-none focus:border-[#6c3483] transition"
              />
              <textarea
                placeholder="Description *"
                required
                value={editForm.description}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full p-3 bg-[#16162a] border border-gray-700 rounded-lg text-white outline-none focus:border-[#6c3483] transition h-24 resize-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Price ($) *"
                  required
                  value={editForm.price}
                  onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                  className="w-full p-3 bg-[#16162a] border border-gray-700 rounded-lg text-white outline-none focus:border-[#6c3483] transition"
                />
                <select
                  value={editForm.category}
                  onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full p-3 bg-[#16162a] border border-gray-700 rounded-lg text-white outline-none focus:border-[#6c3483] transition"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Exhibition Type</label>
                <div className="flex gap-3">
                  {["buy", "view-only", "hybrid"].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, exhibitionType: type })}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border transition ${
                        editForm.exhibitionType === type
                          ? "bg-[#6c3483] border-[#6c3483] text-white"
                          : "bg-[#16162a] border-gray-700 text-gray-400 hover:border-[#6c3483]"
                      }`}
                    >
                      {type === "view-only" ? "View Only" : type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#6c3483] py-3 rounded-lg font-bold text-white hover:bg-opacity-90 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="flex-1 bg-gray-700 py-3 rounded-lg font-bold text-white hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <p className="text-[#6c3483] text-sm font-bold uppercase tracking-widest mb-1">
          Artist Dashboard
        </p>
        <h1
          className="text-4xl font-black text-white"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Welcome, {user?.name}
        </h1>
      </div>

      {/* Tab nav */}
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

      {/* ── Overview tab ── */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#1e1e38] border border-gray-800 rounded-xl p-6 text-center">
              <p className="text-4xl font-black text-[#6c3483]">{myArtworks.length}</p>
              <p className="text-gray-400 text-xs uppercase tracking-wider mt-2">Artworks</p>
            </div>
            <div className="bg-[#1e1e38] border border-gray-800 rounded-xl p-6 text-center">
              <p className="text-4xl font-black text-[#6c3483]">{mySales.length}</p>
              <p className="text-gray-400 text-xs uppercase tracking-wider mt-2">Sold</p>
            </div>
            <div className="bg-[#1e1e38] border border-gray-800 rounded-xl p-6 text-center">
              <p className="text-4xl font-black text-[#6c3483]">${totalRevenue.toLocaleString()}</p>
              <p className="text-gray-400 text-xs uppercase tracking-wider mt-2">Revenue</p>
            </div>
            <div className="bg-[#1e1e38] border border-gray-800 rounded-xl p-6 text-center">
              <p className="text-4xl font-black text-[#6c3483]">{myExhibitions.length}</p>
              <p className="text-gray-400 text-xs uppercase tracking-wider mt-2">Exhibitions</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recent Artworks</h2>
              <button onClick={() => setActiveTab("artworks")} className="text-[#6c3483] text-sm hover:underline">
                View all →
              </button>
            </div>
            {myArtworks.length === 0 ? (
              <div className="bg-[#1e1e38] border border-gray-800 rounded-xl p-10 text-center text-gray-500">
                <p className="text-4xl mb-3">🎨</p>
                <p>No artworks yet.</p>
                <button
                  onClick={() => setActiveTab("upload")}
                  className="mt-4 px-6 py-2 bg-[#6c3483] rounded-lg text-sm font-bold hover:bg-opacity-90 transition"
                >
                  Upload First Artwork
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myArtworks.slice(0, 3).map(art => (
                  <ArtCard key={art._id} art={art} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Upload tab ── */}
      {activeTab === "upload" && (
        <div className="max-w-2xl">
          <h2 className="text-2xl font-black text-white mb-6"
            style={{ fontFamily: "Georgia, serif" }}>
            Upload New Artwork
          </h2>
          <form onSubmit={handleUpload} className="space-y-5">

            <ImageUpload onFileSelect={setUploadFile} />

            <input
              type="text"
              placeholder="Artwork Title *"
              required
              value={uploadForm.title}
              onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
              className="w-full p-3 bg-[#16162a] border border-gray-700 rounded-lg text-white outline-none focus:border-[#6c3483] transition"
            />

            <textarea
              placeholder="Description *"
              required
              value={uploadForm.description}
              onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
              className="w-full p-3 bg-[#16162a] border border-gray-700 rounded-lg text-white outline-none focus:border-[#6c3483] transition h-28 resize-none"
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Price ($) *"
                required
                value={uploadForm.price}
                onChange={e => setUploadForm({ ...uploadForm, price: e.target.value })}
                className="w-full p-3 bg-[#16162a] border border-gray-700 rounded-lg text-white outline-none focus:border-[#6c3483] transition"
              />
              <select
                value={uploadForm.category}
                onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}
                className="w-full p-3 bg-[#16162a] border border-gray-700 rounded-lg text-white outline-none focus:border-[#6c3483] transition"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">Exhibition Type</label>
              <div className="flex gap-3">
                {["buy", "view-only", "hybrid"].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setUploadForm({ ...uploadForm, exhibitionType: type })}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition capitalize ${
                      uploadForm.exhibitionType === type
                        ? "bg-[#6c3483] border-[#6c3483] text-white"
                        : "bg-[#16162a] border-gray-700 text-gray-400 hover:border-[#6c3483]"
                    }`}
                  >
                    {type === "view-only" ? "View Only" : type}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#16162a] border border-gray-700 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold">List as Auction</p>
                  <p className="text-gray-500 text-xs mt-0.5">Requires admin approval before going live</p>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadForm({ ...uploadForm, isAuction: !uploadForm.isAuction })}
                  className={`w-12 h-6 rounded-full transition-all duration-200 relative ${
                    uploadForm.isAuction ? "bg-[#6c3483]" : "bg-gray-700"
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${
                    uploadForm.isAuction ? "left-6" : "left-0.5"
                  }`} />
                </button>
              </div>

              {uploadForm.isAuction && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-700">
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Starting Price ($)</label>
                    <input
                      type="number"
                      placeholder="e.g. 100"
                      value={uploadForm.auctionStartPrice}
                      onChange={e => setUploadForm({ ...uploadForm, auctionStartPrice: e.target.value })}
                      className="w-full p-3 bg-[#0f0f1a] border border-gray-600 rounded-lg text-white outline-none focus:border-[#6c3483] transition"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Duration (Hours)</label>
                    <input
                      type="number"
                      placeholder="e.g. 24"
                      value={uploadForm.auctionDurationHours}
                      onChange={e => setUploadForm({ ...uploadForm, auctionDurationHours: e.target.value })}
                      className="w-full p-3 bg-[#0f0f1a] border border-gray-600 rounded-lg text-white outline-none focus:border-[#6c3483] transition"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-[#6c3483] py-4 rounded-lg font-black text-white text-lg hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : "Upload Artwork 🎨"}
            </button>
          </form>
        </div>
      )}

      {/* ── My Artworks tab ── */}
      {activeTab === "artworks" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white"
              style={{ fontFamily: "Georgia, serif" }}>
              My Artworks
            </h2>
            <button
              onClick={() => setActiveTab("upload")}
              className="px-4 py-2 bg-[#6c3483] rounded-lg text-sm font-bold hover:bg-opacity-90 transition"
            >
              + Upload New
            </button>
          </div>

          {myArtworks.length === 0 ? (
            <div className="text-center py-16 bg-[#1e1e38] border border-gray-800 rounded-xl text-gray-500">
              <p className="text-4xl mb-4">🎨</p>
              <p>No artworks yet. Upload your first piece!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myArtworks.map(art => (
                <div
                  key={art._id}
                  className="bg-[#1e1e38] border border-gray-800 rounded-xl p-4 flex gap-4 items-center hover:border-gray-600 transition"
                >
                  <img
                    src={art.imageUrl || art.image}
                    alt={art.title}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-700 flex-shrink-0 cursor-pointer"
                    onClick={() => navigate(`/art/${art._id}`)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{art.title}</p>
                    <p className="text-gray-400 text-sm">${art.price} · {art.category || "No category"}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <StatusBadge status={art.isSold ? "sold" : art.isAuction ? "auction" : art.status} />
                      {art.exhibitionType && art.exhibitionType !== "buy" && (
                        <StatusBadge status={art.exhibitionType} />
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEdit(art)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-bold border border-blue-800 hover:border-blue-600 px-3 py-1 rounded-lg transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(art._id)}
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

      {/* ── My Sales tab ── */}
      {activeTab === "sales" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white"
              style={{ fontFamily: "Georgia, serif" }}>
              My Sales
            </h2>
            <div className="bg-[#1e1e38] border border-gray-800 rounded-xl px-5 py-3 text-center">
              <p className="text-[#6c3483] font-black text-xl">${totalRevenue.toLocaleString()}</p>
              <p className="text-gray-500 text-xs">Total Revenue</p>
            </div>
          </div>

          {mySales.length === 0 ? (
            <div className="text-center py-16 bg-[#1e1e38] border border-gray-800 rounded-xl text-gray-500">
              <p className="text-4xl mb-4">💰</p>
              <p>No sales yet. Keep creating!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mySales.map(sale => (
                <div
                  key={sale._id}
                  className="bg-[#1e1e38] border border-gray-800 rounded-xl p-5 flex gap-4 items-center"
                >
                  <img
                    src={sale.imageUrl || sale.image}
                    alt={sale.title}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-700 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{sale.title}</p>
                    <p className="text-gray-400 text-sm">
                      Sold to: <span className="text-white">{sale.buyer?.name || "Buyer"}</span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[#6c3483] font-black text-lg">${sale.soldPrice}</p>
                    <p className="text-gray-600 text-xs">
                      {sale.isAuction ? "Auction" : "Fixed Price"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Exhibitions tab ── */}
      {activeTab === "exhibitions" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white"
              style={{ fontFamily: "Georgia, serif" }}>
              My Exhibitions
            </h2>
            <button
              onClick={() => setActiveTab("newexhibition")}
              className="px-4 py-2 bg-[#6c3483] rounded-lg text-sm font-bold hover:bg-opacity-90 transition"
            >
              + New Exhibition
            </button>
          </div>

          {myExhibitions.length === 0 ? (
            <div className="text-center py-16 bg-[#1e1e38] border border-gray-800 rounded-xl text-gray-500">
              <p className="text-4xl mb-4">🖼️</p>
              <p>No exhibitions yet.</p>
              <button
                onClick={() => setActiveTab("newexhibition")}
                className="mt-4 px-6 py-2 bg-[#6c3483] rounded-lg text-sm font-bold hover:bg-opacity-90 transition"
              >
                Create First Exhibition
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myExhibitions.map(ex => (
                <div
                  key={ex._id}
                  className="bg-[#1e1e38] border border-gray-800 rounded-xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-lg">{ex.title}</p>
                    <p className="text-gray-400 text-sm mt-1 line-clamp-1">{ex.description}</p>
                    <p className="text-gray-600 text-xs mt-1">
                      {ex.artworks?.length || 0} artworks
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={ex.status} />
                    <button
                      onClick={() => handleToggleExhibition(ex._id, ex.status)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold border transition ${
                        ex.status === "active"
                          ? "border-red-700 text-red-400 hover:bg-red-900/20"
                          : "border-green-700 text-green-400 hover:bg-green-900/20"
                      }`}
                    >
                      {ex.status === "active" ? "End Exhibition" : "Go Live"}
                    </button>
                    <button
                      onClick={() => navigate(`/exhibition/${ex._id}`)}
                      className="px-4 py-2 rounded-lg text-sm font-bold border border-gray-700 text-gray-400 hover:border-[#6c3483] hover:text-white transition"
                    >
                      View →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── New Exhibition tab ── */}
      {activeTab === "newexhibition" && (
        <div className="max-w-2xl">
          <h2 className="text-2xl font-black text-white mb-6"
            style={{ fontFamily: "Georgia, serif" }}>
            Create New Exhibition
          </h2>
          <form onSubmit={handleSubmitExhibition} className="space-y-5">

            <input
              type="text"
              placeholder="Exhibition Title *"
              required
              value={exForm.title}
              onChange={e => setExForm({ ...exForm, title: e.target.value })}
              className="w-full p-3 bg-[#16162a] border border-gray-700 rounded-lg text-white outline-none focus:border-[#6c3483] transition"
            />

            <textarea
              placeholder="Description of this exhibition..."
              value={exForm.description}
              onChange={e => setExForm({ ...exForm, description: e.target.value })}
              className="w-full p-3 bg-[#16162a] border border-gray-700 rounded-lg text-white outline-none focus:border-[#6c3483] transition h-24 resize-none"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={exForm.startDate}
                  onChange={e => setExForm({ ...exForm, startDate: e.target.value })}
                  className="w-full p-3 bg-[#16162a] border border-gray-700 rounded-lg text-white outline-none focus:border-[#6c3483] transition"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">End Date</label>
                <input
                  type="date"
                  value={exForm.endDate}
                  onChange={e => setExForm({ ...exForm, endDate: e.target.value })}
                  className="w-full p-3 bg-[#16162a] border border-gray-700 rounded-lg text-white outline-none focus:border-[#6c3483] transition"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-3 block">
                Select Artworks ({exForm.artworks.length} selected) *
              </label>
              {myArtworks.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No artworks available. Upload some first.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                  {myArtworks.map(art => {
                    const selected = exForm.artworks.includes(art._id);
                    return (
                      <div
                        key={art._id}
                        onClick={() => toggleArtworkSelection(art._id)}
                        className={`cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                          selected
                            ? "border-[#6c3483] scale-[1.02]"
                            : "border-transparent opacity-60 hover:opacity-90"
                        }`}
                      >
                        <img
                          src={art.imageUrl || art.image}
                          alt={art.title}
                          className="w-full h-24 object-cover"
                        />
                        <div className="bg-[#16162a] p-2">
                          <p className="text-xs text-white truncate font-bold">{art.title}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submittingEx}
              className="w-full bg-[#6c3483] py-4 rounded-lg font-black text-white text-lg hover:bg-opacity-90 transition disabled:opacity-50"
            >
              {submittingEx ? "Creating..." : "Create Exhibition 🖼️"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ArtistDashboard;