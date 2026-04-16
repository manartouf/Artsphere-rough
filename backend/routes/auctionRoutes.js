import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import Auction from '../models/Auction.js';
import Collection from '../models/Collection.js';
import Art from '../models/Art.js';
import User from '../models/User.js';
import { io } from '../server.js';

const router = express.Router();

// ✅ PUBLIC: Get all auctions grouped as live and ended
// Also cleans up any stale "approved" auctions whose time has passed
router.get('/all', async (req, res) => {
  try {
    const now = new Date();

    const auctions = await Auction.find({ status: { $in: ['approved', 'ended'] } })
      .populate({
        path: 'collectionId',
        populate: { path: 'artworks' }
      })
      .populate('artistId', 'name email')
      .sort({ createdAt: -1 });

    // ✅ For each "approved" auction, check if its last artwork's time has passed
    // If so, treat it as ended (and fix the DB in the background)
    const live = [];
    const ended = [];

    for (const auction of auctions) {
      if (auction.status === 'ended') {
        ended.push(auction);
        continue;
      }

      // It's "approved" — verify time is still valid
      const artworks = auction.collectionId?.artworks || [];
      if (artworks.length === 0) {
        ended.push(auction);
        continue;
      }

      const lastArtwork = artworks[artworks.length - 1];
      const lastArtDoc = await Art.findById(lastArtwork._id || lastArtwork);

      // ✅ If last artwork's end time has passed, this auction is actually over
      if (lastArtDoc?.auctionEndTime && now > new Date(lastArtDoc.auctionEndTime)) {
        // Fix DB in background — don't await to keep response fast
        Auction.findByIdAndUpdate(auction._id, { status: 'ended' }).exec();
        const artworkIds = artworks.map(a => a._id || a);
        Art.updateMany(
          { _id: { $in: artworkIds }, isSold: false, isAuction: true },
          { isAuction: false, auctionStatus: 'ended' }
        ).exec();
        ended.push({ ...auction.toObject(), status: 'ended' });
      } else {
        live.push(auction);
      }
    }

    res.json({ live, ended });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Artist requests an auction
router.post('/request', protect, authorize('artist'), async (req, res) => {
  try {
    const { collectionId, startTime, durationHours } = req.body;

    const collection = await Collection.findOne({
      _id: collectionId,
      artist: req.user._id || req.user.id
    }).populate("artworks");

    if (!collection) {
      return res.status(404).json({ message: "Collection not found or unauthorized" });
    }

    const soldArtwork = collection.artworks.find(a => a.isSold);
    if (soldArtwork) {
      return res.status(400).json({
        message: "You cannot hold an auction with an already sold artwork, edit the collection and try again"
      });
    }

    const inAuction = collection.artworks.find(a => a.isAuction && a.status === "approved");
    if (inAuction) {
      return res.status(400).json({
        message: "One or more artworks are already in an active auction"
      });
    }

    const inExhibition = collection.artworks.find(a => a.inExhibition);
    if (inExhibition) {
      return res.status(400).json({
        message: `"${inExhibition.title}" is currently in a live exhibition and cannot be auctioned`
      });
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

// ✅ Find approved auction by artwork ID — checks time validity before returning
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

    // ✅ Check if the auction's global end time has actually passed
    const artworks = auction.collectionId?.artworks || [];
    if (artworks.length > 0) {
      const lastArtwork = artworks[artworks.length - 1];
      const lastArtDoc = await Art.findById(lastArtwork._id || lastArtwork);

      if (lastArtDoc?.auctionEndTime && new Date() > new Date(lastArtDoc.auctionEndTime)) {
        // Auction time has passed — clean up and tell frontend it's ended
        Auction.findByIdAndUpdate(auction._id, { status: 'ended' }).exec();
        const artworkIds = artworks.map(a => a._id || a);
        Art.updateMany(
          { _id: { $in: artworkIds }, isSold: false, isAuction: true },
          { isAuction: false, auctionStatus: 'ended' }
        ).exec();
        return res.status(404).json({ message: "No active auction found for this artwork" });
      }
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
      const artworks = auction.collectionId.artworks;
      const totalArtworks = artworks.length;
      const totalHours = Number(auction.durationHours) || 24;
      const hoursPerArt = totalHours / totalArtworks;
      const start = auction.startTime ? new Date(auction.startTime).getTime() : Date.now();
      for (let i = 0; i < artworks.length; i++) {
        const artEndTime = new Date(start + (i + 1) * hoursPerArt * 60 * 60 * 1000);
        await Art.findByIdAndUpdate(artworks[i]._id || artworks[i], {
          isAuction: true,
          status: 'approved',
          auctionEndTime: artEndTime,
          currentBid: artworks[i].auctionStartPrice || 0,
          auctionStatus: 'active',
        });
      }

      await User.findByIdAndUpdate(auction.artistId, {
        $push: {
          notifications: {
            message: `Your auction request for "${auction.collectionId.name}" has been approved! It is now live for ${auction.durationHours} hours.`
          }
        }
      });

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

// Any logged in user can view auction
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