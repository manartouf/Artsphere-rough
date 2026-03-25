import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";
import User from "../models/User.js";
import Art from "../models/Art.js";
import Exhibition from "../models/Exhibition.js";
import Category from "../models/Category.js";

const router = express.Router();

/* ================= USER MANAGEMENT ================= */

// Get all users
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user
router.delete("/users/:id", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await user.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ================= ART MANAGEMENT ================= */

// Get all artworks
router.get("/artworks", protect, adminOnly, async (req, res) => {
  try {
    const artworks = await Art.find()
      .populate("artist", "name email role")
      .populate("highestBidder", "name email");
    res.json(artworks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// APPROVE ARTWORK
router.put("/artworks/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const artwork = await Art.findById(req.params.id);
    if (!artwork) return res.status(404).json({ message: "Artwork not found" });
    artwork.status = "approved";
    await artwork.save();
    res.json({ message: "Artwork approved successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// REJECT ARTWORK
router.put("/artworks/:id/reject", protect, adminOnly, async (req, res) => {
  try {
    const artwork = await Art.findById(req.params.id);
    if (!artwork) return res.status(404).json({ message: "Artwork not found" });
    artwork.status = "rejected";
    await artwork.save();
    res.json({ message: "Artwork rejected successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete artwork
router.delete("/artworks/:id", protect, adminOnly, async (req, res) => {
  try {
    const artwork = await Art.findById(req.params.id);
    if (!artwork) return res.status(404).json({ message: "Artwork not found" });
    await artwork.deleteOne();
    res.json({ message: "Artwork deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ================= EXHIBITION MANAGEMENT ================= */

// Get all exhibitions (including pending)
router.get("/exhibitions", protect, adminOnly, async (req, res) => {
  try {
    const exhibitions = await Exhibition.find()
      .populate("createdBy", "name email")
      .populate("artworks");
    res.json(exhibitions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// APPROVE EXHIBITION
router.put("/exhibitions/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id);
    if (!exhibition) return res.status(404).json({ message: "Exhibition not found" });
    exhibition.status = "approved";
    await exhibition.save();
    res.json({ message: "Exhibition approved successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// REJECT EXHIBITION
router.put("/exhibitions/:id/reject", protect, adminOnly, async (req, res) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id);
    if (!exhibition) return res.status(404).json({ message: "Exhibition not found" });
    exhibition.status = "rejected";
    await exhibition.save();
    res.json({ message: "Exhibition rejected successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete exhibition
router.delete("/exhibitions/:id", protect, adminOnly, async (req, res) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id);
    if (!exhibition) return res.status(404).json({ message: "Exhibition not found" });
    await exhibition.deleteOne();
    res.json({ message: "Exhibition deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// END AUCTION MANUALLY — deducts winner wallet + notifies winner
router.put("/artworks/:id/end", protect, adminOnly, async (req, res) => {
  try {
    const art = await Art.findById(req.params.id).populate("highestBidder");

    if (!art) {
      return res.status(404).json({ message: "Artwork not found" });
    }

    art.auctionStatus = "ended";
    art.isSold = true;
    art.soldPrice = art.currentBid;
    art.buyer = art.highestBidder?._id || null;

    await art.save();

    // Deduct winning bid from winner's wallet
    if (art.highestBidder && art.currentBid > 0) {
      const winner = await User.findById(art.highestBidder._id);
      if (winner) {
        winner.walletBalance = Math.max(0, (winner.walletBalance || 0) - art.currentBid);
        winner.notifications.push({
          message: `🎉 You won the auction for "${art.title}" with a bid of $${art.currentBid}! $${art.currentBid} has been deducted from your wallet.`
        });
        await winner.save();
      }
    }

    res.json({ message: "Auction ended successfully", art });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ================= CATEGORY MANAGEMENT ================= */

// Create a new category
router.post("/categories", protect, adminOnly, async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.create({ name });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: "Category already exists or server error" });
  }
});

// Get all categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a category
router.delete("/categories/:id", protect, adminOnly, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ================= ADMIN ANALYTICS ================= */

router.get("/analytics", protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalArtworks = await Art.countDocuments();
    const totalAuctions = await Art.countDocuments({ isAuction: true });
    const activeAuctions = await Art.countDocuments({
      isAuction: true,
      auctionStatus: "active",
    });

    const salesData = await Art.find({ isSold: true });
    const totalRevenue = salesData.reduce((acc, item) => acc + (item.soldPrice || 0), 0);
    const soldCount = salesData.length;

    const categoryStats = await Art.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    res.json({
      totalUsers,
      totalArtworks,
      totalAuctions,
      activeAuctions,
      totalRevenue,
      soldCount,
      categoryStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;