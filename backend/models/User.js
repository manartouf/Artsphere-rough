import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: {
      type: String,
      enum: ["admin", "artist", "buyer"],
      default: "buyer",
    },

    // New Fields for Registration
    aboutMe: { type: String, default: "" },
    lookingFor: { type: String, default: "" },

    // Wallet balance — starts at $1000
    walletBalance: { type: Number, default: 1000 },

    // Followers
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Following
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // In-app notifications
    notifications: [
      {
        message: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        read: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;