import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
import Art from "../models/Art.js";

const router = express.Router();

// UPDATE MY PROFILE
router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.name = req.body.name || user.name;
      user.aboutMe = req.body.aboutMe || user.aboutMe;
      user.lookingFor = req.body.lookingFor || user.lookingFor;
      const updatedUser = await user.save();
      res.json({
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          aboutMe: updatedUser.aboutMe,
          lookingFor: updatedUser.lookingFor,
          walletBalance: updatedUser.walletBalance,
        },
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET WALLET BALANCE
router.get("/wallet", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("walletBalance");
    res.json({ walletBalance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// TOP UP WALLET
router.put("/wallet/topup", protect, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    const user = await User.findById(req.user.id);
    user.walletBalance = (user.walletBalance || 0) + Number(amount);
    await user.save();
    res.json({ walletBalance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// FOLLOW / UNFOLLOW ARTIST (toggle)
router.put("/follow/:id", protect, async (req, res) => {
  try {
    const artist = await User.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!artist) return res.status(404).json({ message: "Artist not found" });
    if (artist.role !== "artist") return res.status(400).json({ message: "You can only follow artists" });
    if (artist._id.toString() === user._id.toString()) return res.status(400).json({ message: "You cannot follow yourself" });

    const isFollowing = user.following.some(id => id.toString() === artist._id.toString());

    if (isFollowing) {
      user.following = user.following.filter(id => id.toString() !== artist._id.toString());
      artist.followers = artist.followers.filter(id => id.toString() !== user._id.toString());
      await user.save();
      await artist.save();
      res.json({ message: "Unfollowed successfully" });
    } else {
      user.following.push(artist._id);
      artist.followers.push(user._id);
      await user.save();
      await artist.save();
      res.json({ message: "Artist followed successfully" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// FIX: GET MY FOLLOWING LIST — returns full artist objects
router.get("/following", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("following", "name email aboutMe followers role");
    res.json(user.following || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// FIX: GET MY NOTIFICATIONS — reversed so newest first
router.get("/notifications", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json([...user.notifications].reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// MARK NOTIFICATION AS READ
router.put("/notifications/:notificationId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const notification = user.notifications.id(req.params.notificationId);
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    notification.read = true;
    await user.save();
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET MY PURCHASES — FIX: populate bids.bidder
router.get("/my-purchases", protect, async (req, res) => {
  try {
    const purchases = await Art.find({ buyer: req.user.id })
      .populate("artist", "name email")
      .populate("buyer", "name email")
      .populate("bids.bidder", "name");
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET MY SALES — FIX: populate bids.bidder
router.get("/my-sales", protect, async (req, res) => {
  try {
    const sales = await Art.find({ artist: req.user.id, isSold: true })
      .populate("buyer", "name email")
      .populate("artist", "name email")
      .populate("bids.bidder", "name");
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET PUBLIC PROFILE OF AN ARTIST — FIX: populate followers with _id
router.get("/artist/:id", async (req, res) => {
  try {
    const artist = await User.findById(req.params.id)
      .select("-password")
      .populate("followers", "name _id");

    if (!artist || artist.role !== "artist") {
      return res.status(404).json({ message: "Artist not found" });
    }

    const artworks = await Art.find({ artist: req.params.id, status: "approved" });
    res.json({ artist, artworks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;