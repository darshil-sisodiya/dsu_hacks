const express = require("express");
const router = express.Router();
const { getTimeSaved } = require("../controllers/counterController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getTimeSaved);

module.exports = router;
