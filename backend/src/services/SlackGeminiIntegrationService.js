const { getSlackTasks, fetchSlackMessages } = require("../../Slackservice");
const SlackSummaryService = require("./SlackSummaryService");

/**
 * Service that integrates Slack message fetching with Gemini summarization
 * This service acts as a bridge between Slack data and AI summarization
 */
class SlackGeminiIntegrationService {
    constructor() {
        this.summaryService = new SlackSummaryService();
    }

    /**
     * Fetch messages from a Slack channel and get AI summary
     * @param {string} channelId - Slack channel ID
     * @param {string} channelName - Human-readable channel name (optional)
     * @returns {Promise<Object>} - Channel data with AI summary
     */
    async getChannelSummary(channelId, channelName = "Slack") {
        try {
            console.log(`🔄 Fetching messages from channel: ${channelId}`);
            
            // Fetch messages using existing SlackServices
            const messages = await fetchSlackMessages(channelId);
            console.log(`📨 Fetched ${messages.length} messages from ${channelName}`);
            
            // Extract tasks using existing SlackServices
            const tasks = await getSlackTasks(channelId);
            console.log(`✅ Extracted ${tasks.length} tasks from ${channelName}`);
            
            // Generate AI summary using SlackSummaryService
            const summary = await this.summaryService.generateComprehensiveSummary(
                messages, 
                tasks, 
                channelName
            );
            
            return {
                channelId,
                channelName,
                messageCount: messages.length,
                taskCount: tasks.length,
                messages: messages,
                tasks: tasks,
                aiSummary: summary,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`❌ Error getting channel summary for ${channelId}:`, error);
            throw error;
        }
    }

    /**
     * Get summary for specific messages (useful for webhooks or specific message analysis)
     * @param {Array} messageIds - Array of specific message IDs to analyze
     * @param {string} channelId - Slack channel ID
     * @param {string} channelName - Human-readable channel name (optional)
     * @returns {Promise<Object>} - Specific messages with AI summary
     */
    async getSpecificMessagesSummary(messageIds, channelId, channelName = "Slack") {
        try {
            console.log(`🔍 Analyzing specific messages from channel: ${channelId}`);
            
            // Fetch all messages first
            const allMessages = await fetchSlackMessages(channelId);
            
            // Filter to specific messages if IDs provided
            const targetMessages = messageIds && messageIds.length > 0 
                ? allMessages.filter(msg => messageIds.includes(msg.ts))
                : allMessages;
            
            console.log(`📝 Analyzing ${targetMessages.length} specific messages`);
            
            // Generate summary for specific messages
            const summary = await this.summaryService.summarizeConversation(
                targetMessages, 
                channelName
            );
            
            return {
                channelId,
                channelName,
                messageCount: targetMessages.length,
                messages: targetMessages,
                aiSummary: summary,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`❌ Error getting specific messages summary:`, error);
            throw error;
        }
    }

    /**
     * Get real-time message summary (useful for webhooks)
     * @param {Object} message - Single Slack message object
     * @param {string} channelName - Human-readable channel name (optional)
     * @returns {Promise<Object>} - Single message with AI summary
     */
    async getMessageSummary(message, channelName = "Slack") {
        try {
            console.log(`💬 Analyzing single message from ${channelName}`);
            
            // Generate summary for single message
            const summary = await this.summaryService.summarizeMessage(
                message, 
                `Message from ${channelName}`
            );
            
            return {
                channelId: message.channel,
                channelName,
                message: message,
                aiSummary: summary,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`❌ Error getting message summary:`, error);
            throw error;
        }
    }

    /**
     * Get channel overview with recent activity summary
     * @param {string} channelId - Slack channel ID
     * @param {string} channelName - Human-readable channel name (optional)
     * @param {number} hoursBack - How many hours back to analyze (default: 24)
     * @returns {Promise<Object>} - Channel overview with AI insights
     */
    async getChannelOverview(channelId, channelName = "Slack", hoursBack = 24) {
        try {
            console.log(`📊 Getting channel overview for ${channelName} (last ${hoursBack} hours)`);
            
            // Fetch messages
            const allMessages = await fetchSlackMessages(channelId);
            
            // Filter messages by time (last X hours)
            const cutoffTime = Date.now() - (hoursBack * 60 * 60 * 1000);
            const recentMessages = allMessages.filter(msg => {
                const messageTime = parseFloat(msg.ts) * 1000;
                return messageTime > cutoffTime;
            });
            
            console.log(`⏰ Found ${recentMessages.length} messages in last ${hoursBack} hours`);
            
            // Extract tasks from recent messages
            const recentTasks = await getSlackTasks(channelId);
            
            // Generate summary for recent activity
            const summary = await this.summaryService.generateComprehensiveSummary(
                recentMessages, 
                recentTasks, 
                `${channelName} (Last ${hoursBack}h)`
            );
            
            return {
                channelId,
                channelName,
                timeRange: `${hoursBack} hours`,
                messageCount: recentMessages.length,
                taskCount: recentTasks.length,
                messages: recentMessages,
                tasks: recentTasks,
                aiSummary: summary,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`❌ Error getting channel overview:`, error);
            throw error;
        }
    }
}

module.exports = SlackGeminiIntegrationService;
