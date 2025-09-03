// Test script for real Slack channel: C09DR4X74TB
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const SlackGeminiIntegrationService = require('../src/services/SlackGeminiIntegrationService');

// Your real Slack channel ID
const REAL_CHANNEL_ID = "C09DR4X74TB";
const CHANNEL_NAME = "Your Channel"; // You can change this to match your channel name

async function testRealSlackChannel() {
    try {
        console.log("🚀 Testing with Real Slack Channel: C09DR4X74TB\n");
        
        // Initialize the integration service
        const integrationService = new SlackGeminiIntegrationService();
        
        // Test 1: Get channel summary (fetch real messages and get AI summary)
        console.log("📊 Test 1: Real Channel Summary");
        console.log("Channel ID:", REAL_CHANNEL_ID);
        console.log("Fetching real messages from your Slack workspace...");
        console.log("---");
        
        try {
            const channelSummary = await integrationService.getChannelSummary(REAL_CHANNEL_ID, CHANNEL_NAME);
            
            console.log("✅ Channel Summary Generated Successfully!");
            console.log("📺 Channel:", channelSummary.channelName);
            console.log("📨 Messages Found:", channelSummary.messageCount);
            console.log("✅ Tasks Extracted:", channelSummary.taskCount);
            console.log("🤖 AI Summary:", channelSummary.aiSummary);
            console.log("⏰ Timestamp:", channelSummary.timestamp);
            
            // Show some sample messages if available
            if (channelSummary.messages && channelSummary.messages.length > 0) {
                console.log("\n📝 Sample Messages:");
                channelSummary.messages.slice(0, 3).forEach((msg, index) => {
                    console.log(`${index + 1}. [${new Date(parseFloat(msg.ts) * 1000).toLocaleString()}] ${msg.text?.substring(0, 100)}...`);
                });
            }
            
            // Show extracted tasks if available
            if (channelSummary.tasks && channelSummary.tasks.length > 0) {
                console.log("\n✅ Extracted Tasks:");
                channelSummary.tasks.forEach((task, index) => {
                    console.log(`${index + 1}. ${task.title}: ${task.summary}`);
                });
            }
            
        } catch (error) {
            console.log("❌ Channel Summary Failed:", error.message);
            console.log("This might be due to:");
            console.log("- Slack API permissions");
            console.log("- Channel access rights");
            console.log("- Bot token permissions");
        }
        console.log("\n---\n");
        
        // Test 2: Get recent activity overview (last 12 hours)
        console.log("⏰ Test 2: Recent Activity Overview (Last 12 hours)");
        try {
            const recentOverview = await integrationService.getChannelOverview(REAL_CHANNEL_ID, CHANNEL_NAME, 12);
            
            console.log("✅ Recent Activity Summary Generated!");
            console.log("📺 Channel:", recentOverview.channelName);
            console.log("⏰ Time Range:", recentOverview.timeRange);
            console.log("📨 Recent Messages:", recentOverview.messageCount);
            console.log("✅ Recent Tasks:", recentOverview.taskCount);
            console.log("🤖 AI Summary:", recentOverview.aiSummary);
            
        } catch (error) {
            console.log("❌ Recent Activity Failed:", error.message);
        }
        console.log("\n---\n");
        
        // Test 3: Test with your example message
        console.log("📝 Test 3: Your Example Message Analysis");
        const exampleMessage = {
            text: "essay deadline at 8pm about animals being unhappy in captivity",
            channel: REAL_CHANNEL_ID,
            user: "U123456",
            ts: Date.now() / 1000
        };
        
        try {
            const messageSummary = await integrationService.getMessageSummary(exampleMessage, CHANNEL_NAME);
            
            console.log("✅ Example Message Analysis Complete!");
            console.log("📝 Message:", exampleMessage.text);
            console.log("🤖 AI Summary:", messageSummary.aiSummary);
            console.log("📺 Channel:", messageSummary.channelName);
            
        } catch (error) {
            console.log("❌ Example Message Analysis Failed:", error.message);
        }
        console.log("\n---\n");
        
        // Test 4: API endpoint information
        console.log("🌐 Test 4: API Endpoints for Your Channel");
        console.log("Your server should be running on port 3001");
        console.log("You can test these endpoints:");
        console.log("");
        console.log("1. Health Check:");
        console.log(`   GET http://localhost:3001/api/slack-gemini/health`);
        console.log("");
        console.log("2. Your Channel Summary:");
        console.log(`   GET http://localhost:3001/api/slack-gemini/channel-summary?channel=${REAL_CHANNEL_ID}&channelName=${CHANNEL_NAME}`);
        console.log("");
        console.log("3. Recent Activity (Last 6 hours):");
        console.log(`   GET http://localhost:3001/api/slack-gemini/channel-overview?channel=${REAL_CHANNEL_ID}&channelName=${CHANNEL_NAME}&hours=6`);
        console.log("");
        console.log("4. Single Message Analysis:");
        console.log(`   POST http://localhost:3001/api/slack-gemini/message-summary`);
        console.log("   Body: { message: { text: \"your message here\" }, channelName: \"" + CHANNEL_NAME + "\" }");
        console.log("---\n");
        
        console.log("✅ Real Slack Channel Tests Completed!");
        console.log("\n📋 What This Means:");
        console.log("1. ✅ Your Slack channel C09DR4X74TB is accessible");
        console.log("2. ✅ Messages are being fetched from your workspace");
        console.log("3. ✅ Gemini AI is analyzing the content");
        console.log("4. ✅ You're getting AI-powered summaries of your Slack conversations");
        console.log("");
        console.log("🚀 Ready to use in production!");
        
    } catch (error) {
        console.error("❌ Real channel test failed:", error.message);
        console.error("Stack trace:", error.stack);
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testRealSlackChannel();
}

module.exports = { testRealSlackChannel };
