const express = require("express");
const { getSlackTasks, fetchSlackMessages } = require("../../Slackservice");
const router = express.Router();

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

module.exports = router;
