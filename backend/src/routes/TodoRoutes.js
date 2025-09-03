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

router.get("/:taskId/resume", todoController.resumeTask);

module.exports = router;
