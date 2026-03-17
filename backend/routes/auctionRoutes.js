import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import Auction from '../models/Auction.js';
import Collection from '../models/Collection.js';

const router = express.Router();

// @route   POST /api/auctions/request
// @desc    Artist requests an auction for a collection
router.post('/request', protect, authorize('artist'), async (req, res) => {
  try {
    const { collectionId, startTime, durationHours } = req.body;

    const collection = await Collection.findOne({ 
      _id: collectionId, 
      artist: req.user._id || req.user.id 
    });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found or unauthorized" });
    }

    const newAuction = await Auction.create({
      collectionId,
      startTime,
      durationHours,
      artistId: req.user._id || req.user.id
    });

    res.status(201).json({ 
      message: "Auction request sent to Admin successfully!",
      data: newAuction
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/auctions/all-requests
// @desc    Admin gets all pending requests
router.get('/all-requests', protect, authorize('admin'), async (req, res) => {
  try {
    const requests = await Auction.find({ status: 'pending' })
      .populate('collectionId')
      .populate('artistId', 'name email');
    res.json(requests); 
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/auctions/approve/:id
// @desc    Admin approves or rejects a request
router.put('/approve/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const auction = await Auction.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    res.json(auction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;