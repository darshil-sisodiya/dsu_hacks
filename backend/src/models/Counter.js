// src/models/Counter.js
const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  timeSaved: { type: Number, default: 0 }, // in minutes
}, { timestamps: true });

module.exports = mongoose.model("Counter", counterSchema);
