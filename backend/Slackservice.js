const axios = require("axios");

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

// Get all channels the bot is a member of using smart discovery
async function getBotChannels() {
  console.log("🔍 Discovering channels bot has access to...");
  
  const discoveredChannels = [];
  const channelTestIds = [
    "C09DR4X74TB", // Known working channel
    // Add other channel IDs you know the bot is in
  ];

  // Method 1: Try conversations.list if we have proper scopes
  try {
    console.log("🚀 Attempting conversations.list...");
    const res = await axios.get("https://slack.com/api/conversations.list", {
      headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
      params: { 
        types: "public_channel,private_channel",
        exclude_archived: true,
        limit: 100
      },
    });

    if (res.data.ok && res.data.channels) {
      const channels = res.data.channels.filter(ch => ch.is_member !== false);
      console.log(`✅ conversations.list found ${channels.length} channels`);
      
      // Add all discovered channels
      channels.forEach(channel => {
        discoveredChannels.push({
          id: channel.id,
          name: channel.name,
          type: channel.is_channel ? 'public' : 'private',
          is_member: true,
          discovery_method: 'conversations_list'
        });
      });
      
      return discoveredChannels;
    } else {
      console.log(`⚠️ conversations.list failed: ${res.data.error}`);
    }
  } catch (error) {
    console.log(`⚠️ conversations.list error: ${error.response?.data?.error || error.message}`);
  }

  // Method 2: Try users.conversations (bot's own conversations)
  try {
    console.log("🤖 Attempting users.conversations for bot...");
    
    // First get bot user ID
    const authRes = await axios.get("https://slack.com/api/auth.test", {
      headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` }
    });

    if (authRes.data.ok && authRes.data.user_id) {
      const botUserId = authRes.data.user_id;
      console.log(`🤖 Bot User ID: ${botUserId}`);

      const userConvRes = await axios.get("https://slack.com/api/users.conversations", {
        headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
        params: { 
          user: botUserId,
          types: "public_channel,private_channel",
          exclude_archived: true,
          limit: 100
        }
      });

      if (userConvRes.data.ok && userConvRes.data.channels) {
        const channels = userConvRes.data.channels;
        console.log(`✅ users.conversations found ${channels.length} channels for bot`);
        
        channels.forEach(channel => {
          discoveredChannels.push({
            id: channel.id,
            name: channel.name,
            type: channel.is_channel ? 'public' : 'private',
            is_member: true,
            discovery_method: 'users_conversations'
          });
        });
        
        return discoveredChannels;
      } else {
        console.log(`⚠️ users.conversations failed: ${userConvRes.data.error}`);
      }
    }
  } catch (error) {
    console.log(`⚠️ users.conversations error: ${error.response?.data?.error || error.message}`);
  }

  // Method 3: Try alternative approach - get bot's own conversations without user param
  try {
    console.log("🔄 Attempting users.conversations without user param...");
    
    const userConvRes = await axios.get("https://slack.com/api/users.conversations", {
      headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
      params: { 
        types: "public_channel,private_channel",
        exclude_archived: true,
        limit: 100
      }
    });

    if (userConvRes.data.ok && userConvRes.data.channels) {
      const channels = userConvRes.data.channels;
      console.log(`✅ users.conversations (no user param) found ${channels.length} channels`);
      
      channels.forEach(channel => {
        discoveredChannels.push({
          id: channel.id,
          name: channel.name,
          type: channel.is_channel ? 'public' : 'private',
          is_member: true,
          discovery_method: 'users_conversations_alt'
        });
      });
      
      return discoveredChannels;
    } else {
      console.log(`⚠️ users.conversations (alt) failed: ${userConvRes.data.error}`);
    }
  } catch (error) {
    console.log(`⚠️ users.conversations (alt) error: ${error.response?.data?.error || error.message}`);
  }

  // Method 4: Test known channel IDs by attempting to read their history
  console.log("� Testing known channel IDs...");
  
  for (const channelId of channelTestIds) {
    try {
      const historyRes = await axios.get("https://slack.com/api/conversations.history", {
        headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
        params: { channel: channelId, limit: 1 }
      });

      if (historyRes.data.ok) {
        // Get channel info
        try {
          const infoRes = await axios.get("https://slack.com/api/conversations.info", {
            headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
            params: { channel: channelId }
          });

          if (infoRes.data.ok && infoRes.data.channel) {
            const channel = infoRes.data.channel;
            discoveredChannels.push({
              id: channel.id,
              name: channel.name,
              type: channel.is_channel ? 'public' : 'private',
              is_member: true,
              discovery_method: 'history_test'
            });
            console.log(`✅ Confirmed access to #${channel.name} (${channelId})`);
          }
        } catch (infoError) {
          // Fallback with basic info
          discoveredChannels.push({
            id: channelId,
            name: `channel-${channelId.slice(-6)}`,
            type: 'unknown',
            is_member: true,
            discovery_method: 'history_test_fallback'
          });
          console.log(`✅ Can read messages from ${channelId} (limited info)`);
        }
      }
    } catch (error) {
      console.log(`❌ Cannot access ${channelId}: ${error.response?.data?.error || error.message}`);
    }
  }

  // Method 3: If we have any working channels, that's enough
  if (discoveredChannels.length > 0) {
    console.log(`🎉 Found ${discoveredChannels.length} accessible channels`);
    return discoveredChannels;
  }

  // Method 4: Ultimate fallback
  console.log("🔄 Using minimal fallback configuration");
  return [
    {
      id: "C09DR4X74TB",
      name: "fallback-channel", 
      type: "public",
      is_member: true,
      discovery_method: 'hardcoded_fallback'
    }
  ];
}

// Fetch messages from all channels the bot is in
async function fetchAllSlackMessages() {
  try {
    const channels = await getBotChannels();
    const allMessages = [];

    for (const channel of channels) {
      try {
        console.log(`📨 Fetching messages from #${channel.name} (${channel.id})`);
        const messages = await fetchSlackMessages(channel.id);
        
        // Add channel info to each message
        const messagesWithChannel = messages.map(msg => ({
          ...msg,
          channelId: channel.id,
          channelName: channel.name,
          channelType: channel.is_channel ? 'public' : 'private'
        }));
        
        allMessages.push(...messagesWithChannel);
        console.log(`  ✅ Added ${messages.length} messages from #${channel.name}`);
      } catch (error) {
        console.error(`  ❌ Failed to fetch from #${channel.name}:`, error.message);
        // Continue with other channels even if one fails
      }
    }

    console.log(`🎉 Total messages collected: ${allMessages.length}`);
    return {
      channels: channels.map(ch => ({ id: ch.id, name: ch.name, type: ch.is_channel ? 'public' : 'private' })),
      messages: allMessages,
      summary: {
        totalChannels: channels.length,
        totalMessages: allMessages.length,
        channelBreakdown: channels.map(ch => ({
          name: ch.name,
          id: ch.id,
          messageCount: allMessages.filter(msg => msg.channelId === ch.id).length
        }))
      }
    };
  } catch (error) {
    console.error("❌ Error fetching all messages:", error);
    throw error;
  }
}

// Get tasks from all channels
async function getAllSlackTasks() {
  try {
    const { messages, channels } = await fetchAllSlackMessages();
    const allTasks = [];

    // Group messages by channel for better task extraction
    const messagesByChannel = {};
    messages.forEach(msg => {
      if (!messagesByChannel[msg.channelId]) {
        messagesByChannel[msg.channelId] = [];
      }
      messagesByChannel[msg.channelId].push(msg);
    });

    // Extract tasks from each channel
    for (const [channelId, channelMessages] of Object.entries(messagesByChannel)) {
      const channel = channels.find(ch => ch.id === channelId);
      const tasks = extractTasks(channelMessages);
      
      // Add channel info to tasks
      const tasksWithChannel = tasks.map(task => ({
        ...task,
        sourceChannel: {
          id: channelId,
          name: channel?.name || 'Unknown',
          type: channel?.type || 'unknown'
        }
      }));

      allTasks.push(...tasksWithChannel);
      console.log(`✅ Extracted ${tasks.length} tasks from #${channel?.name}`);
    }

    console.log(`🎯 Total tasks extracted: ${allTasks.length}`);
    return allTasks;
  } catch (error) {
    console.error("❌ Error getting all tasks:", error);
    throw error;
  }
}

async function fetchSlackMessages(channel) {
  try {
    const url = "https://slack.com/api/conversations.history";
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
      params: { channel, limit: 50 },
    });

    if (!res.data.ok) {
      // Provide specific error messages for common issues
      if (res.data.error === 'missing_scope') {
        throw new Error(`Missing OAuth scope for channel ${channel}. Add 'channels:history' and 'groups:history' scopes to your Slack bot.`);
      } else if (res.data.error === 'channel_not_found') {
        throw new Error(`Channel ${channel} not found. Bot may not be a member of this channel.`);
      } else if (res.data.error === 'not_in_channel') {
        throw new Error(`Bot is not a member of channel ${channel}. Invite the bot to this channel first.`);
      }
      throw new Error("Slack API error: " + res.data.error);
    }

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
  } catch (error) {
    console.error(`❌ Error fetching messages from channel ${channel}:`, error.message);
    throw error;
  }
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
        slackChannelId: msg.channelId || msg.channel || "unknown",
        slackChannelName: msg.channelName || "Unknown Channel",
        summary: `${msg.text} ${deadline}`.trim(),
        files: [], // can improve later
        sourceMessage: msg
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

module.exports = { 
  getSlackTasks, 
  fetchSlackMessages, 
  getBotChannels, 
  fetchAllSlackMessages, 
  getAllSlackTasks 
};
