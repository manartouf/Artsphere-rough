import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosConfig";
import { AuthContext } from "../context/AuthContext";
import ArtCard from "../components/ArtCard";
import LoadingSpinner from "../components/LoadingSpinner";
import CountdownTimer from "../components/CountdownTimer";

const Browse = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [allArt, setAllArt] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("artworks");

  // Auction state
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [endedAuctions, setEndedAuctions] = useState([]);
  const [auctionTab, setAuctionTab] = useState("live");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [artRes, auctionRes] = await Promise.all([
          API.get("/artworks"),
          API.get("/auctions/all"),
        ]);

        // ✅ Exclude auction artworks from browse grid
        const nonAuctionArt = artRes.data.filter(a => !a.isAuction);
        setAllArt(nonAuctionArt);
        setFiltered(nonAuctionArt);

        const uniqueCats = [...new Set(
          nonAuctionArt.map(a => a.category).filter(Boolean)
        )].map((name, i) => ({ _id: i, name }));
        setCategories(uniqueCats);

        setLiveAuctions(auctionRes.data.live || []);
        setEndedAuctions(auctionRes.data.ended || []);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let result = [...allArt];

      if (search.trim()) {
        result = result.filter(art =>
          art.title.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (selectedCategory !== "all") {
        result = result.filter(art =>
          art.category?.toLowerCase() === selectedCategory.toLowerCase()
        );
      }

      if (selectedType === "fixed") {
        result = result.filter(art => !art.isAuction);
      } else if (selectedType === "exhibition") {
        result = result.filter(art => art.exhibitionType === "view-only");
      }

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

  // Helper to get a preview image for an auction collection
  const getAuctionPreview = (auction) => {
    const artworks = auction.collectionId?.artworks || [];
    const firstWithImage = artworks.find(a => a.imageUrl || a.image);
    return firstWithImage?.imageUrl || firstWithImage?.image || null;
  };

  const getAuctionSoldCount = (auction) => {
    return (auction.collectionId?.artworks || []).filter(a => a.isSold).length;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 text-white">

      <div className="mb-8 fade-up">
        <p className="text-[#6c3483] text-sm font-bold uppercase tracking-widest mb-2">
          ArtSphere
        </p>
        <h1 className="text-4xl font-black text-white" style={{ fontFamily: "Georgia, serif" }}>
          Browse
        </h1>
        <p className="text-gray-400 mt-2">
          Discover art, join live auctions, and collect extraordinary works.
        </p>
      </div>

      {/* ✅ Main tabs: Artworks | Auctions */}
      <div className="flex gap-2 mb-8 border-b border-gray-800 pb-4">
        {[
          { key: "artworks", label: "🎨 Artworks" },
          { key: "auctions", label: `🔨 Auctions${liveAuctions.length > 0 ? ` (${liveAuctions.length} Live)` : ""}` },
        ].map(tab => (
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

      {/* ── ARTWORKS TAB ── */}
      {activeTab === "artworks" && (
        <>
          <div className="bg-[#1e1e38] border border-gray-800 rounded-xl p-5 mb-8 space-y-4 fade-up">
            <input
              type="text"
              placeholder="Search artworks by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 bg-[#16162a] border border-gray-700 rounded-lg text-white outline-none focus:border-[#6c3483] transition placeholder-gray-500"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="p-3 bg-[#16162a] border border-gray-700 rounded-lg text-white outline-none focus:border-[#6c3483] transition"
              >
                <option value="all">All Types</option>
                <option value="fixed">Fixed Price</option>
                <option value="exhibition">Exhibition Only</option>
              </select>

              <input
                type="number"
                placeholder="Min price ($)"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="p-3 bg-[#16162a] border border-gray-700 rounded-lg text-white outline-none focus:border-[#6c3483] transition placeholder-gray-500"
              />

              <input
                type="number"
                placeholder="Max price ($)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="p-3 bg-[#16162a] border border-gray-700 rounded-lg text-white outline-none focus:border-[#6c3483] transition placeholder-gray-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                Showing <span className="text-white font-bold">{filtered.length}</span> of{" "}
                <span className="text-white font-bold">{allArt.length}</span> artworks
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-[#6c3483] hover:underline font-bold">
                  Clear all filters ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {["all", "fixed", "exhibition"].map(type => (
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
                 "🖼️ Exhibition"}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-4xl mb-4">🎨</p>
              <p className="text-lg font-bold text-gray-400">No artworks match your filters</p>
              <p className="text-sm mt-2">Try adjusting your search or filters</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="mt-4 px-6 py-2 bg-[#6c3483] rounded-lg text-sm font-bold hover:bg-opacity-90 transition">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map(art => (
                <ArtCard key={art._id} art={art} onAdmireToggle={handleAdmireToggle} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── AUCTIONS TAB ── */}
      {activeTab === "auctions" && (
        <div className="fade-up">
          {/* Live / Ended sub-tabs */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={() => setAuctionTab("live")}
              className={`px-5 py-2 rounded-full text-sm font-bold transition flex items-center gap-2 ${
                auctionTab === "live"
                  ? "bg-green-700 text-white"
                  : "bg-[#1e1e38] text-gray-400 border border-gray-700 hover:border-green-700"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live Auctions ({liveAuctions.length})
            </button>
            <button
              onClick={() => setAuctionTab("ended")}
              className={`px-5 py-2 rounded-full text-sm font-bold transition ${
                auctionTab === "ended"
                  ? "bg-gray-600 text-white"
                  : "bg-[#1e1e38] text-gray-400 border border-gray-700 hover:border-gray-500"
              }`}
            >
              ⚫ Ended Auctions ({endedAuctions.length})
            </button>
          </div>

          {/* Live auctions */}
          {auctionTab === "live" && (
            <>
              {liveAuctions.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-[#1e1e38] border border-gray-800 rounded-xl">
                  <p className="text-4xl mb-4">🔨</p>
                  <p className="text-lg">No live auctions right now.</p>
                  <p className="text-sm mt-2">Check back soon — artists are always scheduling new auctions.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {liveAuctions.map(auction => {
                    const preview = getAuctionPreview(auction);
                    const artworks = auction.collectionId?.artworks || [];
                    const totalArtworks = artworks.length;
                    const soldCount = getAuctionSoldCount(auction);
                    // Find first unsold artwork for timing
                    const firstUnsold = artworks.find(a => !a.isSold);

                    return (
                      <div
                        key={auction._id}
                        onClick={() => firstUnsold ? navigate(`/auction/${firstUnsold._id}`) : null}
                        className="bg-[#1e1e38] border border-gray-800 rounded-xl overflow-hidden cursor-pointer hover:border-green-600 hover:scale-[1.02] transition-all duration-300 group"
                      >
                        <div className="relative h-48 bg-[#16162a]">
                          {preview ? (
                            <img src={preview} alt={auction.collectionId?.name}
                              className="w-full h-full object-cover group-hover:brightness-110 transition" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl text-gray-600">🔨</div>
                          )}
                          <div className="absolute top-3 left-3 bg-green-900/90 border border-green-700 text-green-400 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            LIVE
                          </div>
                          {totalArtworks > 1 && (
                            <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full">
                              {soldCount}/{totalArtworks} sold
                            </div>
                          )}
                        </div>
                        <div className="p-5 space-y-2">
                          <h3 className="font-bold text-white text-lg truncate" style={{ fontFamily: "Georgia, serif" }}>
                            {auction.collectionId?.name || "Unnamed Collection"}
                          </h3>
                          <p className="text-[#6c3483] text-sm">
                            By {auction.artistId?.name || "Unknown Artist"}
                          </p>
                          <p className="text-gray-500 text-xs">{totalArtworks} artwork{totalArtworks !== 1 ? "s" : ""}</p>
                          {firstUnsold?.auctionEndTime && (
                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-gray-500 text-xs">Current slot ends:</span>
                              <CountdownTimer endTime={firstUnsold.auctionEndTime} />
                            </div>
                          )}
                          <button className="w-full mt-2 bg-green-700 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-bold transition">
                            Enter Auction →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Ended auctions */}
          {auctionTab === "ended" && (
            <>
              {endedAuctions.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-[#1e1e38] border border-gray-800 rounded-xl">
                  <p className="text-4xl mb-4">⚫</p>
                  <p className="text-lg">No ended auctions yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {endedAuctions.map(auction => {
                    const preview = getAuctionPreview(auction);
                    const artworks = auction.collectionId?.artworks || [];
                    const soldCount = getAuctionSoldCount(auction);
                    const totalRevenue = artworks.reduce((sum, a) => sum + (a.isSold ? (a.soldPrice || 0) : 0), 0);
                    // For ended auctions navigate to first artwork
                    const firstArt = artworks[0];

                    return (
                      <div
                        key={auction._id}
                        onClick={() => firstArt ? navigate(`/art/${firstArt._id}`) : null}
                        className="bg-[#1e1e38] border border-gray-800 rounded-xl overflow-hidden cursor-pointer hover:border-gray-600 hover:scale-[1.02] transition-all duration-300 group"
                      >
                        <div className="relative h-48 bg-[#16162a]">
                          {preview ? (
                            <img src={preview} alt={auction.collectionId?.name}
                              className="w-full h-full object-cover group-hover:brightness-75 transition opacity-70" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl text-gray-600">⚫</div>
                          )}
                          <div className="absolute inset-0 bg-black/30" />
                          <div className="absolute top-3 left-3 bg-gray-900/90 border border-gray-700 text-gray-400 text-xs font-bold px-2 py-1 rounded-full">
                            ⚫ ENDED
                          </div>
                          <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {soldCount}/{artworks.length} sold
                          </div>
                        </div>
                        <div className="p-5 space-y-2">
                          <h3 className="font-bold text-white text-lg truncate" style={{ fontFamily: "Georgia, serif" }}>
                            {auction.collectionId?.name || "Unnamed Collection"}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            By {auction.artistId?.name || "Unknown Artist"}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-gray-500 text-xs">{artworks.length} artwork{artworks.length !== 1 ? "s" : ""}</span>
                            {totalRevenue > 0 && (
                              <span className="text-[#6c3483] font-bold text-sm">Total: ${totalRevenue.toLocaleString()}</span>
                            )}
                          </div>
                          <button className="w-full mt-2 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-bold transition">
                            View Results →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Browse;