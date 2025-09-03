const todoService = require("../services/todoService");



exports.resumeTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await todoService.getTodoByIdForUser(taskId, req.user._id);
        if (!task) return res.status(404).json({ message: "Task not found" });
        const recentFiles = task.files.sort((a, b) => new Date(b.lastOpened) - new Date(a.lastOpened));
        res.json({ taskId: task._id, title: task.title, files: recentFiles });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Get all todos


exports.getTodos = async (req, res) => {
    try {
        const todos = await todoService.getTodos(req.user._id);
        res.json(todos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get single todo
exports.getTodoById = async (req, res) => {
    try {
        const todo = await todoService.getTodoByIdForUser(req.params.id, req.user._id);
        if (!todo) return res.status(404).json({ message: "Todo not found" });
        res.json(todo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create todo
exports.createTodo = async (req, res) => {
    try {
        const todo = await todoService.createTodoForUser(req.user._id, req.body);
        console.log(`todo stored: ${todo._id} - ${todo.title}`);
        res.status(201).json(todo);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Update todo
exports.updateTodo = async (req, res) => {
    try {
        const todo = await todoService.updateTodoForUser(req.params.id, req.user._id, req.body);
        if (!todo) return res.status(404).json({ message: "Todo not found" });
        res.json(todo);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete todo
exports.deleteTodo = async (req, res) => {
    try {
        const todo = await todoService.deleteTodoForUser(req.params.id, req.user._id);
        if (!todo) return res.status(404).json({ message: "Todo not found" });
        res.json({ message: "Todo deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Record file opened for a task
exports.trackFile = async (req, res) => {
    try {
        const { id } = req.params;
        const { path } = req.body;
        if (!path) return res.status(400).json({ message: "File path is required" });
        const updated = await todoService.addOrUpdateFileForUser(id, req.user._id, path);
        if (!updated) return res.status(404).json({ message: "Todo not found" });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
