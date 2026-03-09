import express from "express";
import Art from "../models/Art.js";
import Exhibition from "../models/Exhibition.js";

const router = express.Router();

// ✅ GET DATA FOR HOMEPAGE (No Login Required)
router.get("/home", async (req, res) => {
  try {
    // 1. Get 4 Featured Artworks (Fixed Price & Approved)
    const featuredArt = await Art.find({ isAuction: false, status: "approved", isSold: false })
      .limit(4)
      .populate("artist", "name");

    // 2. Get 4 Active Auctions (Approved)
    const activeAuctions = await Art.find({ isAuction: true, status: "approved", auctionStatus: "active" })
      .limit(4)
      .populate("artist", "name");

    // 3. Get 2 Upcoming Exhibitions (Approved)
    const exhibitions = await Exhibition.find({ status: "approved" })
      .limit(2)
      .populate("artworks", "title image");

    res.json({
      featuredArt,
      activeAuctions,
      exhibitions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;