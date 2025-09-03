import { getApiBaseUrl } from './api';

export interface SlackMessage {
  text: string;
  user: string;
  timestamp: string;
  channel: string;
  ts?: string;
}

export interface SlackKeywordSearchResult {
  success: boolean;
  keyword: string;
  messageCount: number;
  channelName: string;
  channelId: string;
  aiSummary: string;
  messages: SlackMessage[];
  timestamp: string;
}

/**
 * Search Slack messages by keywords and get AI summary
 * This function will search for messages containing the specified keywords
 * and return an AI-generated summary of the relevant conversations
 */
export async function searchSlackMessagesByKeywords(
  keywords: string,
  channelId?: string,
  channelName?: string
): Promise<SlackKeywordSearchResult> {
  try {
    // Default to a common channel if not specified
    const targetChannelId = channelId || 'C09DR4X74TB'; // Your workspace channel
    const targetChannelName = channelName || 'General';

    // Build query parameters
    const queryParams = new URLSearchParams({
      keywords: keywords.trim(),
      channel: targetChannelId,
      channelName: targetChannelName
    });

    const response = await fetch(
      `${getApiBaseUrl()}/api/slack-gemini/keyword-search?${queryParams}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || 
        errorData.details || 
        `Search failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Search was not successful');
    }

    return data.data;
  } catch (error) {
    console.error('Error searching Slack messages by keywords:', error);
    throw new Error(
      `Failed to search Slack messages: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Search Slack messages with advanced filters
 */
export async function advancedSlackKeywordSearch(options: {
  keywords: string;
  channelId?: string;
  channelName?: string;
  hoursBack?: number;
  maxMessages?: number;
}): Promise<SlackKeywordSearchResult> {
  try {
    const {
      keywords,
      channelId = 'C09DR4X74TB',
      channelName = 'General',
      hoursBack = 168, // Default to 1 week
      maxMessages = 50
    } = options;

    const queryParams = new URLSearchParams({
      keywords: keywords.trim(),
      channel: channelId,
      channelName,
      hoursBack: hoursBack.toString(),
      maxMessages: maxMessages.toString()
    });

    const response = await fetch(
      `${getApiBaseUrl()}/api/slack-gemini/advanced-keyword-search?${queryParams}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || 
        errorData.details || 
        `Advanced search failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Advanced search was not successful');
    }

    return data.data;
  } catch (error) {
    console.error('Error in advanced Slack keyword search:', error);
    throw new Error(
      `Failed to perform advanced search: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Validate keyword input
 */
export function validateKeywords(keywords: string): {
  isValid: boolean;
  error?: string;
} {
  const trimmed = keywords.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'Keywords cannot be empty' };
  }
  
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Keywords must be at least 2 characters long' };
  }
  
  if (trimmed.length > 100) {
    return { isValid: false, error: 'Keywords cannot exceed 100 characters' };
  }
  
  return { isValid: true };
}

/**
 * Extract common programming-related keywords from text
 */
export function extractProgrammingKeywords(text: string): string[] {
  const programmingTerms = [
    'python', 'javascript', 'typescript', 'react', 'node', 'npm', 'git',
    'api', 'database', 'sql', 'mongodb', 'express', 'frontend', 'backend',
    'component', 'function', 'class', 'variable', 'array', 'object',
    'debug', 'error', 'bug', 'fix', 'update', 'deploy', 'build',
    'pandas', 'numpy', 'matplotlib', 'flask', 'django', 'vue', 'angular',
    'css', 'html', 'scss', 'bootstrap', 'tailwind', 'webpack', 'vite',
    'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'server', 'client',
    'authentication', 'authorization', 'token', 'jwt', 'oauth',
    'testing', 'jest', 'cypress', 'selenium', 'unit test', 'integration',
    'performance', 'optimization', 'caching', 'memory', 'cpu',
    'repository', 'commit', 'branch', 'merge', 'pull request', 'issue'
  ];

  const lowercaseText = text.toLowerCase();
  return programmingTerms.filter(term => lowercaseText.includes(term));
}

/**
 * Get suggested keywords based on common development tasks
 */
export function getSuggestedKeywords(): string[] {
  return [
    'pandas',
    'python file',
    'database update',
    'API endpoint',
    'bug fix',
    'deployment',
    'authentication',
    'frontend component',
    'backend service',
    'testing',
    'performance',
    'git merge',
    'code review',
    'documentation',
    'error handling'
  ];
}
