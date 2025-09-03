import { getApiBaseUrl } from './api';
import { createTodo, type Todo } from './todos';

export interface SlackTask {
  id: number;
  title: string;
  slackChannelId: string;
  summary: string;
  files: any[];
  deadline?: string;
  file?: string;
  extractedInfo?: {
    taskType?: string;
    fileName?: string;
    deadline?: string;
    description?: string;
  };
}

export interface SlackImportResult {
  success: boolean;
  importedCount: number;
  errors: string[];
  tasks: Todo[];
}

/**
 * Parse Slack message to extract task information
 */
function parseSlackMessage(message: string): SlackTask['extractedInfo'] | null {
  const text = message.toLowerCase();
  
  // Check for task-related keywords
  const taskKeywords = ['task', 'assignment', 'project', 'work', 'todo', 'deadline', 'finish', 'complete'];
  const hasTaskKeyword = taskKeywords.some(keyword => text.includes(keyword));
  
  if (!hasTaskKeyword) return null;
  
  const extractedInfo: SlackTask['extractedInfo'] = {};
  
  // Extract task type (assignment, project, etc.)
  const taskTypeMatch = text.match(/(assignment|project|task|work|todo)/i);
  if (taskTypeMatch) {
    extractedInfo.taskType = taskTypeMatch[1];
  }
  
  // Extract file information (look for "in file", "file:", etc.)
  const fileMatch = text.match(/(?:in file|file:|for file)\s+([a-zA-Z0-9._-]+)/i);
  if (fileMatch) {
    extractedInfo.fileName = fileMatch[1];
  }
  
  // Extract deadline information
  const deadlineMatch = text.match(/deadline\s+(?:at|by|on)?\s*([0-9:apm\s]+|[a-zA-Z]+)/i);
  if (deadlineMatch) {
    extractedInfo.deadline = deadlineMatch[1].trim();
  }
  
  // Extract description (first few words before task keywords)
  const descriptionMatch = text.match(/^([^.!?]*(?:assignment|project|task|work|todo))/i);
  if (descriptionMatch) {
    extractedInfo.description = descriptionMatch[1].trim();
  }
  
  return extractedInfo;
}

/**
 * Fetch tasks from a Slack channel
 */
export async function fetchSlackTasks(channelId: string): Promise<SlackTask[]> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/slack/tasks?channel=${channelId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Slack tasks: ${response.status}`);
    }
    
    const tasks = await response.json();
    
    // Parse each task to extract additional information
    const parsedTasks = tasks.map((task: any) => {
      const extractedInfo = parseSlackMessage(task.summary || task.text || '');
      
      return {
        ...task,
        extractedInfo,
        // Create a better title based on extracted info
        title: extractedInfo?.taskType 
          ? `${extractedInfo.taskType}${extractedInfo.fileName ? ` - ${extractedInfo.fileName}` : ''}`
          : task.title,
        // Create a better summary
        summary: extractedInfo?.description 
          ? `${extractedInfo.description}${extractedInfo.deadline ? ` (Deadline: ${extractedInfo.deadline})` : ''}`
          : task.summary
      };
    });
    
    return parsedTasks || [];
  } catch (error) {
    console.error('Error fetching Slack tasks:', error);
    throw new Error(`Failed to fetch Slack tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Import Slack tasks as todos
 */
export async function importSlackTasks(
  channelId: string,
  onProgress?: (message: string) => void
): Promise<SlackImportResult> {
  const result: SlackImportResult = {
    success: false,
    importedCount: 0,
    errors: [],
    tasks: []
  };

  try {
    onProgress?.('Fetching tasks from Slack...');
    
    // Fetch tasks from Slack
    const slackTasks = await fetchSlackTasks(channelId);
    
    if (slackTasks.length === 0) {
      result.errors.push('No tasks found in the specified Slack channel');
      return result;
    }

    onProgress?.(`Found ${slackTasks.length} tasks. Importing...`);

    // Import each task
    for (let i = 0; i < slackTasks.length; i++) {
      const slackTask = slackTasks[i];
      
      try {
        onProgress?.(`Importing task ${i + 1}/${slackTasks.length}: ${slackTask.title}`);
        
        // Create todo from Slack task with parsed information
        const todo = await createTodo({
          title: slackTask.title,
          description: `Imported from Slack\n\n${slackTask.summary}\n\nSlack Channel: ${slackTask.slackChannelId}${slackTask.extractedInfo?.deadline ? `\nDeadline: ${slackTask.extractedInfo.deadline}` : ''}${slackTask.extractedInfo?.fileName ? `\nFile: ${slackTask.extractedInfo.fileName}` : ''}`
        });
        
        result.tasks.push(todo);
        result.importedCount++;
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        const errorMessage = `Failed to import task "${slackTask.title}": ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMessage);
        console.error(errorMessage, error);
      }
    }

    result.success = result.importedCount > 0;
    onProgress?.(`Import completed. ${result.importedCount} tasks imported successfully.`);
    
    return result;
    
  } catch (error) {
    const errorMessage = `Failed to import Slack tasks: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(errorMessage);
    console.error(errorMessage, error);
    return result;
  }
}

/**
 * Validate Slack channel ID format
 */
export function validateSlackChannelId(channelId: string): boolean {
  // Slack channel IDs typically start with 'C' for public channels or 'G' for private channels
  return /^[CG][A-Z0-9]{8,}$/.test(channelId);
}

/**
 * Extract channel ID from Slack URL
 */
export function extractChannelIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Handle different Slack URL formats
    if (urlObj.hostname.includes('slack.com')) {
      const pathParts = urlObj.pathname.split('/');
      const channelIndex = pathParts.findIndex(part => part === 'channels');
      
      if (channelIndex !== -1 && pathParts[channelIndex + 1]) {
        return pathParts[channelIndex + 1];
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Preview parsed tasks from Slack channel
 */
export async function previewSlackTasks(channelId: string): Promise<SlackTask[]> {
  try {
    const tasks = await fetchSlackTasks(channelId);
    // Filter out tasks that don't have extracted info (not task-related)
    return tasks.filter(task => task.extractedInfo !== null);
  } catch (error) {
    console.error('Error previewing Slack tasks:', error);
    throw new Error(`Failed to preview Slack tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Test function to demonstrate parsing (for development/testing)
 */
export function testSlackParsing() {
  const testMessages = [
    "coding assignment in file health deadline at 8",
    "project work on database.js deadline by tomorrow",
    "task: fix login bug in auth.ts",
    "todo: update documentation for API endpoints",
    "finish the user interface by Friday",
    "complete the payment integration work"
  ];

  console.log("Testing Slack message parsing:");
  testMessages.forEach((message, index) => {
    const parsed = parseSlackMessage(message);
    console.log(`${index + 1}. "${message}"`);
    console.log("   Parsed:", parsed);
    console.log("---");
  });
}
