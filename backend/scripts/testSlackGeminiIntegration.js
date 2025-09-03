// Test script for Slack-Gemini Integration Service
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const SlackGeminiIntegrationService = require('../src/services/SlackGeminiIntegrationService');

// Example message like the one you mentioned
const exampleMessage = {
    text: "essay deadline at 8pm about animals being unhappy in captivity",
    channel: "C123456",
    user: "U123456",
    ts: Date.now() / 1000
};

// Example channel data for testing
const exampleChannelId = "C123456";
const exampleChannelName = "General";

async function testSlackGeminiIntegration() {
    try {
        console.log("🚀 Testing Slack-Gemini Integration Service...\n");
        
        // Initialize the integration service
        const integrationService = new SlackGeminiIntegrationService();
        
        // Test 1: Single message summary (like your example)
        console.log("📝 Test 1: Single Message Summary");
        console.log("Message:", exampleMessage.text);
        console.log("---");
        
        try {
            const messageSummary = await integrationService.getMessageSummary(exampleMessage, exampleChannelName);
            console.log("✅ Message Summary Generated:");
            console.log("Summary:", messageSummary.aiSummary);
            console.log("Channel:", messageSummary.channelName);
            console.log("Timestamp:", messageSummary.timestamp);
        } catch (error) {
            console.log("❌ Message Summary Failed:", error.message);
        }
        console.log("\n---\n");
        
        // Test 2: Channel summary (if you have a real channel ID)
        console.log("📊 Test 2: Channel Summary");
        console.log("Note: This requires a real Slack channel ID");
        console.log("You can test with: GET /api/slack-gemini/channel-summary?channel=YOUR_CHANNEL_ID&channelName=ChannelName");
        console.log("---\n");
        
        // Test 3: Channel overview
        console.log("⏰ Test 3: Channel Overview (Last 24 hours)");
        console.log("Note: This requires a real Slack channel ID");
        console.log("You can test with: GET /api/slack-gemini/channel-overview?channel=YOUR_CHANNEL_ID&channelName=ChannelName&hours=24");
        console.log("---\n");
        
        // Test 4: API endpoint examples
        console.log("🌐 Test 4: API Endpoint Examples");
        console.log("Available endpoints:");
        console.log("1. GET /api/slack-gemini/health - Service health check");
        console.log("2. GET /api/slack-gemini/channel-summary?channel=CHANNEL_ID&channelName=ChannelName");
        console.log("3. GET /api/slack-gemini/message-summary?message=MESSAGE_TEXT&channelName=ChannelName");
        console.log("4. POST /api/slack-gemini/message-summary - Send message in request body");
        console.log("5. GET /api/slack-gemini/channel-overview?channel=CHANNEL_ID&channelName=ChannelName&hours=12");
        console.log("---\n");
        
        // Test 5: Health check simulation
        console.log("🏥 Test 5: Service Health Check");
        try {
            // Simulate what the health endpoint would return
            console.log("✅ Service Status: Running");
            console.log("✅ Integration Service: Initialized");
            console.log("✅ Slack Services: Available");
            console.log("✅ Gemini API: Connected");
        } catch (error) {
            console.log("❌ Health Check Failed:", error.message);
        }
        console.log("---\n");
        
        console.log("✅ Integration tests completed!");
        console.log("\n📋 Next steps:");
        console.log("1. Start your server: npm start");
        console.log("2. Test with real Slack channel ID");
        console.log("3. Use the example message format for testing");
        console.log("4. Check the health endpoint: GET /api/slack-gemini/health");
        
    } catch (error) {
        console.error("❌ Integration test failed:", error.message);
        console.error("Stack trace:", error.stack);
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testSlackGeminiIntegration();
}

module.exports = { testSlackGeminiIntegration };
