import { io } from "../server.js";
import express from "express";
import Art from "../models/Art.js";
import User from "../models/User.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// CREATE ART
router.post("/", protect, authorize("artist"), upload.single("image"), async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      price, 
      isAuction,
      auctionStartPrice,
      auctionDurationHours,
      exhibitionType // ✅ Extracted from body
    } = req.body;

    let imageUrl = "";

    const createArt = async (image) => {
      const art = await Art.create({
        title,
        description,
        category,
        price,
        isAuction,
        exhibitionType: exhibitionType || "buy", // ✅ Saved to DB
        auctionStartPrice: isAuction ? auctionStartPrice || 0 : 0,
        currentBid: isAuction ? auctionStartPrice || 0 : 0,
        auctionEndTime: isAuction
          ? new Date(Date.now() + (auctionDurationHours || 24) * 60 * 60 * 1000)
          : null,
        image,
        artist: req.user.id,
      });

      // 🔔 Notify followers
      const artist = await User.findById(req.user.id);

      if (artist && artist.followers.length > 0) {
        await User.updateMany(
          { _id: { $in: artist.followers } },
          {
            $push: {
              notifications: {
                message: `${artist.name} posted new artwork: ${art.title}`,
              },
            },
          }
        );
      }

      res.status(201).json(art);
    };

    if (req.file) {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "image" },
        async (error, result) => {
          if (error) {
            return res.status(500).json({ message: "Image upload failed" });
          }

          imageUrl = result.secure_url;
          await createArt(imageUrl);
        }
      );

      stream.end(req.file.buffer);
    } else {
      await createArt("");
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET ALL ART (ONLY APPROVED)
router.get("/", async (req, res) => {
  try {
    const arts = await Art.find({ status: "approved" })
      .populate("artist", "name email role")
      .populate("highestBidder", "name email");

    res.json(arts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ NEW: TOGGLE ADMIRE (LIKE) ARTWORK
router.put("/:id/admire", protect, async (req, res) => {
  try {
    const art = await Art.findById(req.params.id);
    if (!art) return res.status(404).json({ message: "Art not found" });

    const userId = req.user.id;
    if (art.admirers.includes(userId)) {
      // Remove admiration
      art.admirers = art.admirers.filter((id) => id.toString() !== userId);
      await art.save();
      return res.json({ message: "Unadmired", admirersCount: art.admirers.length });
    } else {
      // Add admiration
      art.admirers.push(userId);
      await art.save();
      return res.json({ message: "Admired!", admirersCount: art.admirers.length });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PLACE BID
router.post("/:id/bid", protect, async (req, res) => {
  try {
    const { amount } = req.body;
    const art = await Art.findById(req.params.id);

    if (!art) return res.status(404).json({ message: "Art not found" });
    if (!art.isAuction) return res.status(400).json({ message: "Not an auction" });
    if (art.auctionStatus !== "active") return res.status(400).json({ message: "Auction inactive" });
    if (art.artist.toString() === req.user.id) return res.status(400).json({ message: "Cannot bid on own art" });

    if (art.auctionEndTime && new Date() > art.auctionEndTime) {
      art.isSold = true;
      art.soldPrice = art.currentBid;
      art.buyer = art.highestBidder;
      await art.save();
      io.emit("auctionEnded", art);
      return res.status(400).json({ message: "Auction has ended" });
    }

    if (art.isSold) return res.status(400).json({ message: "Already closed" });
    if (amount <= art.currentBid) return res.status(400).json({ message: "Bid too low" });

    art.currentBid = amount;
    art.bids.push({ bidder: req.user.id, amount });
    art.highestBidder = req.user.id;

    await art.save();
    io.emit("bidUpdate", art);

    res.json({ message: "Bid placed successfully", currentBid: art.currentBid });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DIRECT PURCHASE
router.post("/:id/buy", protect, async (req, res) => {
  try {
    const art = await Art.findById(req.params.id);
    if (!art) return res.status(404).json({ message: "Art not found" });
    
    // ✅ NEW: Block purchase for View-Only items
    if (art.exhibitionType === "view-only") {
      return res.status(400).json({ message: "This artwork is for viewing only." });
    }

    if (art.isAuction) return res.status(400).json({ message: "Use bidding for this item" });
    if (art.isSold) return res.status(400).json({ message: "Already sold" });

    art.isSold = true;
    art.buyer = req.user.id;
    art.soldPrice = art.price;

    await art.save();
    res.json({ message: "Purchase successful", art });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE ART
router.put("/:id", protect, async (req, res) => {
  try {
    const art = await Art.findById(req.params.id);
    if (!art) return res.status(404).json({ message: "Art not found" });
    if (art.artist.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    const updatedArt = await Art.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedArt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE ART
router.delete("/:id", protect, async (req, res) => {
  try {
    const art = await Art.findById(req.params.id);
    if (!art) return res.status(404).json({ message: "Art not found" });
    if (art.artist.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    await art.deleteOne();
    res.json({ message: "Art deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET ACTIVE AUCTIONS
router.get("/auctions/active", async (req, res) => {
  try {
    const activeAuctions = await Art.find({
      isAuction: true,
      auctionStatus: "active",
      status: "approved"
    }).populate("artist", "name email");

    res.json(activeAuctions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;