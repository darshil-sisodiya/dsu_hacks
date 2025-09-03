const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
        priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
        dueDate: { type: Date },
        files: [
            {
                path: { type: String, required: true },
                lastOpened: { type: Date, default: Date.now },
                lastAccessed: { type: Date, default: Date.now },
                isActive: { type: Boolean, default: true }
            }
        ]
    },
    { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
