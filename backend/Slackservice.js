const axios = require("axios");

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

async function fetchSlackMessages(channel) {
  const url = "https://slack.com/api/conversations.history";
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
    params: { channel, limit: 50 },
  });

  if (!res.data.ok) throw new Error("Slack API error: " + res.data.error);

  const messages = res.data.messages || [];
  
  // Log all messages with JSON representation
  console.log("📨 Slack Messages from channel:", channel);
  console.log("📊 Total messages found:", messages.length);
  messages.forEach((msg, index) => {
    console.log(`\n📝 Message ${index + 1}:`);
    console.log("👤 User ID:", msg.user);
    console.log("📝 Text:", msg.text);
    console.log("⏰ Timestamp:", msg.ts);
    console.log("📺 Channel:", msg.channel);
    console.log("🔗 Full JSON:", JSON.stringify(msg, null, 2));
    console.log("---");
  });

  return messages;
}

// Naive keyword-based extraction
function extractTasks(messages) {
  let tasks = [];

  messages.forEach((msg, idx) => {
    const text = msg.text.toLowerCase();

    if (text.includes("task") || text.includes("deadline") || text.includes("finish") || text.includes("complete")) {
      // Extract a title (first few words after task/finish/complete)
      let titleMatch = text.match(/(?:task|finish|complete)\s+(.*?)(?:,|\.|$)/);
      let deadlineMatch = text.match(/deadline\s+(?:at|by)\s+([0-9:apm\s]+)/);

      const title = titleMatch ? titleMatch[1] : "Unlabeled Task";
      const deadline = deadlineMatch ? `Deadline: ${deadlineMatch[1]}` : "";

      tasks.push({
        id: idx + 1,
        title: title.trim(),
        slackChannelId: msg.channel || "unknown",
        summary: `${msg.text} ${deadline}`.trim(),
        files: [], // can improve later
      });
    }
  });

  return tasks;
}

async function getSlackTasks(channel) {
  const messages = await fetchSlackMessages(channel);
  const tasks = extractTasks(messages);

  return tasks;
}

module.exports = { getSlackTasks, fetchSlackMessages };
