// routes/recommendation.js
const DecisionTree = require("decision-tree");
const Pattern = require("../models/Pattern");

const FEATURES = ["skillLevel", "category"];
const PATTERN_CLASS_NAME = "title";

module.exports = (app) => {
  app.post("/api/recommendations", async (req, res) => {
    console.log("Received body:", req.body);

    if (!req.body) {
      return res.status(400).json({ error: "Request body is missing" });
    }

    const { skillLevel, category } = req.body;

    if (skillLevel === undefined || category === undefined) {
      return res.status(400).json({ error: "Missing required parameters" });
    }
    if (!skillLevel.trim() || !category.trim()) {
      return res.status(400).json({ error: "Parameters cannot be empty" });
    }

    try {
      // Verify Pattern is a Mongoose model
      if (typeof Pattern.find !== "function") {
        throw new Error("Pattern model is not properly initialized");
      }

      // Fetch patterns
      const patterns = await Pattern.find().lean();
      console.log("Raw patterns from DB:", patterns);

      // Format training data
      const trainingData = patterns.map((p) => ({
        skillLevel: p.skillLevel.toLowerCase(),
        category: p.category.toLowerCase(),
        title: p.title,
      }));
      console.log("Formatted training data:", trainingData);

      if (trainingData.length === 0) {
        return res
          .status(404)
          .json({ error: "No patterns available for recommendation" });
      }

      // Train decision tree
      const patternTree = new DecisionTree(
        trainingData,
        PATTERN_CLASS_NAME,
        FEATURES
      );
      console.log("Decision tree trained with features:", FEATURES);

      // Normalize input
      const input = {
        skillLevel: skillLevel.toLowerCase(),
        category: category.toLowerCase(),
      };
      console.log("Prediction input:", input);

      // Predict
      let patternPrediction = patternTree.predict(input);
      console.log("Predicted pattern (title):", patternPrediction);

      // Fallback
      if (!patternPrediction) {
        patternPrediction =
          trainingData.find(
            (p) =>
              p.skillLevel === input.skillLevel && p.category === input.category
          )?.title || "No matching pattern found";
        console.log("Fallback prediction:", patternPrediction);
      }

      res.json({
        recommendedPattern: patternPrediction,
      });
    } catch (error) {
      console.error("Prediction error:", error.message);
      res
        .status(500)
        .json({ error: "Internal server error: " + error.message });
    }
  });
};
