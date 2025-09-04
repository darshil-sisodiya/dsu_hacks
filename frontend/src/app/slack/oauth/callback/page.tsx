"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaSlack, FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

const SlackOAuthCallback: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (error) {
      setStatus('error');
      setMessage(`Authorization failed: ${error}`);
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('No authorization code received from Slack');
      return;
    }

    // Handle the OAuth callback
    handleOAuthCallback(code, state);
  }, [searchParams]);

  const handleOAuthCallback = async (code: string, state: string | null) => {
    try {
      setStatus('loading');
      setMessage('Completing bot installation...');

      // Send the authorization code to your backend
      const response = await fetch('/api/slack/oauth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });

      if (response.ok) {
        const result = await response.json();
        setStatus('success');
        setMessage('Bot successfully installed to your Slack workspace!');
        
        // Redirect back to the main app after 3 seconds
        setTimeout(() => {
          router.push('/tasks');
        }, 3000);
      } else {
        const error = await response.json();
        setStatus('error');
        setMessage(error.message || 'Failed to complete bot installation');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error during bot installation');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <FaSpinner className="text-4xl text-blue-600 animate-spin" />;
      case 'success':
        return <FaCheckCircle className="text-4xl text-green-600" />;
      case 'error':
        return <FaExclamationTriangle className="text-4xl text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <FaSlack className="text-2xl text-slack-green" style={{ color: '#4A154B' }} />
            </div>
            <h1 className="text-xl font-bold text-white">Slack Bot Installation</h1>
            <p className="text-slate-300 text-sm mt-1">contextFlowBot</p>
          </div>

          {/* Status */}
          <div className="p-8">
            <div className={`border rounded-lg p-6 text-center ${getStatusColor()}`}>
              <div className="mb-4">
                {getStatusIcon()}
              </div>
              
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {status === 'loading' && 'Installing Bot...'}
                {status === 'success' && 'Installation Complete!'}
                {status === 'error' && 'Installation Failed'}
              </h2>
              
              <p className="text-slate-700 text-sm leading-relaxed mb-4">
                {message}
              </p>

              {status === 'success' && (
                <div className="bg-white border border-green-200 rounded-lg p-4 text-left">
                  <h3 className="font-medium text-green-900 mb-2">What's Next?</h3>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• The bot is now installed in your Slack workspace</li>
                    <li>• Invite the bot to channels where you want to search messages</li>
                    <li>• Use the keyword search feature in the app</li>
                    <li>• Get AI summaries of your Slack conversations</li>
                  </ul>
                </div>
              )}

              {status === 'loading' && (
                <div className="bg-white border border-blue-200 rounded-lg p-4 text-left">
                  <p className="text-sm text-blue-800">
                    Please wait while we complete the installation process...
                  </p>
                </div>
              )}

              {status === 'error' && (
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/tasks')}
                    className="w-full bg-slate-600 text-white py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Return to App
                  </button>
                  <p className="text-xs text-slate-600">
                    You can try the installation process again from the Slack search feature.
                  </p>
                </div>
              )}
            </div>

            {status === 'success' && (
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600 mb-3">
                  Redirecting you back to the app in a few seconds...
                </p>
                <button
                  onClick={() => router.push('/tasks')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Go to App Now →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlackOAuthCallback;
