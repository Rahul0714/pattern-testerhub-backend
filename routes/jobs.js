const express = require("express");
const { getJobs, postJob } = require("../controllers/jobController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getJobs);
router.post("/", authMiddleware, postJob);

module.exports = router;
