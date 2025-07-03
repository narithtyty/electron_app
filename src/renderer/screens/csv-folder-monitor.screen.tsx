import { useState, useEffect } from 'react';
import { Button } from '../components/button';
import { safeIpcInvoke } from '../utils/electron';

interface CsvFileInfo {
  fileName: string;
  filePath: string;
  size: number;
  lastModified: Date;
  data?: any[];
  headers?: string[];
  error?: string;
}

interface FolderWatcherStatus {
  isWatching: boolean;
  folderPath: string;
  backupFolderPath: string;
  filesDetected: CsvFileInfo[];
  lastUpdate: Date;
  autoProcessing: boolean;
  processedCount: number;
  failedCount: number;
  isPaused: boolean;
}

interface WorkflowConfig {
  autoProcessing: boolean;
  processDelay: number;
  enableBackup: boolean;
  enableCleanup: boolean;
}

export function CsvFolderMonitorScreen() {
  const [watcherStatus, setWatcherStatus] = useState<FolderWatcherStatus | null>(null);
  const [workflowConfig, setWorkflowConfig] = useState<WorkflowConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<CsvFileInfo | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [processingResult, setProcessingResult] = useState<any>(null);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  // Fetch watcher status
  const fetchWatcherStatus = async () => {
    try {
      const status = await safeIpcInvoke('get-folder-watcher-status');
      setWatcherStatus(status);
      setError('');
    } catch (err) {
      console.error('Error fetching watcher status:', err);
      setError('Failed to fetch watcher status');
    }
  };

  // Fetch workflow configuration
  const fetchWorkflowConfig = async () => {
    try {
      const config = await safeIpcInvoke('get-workflow-config');
      setWorkflowConfig(config);
    } catch (err) {
      console.error('Error fetching workflow config:', err);
      setError('Failed to fetch workflow configuration');
    }
  };

  // Start folder watching
  const startWatching = async () => {
    try {
      setIsLoading(true);
      setError('');
      const status = await safeIpcInvoke('start-folder-watching');
      setWatcherStatus(status);
      console.log('Folder watching started:', status);
    } catch (err) {
      console.error('Error starting folder watcher:', err);
      setError('Failed to start folder watching');
    } finally {
      setIsLoading(false);
    }
  };

  // Stop folder watching
  const stopWatching = async () => {
    try {
      setIsLoading(true);
      setError('');
      const status = await safeIpcInvoke('stop-folder-watching');
      setWatcherStatus(status);
      console.log('Folder watching stopped:', status);
    } catch (err) {
      console.error('Error stopping folder watcher:', err);
      setError('Failed to stop folder watching');
    } finally {
      setIsLoading(false);
    }
  };

  // Get file details
  const getFileDetails = async (fileName: string) => {
    try {
      const fileData = await safeIpcInvoke('get-csv-file-data', fileName);
      setSelectedFile(fileData);
    } catch (err) {
      console.error('Error getting file details:', err);
      setError(`Failed to get details for ${fileName}`);
    }
  };

  // Open CSV folder in file explorer
  const openCsvFolder = async () => {
    try {
      await safeIpcInvoke('open-csv-folder');
    } catch (err) {
      console.error('Error opening CSV folder:', err);
      setError('Failed to open CSV folder');
    }
  };

  // Initialize CSV folder
  const initializeCsvFolder = async () => {
    try {
      const result = await safeIpcInvoke('initialize-csv-folder');
      console.log('CSV folder initialized:', result);
      fetchWatcherStatus(); // Refresh status after initialization
    } catch (err) {
      console.error('Error initializing CSV folder:', err);
      setError('Failed to initialize CSV folder');
    }
  };

  // Toggle auto-processing
  const toggleAutoProcessing = async () => {
    try {
      setIsLoading(true);
      const newState = !watcherStatus?.autoProcessing;
      await safeIpcInvoke('set-auto-processing', newState);
      fetchWatcherStatus();
      console.log(`Auto-processing ${newState ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Error toggling auto-processing:', err);
      setError('Failed to toggle auto-processing');
    } finally {
      setIsLoading(false);
    }
  };

  // Process all files manually
  const processAllFiles = async () => {
    try {
      setIsLoading(true);
      setError('');
      const result = await safeIpcInvoke('process-all-csv-files');
      setProcessingResult(result);
      fetchWatcherStatus(); // Refresh to see updated counts
      console.log('Manual processing completed:', result);
    } catch (err) {
      console.error('Error processing all files:', err);
      setError('Failed to process all files');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset processing counters
  const resetCounters = async () => {
    try {
      await safeIpcInvoke('reset-processing-counters');
      fetchWatcherStatus();
      setProcessingResult(null);
      console.log('Processing counters reset');
    } catch (err) {
      console.error('Error resetting counters:', err);
      setError('Failed to reset counters');
    }
  };

  // Update workflow configuration
  const updateWorkflowConfig = async (updates: Partial<WorkflowConfig>) => {
    try {
      await safeIpcInvoke('update-workflow-config', updates);
      fetchWorkflowConfig();
      fetchWatcherStatus();
      console.log('Workflow config updated:', updates);
    } catch (err) {
      console.error('Error updating workflow config:', err);
      setError('Failed to update workflow configuration');
    }
  };

  // Auto-start watching when component mounts
  useEffect(() => {
    const autoStartWatching = async () => {
      try {
        console.log('🚀 Auto-starting CSV folder monitoring...');
        await safeIpcInvoke('auto-start-watching');
        fetchWatcherStatus();
        fetchWorkflowConfig();
      } catch (err) {
        console.error('Error auto-starting folder watching:', err);
        // Fallback to manual status fetch
        fetchWatcherStatus();
        fetchWorkflowConfig();
      }
    };

    autoStartWatching();
  }, []); // Run once on mount

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchWatcherStatus();
        fetchWorkflowConfig();
      }, 3000); // Refresh every 3 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center mb-4">
        <h1 className="text-3xl font-bold text-center mb-2">
          CSV Folder Monitor
          {watcherStatus?.autoProcessing && !watcherStatus?.isPaused && (
            <span className="ml-2 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              ⚡ Auto-Processing Active
            </span>
          )}
          {watcherStatus?.autoProcessing && watcherStatus?.isPaused && (
            <span className="ml-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
              ⏸️ Paused (No Files)
            </span>
          )}
        </h1>
        <p className="text-gray-600 text-center">
          Automatically monitors and processes CSV files in desktop/simple_csv folder
        </p>
        {watcherStatus?.isWatching && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-600 font-medium">Monitoring Active</span>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Auto-Processing Status Banner */}
      {watcherStatus?.isWatching && watcherStatus?.autoProcessing && !watcherStatus?.isPaused && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <p className="text-green-800 font-medium">🔄 Auto-Processing Active</p>
              <p className="text-green-700 text-sm">
                Drop CSV files into the simple_csv folder - they will be automatically processed!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Paused Status Banner */}
      {watcherStatus?.isWatching && watcherStatus?.autoProcessing && watcherStatus?.isPaused && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div>
              <p className="text-yellow-800 font-medium">⏸️ Auto-Processing Paused</p>
              <p className="text-yellow-700 text-sm">
                No CSV files found in the simple_csv folder. Processing will resume automatically when files are added.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Control Panel</h2>
        
        <div className="flex flex-wrap gap-4 items-center">
          <Button
            onClick={startWatching}
            disabled={isLoading || (watcherStatus?.isWatching ?? false)}
            className="bg-green-500 hover:bg-green-600"
          >
            {isLoading ? 'Starting...' : 'Start Watching'}
          </Button>
          
          <Button
            onClick={stopWatching}
            disabled={isLoading || !(watcherStatus?.isWatching ?? false)}
            variant="secondary"
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {isLoading ? 'Stopping...' : 'Stop Watching'}
          </Button>
          
          <Button
            onClick={fetchWatcherStatus}
            disabled={isLoading}
            variant="secondary"
          >
            Refresh Status
          </Button>

          <Button
            onClick={openCsvFolder}
            disabled={isLoading}
            variant="secondary"
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Open Folder
          </Button>

          <Button
            onClick={initializeCsvFolder}
            disabled={isLoading}
            variant="secondary"
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            Initialize Folder
          </Button>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Auto-refresh</span>
          </label>
        </div>
      </div>

      {/* Workflow Controls */}
      {workflowConfig && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Workflow Configuration</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={workflowConfig.autoProcessing}
                    onChange={(e) => updateWorkflowConfig({ autoProcessing: e.target.checked })}
                    className="rounded"
                  />
                  <span className="font-medium">Auto-Processing</span>
                </label>
                <span className={`px-2 py-1 rounded text-xs ${workflowConfig.autoProcessing ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {workflowConfig.autoProcessing ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={workflowConfig.enableBackup}
                    onChange={(e) => updateWorkflowConfig({ enableBackup: e.target.checked })}
                    className="rounded"
                  />
                  <span className="font-medium">Create Backups</span>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={workflowConfig.enableCleanup}
                    onChange={(e) => updateWorkflowConfig({ enableCleanup: e.target.checked })}
                    className="rounded"
                  />
                  <span className="font-medium">Delete After Processing</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Processing Delay (seconds)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={workflowConfig.processDelay / 1000}
                  onChange={(e) => updateWorkflowConfig({ processDelay: parseInt(e.target.value) * 1000 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">Workflow Steps:</h3>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Detect new CSV file</li>
                  <li>Read and log file data</li>
                  <li className={workflowConfig.enableBackup ? 'text-green-600' : 'text-gray-400'}>
                    {workflowConfig.enableBackup ? '✓' : '✗'} Create backup copy
                  </li>
                  <li className={workflowConfig.enableCleanup ? 'text-green-600' : 'text-gray-400'}>
                    {workflowConfig.enableCleanup ? '✓' : '✗'} Delete original file
                  </li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={processAllFiles}
                  disabled={isLoading}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isLoading ? 'Processing...' : 'Process All Files'}
                </Button>

                <Button
                  onClick={resetCounters}
                  disabled={isLoading}
                  variant="secondary"
                  className="text-xs"
                >
                  Reset Counters
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Result */}
      {processingResult && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Processing Result</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm text-blue-600">Total Files</p>
              <p className="text-2xl font-bold text-blue-800">{processingResult.totalFiles}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-md">
              <p className="text-sm text-green-600">Processed</p>
              <p className="text-2xl font-bold text-green-800">{processingResult.processed.length}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-sm text-red-600">Failed</p>
              <p className="text-2xl font-bold text-red-800">{processingResult.failed.length}</p>
            </div>
          </div>

          {processingResult.processed.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Successfully Processed:</p>
              <div className="flex flex-wrap gap-2">
                {processingResult.processed.map((fileName: string, index: number) => (
                  <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                    {fileName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {processingResult.failed.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Failed to Process:</p>
              <div className="flex flex-wrap gap-2">
                {processingResult.failed.map((fileName: string, index: number) => (
                  <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                    {fileName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Display */}
      {watcherStatus && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Watcher Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className={`font-semibold ${watcherStatus.isWatching ? 'text-green-600' : 'text-red-600'}`}>
                {watcherStatus.isWatching ? 'Watching' : 'Not Watching'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Auto-Processing</p>
              <p className={`font-semibold ${
                watcherStatus.autoProcessing && !watcherStatus.isPaused
                  ? 'text-green-600'
                  : watcherStatus.autoProcessing && watcherStatus.isPaused
                    ? 'text-yellow-600'
                    : 'text-gray-600'
              }`}>
                {watcherStatus.autoProcessing
                  ? (watcherStatus.isPaused ? 'Paused (No Files)' : 'Active')
                  : 'Disabled'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Files Detected</p>
              <p className="font-semibold">{watcherStatus.filesDetected.length}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Processed Count</p>
              <p className="font-semibold text-green-600">{watcherStatus.processedCount}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Failed Count</p>
              <p className="font-semibold text-red-600">{watcherStatus.failedCount}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Last Update</p>
              <p className="text-sm">{formatDate(watcherStatus.lastUpdate)}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div>
              <p className="text-sm text-gray-600">CSV Folder Path</p>
              <p className="font-mono text-xs break-all bg-gray-50 p-2 rounded">{watcherStatus.folderPath}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Backup Folder Path</p>
              <p className="font-mono text-xs break-all bg-gray-50 p-2 rounded">{watcherStatus.backupFolderPath}</p>
            </div>
          </div>
        </div>
      )}

      {/* Files List */}
      {watcherStatus && watcherStatus.filesDetected.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Detected CSV Files</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">File Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Size</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Last Modified</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Rows</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {watcherStatus.filesDetected.map((file, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-mono text-sm">
                      {file.fileName}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      {formatDate(file.lastModified)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {file.data?.length || 0}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {file.error ? (
                        <span className="text-red-600 text-sm">Error</span>
                      ) : (
                        <span className="text-green-600 text-sm">OK</span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Button
                        onClick={() => getFileDetails(file.fileName)}
                        variant="secondary"
                        className="text-xs px-2 py-1"
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* File Details Modal */}
      {selectedFile && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">File Details: {selectedFile.fileName}</h2>
            <Button
              onClick={() => setSelectedFile(null)}
              variant="secondary"
              className="text-xs"
            >
              Close
            </Button>
          </div>
          
          {selectedFile.error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-700">{selectedFile.error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Headers ({selectedFile.headers?.length || 0})</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedFile.headers?.map((header, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                    >
                      {header}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Data Preview (first 5 rows)</p>
                {selectedFile.data && selectedFile.data.length > 0 && (
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          {selectedFile.headers?.map((header, index) => (
                            <th key={index} className="border border-gray-300 px-2 py-1 text-left">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedFile.data.slice(0, 5).map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-gray-50">
                            {selectedFile.headers?.map((header, colIndex) => (
                              <td key={colIndex} className="border border-gray-300 px-2 py-1">
                                {String(row[header] || '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">How to Use the Enhanced Workflow</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Basic Setup:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click "Start Watching" to begin monitoring</li>
              <li>Configure workflow settings as needed</li>
              <li>Enable "Auto-Processing" for automatic workflow</li>
              <li>Drop CSV files into the simple_csv folder</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Automatic Workflow:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>📁 File detected in simple_csv folder</li>
              <li>📖 File content read and logged to console</li>
              <li>💾 File backed up to simple_csv_bk folder</li>
              <li>🗑️ Original file deleted (if cleanup enabled)</li>
            </ol>
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="font-semibold text-yellow-800 mb-2">💡 Pro Tips:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
            <li>Check the browser console (F12) to see detailed file processing logs</li>
            <li>Use "Process All Files" to manually process existing files</li>
            <li>Disable cleanup to keep original files while still creating backups</li>
            <li>Adjust processing delay to avoid conflicts with file operations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
