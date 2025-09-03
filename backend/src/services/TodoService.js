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

module.exports = { getTodos, getTodoByIdForUser, createTodoForUser, updateTodoForUser, deleteTodoForUser };
