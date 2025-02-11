const Job = require("../models/Job");

// Get all jobs
exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate("employer", "name email");
    res.status(200).json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Post a new job
exports.postJob = async (req, res) => {
  const { title, description, company, location } = req.body;

  try {
    const job = new Job({
      title,
      description,
      company,
      location,
      employer: req.user.userId,
    });
    await job.save();
    res.status(201).json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
