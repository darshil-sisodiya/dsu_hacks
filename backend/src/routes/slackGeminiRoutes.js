const express = require("express");
const SlackGeminiIntegrationService = require("../services/SlackGeminiIntegrationService");
const router = express.Router();

// Initialize the integration service
const integrationService = new SlackGeminiIntegrationService();

/**
 * GET /api/slack-gemini/channel-summary
 * Get comprehensive summary of a Slack channel with AI analysis
 */
router.get("/channel-summary", async (req, res) => {
    const { channel, channelName = "Slack" } = req.query;
    
    if (!channel) {
        return res.status(400).json({ 
            error: "Missing channel id", 
            example: "/api/slack-gemini/channel-summary?channel=C123456&channelName=General" 
        });
    }

    try {
        console.log(`🤖 Generating AI summary for channel: ${channel} (${channelName})`);
        
        const result = await integrationService.getChannelSummary(channel, channelName);
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error("❌ Error generating channel summary:", error);
        res.status(500).json({ 
            success: false,
            error: "Failed to generate channel summary", 
            details: error.message 
        });
    }
});

/**
 * GET /api/slack-gemini/message-summary
 * Get AI summary for a specific message (useful for webhooks)
 */
router.get("/message-summary", async (req, res) => {
    const { message, channelName = "Slack" } = req.query;
    
    if (!message) {
        return res.status(400).json({ 
            error: "Missing message data", 
            example: "Send message object in request body or as query param" 
        });
    }

    try {
        let messageData;
        
        // Try to parse message if it's a string
        if (typeof message === 'string') {
            try {
                messageData = JSON.parse(message);
            } catch (parseError) {
                // If not JSON, create a simple message object
                messageData = {
                    text: message,
                    channel: "unknown",
                    user: "unknown",
                    ts: Date.now() / 1000
                };
            }
        } else {
            messageData = message;
        }

        console.log(`💬 Analyzing message: ${messageData.text?.substring(0, 50)}...`);
        
        const result = await integrationService.getMessageSummary(messageData, channelName);
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error("❌ Error generating message summary:", error);
        res.status(500).json({ 
            success: false,
            error: "Failed to generate message summary", 
            details: error.message 
        });
    }
});

/**
 * POST /api/slack-gemini/message-summary
 * Alternative endpoint for sending message data in request body
 */
router.post("/message-summary", async (req, res) => {
    const { message, channelName = "Slack" } = req.body;
    
    if (!message) {
        return res.status(400).json({ 
            error: "Missing message data in request body",
            example: { message: { text: "essay deadline at 8pm about animals being unhappy in captivity" }, channelName: "General" }
        });
    }

    try {
        console.log(`💬 Analyzing message from POST: ${message.text?.substring(0, 50)}...`);
        
        const result = await integrationService.getMessageSummary(message, channelName);
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error("❌ Error generating message summary:", error);
        res.status(500).json({ 
            success: false,
            error: "Failed to generate message summary", 
            details: error.message 
        });
    }
});

/**
 * GET /api/slack-gemini/channel-overview
 * Get recent activity overview for a channel (last X hours)
 */
router.get("/channel-overview", async (req, res) => {
    const { channel, channelName = "Slack", hours = 24 } = req.query;
    
    if (!channel) {
        return res.status(400).json({ 
            error: "Missing channel id", 
            example: "/api/slack-gemini/channel-overview?channel=C123456&channelName=General&hours=12" 
        });
    }

    try {
        const hoursBack = parseInt(hours) || 24;
        console.log(`📊 Getting overview for channel: ${channel} (${channelName}) - last ${hoursBack} hours`);
        
        const result = await integrationService.getChannelOverview(channel, channelName, hoursBack);
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error("❌ Error getting channel overview:", error);
        res.status(500).json({ 
            success: false,
            error: "Failed to get channel overview", 
            details: error.message 
        });
    }
});

/**
 * GET /api/slack-gemini/health
 * Health check endpoint for the integration service
 */
router.get("/health", (req, res) => {
    res.json({
        success: true,
        service: "Slack-Gemini Integration Service",
        status: "Running",
        timestamp: new Date().toISOString(),
        endpoints: {
            "GET /channel-summary": "Get comprehensive channel summary",
            "GET /message-summary": "Get AI summary for specific message",
            "POST /message-summary": "Post message for AI analysis",
            "GET /channel-overview": "Get recent channel activity overview"
        }
    });
});

module.exports = router;
