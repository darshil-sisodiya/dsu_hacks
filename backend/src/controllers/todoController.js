const todoService = require("../services/todoService");



exports.resumeTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await todoService.getTodoById(taskId);

        if (!task) return res.status(404).json({ message: "Task not found" });

        // Sort by lastOpened (newest first)
        const recentFiles = task.files.sort((a, b) => new Date(b.lastOpened) - new Date(a.lastOpened));

        res.json({
            taskId: task._id,
            title: task.title,
            files: recentFiles
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Get all todos


exports.getTodos = async (req, res) => {
    try {
        const todos = await todoService.getTodos();
        res.json(todos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get single todo
exports.getTodoById = async (req, res) => {
    try {
        const todo = await todoService.getTodoById(req.params.id);
        if (!todo) return res.status(404).json({ message: "Todo not found" });
        res.json(todo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create todo
exports.createTodo = async (req, res) => {
    try {
        const todo = await todoService.createTodo(req.body);
        res.status(201).json(todo);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Update todo
exports.updateTodo = async (req, res) => {
    try {
        const todo = await todoService.updateTodo(req.params.id, req.body);
        if (!todo) return res.status(404).json({ message: "Todo not found" });
        res.json(todo);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete todo
exports.deleteTodo = async (req, res) => {
    try {
        const todo = await todoService.deleteTodo(req.params.id);
        if (!todo) return res.status(404).json({ message: "Todo not found" });
        res.json({ message: "Todo deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
