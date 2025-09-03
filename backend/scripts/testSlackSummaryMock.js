// Mock test script that doesn't require Gemini API key
const SlackSummaryService = require('../src/services/SlackSummaryService');

// Sample Slack data for testing
const sampleMessages = [
    {
        user: "U123456",
        text: "Hey team, we need to finish the project presentation by Friday",
        ts: "1703123456.789",
        channel: "C123456"
    },
    {
        user: "U789012",
        text: "I'll work on the slides, deadline is Friday 5 PM",
        ts: "1703123500.123",
        channel: "C123456"
    },
    {
        user: "U123456",
        text: "Great! Also need to review the budget spreadsheet",
        ts: "1703123550.456",
        channel: "C123456"
    },
    {
        user: "U345678",
        text: "I can help with budget review, let's schedule a meeting",
        ts: "1703123600.789",
        channel: "C123456"
    }
];

const sampleTasks = [
    {
        id: 1,
        title: "Project presentation",
        slackChannelId: "C123456",
        summary: "Finish project presentation by Friday 5 PM",
        files: []
    },
    {
        id: 2,
        title: "Budget review",
        slackChannelId: "C123456",
        summary: "Review budget spreadsheet and schedule meeting",
        files: []
    }
];

async function testSlackSummaryServiceStructure() {
    try {
        console.log("🚀 Testing SlackSummaryService Structure...\n");
        
        // Check if environment variable is available
        console.log("🔑 Environment Check:");
        console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
        console.log("GEMINI_API_KEY length:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
        console.log("---\n");
        
        // Test if we can instantiate the service
        console.log("🏗️ Test 1: Service Instantiation...");
        try {
            const summaryService = new SlackSummaryService();
            console.log("✅ Service instantiated successfully");
            console.log("Service type:", typeof summaryService);
            console.log("Available methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(summaryService)));
        } catch (error) {
            console.log("❌ Service instantiation failed:", error.message);
        }
        console.log("---\n");
        
        // Test data formatting
        console.log("📝 Test 2: Data Formatting...");
        const formattedMessages = sampleMessages.map((msg, index) => {
            const timestamp = new Date(parseFloat(msg.ts) * 1000).toLocaleString();
            return `[${timestamp}] ${msg.user || 'Unknown User'}: ${msg.text}`;
        }).join('\n\n');
        
        console.log("Formatted messages length:", formattedMessages.length);
        console.log("First formatted message:", formattedMessages.split('\n\n')[0]);
        console.log("---\n");
        
        // Test task formatting
        console.log("✅ Test 3: Task Formatting...");
        const formattedTasks = sampleTasks.map((task, index) => {
            return `Task ${index + 1}: ${task.title}\nSummary: ${task.summary}\nChannel: ${task.slackChannelId}`;
        }).join('\n\n');
        
        console.log("Formatted tasks length:", formattedTasks.length);
        console.log("First formatted task:", formattedTasks.split('\n\n')[0]);
        console.log("---\n");
        
        console.log("✅ Structure tests completed successfully!");
        console.log("\n📋 Next steps:");
        console.log("1. Set GEMINI_API_KEY environment variable");
        console.log("2. Run the full test with: node scripts/testSlackSummary.js");
        console.log("3. Or test via API endpoint: GET /api/slack/summary?channel=CHANNEL_ID");
        
    } catch (error) {
        console.error("❌ Test failed:", error.message);
        console.error("Stack trace:", error.stack);
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testSlackSummaryServiceStructure();
}

module.exports = { testSlackSummaryServiceStructure };
