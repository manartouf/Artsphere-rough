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
      title, description, category, price,
      isAuction, auctionStartPrice, auctionDurationHours, exhibitionType
    } = req.body;

    let imageUrl = "";

    const createArt = async (img) => {
      const checkIsAuction = String(isAuction) === "true";

      const art = await Art.create({
        title, description, category,
        price: Number(price),
        isAuction: checkIsAuction,
        exhibitionType: exhibitionType || "buy",
        auctionStartPrice: checkIsAuction ? Number(auctionStartPrice) || 0 : 0,
        currentBid: checkIsAuction ? Number(auctionStartPrice) || 0 : 0,
        auctionEndTime: checkIsAuction
          ? new Date(Date.now() + (Number(auctionDurationHours) || 24) * 60 * 60 * 1000)
          : null,
        imageUrl: img,
        artist: req.user.id,
        status: checkIsAuction ? "pending" : "approved",
      });

      const artist = await User.findById(req.user.id);
      if (artist && artist.followers.length > 0 && art.status === "approved") {
        await User.updateMany(
          { _id: { $in: artist.followers } },
          { $push: { notifications: { message: `${artist.name} posted new artwork: ${art.title}` } } }
        );
      }

      res.status(201).json(art);
    };

    if (req.file) {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "image" },
        async (error, result) => {
          if (error) return res.status(500).json({ message: "Image upload failed" });
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

// ADMIN: GET ALL PENDING AUCTION REQUESTS
router.get("/admin/requests", protect, authorize("admin"), async (req, res) => {
  try {
    const requests = await Art.find({ status: "pending", isAuction: true })
      .populate("artist", "name email");
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADMIN: APPROVE / RESCHEDULE AUCTION
router.put("/admin/approve/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const { status, auctionDurationHours, auctionStartTime } = req.body;
    let updateData = { status };
    if (status === "approved" && auctionDurationHours) {
      const start = auctionStartTime ? new Date(auctionStartTime) : new Date();
      updateData.auctionEndTime = new Date(start.getTime() + Number(auctionDurationHours) * 60 * 60 * 1000);
    }
    const art = await Art.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(art);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET ALL ART
router.get("/", async (req, res) => {
  try {
    const arts = await Art.find({ status: "approved" })
      .populate("artist", "name email role aboutMe followers")
      .populate("highestBidder", "name email");
    const formattedArts = arts.map(art => {
      const artObj = art.toObject();
      if (!art.artist && art._doc.artist) artObj.artist = art._doc.artist;
      return artObj;
    });
    res.json(formattedArts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET SINGLE ARTWORK BY ID
router.get("/:id", async (req, res) => {
  try {
    const art = await Art.findById(req.params.id)
      .populate("artist", "name email role aboutMe followers")
      .populate("highestBidder", "name email")
      .populate("bids.bidder", "name");
    if (!art) return res.status(404).json({ message: "Artwork not found" });
    const artObj = art.toObject();
    if (!art.artist && art._doc.artist) artObj.artist = art._doc.artist;
    res.json(artObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// TOGGLE ADMIRE
router.put("/:id/admire", protect, async (req, res) => {
  try {
    const art = await Art.findById(req.params.id);
    if (!art) return res.status(404).json({ message: "Art not found" });
    const userId = req.user.id;
    if (art.admirers.includes(userId)) {
      art.admirers = art.admirers.filter((id) => id.toString() !== userId);
    } else {
      art.admirers.push(userId);
    }
    await art.save();
    res.json({ message: "Toggled", admirersCount: art.admirers.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PLACE BID
router.post("/:id/bid", protect, async (req, res) => {
  try {
    const { amount } = req.body;
    const art = await Art.findById(req.params.id);

    if (!art || !art.isAuction || art.status !== "approved") {
      return res.status(400).json({ message: "Auction not available" });
    }
    if (art.isSold) {
      return res.status(400).json({ message: "This artwork has already been sold" });
    }
    if (art.auctionEndTime && new Date() > new Date(art.auctionEndTime)) {
      return res.status(400).json({ message: "Auction time has expired" });
    }

    const startPrice = art.auctionStartPrice || 0;
    const increment = Math.ceil(startPrice * 0.1) || 1;
    const expectedBid = startPrice + (increment * (art.bids.length + 1));

    if (Number(amount) < expectedBid) {
      return res.status(400).json({ message: `Minimum bid is $${expectedBid}` });
    }

    const bidder = await User.findById(req.user.id);
    if (!bidder) return res.status(404).json({ message: "Bidder not found" });
    if (bidder.walletBalance < Number(amount)) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    art.currentBid = Number(amount);
    art.bids.push({ bidder: req.user.id, amount: Number(amount), time: new Date() });
    art.highestBidder = req.user.id;
    await art.save();

    const nextExpectedBid = startPrice + (increment * (art.bids.length + 1));

    // Respond to bidder immediately
    res.json({ message: "Bid placed", currentBid: art.currentBid, nextExpectedBid });

    // Populate bids for socket emit
    const populated = await Art.findById(art._id)
      .populate("bids.bidder", "name")
      .populate("highestBidder", "name");

    // Emit to ALL connected clients instantly
    io.emit("bidUpdate", {
      artId: art._id.toString(),
      currentBid: art.currentBid,
      highestBidder: { _id: bidder._id.toString(), name: bidder.name },
      bids: populated.bids.map(b => ({
        bidder: { _id: b.bidder?._id?.toString(), name: b.bidder?.name || "Anonymous" },
        amount: b.amount,
        time: b.time,
      })),
      totalBids: art.bids.length,
      nextExpectedBid,
      startingPrice: startPrice,
    });

    // Toast notification for all OTHER buyers
    io.emit("bidToast", {
      artId: art._id.toString(),
      bidderId: bidder._id.toString(),
      bidderName: bidder.name,
      amount: Number(amount),
      nextBid: nextExpectedBid,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DIRECT PURCHASE
router.post("/:id/buy", protect, async (req, res) => {
  try {
    const art = await Art.findById(req.params.id).populate("artist");
    if (!art || art.isSold || art.status !== "approved") {
      return res.status(400).json({ message: "Not available" });
    }
    if (art.isAuction) {
      return res.status(400).json({ message: "This artwork is in auction and cannot be bought directly" });
    }

    const buyer = await User.findById(req.user.id);
    if (!buyer) return res.status(404).json({ message: "Buyer not found" });
    if (buyer.walletBalance < art.price) {
      return res.status(400).json({ message: `Insufficient wallet balance. You have $${buyer.walletBalance} but this costs $${art.price}` });
    }

    buyer.walletBalance -= art.price;
    await buyer.save();

    art.isSold = true;
    art.buyer = req.user.id;
    art.soldPrice = art.price;
    await art.save();

    if (art.artist?._id) {
      await User.findByIdAndUpdate(art.artist._id, {
        $push: { notifications: { message: `${buyer.name} bought your artwork "${art.title}" for $${art.price}!` } }
      });
    }

    res.json({ message: "Purchase successful", art, newBalance: buyer.walletBalance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE ART
router.put("/:id", protect, async (req, res) => {
  try {
    const art = await Art.findById(req.params.id);
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
    if (art.artist.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    await art.deleteOne();
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;