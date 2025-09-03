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
    /**
     * Search Slack messages by keywords and get AI summary
     * @param {string} keywords - Keywords to search for
     * @param {string} channelId - Slack channel ID
     * @param {string} channelName - Human-readable channel name (optional)
     * @returns {Promise<Object>} - Filtered messages with AI summary
     */
    async searchMessagesByKeywords(keywords, channelId, channelName = "Slack") {
        try {
            console.log(`🔍 Searching for keywords: "${keywords}" in channel: ${channelId}`);
            
            // Fetch all messages from the channel
            const allMessages = await fetchSlackMessages(channelId);
            console.log(`📨 Fetched ${allMessages.length} total messages from ${channelName}`);
            
            // Filter messages that contain the keywords (case-insensitive)
            const keywordArray = keywords.toLowerCase().split(/[,\s]+/).filter(k => k.length > 0);
            const filteredMessages = allMessages.filter(message => {
                const messageText = (message.text || '').toLowerCase();
                return keywordArray.some(keyword => messageText.includes(keyword));
            });
            
            console.log(`🎯 Found ${filteredMessages.length} messages matching keywords: ${keywordArray.join(', ')}`);
            
            if (filteredMessages.length === 0) {
                return {
                    channelId,
                    channelName,
                    keyword: keywords,
                    messageCount: 0,
                    messages: [],
                    aiSummary: `No messages found containing the keywords: "${keywords}". Try different keywords or check if the channel has recent activity.`,
                    timestamp: new Date().toISOString()
                };
            }
            
            // Generate AI summary for the filtered messages
            const summary = await this.summaryService.summarizeConversation(
                filteredMessages, 
                `${channelName} - Keyword Search: "${keywords}"`
            );
            
            return {
                channelId,
                channelName,
                keyword: keywords,
                messageCount: filteredMessages.length,
                messages: filteredMessages.map(msg => ({
                    text: msg.text,
                    user: msg.user || 'unknown',
                    timestamp: msg.ts ? new Date(parseFloat(msg.ts) * 1000).toISOString() : new Date().toISOString(),
                    channel: msg.channel || channelId
                })),
                aiSummary: summary,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`❌ Error searching messages by keywords:`, error);
            throw error;
        }
    }

    /**
     * Advanced keyword search with additional filters
     * @param {Object} options - Search options
     * @param {string} options.keywords - Keywords to search for
     * @param {string} options.channel - Slack channel ID
     * @param {string} options.channelName - Human-readable channel name
     * @param {number} options.hoursBack - How many hours back to search
     * @param {number} options.maxMessages - Maximum number of messages to analyze
     * @returns {Promise<Object>} - Filtered messages with AI summary
     */
    async advancedKeywordSearch(options) {
        const {
            keywords,
            channel: channelId,
            channelName = "Slack",
            hoursBack = 168, // Default 1 week
            maxMessages = 50
        } = options;

        try {
            console.log(`🔍 Advanced search: "${keywords}" in ${channelName} (last ${hoursBack}h, max ${maxMessages} messages)`);
            
            // Fetch all messages from the channel
            const allMessages = await fetchSlackMessages(channelId);
            
            // Filter by time range
            const cutoffTime = Date.now() - (hoursBack * 60 * 60 * 1000);
            const recentMessages = allMessages.filter(msg => {
                const messageTime = parseFloat(msg.ts) * 1000;
                return messageTime > cutoffTime;
            });
            
            console.log(`⏰ Found ${recentMessages.length} messages in last ${hoursBack} hours`);
            
            // Filter by keywords
            const keywordArray = keywords.toLowerCase().split(/[,\s]+/).filter(k => k.length > 0);
            const keywordMatches = recentMessages.filter(message => {
                const messageText = (message.text || '').toLowerCase();
                return keywordArray.some(keyword => messageText.includes(keyword));
            });
            
            // Limit the number of messages for analysis
            const limitedMessages = keywordMatches.slice(0, maxMessages);
            
            console.log(`🎯 Found ${keywordMatches.length} keyword matches, analyzing ${limitedMessages.length} messages`);
            
            if (limitedMessages.length === 0) {
                return {
                    channelId,
                    channelName,
                    keyword: keywords,
                    messageCount: 0,
                    timeRange: `${hoursBack} hours`,
                    messages: [],
                    aiSummary: `No messages found in the last ${hoursBack} hours containing the keywords: "${keywords}". Try expanding the time range or using different keywords.`,
                    timestamp: new Date().toISOString()
                };
            }
            
            // Generate AI summary for the filtered messages
            const summary = await this.summaryService.summarizeConversation(
                limitedMessages, 
                `${channelName} - Advanced Search: "${keywords}" (Last ${hoursBack}h)`
            );
            
            return {
                channelId,
                channelName,
                keyword: keywords,
                messageCount: limitedMessages.length,
                timeRange: `${hoursBack} hours`,
                totalMatches: keywordMatches.length,
                messages: limitedMessages.map(msg => ({
                    text: msg.text,
                    user: msg.user || 'unknown',
                    timestamp: msg.ts ? new Date(parseFloat(msg.ts) * 1000).toISOString() : new Date().toISOString(),
                    channel: msg.channel || channelId
                })),
                aiSummary: summary,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`❌ Error in advanced keyword search:`, error);
            throw error;
        }
    }
}

module.exports = SlackGeminiIntegrationService;
