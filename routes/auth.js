const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");
const cloudinary = require("../config/cloudinary");
const upload = require("../middleware/upload");

// Signup route
router.post("/signup", upload.single("profilePhoto"), async (req, res) => {
  const { username, email, password, role } = req.body;

  // Validate role
  if (!["creator", "tester"].includes(role)) {
    return res
      .status(400)
      .json({ message: 'Invalid role. Must be "creator" or "tester"' });
  }

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    // Handle profile photo upload
    let profilePhotoUrl = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      profilePhotoUrl = result.secure_url;
    }

    // Create new user
    user = new User({
      username,
      email,
      password: await bcrypt.hash(password, 10),
      role,
      profilePhoto: profilePhotoUrl,
    });
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({
      token,
      user: {
        _id: user._id,
        username,
        email,
        role,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  
  try {
    // Find user
    const user = await User.findOne({ email });
    console.log(user);
    
    if (!user) return res.status(400).json({ message: "Invalid Username" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid Password" });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email,
        role: user.role,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// Get current user (protected route)
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;
