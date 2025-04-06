const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

module.exports = (io, Chat) => {
  router.get("/:userId/:otherUserId", auth, async (req, res) => {
    try {
      const messages = await Chat.find({
        $or: [
          { sender: req.params.userId, receiver: req.params.otherUserId },
          { sender: req.params.otherUserId, receiver: req.params.userId },
        ],
      })
        .populate("sender", "username")
        .populate("receiver", "username")
        .sort("timestamp");
      res.json(messages);
    } catch (err) {
      console.error("Error in /api/chat:", err.message, err.stack);
      res.status(500).json({ message: "Server error: " + err.message });
    }
  });

  router.post("/send", auth, async (req, res) => {
    try {
      console.log("Request headers:", req.headers);
      console.log("Raw request body:", req.body);
      console.log("Uploaded files:", req.files);

      let fileUrl = "";
      if (req.files && req.files.file) {
        const file = req.files.file;
        console.log("File details:", {
          name: file.name,
          size: file.size,
          mimetype: file.mimetype,
        });
        if (!["image/png", "image/jpeg", "image/jpg"].includes(file.mimetype)) {
          console.log("Invalid file type:", file.mimetype);
          return res
            .status(400)
            .json({ message: "Only image files (PNG, JPEG, JPG) are allowed" });
        }
        console.log("Uploading file to Cloudinary:", file.name);
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
          resource_type: "image", // Changed to "image" for proper handling
          folder: "chat_images", // Changed folder to "chat_images"
          public_id: file.name.replace(/\.[^/.]+$/, ""),
        });
        fileUrl = result.secure_url;
        console.log("File uploaded to Cloudinary:", fileUrl);
      } else {
        console.log("No file detected in request");
      }

      const { sender, receiver, message } = req.body || {};

      if (!req.body) {
        console.log("No request body received");
        return res.status(400).json({ message: "Request body is empty" });
      }

      if (!sender || !receiver) {
        console.log("Missing sender or receiver");
        return res
          .status(400)
          .json({ message: "Sender and receiver are required" });
      }

      if (
        !mongoose.Types.ObjectId.isValid(sender) ||
        !mongoose.Types.ObjectId.isValid(receiver)
      ) {
        console.log("Invalid sender or receiver ID format");
        return res
          .status(400)
          .json({ message: "Invalid sender or receiver ID" });
      }

      console.log("Creating new message with:", {
        sender,
        receiver,
        message,
        fileUrl,
      });
      const newMessage = new Chat({ sender, receiver, message, fileUrl });
      await newMessage.save();
      console.log("Message saved:", newMessage._id);

      console.log("Fetching populated message...");
      const populatedMessage = await Chat.findById(newMessage._id)
        .populate("sender", "username")
        .populate("receiver", "username");
      if (!populatedMessage) {
        console.log("Failed to find saved message");
        return res.status(500).json({ message: "Failed to retrieve message" });
      }

      console.log("Emitting new message via Socket.IO");
      io.emit("newMessage", populatedMessage);
      res.json(populatedMessage);
    } catch (err) {
      console.error("Error in /api/chat/send:", err.message, err.stack);
      res.status(500).json({ message: "Server error: " + err.message });
    }
  });

  router.delete("/delete/:id", auth, async (req, res) => {
    try {
      const chat = await Chat.findById(req.params.id);
      if (!chat) return res.status(404).json({ message: "Message not found" });
      if (chat.sender.toString() !== req.user.id)
        return res.status(403).json({ message: "Unauthorized" });

      await chat.remove();
      res.json({ message: "Message deleted" });
    } catch (err) {
      console.error("Error in /api/chat/delete:", err.message, err.stack);
      res.status(500).json({ message: "Server error: " + err.message });
    }
  });

  return router;
};
