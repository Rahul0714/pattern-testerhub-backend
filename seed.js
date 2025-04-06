const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");
const Pattern = require("./models/Pattern");
require("dotenv").config();

const seedData = async () => {
  await connectDB();

  await User.deleteMany({});
  await Pattern.deleteMany({});

  const creator = await User.create({
    username: "CreatorJane",
    email: "jane@example.com",
    password: await bcrypt.hash("password123", 10),
    role: "creator",
    bio: "Experienced crochet pattern designer.",
  });

  const tester = await User.create({
    username: "TesterAlice",
    email: "alice@example.com",
    password: await bcrypt.hash("password123", 10),
    role: "tester",
    skillLevel: "intermediate",
    rewardPoints: 50,
  });

  await Pattern.create([
    {
      title: "Crochet Amigurumi Bunny",
      description: "A cute bunny pattern for beginners.",
      category: "other",
      skillLevel: "beginner",
      completionTime: "less than 1 week",
      positions: 2,
      compensation: "Free pattern + 10 points",
      creator: creator._id,
      applicants: [tester._id],
      postedDate: new Date("2025-03-01"),
    },
    {
      title: "Knit Blanket",
      description: "Cozy blanket for intermediate knitters.",
      category: "home-decor",
      skillLevel: "intermediate",
      completionTime: "1-2 months",
      positions: 3,
      compensation: "Free pattern + 20 points",
      creator: creator._id,
      postedDate: new Date("2025-03-15"),
    },
  ]);

  console.log("Database seeded!");
  mongoose.connection.close();
};

seedData();
