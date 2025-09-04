const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * POST /api/slack/oauth/callback
 * Handle Slack OAuth callback after user authorizes the bot
 */
router.post('/callback', async (req, res) => {
  try {
    const { code, state } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }

    console.log('🔐 Processing Slack OAuth callback...');

    // Exchange authorization code for access token
    const tokenResponse = await axios.post('https://slack.com/api/oauth.v2.access', {
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      code: code,
      redirect_uri: 'http://localhost:3000/slack/oauth/callback'
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!tokenResponse.data.ok) {
      console.error('❌ Slack OAuth token exchange failed:', tokenResponse.data.error);
      return res.status(400).json({
        success: false,
        message: `Slack OAuth error: ${tokenResponse.data.error}`
      });
    }

    const { access_token, team, authed_user, bot_user_id } = tokenResponse.data;

    // Store the bot token and team information
    // Note: In production, you should store this in a database
    console.log('✅ Slack OAuth successful!');
    console.log(`📝 Team: ${team.name} (${team.id})`);
    console.log(`🤖 Bot User: ${bot_user_id}`);
    console.log(`👤 Authorized User: ${authed_user.id}`);

    // Update environment or database with new bot token
    // For now, we'll just log it (in production, store securely)
    if (access_token) {
      console.log('🔑 New bot token received (update your SLACK_BOT_TOKEN environment variable)');
      // In production, you'd store this token associated with the team ID
    }

    // Test the new token by making a simple API call
    try {
      const testResponse = await axios.get('https://slack.com/api/auth.test', {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      if (testResponse.data.ok) {
        console.log('✅ Token validation successful');
      }
    } catch (testError) {
      console.log('⚠️ Token validation failed, but installation completed');
    }

    res.json({
      success: true,
      message: 'Bot successfully installed to your Slack workspace!',
      data: {
        team: {
          id: team.id,
          name: team.name
        },
        bot_user_id,
        authed_user: authed_user.id
      }
    });

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete OAuth flow',
      error: error.message
    });
  }
});

/**
 * GET /api/slack/oauth/status
 * Check OAuth installation status
 */
router.get('/status', async (req, res) => {
  try {
    const botToken = process.env.SLACK_BOT_TOKEN;
    
    if (!botToken) {
      return res.json({
        success: false,
        installed: false,
        message: 'Bot token not configured'
      });
    }

    // Test the current bot token
    const testResponse = await axios.get('https://slack.com/api/auth.test', {
      headers: { Authorization: `Bearer ${botToken}` }
    });

    if (testResponse.data.ok) {
      res.json({
        success: true,
        installed: true,
        data: {
          team: testResponse.data.team,
          team_id: testResponse.data.team_id,
          user: testResponse.data.user,
          user_id: testResponse.data.user_id
        }
      });
    } else {
      res.json({
        success: false,
        installed: false,
        message: 'Bot token is invalid or expired'
      });
    }

  } catch (error) {
    console.error('❌ OAuth status check error:', error);
    res.status(500).json({
      success: false,
      installed: false,
      message: 'Failed to check OAuth status',
      error: error.message
    });
  }
});

module.exports = router;
