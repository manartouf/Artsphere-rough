import express from "express";
import Collection from "../models/Collection.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a new collection
router.post("/", protect, authorize("artist"), async (req, res) => {
  try {
    const { name, description, artworks } = req.body;
    
    // Check both _id and id to ensure the artist field is populated
    const artistId = req.user._id || req.user.id;

    const newCollection = await Collection.create({
      name,
      description: description || "", 
      artworks,
      artist: artistId 
    });
    
    res.status(201).json(newCollection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get logged-in artist's collections
router.get("/my-collections", protect, authorize("artist"), async (req, res) => {
  try {
    const artistId = req.user._id || req.user.id;
    const collections = await Collection.find({ artist: artistId }).populate("artworks");
    res.json(collections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;