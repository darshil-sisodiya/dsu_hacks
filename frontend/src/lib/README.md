# Slack Integration

This directory contains the Slack integration functionality for importing tasks from Slack channels.

## Files

### `slack.ts`
Main Slack service module containing:
- `fetchSlackTasks()` - Fetches tasks from a Slack channel
- `importSlackTasks()` - Imports Slack tasks as todos
- `previewSlackTasks()` - Preview parsed tasks before importing
- `parseSlackMessage()` - Parses Slack messages to extract task information
- `validateSlackChannelId()` - Validates Slack channel ID format
- `extractChannelIdFromUrl()` - Extracts channel ID from Slack URLs
- `testSlackParsing()` - Test function for development

### `../components/SlackImport.tsx`
React component for the Slack import UI:
- Modal dialog for entering channel ID
- Progress tracking during import
- Error handling and result display
- URL paste support for easy channel ID extraction

### `../hooks/useSlackImport.ts`
Custom React hook for managing Slack import state:
- Import progress tracking
- Result management
- Error handling
- Reset functionality

## Usage

### Basic Import
```tsx
import SlackImport from '../components/SlackImport';

function MyComponent() {
  const handleImportComplete = (result) => {
    if (result.success) {
      console.log(`Imported ${result.importedCount} tasks`);
    }
  };

  return <SlackImport onImportComplete={handleImportComplete} />;
}
```

### Using the Hook
```tsx
import { useSlackImport } from '../hooks/useSlackImport';

function MyComponent() {
  const { isImporting, progress, result, importTasks, reset } = useSlackImport();

  const handleImport = async () => {
    const result = await importTasks('C1234567890');
    // Handle result...
  };

  return (
    <div>
      {isImporting && <div>Importing... {progress}</div>}
      {result && <div>Imported {result.importedCount} tasks</div>}
      <button onClick={handleImport}>Import from Slack</button>
    </div>
  );
}
```

## Backend Requirements

The Slack integration requires the backend to have:
1. Slack bot token configured (`SLACK_BOT_TOKEN` environment variable)
2. `/api/slack/tasks` endpoint that accepts a `channel` query parameter
3. Proper CORS configuration for frontend requests

## Channel ID Formats

Slack channel IDs follow these patterns:
- Public channels: `C` followed by 8+ alphanumeric characters
- Private channels: `G` followed by 8+ alphanumeric characters
- Direct messages: `D` followed by 8+ alphanumeric characters

## Message Parsing

The integration automatically parses Slack messages to extract task information:

### Supported Keywords
- **Task Types**: `task`, `assignment`, `project`, `work`, `todo`, `deadline`, `finish`, `complete`
- **File References**: `in file`, `file:`, `for file`
- **Deadline Indicators**: `deadline at`, `deadline by`, `deadline on`

### Example Parsing
```
Input: "coding assignment in file health deadline at 8"
Output:
- Task Type: "assignment"
- File: "health"
- Deadline: "8"
- Description: "coding assignment"
```

### Preview Feature
Before importing, users can preview parsed tasks to see:
- Extracted task titles
- File references
- Deadline information
- Full message summaries

## Error Handling

The integration handles various error scenarios:
- Invalid channel IDs
- Network failures
- Backend API errors
- Empty channel results
- Individual task import failures
- Message parsing errors

All errors are collected and displayed to the user with appropriate messaging.
