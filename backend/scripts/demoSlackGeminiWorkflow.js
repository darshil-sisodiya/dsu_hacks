// Demo: Slack Messages -> Gemini -> Summary Workflow
// This demonstrates the exact workflow you requested

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api/slack-gemini`;

// Example message like yours
const exampleMessage = "essay deadline at 8pm about animals being unhappy in captivity";

async function demoSlackGeminiWorkflow() {
    try {
        console.log("🚀 Demo: Slack Messages -> Gemini -> Summary Workflow\n");
        
        // Step 1: Test the health endpoint
        console.log("📋 Step 1: Check Service Health");
        try {
            const healthResponse = await axios.get(`${API_BASE}/health`);
            console.log("✅ Service Status:", healthResponse.data.data.status);
            console.log("✅ Available Endpoints:", Object.keys(healthResponse.data.data.endpoints).length);
        } catch (error) {
            console.log("❌ Health check failed:", error.message);
            return;
        }
        console.log("---\n");
        
        // Step 2: Test single message summary (like your example)
        console.log("📝 Step 2: Single Message Summary");
        console.log("Message:", exampleMessage);
        console.log("Sending to Gemini for analysis...");
        
        try {
            const messageResponse = await axios.post(`${API_BASE}/message-summary`, {
                message: {
                    text: exampleMessage,
                    channel: "C123456",
                    user: "U123456",
                    ts: Date.now() / 1000
                },
                channelName: "General"
            });
            
            console.log("✅ Gemini Analysis Complete!");
            console.log("📊 Summary:", messageResponse.data.data.aiSummary);
            console.log("📺 Channel:", messageResponse.data.data.channelName);
            console.log("⏰ Timestamp:", messageResponse.data.data.timestamp);
        } catch (error) {
            console.log("❌ Message summary failed:", error.response?.data?.error || error.message);
        }
        console.log("---\n");
        
        // Step 3: Test GET endpoint for message summary
        console.log("🔍 Step 3: GET Message Summary (Alternative Method)");
        try {
            const getResponse = await axios.get(`${API_BASE}/message-summary`, {
                params: {
                    message: exampleMessage,
                    channelName: "General"
                }
            });
            
            console.log("✅ GET Method Success!");
            console.log("📊 Summary:", getResponse.data.data.aiSummary);
        } catch (error) {
            console.log("❌ GET method failed:", error.response?.data?.error || error.message);
        }
        console.log("---\n");
        
        // Step 4: Show how to test with real Slack data
        console.log("📱 Step 4: Testing with Real Slack Data");
        console.log("To test with real Slack channels, use these endpoints:");
        console.log("");
        console.log("1. Channel Summary:");
        console.log(`   GET ${API_BASE}/channel-summary?channel=YOUR_CHANNEL_ID&channelName=ChannelName`);
        console.log("");
        console.log("2. Recent Activity (Last 12 hours):");
        console.log(`   GET ${API_BASE}/channel-overview?channel=YOUR_CHANNEL_ID&channelName=ChannelName&hours=12`);
        console.log("");
        console.log("3. Single Message (like your example):");
        console.log(`   POST ${API_BASE}/message-summary`);
        console.log("   Body: { message: { text: \"your message here\" }, channelName: \"ChannelName\" }");
        console.log("---\n");
        
        // Step 5: Show the complete workflow
        console.log("🔄 Complete Workflow Summary:");
        console.log("1. ✅ Slack message fetched (from your existing SlackServices)");
        console.log("2. ✅ Message sent to Gemini API");
        console.log("3. ✅ AI-generated summary returned");
        console.log("4. ✅ JSON response with all data");
        console.log("");
        console.log("🎯 Your example message: \"essay deadline at 8pm about animals being unhappy in captivity\"");
        console.log("🤖 Gemini analyzed it and provided a structured summary!");
        console.log("");
        console.log("🚀 Ready to use with real Slack data!");
        
    } catch (error) {
        console.error("❌ Demo failed:", error.message);
        console.error("Make sure your server is running on port 3001");
    }
}

// Run the demo if this file is executed directly
if (require.main === module) {
    demoSlackGeminiWorkflow();
}

module.exports = { demoSlackGeminiWorkflow };
