require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { getBotChannels, fetchAllSlackMessages, getAllSlackTasks } = require('../Slackservice');
const SlackGeminiIntegrationService = require('../src/services/SlackGeminiIntegrationService');

async function testMultiChannelBot() {
    try {
        console.log("🚀 Testing Multi-Channel Bot Functionality\n");
        
        // Test 1: Get all channels
        console.log("📋 Test 1: Get All Bot Channels");
        const channels = await getBotChannels();
        console.log(`✅ Bot is in ${channels.length} channels:`);
        channels.forEach(ch => {
            console.log(`  - #${ch.name} (${ch.id}) - ${ch.is_channel ? 'Public' : 'Private'}`);
        });
        console.log();
        
        // Test 2: Get all messages
        console.log("📨 Test 2: Get All Messages");
        const { messages, summary } = await fetchAllSlackMessages();
        console.log(`✅ Collected ${messages.length} total messages`);
        console.log("📊 Channel breakdown:");
        summary.channelBreakdown.forEach(ch => {
            console.log(`  - #${ch.name}: ${ch.messageCount} messages`);
        });
        console.log();
        
        // Test 3: Get all tasks
        console.log("✅ Test 3: Get All Tasks");
        const tasks = await getAllSlackTasks();
        console.log(`✅ Extracted ${tasks.length} total tasks`);
        tasks.forEach((task, idx) => {
            console.log(`  ${idx + 1}. "${task.title}" from #${task.sourceChannel.name}`);
        });
        console.log();
        
        // Test 4: Test keyword search across all channels
        console.log("🔍 Test 4: Keyword Search Across All Channels");
        const integrationService = new SlackGeminiIntegrationService();
        
        const keywords = ["finish", "task", "deadline"];
        for (const keyword of keywords) {
            console.log(`\nSearching for: "${keyword}"`);
            const searchResult = await integrationService.searchMessagesByKeywords(keyword);
            console.log(`📍 Found ${searchResult.messageCount} messages containing "${keyword}"`);
            if (searchResult.channelBreakdown) {
                searchResult.channelBreakdown.forEach(ch => {
                    console.log(`  - #${ch.channelName}: ${ch.messageCount} messages`);
                });
            }
        }
        
        console.log("\n🎉 Multi-Channel Bot Test Completed Successfully!");
        
    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

if (require.main === module) {
    testMultiChannelBot();
}

module.exports = { testMultiChannelBot };
