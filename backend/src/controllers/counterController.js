// controllers/counterController.js
const Counter = require("../models/Counter");

exports.getTimeSaved = async (req, res) => {
  try {
    console.log("Fetching counter for user:", req.user._id);
    const counter = await Counter.findOne({ userId: req.user._id });
    console.log("Counter from DB:", counter);
    res.json({ timeSaved: counter ? counter.timeSaved : 0 });
  } catch (err) {
    console.error("Counter fetch error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

