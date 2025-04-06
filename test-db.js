const mongoose = require("mongoose");
require("dotenv").config();

const testConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB!");
    await mongoose.connection.close();
  } catch (error) {
    console.error("Connection failed:", error);
  }
};

testConnection();
