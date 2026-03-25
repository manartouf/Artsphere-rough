import express from "express";
import Exhibition from "../models/Exhibition.js";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";

const router = express.Router();

/* ---------------- CREATE EXHIBITION — goes live immediately ---------------- */
router.post("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "artist") {
      return res.status(403).json({ message: "Only artists can create exhibitions" });
    }

    const { title, description, artworks, startDate, endDate } = req.body;

    const exhibition = await Exhibition.create({
      title,
      description: description || "",
      artworks,
      startDate,
      endDate,
      createdBy: req.user.id,
      status: "active",
    });

    // Notify followers
    const artist = await User.findById(req.user.id);
    if (artist && artist.followers.length > 0) {
      await User.updateMany(
        { _id: { $in: artist.followers } },
        {
          $push: {
            notifications: {
              message: `${artist.name} is holding a new exhibition: "${title}"! Visit their profile to see it.`
            }
          }
        }
      );
    }

    res.status(201).json(exhibition);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ---------------- GET ALL APPROVED + ACTIVE EXHIBITIONS ---------------- */
router.get("/", async (req, res) => {
  try {
    const exhibitions = await Exhibition.find({
      status: { $in: ["approved", "active"] }
    })
      .populate("artworks")
      .populate("createdBy", "name email");
    res.json(exhibitions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ---------------- GET SINGLE EXHIBITION BY ID ---------------- */
router.get("/:id", async (req, res) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id)
      .populate("artworks")
      .populate("createdBy", "name");
    if (!exhibition) return res.status(404).json({ message: "Exhibition not found" });
    res.json(exhibition);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ---------------- ADMIN APPROVE EXHIBITION ---------------- */
router.put("/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id);
    if (!exhibition) return res.status(404).json({ message: "Exhibition not found" });
    exhibition.status = "approved";
    await exhibition.save();
    res.json({ message: "Exhibition approved" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ---------------- ADMIN REJECT EXHIBITION ---------------- */
router.put("/:id/reject", protect, adminOnly, async (req, res) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id);
    if (!exhibition) return res.status(404).json({ message: "Exhibition not found" });
    exhibition.status = "rejected";
    await exhibition.save();
    res.json({ message: "Exhibition rejected" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ---------------- ARTIST TOGGLE EXHIBITION ON/OFF ---------------- */
router.put("/:id/toggle", protect, async (req, res) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id);
    if (!exhibition) return res.status(404).json({ message: "Exhibition not found" });
    if (exhibition.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    exhibition.status = exhibition.status === "active" ? "ended" : "active";
    await exhibition.save();
    res.json(exhibition);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;