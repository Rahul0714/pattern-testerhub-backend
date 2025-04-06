const mongoose = require("mongoose");

const patternSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  skillLevel: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    required: true,
  },
  completionTime: { type: String, required: true },
  positions: { type: Number, required: true },
  compensation: { type: String, required: true },
  pdfUrl: { type: String }, // Cloudinary URL for pattern PDF
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  selectedTesters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  postedDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Pattern", patternSchema);
