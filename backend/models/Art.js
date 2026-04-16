import mongoose from "mongoose";

const artSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,
    image: String, // For old Postman data
    imageUrl: String, // NEW: For Cloudinary uploads from the frontend

    category: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    isAuction: {
      type: Boolean,
      default: false,
    },

    // ✅ NEW: Exhibition Type (Social/Gallery update)
    exhibitionType: {
      type: String,
      enum: ["view-only", "buy", "hybrid"],
      default: "buy",
    },

    // ✅ NEW: Admirers (Like system)
    admirers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ✅ Added for auction system
    auctionStartPrice: {
      type: Number,
      default: 0,
    },

    bids: [
      {
        bidder: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        amount: Number,
        time: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ✅ Added for live bidding
    currentBid: {
      type: Number,
      default: 0,
    },

    highestBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // ✅ Added for auction end time
    auctionEndTime: {
      type: Date,
    },

    auctionStatus: {
      type: String,
      enum: ["active", "ended", "cancelled"],
      default: "active",
    },

    isSold: {
      type: Boolean,
      default: false,
    },

    soldPrice: {
      type: Number,
      default: 0,
    },

    soldWhere: {
      type: String,
      enum: ["browse", "auction", "exhibition"],
      default: null,
    },

    inExhibition: {
      type: Boolean,
      default: false,
    },

    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // ✅ NEW: Artwork approval status (ADMIN CONTROL)
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Art = mongoose.model("Art", artSchema);

export default Art;