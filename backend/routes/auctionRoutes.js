import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import Auction from '../models/Auction.js';
import Collection from '../models/Collection.js';
import Art from '../models/Art.js';
import User from '../models/User.js';

const router = express.Router();

// Artist requests an auction
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

    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      admin.notifications.push({
        message: `New auction request from ${req.user.name || 'an artist'} for collection "${collection.name}"`
      });
      await admin.save();
    }

    res.status(201).json({
      message: "Auction request sent to Admin successfully!",
      data: newAuction
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin gets all pending requests
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

// Find approved auction by artwork ID
router.get('/by-art/:artId', protect, async (req, res) => {
  try {
    const collection = await Collection.findOne({ artworks: req.params.artId });

    if (!collection) {
      return res.status(404).json({ message: "No collection found for this artwork" });
    }

    const auction = await Auction.findOne({
      collectionId: collection._id,
      status: 'approved'
    })
      .populate({ path: 'collectionId', populate: { path: 'artworks' } })
      .populate('artistId', 'name email');

    if (!auction) {
      return res.status(404).json({ message: "No active auction found for this artwork" });
    }

    res.json(auction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin approves or rejects
router.put('/approve/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;

    const auction = await Auction.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate({
      path: 'collectionId',
      populate: { path: 'artworks' }
    }).populate('artistId', 'name email');

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    if (status === 'approved' && auction.collectionId) {
      const artworkIds = auction.collectionId.artworks.map(a => a._id || a);

      // FIX: Use Date.now() not startTime to avoid 561 hours bug
      const auctionEndTime = new Date(
        Date.now() + (Number(auction.durationHours) || 24) * 60 * 60 * 1000
      );

      await Art.updateMany(
        { _id: { $in: artworkIds } },
        {
          isAuction: true,
          status: 'approved',
          auctionEndTime,
          currentBid: 0,
        }
      );

      // Notify the artist
      await User.findByIdAndUpdate(auction.artistId, {
        $push: {
          notifications: {
            message: `Your auction request for "${auction.collectionId.name}" has been approved! It is now live for ${auction.durationHours} hours.`
          }
        }
      });

      // FIX: Notify artist's followers about the auction
      const artist = await User.findById(auction.artistId);
      if (artist && artist.followers.length > 0) {
        await User.updateMany(
          { _id: { $in: artist.followers } },
          {
            $push: {
              notifications: {
                message: `${artist.name} is holding a live auction: "${auction.collectionId.name}"! Check it out now.`
              }
            }
          }
        );
      }
    }

    if (status === 'rejected') {
      await User.findByIdAndUpdate(auction.artistId, {
        $push: {
          notifications: {
            message: `Your auction request for "${auction.collectionId?.name || 'your collection'}" was not approved by the admin.`
          }
        }
      });
    }

    res.json(auction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// FIX: Remove role restriction — any logged in user can view auction
router.get("/:id", protect, async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate({ path: "collectionId", populate: { path: "artworks" } })
      .populate("artistId", "name email");
    if (!auction) return res.status(404).json({ message: "Auction not found" });
    res.json(auction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;