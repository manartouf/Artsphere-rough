import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosConfig";
import { AuthContext } from "../context/AuthContext";
import ArtCard from "../components/ArtCard";
import LoadingSpinner from "../components/LoadingSpinner";

const Browse = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [allArt, setAllArt] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // ── Fetch artworks + categories ──────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [artRes, catRes] = await Promise.all([
          API.get("/art"),
          API.get("/admin/categories"),
        ]);
        setAllArt(artRes.data);
        setFiltered(artRes.data);
        setCategories(catRes.data);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Debounced filtering ──────────────────────────────────
  useEffect(() => {
    const timeout = setTimeout(() => {
      let result = [...allArt];

      // Search by title
      if (search.trim()) {
        result = result.filter(art =>
          art.title.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Category filter
      if (selectedCategory !== "all") {
        result = result.filter(art =>
          art.category?.toLowerCase() === selectedCategory.toLowerCase()
        );
      }

      // Type filter
      if (selectedType === "auction") {
        result = result.filter(art => art.isAuction);
      } else if (selectedType === "fixed") {
        result = result.filter(art => !art.isAuction);
      } else if (selectedType === "exhibition") {
        result = result.filter(art => art.exhibitionType === "view-only");
      }

      // Price filter
      if (minPrice !== "") {
        result = result.filter(art => art.price >= Number(minPrice));
      }
      if (maxPrice !== "") {
        result = result.filter(art => art.price <= Number(maxPrice));
      }

      setFiltered(result);
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, selectedCategory, selectedType, minPrice, maxPrice, allArt]);

  // ── Admire toggle — updates card without refetch ─────────
  const handleAdmireToggle = (artId) => {
    setAllArt(prev => prev.map(art => {
      if (art._id !== artId) return art;
      const alreadyAdmired = art.admirers?.includes(user?._id);
      return {
        ...art,
        admirers: alreadyAdmired
          ? art.admirers.filter(id => id !== user?._id)
          : [...(art.admirers || []), user?._id]
      };
    }));
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedType("all");
    setMinPrice("");
    setMaxPrice("");
  };

  const hasActiveFilters = search || selectedCategory !== "all" || selectedType !== "all" || minPrice || maxPrice;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 text-white">

      {/* Header */}
      <div className="mb-8">
        <p className="text-[#6c3483] text-sm font-bold uppercase tracking-widest mb-2">
          ArtSphere
        </p>
        <h1
          className="text-4xl font-black text-white"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Browse Artworks
        </h1>
        <p className="text-gray-400 mt-2">
          Discover and collect extraordinary art from artists worldwide.
        </p>
      </div>

      {/* ── Filters bar ── */}
      <div className="bg-[#1e1e38] border border-gray-800 rounded-xl p-5 mb-8 space-y-4">

        {/* Search */}
        <input
          type="text"
          placeholder="Search artworks by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 bg-[#16162a] border border-gray-700 rounded-lg text-white outline-none focus:border-[#6c3483] transition placeholder-gray-500"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-3 bg-[#16162a] border border-gray-700 rounded-lg text-white outline-none focus:border-[#6c3483] transition"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          {/* Type */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="p-3 bg-[#16162a] border border-gray-700 rounded-lg text-white outline-none focus:border-[#6c3483] transition"
          >
            <option value="all">All Types</option>
            <option value="fixed">Fixed Price</option>
            <option value="auction">Auction</option>
            <option value="exhibition">Exhibition Only</option>
          </select>

          {/* Min price */}
          <input
            type="number"
            placeholder="Min price ($)"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="p-3 bg-[#16162a] border border-gray-700 rounded-lg text-white outline-none focus:border-[#6c3483] transition placeholder-gray-500"
          />

          {/* Max price */}
          <input
            type="number"
            placeholder="Max price ($)"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="p-3 bg-[#16162a] border border-gray-700 rounded-lg text-white outline-none focus:border-[#6c3483] transition placeholder-gray-500"
          />
        </div>

        {/* Filter summary + clear */}
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Showing <span className="text-white font-bold">{filtered.length}</span> of{" "}
            <span className="text-white font-bold">{allArt.length}</span> artworks
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-[#6c3483] hover:underline font-bold"
            >
              Clear all filters ✕
            </button>
          )}
        </div>
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "fixed", "auction", "exhibition"].map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition capitalize ${
              selectedType === type
                ? "bg-[#6c3483] text-white"
                : "bg-[#1e1e38] text-gray-400 border border-gray-700 hover:border-[#6c3483]"
            }`}
          >
            {type === "all" ? "All Artworks" :
             type === "fixed" ? "Fixed Price" :
             type === "auction" ? "🔨 Auction" :
             "🖼️ Exhibition"}
          </button>
        ))}
      </div>

      {/* ── Artwork grid ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-4">🎨</p>
          <p className="text-lg font-bold text-gray-400">No artworks match your filters</p>
          <p className="text-sm mt-2">Try adjusting your search or filters</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-6 py-2 bg-[#6c3483] rounded-lg text-sm font-bold hover:bg-opacity-90 transition"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(art => (
            <ArtCard
              key={art._id}
              art={art}
              onAdmireToggle={handleAdmireToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Browse;