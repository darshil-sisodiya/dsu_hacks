const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Service for generating AI-powered summaries of Slack content using Gemini API
 */
class SlackSummaryService {
    constructor() {
        this.model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    }

    /**
     * Generate a summary of Slack messages/conversation
     * @param {Array} messages - Array of Slack messages from SlackServices
     * @param {string} channelName - Name of the Slack channel (optional)
     * @returns {Promise<string>} - AI-generated summary
     */
    async summarizeConversation(messages, channelName = "Slack") {
        try {
            if (!messages || messages.length === 0) {
                return "No messages to summarize.";
            }

            // Format messages for better context
            const formattedMessages = messages.map((msg, index) => {
                const timestamp = new Date(parseFloat(msg.ts) * 1000).toLocaleString();
                return `[${timestamp}] ${msg.user || 'Unknown User'}: ${msg.text}`;
            }).join('\n\n');

            // Limit content size to prevent exceeding token limit
            const maxChars = 8000;
            const trimmedContent = formattedMessages.length > maxChars 
                ? formattedMessages.slice(0, maxChars) + "\n\n[Content truncated for summarization]" 
                : formattedMessages;

            const prompt = `Analyze the following Slack conversation from ${channelName} and provide a concise summary (2-3 sentences) that captures:

1. The main topics or themes discussed
2. Any tasks, deadlines, or action items mentioned
3. The overall tone and purpose of the conversation

Focus on extracting actionable insights and key information. Keep the summary brief but informative.

Conversation:
${trimmedContent}`;

            const result = await this.model.generateContent(prompt);
            return result.response.text();

        } catch (error) {
            console.error("Error summarizing conversation:", error);
            return `Error generating summary: ${error.message}`;
        }
    }

    /**
     * Generate a summary of Slack tasks
     * @param {Array} tasks - Array of tasks extracted from Slack
     * @param {string} channelName - Name of the Slack channel (optional)
     * @returns {Promise<string>} - AI-generated task summary
     */
    async summarizeTasks(tasks, channelName = "Slack") {
        try {
            if (!tasks || tasks.length === 0) {
                return "No tasks found to summarize.";
            }

            // Format tasks for better context
            const formattedTasks = tasks.map((task, index) => {
                return `Task ${index + 1}: ${task.title}\nSummary: ${task.summary}\nChannel: ${task.slackChannelId}`;
            }).join('\n\n');

            const prompt = `Analyze the following Slack tasks from ${channelName} and provide a concise summary (2-3 sentences) that includes:

1. The total number of tasks identified
2. Common themes or categories of tasks
3. Any urgent or high-priority items
4. Overall workload assessment

Tasks:
${formattedTasks}`;

            const result = await this.model.generateContent(prompt);
            return result.response.text();

        } catch (error) {
            console.error("Error summarizing tasks:", error);
            return `Error generating task summary: ${error.message}`;
        }
    }

    /**
     * Generate a comprehensive summary of both conversation and tasks
     * @param {Array} messages - Array of Slack messages
     * @param {Array} tasks - Array of extracted tasks
     * @param {string} channelName - Name of the Slack channel (optional)
     * @returns {Promise<string>} - Comprehensive AI-generated summary
     */
    async generateComprehensiveSummary(messages, tasks, channelName = "Slack") {
        try {
            const conversationSummary = await this.summarizeConversation(messages, channelName);
            const taskSummary = await this.summarizeTasks(tasks, channelName);

            const prompt = `Create a comprehensive summary of the Slack activity in ${channelName} by combining these two summaries:

Conversation Summary:
${conversationSummary}

Task Summary:
${taskSummary}

Provide a unified summary (3-4 sentences) that gives a complete overview of the channel's activity, including key discussions and actionable items.`;

            const result = await this.model.generateContent(prompt);
            return result.response.text();

        } catch (error) {
            console.error("Error generating comprehensive summary:", error);
            return `Error generating comprehensive summary: ${error.message}`;
        }
    }

    /**
     * Generate a summary of a specific message or thread
     * @param {Object} message - Single Slack message object
     * @param {string} context - Additional context about the message
     * @returns {Promise<string>} - AI-generated message summary
     */
    async summarizeMessage(message, context = "") {
        try {
            if (!message || !message.text) {
                return "No message content to summarize.";
            }

            const prompt = `Analyze this Slack message and provide a brief summary (1-2 sentences) that captures:

1. The main point or request
2. Any action items or deadlines mentioned
3. The tone and urgency level

Message: ${message.text}
Context: ${context || 'General conversation'}

Summary:`;

            const result = await this.model.generateContent(prompt);
            return result.response.text();

        } catch (error) {
            console.error("Error summarizing message:", error);
            return `Error generating message summary: ${error.message}`;
        }
    }
}

module.exports = SlackSummaryService;
