const Todo = require("../models/todoModel");

// Get all todos
async function getTodos() {
    return await Todo.find().sort({ createdAt: -1 });
}

// Get single todo
async function getTodoById(id) {
    return await Todo.findById(id);
}

// Create new todo
async function createTodo(data) {
    const todo = new Todo(data);
    return await todo.save();
}

// Update todo
async function updateTodo(id, data) {
    return await Todo.findByIdAndUpdate(id, data, { new: true });
}

// Delete todo
async function deleteTodo(id) {
    return await Todo.findByIdAndDelete(id);
}

module.exports = { getTodos, getTodoById, createTodo, updateTodo, deleteTodo };
