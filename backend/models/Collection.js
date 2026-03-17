import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  artist: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  artworks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Art" }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Collection", collectionSchema);