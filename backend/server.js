const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const connectDB = require('./src/config/database');
const authRoutes = require('./src/routes/authRoutes');
const todoRoutes = require('./src/routes/TodoRoutes'); 
const slackRoutes = require('./src/routes/slackRoutes'); // ✅ Import Slack routes
const slackGeminiRoutes = require('./src/routes/slackGeminiRoutes'); // 🚀 Import Slack-Gemini integration routes

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes); 
app.use('/api/slack', slackRoutes); // ✅ Mount Slack routes
app.use('/api/slack-gemini', slackGeminiRoutes); // 🚀 Mount Slack-Gemini integration routes

// Health check route
app.get('/health', (req, res) => {
    res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    process.exit(1);
});

module.exports = app;
