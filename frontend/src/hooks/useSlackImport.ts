import { useState, useCallback } from 'react';
import { importSlackTasks, type SlackImportResult } from '../lib/slack';
import { type Todo } from '../lib/todos';

interface UseSlackImportReturn {
  isImporting: boolean;
  progress: string;
  result: SlackImportResult | null;
  importTasks: (channelId: string) => Promise<SlackImportResult>;
  reset: () => void;
}

export function useSlackImport(): UseSlackImportReturn {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<SlackImportResult | null>(null);

  const importTasks = useCallback(async (channelId: string): Promise<SlackImportResult> => {
    setIsImporting(true);
    setProgress('');
    setResult(null);

    try {
      const importResult = await importSlackTasks(channelId, setProgress);
      setResult(importResult);
      return importResult;
    } catch (error) {
      const errorResult: SlackImportResult = {
        success: false,
        importedCount: 0,
        errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        tasks: []
      };
      setResult(errorResult);
      return errorResult;
    } finally {
      setIsImporting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsImporting(false);
    setProgress('');
    setResult(null);
  }, []);

  return {
    isImporting,
    progress,
    result,
    importTasks,
    reset
  };
}
