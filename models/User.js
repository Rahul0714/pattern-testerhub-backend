const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["creator", "tester"], required: true }, // Role is mandatory
    bio: { type: String, default: "" },
    contactNumber: { type: String, default: "" },
    profilePhoto: { type: String, default: "" }, // Cloudinary URL
    portfolio: [{ type: String }], // For creators (optional)
    skillLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    }, // For testers
    rewardPoints: { type: Number, default: 0 }, // For testers
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
