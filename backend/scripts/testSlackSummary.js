// Load environment variables first
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const SlackSummaryService = require('../src/services/SlackSummaryService');

// Sample Slack data for testing (simulating what would come from SlackServices)
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

async function testSlackSummaryService() {
    try {
        console.log("🚀 Testing SlackSummaryService...\n");
        
        // Initialize the service
        const summaryService = new SlackSummaryService();
        
        // Test 1: Summarize conversation
        console.log("📝 Test 1: Summarizing conversation...");
        const conversationSummary = await summaryService.summarizeConversation(sampleMessages, "Project Team");
        console.log("Conversation Summary:", conversationSummary);
        console.log("---\n");
        
        // Test 2: Summarize tasks
        console.log("✅ Test 2: Summarizing tasks...");
        const taskSummary = await summaryService.summarizeTasks(sampleTasks, "Project Team");
        console.log("Task Summary:", taskSummary);
        console.log("---\n");
        
        // Test 3: Generate comprehensive summary
        console.log("🤖 Test 3: Generating comprehensive summary...");
        const comprehensiveSummary = await summaryService.generateComprehensiveSummary(
            sampleMessages, 
            sampleTasks, 
            "Project Team"
        );
        console.log("Comprehensive Summary:", comprehensiveSummary);
        console.log("---\n");
        
        // Test 4: Summarize individual message
        console.log("💬 Test 4: Summarizing individual message...");
        const messageSummary = await summaryService.summarizeMessage(
            sampleMessages[0], 
            "Project planning discussion"
        );
        console.log("Message Summary:", messageSummary);
        console.log("---\n");
        
        console.log("✅ All tests completed successfully!");
        
    } catch (error) {
        console.error("❌ Test failed:", error.message);
        console.error("Stack trace:", error.stack);
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testSlackSummaryService();
}

module.exports = { testSlackSummaryService };
