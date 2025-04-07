const express = require("express");
const router = express.Router();
const Pattern = require("../models/Pattern");
// const Pattern = require("../models/Pattern");
const auth = require("../middleware/auth");
const cloudinary = require("../config/cloudinary");
const upload = require("../middleware/upload");

router.get("/", async (req, res) => {
  try {
    const patterns = await Pattern.find()
      .populate("creator", "username")
      .populate("applicants", "username");
    res.json(patterns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/create", auth, upload.single("pdf"), async (req, res) => {
  if (req.user.role !== "creator")
    return res.status(403).json({ message: "Only creators can add patterns" });

  const {
    title,
    category,
    description,
    skillLevel,
    completionTime,
    positions,
    compensation,
  } = req.body;
  try {
    let pdfUrl = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "raw",
      });
      pdfUrl = result.secure_url;
    }

    const pattern = new Pattern({
      title,
      category,
      description,
      skillLevel,
      completionTime,
      positions,
      compensation,
      pdfUrl,
      creator: req.user.id,
    });
    await pattern.save();
    res.json(pattern);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/apply/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "tester") {
      return res
        .status(403)
        .json({ message: "Only testers can apply to patterns" });
    }
    const pattern = await Pattern.findById(req.params.id);
    if (!pattern) return res.status(404).json({ message: "Pattern not found" });
    if (pattern.applicants.includes(req.user.id)) {
      return res
        .status(400)
        .json({ message: "You have already applied to this pattern" });
    }
    if (pattern.positions <= pattern.applicants.length) {
      return res.status(400).json({ message: "No positions available" });
    }
    pattern.applicants.push(req.user.id);
    await pattern.save();
    res.json({ message: "Applied successfully", pattern });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

router.get("/applied/:userId", auth, async (req, res) => {
  try {
    const patterns = await Pattern.find({
      applicants: req.params.userId,
    })
      .populate("creator", "username")
      .lean();

    // Add status to each pattern
    const patternsWithStatus = patterns.map((pattern) => {
      const isSelected = pattern.selectedTesters.some(
        (testerId) => testerId.toString() === req.params.userId.toString()
      );
      return {
        ...pattern,
        status: isSelected ? "Approved" : "Pending",
      };
    });

    res.json(patternsWithStatus);
  } catch (err) {
    console.error("Error fetching applied patterns:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

router.put("/creator/patterns/:patternId/select-testers", async (req, res) => {
  const { patternId } = req.params;
  const { selectedTesters } = req.body;

  try {
    const pattern = await Pattern.findById(patternId);
    if (!pattern)
      return res
        .status(404)
        .json({ success: false, message: "pattern not found" });

    // Validate selectedTesters are valid applicants
    const validTesters = selectedTesters.filter((testerId) =>
      pattern.applicants.some(
        (applicantId) => applicantId.toString() === testerId
      )
    );
    if (validTesters.length !== selectedTesters.length) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid tester IDs provided" });
    }
    if (validTesters.length > pattern.testersNeeded) {
      return res
        .status(400)
        .json({ success: false, message: "Too many testers selected" });
    }

    pattern.selectedTesters = validTesters;
    await pattern.save();
    res.json({
      success: true,
      message: "Testers selected successfully",
      pattern,
    });
  } catch (error) {
    console.error("Error selecting testers:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/created/:creatorId", auth, async (req, res) => {
  try {
    const patterns = await Pattern.find({ creator: req.params.creatorId })
      .populate("creator", "username")
      .populate("applicants", "username")
      .lean();
    res.json(patterns);
  } catch (err) {
    console.error("Error fetching created patterns:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;


