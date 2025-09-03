const Todo = require("../models/todoModel");

// Get all todos for a user
async function getTodos(userId) {
    return await Todo.find({ userId }).sort({ createdAt: -1 });
}

// Get single todo for a user
async function getTodoByIdForUser(id, userId) {
    return await Todo.findOne({ _id: id, userId });
}

// Create new todo for a user
async function createTodoForUser(userId, data) {
    const todo = new Todo({ ...data, userId });
    const saved = await todo.save();
    console.log(`todo created for user ${userId}: ${saved._id} - ${saved.title}`);
    return saved;
}

// Update todo for a user
async function updateTodoForUser(id, userId, data) {
    return await Todo.findOneAndUpdate({ _id: id, userId }, data, { new: true });
}

// Delete todo for a user
async function deleteTodoForUser(id, userId) {
    return await Todo.findOneAndDelete({ _id: id, userId });
}

// Add or update a file entry on a todo for a user
async function addOrUpdateFileForUser(id, userId, filePath) {
    const now = new Date();
    // Try update existing file's lastOpened
    const updated = await Todo.findOneAndUpdate(
        { _id: id, userId, "files.path": filePath },
        { $set: { "files.$.lastOpened": now } },
        { new: true }
    );
    if (updated) return updated;
    // Otherwise push new
    return await Todo.findOneAndUpdate(
        { _id: id, userId },
        { $push: { files: { path: filePath, lastOpened: now } } },
        { new: true }
    );
}

module.exports = { getTodos, getTodoByIdForUser, createTodoForUser, updateTodoForUser, deleteTodoForUser, addOrUpdateFileForUser };
