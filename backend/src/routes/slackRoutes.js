const express = require("express");
const { 
  getSlackTasks, 
  fetchSlackMessages, 
  getBotChannels, 
  fetchAllSlackMessages, 
  getAllSlackTasks 
} = require("../../Slackservice");
const SlackSummaryService = require("../services/SlackSummaryService");
const router = express.Router();

// Test channel discovery
router.get("/discover-channels", async (req, res) => {
  try {
    console.log('🔍 Testing channel discovery...');
    
    const channels = await getBotChannels();
    
    res.json({
      success: true,
      channelCount: channels.length,
      channels: channels.map(ch => ({
        id: ch.id,
        name: ch.name,
        type: ch.type,
        discoveryMethod: ch.discovery_method
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Channel discovery error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test OAuth scopes and bot permissions
router.get("/test-scopes", async (req, res) => {
  try {
    console.log("🔧 Testing Slack OAuth scopes...");
    
    const axios = require('axios');
    const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
    
    const tests = [
      {
        name: "Bot Authentication",
        endpoint: "https://slack.com/api/auth.test",
        requiredScopes: ["basic bot functionality"]
      },
      {
        name: "List Conversations",
        endpoint: "https://slack.com/api/conversations.list",
        params: { types: "public_channel,private_channel", limit: 5, exclude_archived: true },
        requiredScopes: ["channels:read", "groups:read"]
      },
      {
        name: "Get Channel History",
        endpoint: "https://slack.com/api/conversations.history",
        params: { channel: "C09DR4X74TB", limit: 1 },
        requiredScopes: ["channels:history", "groups:history"]
      }
    ];

    const results = [];
    
    for (const test of tests) {
      try {
        const response = await axios.get(test.endpoint, {
          headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
          params: test.params || {}
        });
        
        results.push({
          test: test.name,
          status: response.data.ok ? "✅ PASS" : "❌ FAIL",
          error: response.data.error || null,
          requiredScopes: test.requiredScopes,
          response: response.data.ok ? "Success" : response.data.error
        });
      } catch (error) {
        results.push({
          test: test.name,
          status: "❌ ERROR",
          error: error.message,
          requiredScopes: test.requiredScopes,
          response: error.message
        });
      }
    }

    // Check what scopes we actually have
    let actualScopes = [];
    try {
      const authTest = await axios.get("https://slack.com/api/auth.test", {
        headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` }
      });
      
      if (authTest.data.ok) {
        // Try to get app info to see scopes
        const appInfo = await axios.get("https://slack.com/api/apps.permissions.info", {
          headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` }
        });
        
        if (appInfo.data.ok && appInfo.data.info && appInfo.data.info.scopes) {
          actualScopes = appInfo.data.info.scopes.bot || [];
        }
      }
    } catch (error) {
      console.log("Could not fetch current scopes:", error.message);
    }

    res.json({
      success: true,
      botUserId: results[0]?.response?.user_id || "unknown",
      teamId: results[0]?.response?.team_id || "unknown",
      actualScopes: actualScopes.length > 0 ? actualScopes : "Unable to fetch current scopes",
      requiredScopes: [
        "channels:read",
        "groups:read", 
        "channels:history",
        "groups:history",
        "users:read",
        "im:read",
        "mpim:read",
        "im:history",
        "mpim:history"
      ],
      testResults: results,
      recommendations: results.filter(r => r.status.includes("FAIL") || r.status.includes("ERROR")).length > 0 ? [
        "Go to https://api.slack.com/apps/[YOUR_APP_ID]/oauth",
        "Add the missing OAuth scopes listed above",
        "Click 'Reinstall App' to apply new permissions",
        "Invite the bot to channels where you want it to work"
      ] : [
        "All tests passed! Your bot has the required permissions.",
        "You can now use multi-channel functionality."
      ]
    });
    
  } catch (error) {
    console.error("❌ Error testing scopes:", error);
    res.status(500).json({ 
      error: "Failed to test OAuth scopes", 
      details: error.message 
    });
  }
});

// Webhook endpoint to receive Slack messages
router.post("/webhook", async (req, res) => {
  try {
    console.log("📨 Slack webhook received:", JSON.stringify(req.body, null, 2));
    
    // Respond to Slack immediately to acknowledge receipt
    res.status(200).json({ message: "Webhook received successfully" });
    
    // Process the message if needed
    if (req.body && req.body.text) {
      console.log("📝 Message text:", req.body.text);
      console.log("👤 User:", req.body.user);
      console.log("📺 Channel:", req.body.channel);
    }
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Get all channels the bot is in
router.get("/channels", async (req, res) => {
  try {
    const channels = await getBotChannels();
    res.json({
      success: true,
      channelCount: channels.length,
      channels: channels.map(ch => ({
        id: ch.id,
        name: ch.name,
        type: ch.is_channel ? 'public' : 'private',
        memberCount: ch.num_members,
        topic: ch.topic?.value || '',
        purpose: ch.purpose?.value || ''
      }))
    });
  } catch (err) {
    console.error("❌ Error fetching channels:", err);
    res.status(500).json({ error: "Failed to fetch bot channels", details: err.message });
  }
});

// Get messages from all channels
router.get("/all-messages", async (req, res) => {
  try {
    const result = await fetchAllSlackMessages();
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error("❌ Error fetching all messages:", err);
    res.status(500).json({ error: "Failed to fetch messages from all channels", details: err.message });
  }
});

// Get tasks from all channels
router.get("/all-tasks", async (req, res) => {
  try {
    const tasks = await getAllSlackTasks();
    res.json({
      success: true,
      taskCount: tasks.length,
      tasks: tasks,
      channelBreakdown: tasks.reduce((acc, task) => {
        const channelName = task.sourceChannel.name;
        acc[channelName] = (acc[channelName] || 0) + 1;
        return acc;
      }, {})
    });
  } catch (err) {
    console.error("❌ Error fetching all tasks:", err);
    res.status(500).json({ error: "Failed to fetch tasks from all channels", details: err.message });
  }
});

// Enhanced summary endpoint for all channels
router.get("/all-summary", async (req, res) => {
  try {
    console.log("🤖 Generating AI summary for all channels...");
    
    const summaryService = new SlackSummaryService();
    const { messages, channels, summary } = await fetchAllSlackMessages();
    const tasks = await getAllSlackTasks();
    
    console.log(`📊 Analyzing ${messages.length} messages and ${tasks.length} tasks from ${channels.length} channels`);
    
    // Generate comprehensive summary for all channels
    const aiSummary = await summaryService.generateComprehensiveSummary(
      messages, 
      tasks, 
      `All Bot Channels (${channels.length} channels)`
    );
    
    res.json({
      success: true,
      overview: {
        totalChannels: channels.length,
        totalMessages: messages.length,
        totalTasks: tasks.length,
        channelBreakdown: summary.channelBreakdown
      },
      channels: channels,
      aiSummary: aiSummary,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("❌ Error generating all-channel summary:", err);
    res.status(500).json({ error: "Failed to generate summary for all channels", details: err.message });
  }
});

// Endpoint to fetch raw messages from a channel (for debugging)
router.get("/messages", async (req, res) => {
  const { channel } = req.query;
  if (!channel) return res.status(400).json({ error: "Missing channel id" });

  try {
    const messages = await fetchSlackMessages(channel);
    res.json({ 
      channel, 
      messageCount: messages.length, 
      messages: messages 
    });
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch Slack messages", details: err.message });
  }
});

// Endpoint to fetch tasks from a channel
router.get("/tasks", async (req, res) => {
  const { channel } = req.query;
  if (!channel) return res.status(400).json({ error: "Missing channel id" });

  try {
    const tasks = await getSlackTasks(channel);
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch Slack tasks" });
  }
});

// New endpoint to generate AI summaries of Slack content
router.get("/summary", async (req, res) => {
  const { channel, channelName = "Slack" } = req.query;
  if (!channel) return res.status(400).json({ error: "Missing channel id" });

  try {
    console.log("🤖 Generating AI summary for channel:", channel);
    
    // Initialize the summary service
    const summaryService = new SlackSummaryService();
    
    // Fetch messages and tasks
    const messages = await fetchSlackMessages(channel);
    const tasks = await getSlackTasks(channel);
    
    console.log(`📊 Found ${messages.length} messages and ${tasks.length} tasks`);
    
    // Generate comprehensive summary
    const summary = await summaryService.generateComprehensiveSummary(
      messages, 
      tasks, 
      channelName
    );
    
    res.json({
      channel,
      channelName,
      messageCount: messages.length,
      taskCount: tasks.length,
      summary: summary,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error("❌ Error generating summary:", err);
    res.status(500).json({ 
      error: "Failed to generate summary", 
      details: err.message 
    });
  }
});

module.exports = router;
