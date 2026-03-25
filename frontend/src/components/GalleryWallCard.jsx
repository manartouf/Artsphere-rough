import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import CountdownTimer from "./CountdownTimer";

const GalleryWallCard = ({ artworks = [], mode = "exhibition", onBuy, onBid, currentBid, user }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(null); // "left" | "right"
  const [animating, setAnimating] = useState(false);
  const navigate = useNavigate();

  const current = artworks[currentIndex];

  // ── Navigation ──────────────────────────────────────────
  const goTo = useCallback((newIndex, dir) => {
    if (animating || newIndex === currentIndex) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setAnimating(false);
      setDirection(null);
    }, 400);
  }, [animating, currentIndex]);

  const goNext = () => {
    if (currentIndex < artworks.length - 1) goTo(currentIndex + 1, "right");
  };

  const goPrev = () => {
    if (currentIndex > 0) goTo(currentIndex - 1, "left");
  };

  // ── Keyboard navigation ──────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex, animating]);

  // ── Touch/swipe support ──────────────────────────────────
  const [touchStart, setTouchStart] = useState(null);

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);

  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev();
    }
    setTouchStart(null);
  };

  if (!current) return (
    <div className="flex items-center justify-center h-96 text-gray-500">
      No artworks in this exhibition
    </div>
  );

  const displayImage = current.imageUrl || current.image || "https://via.placeholder.com/600x500?text=No+Image";
  const isSold = current.isSold;

  // ── Slide animation classes ──────────────────────────────
  const slideClass = animating
    ? direction === "right"
      ? "opacity-0 translate-x-16"
      : "opacity-0 -translate-x-16"
    : "opacity-100 translate-x-0";

  return (
    <div className="w-full select-none">

      {/* ── WALL SECTION ── */}
      <div
        className="relative w-full rounded-2xl overflow-hidden flex items-center justify-center py-12 px-4"
        style={{
          background: "linear-gradient(145deg, #1a1a2e 0%, #2c2c3e 40%, #1e1e38 100%)",
          backgroundImage: `
            linear-gradient(145deg, #1a1a2e 0%, #2c2c3e 40%, #1e1e38 100%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23ffffff' fill-opacity='0.02'/%3E%3Ccircle cx='1' cy='1' r='1' fill='%23ffffff' fill-opacity='0.03'/%3E%3C/svg%3E")
          `,
          minHeight: "520px",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left arrow */}
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-[#6c3483] disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center text-white text-xl transition-all duration-200"
        >
          ‹
        </button>

        {/* Artwork frame */}
        <div
          className={`relative transition-all duration-400 ease-in-out ${slideClass}`}
          style={{ transitionDuration: "400ms" }}
        >
          {/* Hanging wire effect */}
          <div className="flex justify-center mb-2">
            <div className="w-px h-8 bg-gray-500 opacity-40"></div>
          </div>

          {/* Frame */}
          <div
            className="relative"
            style={{
              padding: "14px",
              background: "linear-gradient(145deg, #2a1a0a, #1a0f05, #3d2b1a, #1a0f05)",
              borderRadius: "4px",
              boxShadow: "0 25px 80px rgba(0,0,0,0.9), 0 8px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {/* Inner frame bevel */}
            <div
              style={{
                padding: "4px",
                background: "linear-gradient(145deg, #0a0a0a, #2a2a2a)",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.8)",
              }}
            >
              {/* Artwork image */}
              <div className="relative overflow-hidden" style={{ maxWidth: "520px", maxHeight: "420px" }}>
                <img
                  src={displayImage}
                  alt={current.title}
                  className="block"
                  style={{
                    width: "520px",
                    maxWidth: "70vw",
                    height: "400px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />

                {/* SOLD ribbon */}
                {isSold && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div
                      className="text-red-500 font-black text-4xl border-4 border-red-500 px-6 py-2 rotate-[-15deg]"
                      style={{ textShadow: "0 0 20px rgba(239,68,68,0.5)" }}
                    >
                      SOLD
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Museum label below frame */}
          <div
            className="mx-auto mt-4 px-5 py-3 rounded"
            style={{
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.08)",
              maxWidth: "400px",
            }}
          >
            <p
              className="text-white text-center font-bold text-lg truncate"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {current.title}
            </p>
            <p className="text-gray-400 text-center text-sm mt-0.5">
              {current.artist?.name || "Unknown Artist"}
            </p>
            <div className="flex items-center justify-center gap-3 mt-2">
              {isSold ? (
                <StatusBadge status="sold" />
              ) : mode === "auction" ? (
                <span className="text-[#6c3483] font-bold text-sm">
                  Bid: ${current.currentBid || current.auctionStartPrice || 0}
                </span>
              ) : (
                <span className="text-white font-bold text-sm">${current.price}</span>
              )}
              {mode === "auction" && current.auctionEndTime && !isSold && (
                <CountdownTimer endTime={current.auctionEndTime} />
              )}
            </div>
          </div>
        </div>

        {/* Right arrow */}
        <button
          onClick={goNext}
          disabled={currentIndex === artworks.length - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-[#6c3483] disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center text-white text-xl transition-all duration-200"
        >
          ›
        </button>

        {/* Dot indicators */}
        {artworks.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {artworks.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i, i > currentIndex ? "right" : "left")}
                className={`rounded-full transition-all duration-200 ${
                  i === currentIndex
                    ? "w-6 h-2 bg-[#6c3483]"
                    : "w-2 h-2 bg-gray-600 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        )}

        {/* Artwork counter top right */}
        <div className="absolute top-4 right-4 text-gray-500 text-xs">
          {currentIndex + 1} / {artworks.length}
        </div>
      </div>

      {/* ── DETAILS SECTION (below the wall) ── */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 px-2">

        {/* Left — artwork info */}
        <div className="space-y-4">
          <div>
            <h2
              className="text-3xl font-bold text-white"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {current.title}
            </h2>
            <button
              onClick={() => navigate(`/artist/${current.artist?._id}`)}
              className="text-[#6c3483] hover:underline text-sm mt-1"
            >
              By {current.artist?.name || "Unknown Artist"} →
            </button>
          </div>

          <p className="text-gray-300 leading-relaxed">{current.description}</p>

          <div className="flex flex-wrap gap-2">
            {current.category && (
              <span className="text-xs bg-[#1e1e38] border border-gray-700 px-3 py-1 rounded-full text-gray-300">
                {current.category}
              </span>
            )}
            {current.exhibitionType && (
              <StatusBadge status={current.exhibitionType} />
            )}
          </div>
        </div>

        {/* Right — action panel */}
        <div className="bg-[#1e1e38] border border-gray-800 rounded-xl p-6 space-y-4">

          {isSold ? (
            <div className="text-center space-y-2">
              <StatusBadge status="sold" />
              <p className="text-gray-400 text-sm mt-2">Final price: <span className="text-white font-bold">${current.soldPrice}</span></p>
            </div>

          ) : mode === "auction" ? (
            <>
              <div className="space-y-1">
                <p className="text-gray-400 text-sm">Current Highest Bid</p>
                <p className="text-3xl font-black text-[#6c3483]">${currentBid ?? current.currentBid ?? current.auctionStartPrice ?? 0}</p>
              </div>
              {current.auctionEndTime && (
                <div className="space-y-1">
                  <p className="text-gray-400 text-sm">Time Remaining</p>
                  <CountdownTimer endTime={current.auctionEndTime} />
                </div>
              )}
              {user?.role === "buyer" && onBid && (
                <button
                  onClick={() => onBid(current)}
                  className="w-full bg-[#6c3483] py-3 rounded-lg font-bold text-white hover:bg-opacity-90 transition"
                >
                  Place Bid
                </button>
              )}
              {!user && (
                <button
                  onClick={() => navigate("/login")}
                  className="w-full bg-gray-700 py-3 rounded-lg font-bold text-white hover:bg-gray-600 transition"
                >
                  Login to Bid
                </button>
              )}
            </>

          ) : current.exhibitionType === "view-only" ? (
            <div className="text-center space-y-2">
              <StatusBadge status="view-only" />
              <p className="text-gray-400 text-sm mt-2">This piece is for exhibition viewing only</p>
            </div>

          ) : (
            <>
              <div className="space-y-1">
                <p className="text-gray-400 text-sm">Price</p>
                <p className="text-3xl font-black text-white">${current.price}</p>
              </div>
              {user?.role === "buyer" && onBuy && (
                <button
                  onClick={() => onBuy(current)}
                  className="w-full bg-[#6c3483] py-3 rounded-lg font-bold text-white hover:bg-opacity-90 transition"
                >
                  Buy Now
                </button>
              )}
              {!user && (
                <button
                  onClick={() => navigate("/login")}
                  className="w-full bg-gray-700 py-3 rounded-lg font-bold text-white hover:bg-gray-600 transition"
                >
                  Login to Buy
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleryWallCard;