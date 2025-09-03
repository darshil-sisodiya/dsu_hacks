const express = require("express");
const router = express.Router();
const todoController = require("../controllers/todoController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", todoController.getTodos);
router.get("/:id", todoController.getTodoById);
router.post("/", todoController.createTodo);
router.put("/:id", todoController.updateTodo);
router.delete("/:id", todoController.deleteTodo);

router.post("/:id/files/track", todoController.trackFile);
router.get("/:taskId/resume", todoController.resumeTask);
// routes/TodoRoutes.js
router.get("/:id/files/summary", todoController.summarizeRecentFile);

module.exports = router;