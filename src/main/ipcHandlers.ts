import axios from 'axios';
import { ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { watch } from 'chokidar';
import Papa from 'papaparse';
import {
  getSimpleCsvFolderPath,
  getSimpleCsvBackupFolderPath,
  ensureFolderExists,
  listCsvFiles,
  readFileContent,
  processAllCsvFiles,
  copyFileToBackup,
  deleteFile
} from './fileSystemUtils';

interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

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
  isPaused: boolean; // True when no files in folder and processing is paused
}

interface WorkflowConfig {
  autoProcessing: boolean;
  processDelay: number; // milliseconds to wait before processing new files
  enableBackup: boolean;
  enableCleanup: boolean;
}

// Global variables for folder watching
let folderWatcher: any = null;
let periodicChecker: NodeJS.Timeout | null = null;
let lastEmptyFolderLog: number = 0; // Track when we last logged empty folder message
let workflowConfig: WorkflowConfig = {
  autoProcessing: true,  // Enable auto-processing by default
  processDelay: 2000, // 2 seconds delay
  enableBackup: true,
  enableCleanup: true
};

let watcherStatus: FolderWatcherStatus = {
  isWatching: false,
  folderPath: '',
  backupFolderPath: '',
  filesDetected: [],
  lastUpdate: new Date(),
  autoProcessing: false,
  processedCount: 0,
  failedCount: 0,
  isPaused: false
};



// Periodic checker function to scan for new CSV files
async function checkForNewFiles(): Promise<void> {
  if (!workflowConfig.autoProcessing || !watcherStatus.isWatching) {
    return;
  }

  try {
    const csvFolderPath = getSimpleCsvFolderPath();
    const currentFiles = fs.readdirSync(csvFolderPath)
      .filter(file => file.toLowerCase().endsWith('.csv'))
      .map(file => path.join(csvFolderPath, file));

    // If no CSV files found, log status and skip processing
    if (currentFiles.length === 0) {
      // Only log this message occasionally to avoid spam
      const now = Date.now();
      if (!lastEmptyFolderLog || now - lastEmptyFolderLog > 30000) { // Log every 30 seconds
        console.log(`📂 Folder check: No CSV files found in ${csvFolderPath} - auto-processing paused`);
        lastEmptyFolderLog = now;
      }

      // Clear detected files list if folder is empty
      if (watcherStatus.filesDetected.length > 0) {
        console.log(`🧹 Clearing detected files list - folder is empty`);
        watcherStatus.filesDetected = [];
        watcherStatus.lastUpdate = new Date();
      }

      // Set paused status
      if (!watcherStatus.isPaused) {
        watcherStatus.isPaused = true;
        watcherStatus.lastUpdate = new Date();
      }

      return; // Stop processing when no files
    }

    // Reset the empty log timer when files are found
    if (lastEmptyFolderLog) {
      console.log(`📁 CSV files detected - resuming auto-processing`);
      lastEmptyFolderLog = 0;
    }

    // Resume processing if it was paused
    if (watcherStatus.isPaused) {
      console.log(`▶️ Resuming auto-processing - files detected`);
      watcherStatus.isPaused = false;
      watcherStatus.lastUpdate = new Date();
    }

    for (const filePath of currentFiles) {
      // Check if this file is already in our detected files list
      const fileName = path.basename(filePath);
      const alreadyDetected = watcherStatus.filesDetected.some(f => f.fileName === fileName);

      if (!alreadyDetected) {
        console.log(`🔍 Periodic check found new CSV file: ${fileName}`);

        // Add to detected files list
        const fileInfo = await processCsvFile(filePath);
        watcherStatus.filesDetected.push(fileInfo);
        watcherStatus.lastUpdate = new Date();

        console.log(`📊 Added to detected files: ${fileInfo.fileName}, rows: ${fileInfo.data?.length || 0}`);

        // Auto-process the file
        console.log(`⚡ Auto-processing new file: ${fileInfo.fileName}`);
        setTimeout(async () => {
          try {
            await processFileWorkflow(filePath);
          } catch (error) {
            console.error(`❌ Auto-processing failed for ${fileInfo.fileName}:`, error);
            watcherStatus.failedCount++;
          }
        }, workflowConfig.processDelay);
      }
    }
  } catch (error) {
    console.error('Error in periodic file check:', error);
  }
}

// Start periodic checking
function startPeriodicChecker(): void {
  if (periodicChecker) {
    clearInterval(periodicChecker);
  }

  // Check every 5 seconds for new files
  periodicChecker = setInterval(checkForNewFiles, 5000);
  console.log('📅 Started periodic file checker (every 5 seconds)');
}

// Stop periodic checking
function stopPeriodicChecker(): void {
  if (periodicChecker) {
    clearInterval(periodicChecker);
    periodicChecker = null;
    console.log('📅 Stopped periodic file checker');
  }
}

// Workflow function to process a single file (read, backup, delete)
async function processFileWorkflow(filePath: string): Promise<void> {
  const fileName = path.basename(filePath);
  console.log(`\n🔄 Starting workflow for: ${fileName}`);

  try {
    // Step 1: Read and log file data
    console.log(`📖 Step 1: Reading file data...`);
    const content = readFileContent(filePath);
    if (!content) {
      throw new Error('Failed to read file content');
    }

    // Log file information
    const stats = fs.statSync(filePath);
    console.log(`📄 File: ${fileName}`);
    console.log(`📊 Size: ${stats.size} bytes`);
    console.log(`📅 Modified: ${stats.mtime.toISOString()}`);
    console.log(`📝 Content preview (first 300 chars):`);
    console.log(content.substring(0, 300) + (content.length > 300 ? '...' : ''));
    console.log('---');

    // Parse CSV data and log it
    const csvData = await new Promise<any[]>((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
            return;
          }
          resolve(results.data as any[]);
        },
        error: (error: any) => {
          reject(new Error(`Error parsing CSV: ${error.message}`));
        }
      });
    });

    console.log(`📊 CSV Data (${csvData.length} rows):`);
    console.log(JSON.stringify(csvData, null, 2));

    // Step 2: Create backup if enabled
    if (workflowConfig.enableBackup) {
      console.log(`💾 Step 2: Creating backup...`);
      const backupPath = copyFileToBackup(filePath, watcherStatus.backupFolderPath);
      if (!backupPath) {
        throw new Error('Failed to create backup');
      }
      console.log(`✅ Backup created: ${backupPath}`);
    } else {
      console.log(`⏭️  Step 2: Backup disabled, skipping...`);
    }

    // Step 3: Delete original file if cleanup is enabled
    if (workflowConfig.enableCleanup) {
      console.log(`🗑️  Step 3: Deleting original file...`);
      const deleted = deleteFile(filePath);
      if (!deleted) {
        throw new Error('Failed to delete original file');
      }
      console.log(`✅ Original file deleted: ${fileName}`);

      // Remove from detected files list
      watcherStatus.filesDetected = watcherStatus.filesDetected.filter(f => f.filePath !== filePath);
    } else {
      console.log(`⏭️  Step 3: Cleanup disabled, keeping original file...`);
    }

    watcherStatus.processedCount++;
    watcherStatus.lastUpdate = new Date();
    console.log(`🎉 Workflow completed successfully for: ${fileName}`);

  } catch (error) {
    console.error(`❌ Workflow failed for ${fileName}:`, error);
    watcherStatus.failedCount++;
    throw error;
  }
}

// Utility function to process CSV file
async function processCsvFile(filePath: string): Promise<CsvFileInfo> {
  const fileName = path.basename(filePath);
  const stats = fs.statSync(filePath);

  const fileInfo: CsvFileInfo = {
    fileName,
    filePath,
    size: stats.size,
    lastModified: stats.mtime
  };

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    return new Promise((resolve) => {
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            fileInfo.error = `CSV parsing error: ${results.errors[0].message}`;
          } else {
            const data = results.data as any[];
            if (data.length > 0) {
              fileInfo.headers = Object.keys(data[0]);
              fileInfo.data = data;
            } else {
              fileInfo.error = 'No data found in CSV file';
            }
          }
          resolve(fileInfo);
        },
        error: (error: any) => {
          fileInfo.error = `Error reading file: ${error.message}`;
          resolve(fileInfo);
        }
      });
    });
  } catch (error) {
    fileInfo.error = `File read error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    return fileInfo;
  }
}

export function setupIpcHandlers() {
  console.log('Setting up IPC handlers...');

  ipcMain.handle('fetch-data', async () => {
    try {
      console.log('fetch-data handler called');
      const response = await axios.get<Todo[]>('https://jsonplaceholder.typicode.com/todos');
      console.log('API response received, data length:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Error fetching todos:', error);
      throw error;
    }
  });

  // Start folder watching
  ipcMain.handle('start-folder-watching', async () => {
    try {
      console.log('start-folder-watching handler called');

      if (folderWatcher) {
        console.log('Folder watcher already running');
        return watcherStatus;
      }

      const csvFolderPath = getSimpleCsvFolderPath();
      const backupFolderPath = getSimpleCsvBackupFolderPath();
      ensureFolderExists(csvFolderPath);
      ensureFolderExists(backupFolderPath);

      watcherStatus = {
        isWatching: true,
        folderPath: csvFolderPath,
        backupFolderPath: backupFolderPath,
        filesDetected: [],
        lastUpdate: new Date(),
        autoProcessing: workflowConfig.autoProcessing,
        processedCount: 0,
        failedCount: 0,
        isPaused: false
      };

      // Scan existing files
      const existingFiles = fs.readdirSync(csvFolderPath)
        .filter(file => file.toLowerCase().endsWith('.csv'))
        .map(file => path.join(csvFolderPath, file));

      console.log(`📁 Found ${existingFiles.length} existing CSV files in folder`);

      for (const filePath of existingFiles) {
        const fileInfo = await processCsvFile(filePath);
        watcherStatus.filesDetected.push(fileInfo);

        // Auto-process existing files if auto-processing is enabled
        if (workflowConfig.autoProcessing) {
          console.log(`⚡ Auto-processing existing file: ${fileInfo.fileName}`);

          // Add a small delay to avoid overwhelming the system
          setTimeout(async () => {
            try {
              await processFileWorkflow(filePath);
            } catch (error) {
              console.error(`❌ Auto-processing failed for existing file ${fileInfo.fileName}:`, error);
              watcherStatus.failedCount++;
            }
          }, 1000 + (watcherStatus.filesDetected.length * 500)); // Stagger processing
        }
      }

      // Start watching for new files
      folderWatcher = watch(csvFolderPath, {
        ignored: /[\/\\]\./,
        persistent: true,
        ignoreInitial: true
      });

      folderWatcher.on('add', async (filePath: string) => {
        if (filePath.toLowerCase().endsWith('.csv')) {
          console.log(`🔍 New CSV file detected: ${filePath}`);
          const fileInfo = await processCsvFile(filePath);
          watcherStatus.filesDetected.push(fileInfo);
          watcherStatus.lastUpdate = new Date();

          console.log(`📊 Processed CSV file: ${fileInfo.fileName}, rows: ${fileInfo.data?.length || 0}`);

          // Auto-processing workflow
          if (workflowConfig.autoProcessing) {
            console.log(`⚡ Auto-processing enabled, starting workflow for: ${fileInfo.fileName}`);

            // Add delay before processing
            setTimeout(async () => {
              try {
                await processFileWorkflow(filePath);
              } catch (error) {
                console.error(`❌ Auto-processing failed for ${fileInfo.fileName}:`, error);
                watcherStatus.failedCount++;
              }
            }, workflowConfig.processDelay);
          }
        }
      });

      folderWatcher.on('change', async (filePath: string) => {
        if (filePath.toLowerCase().endsWith('.csv')) {
          console.log(`CSV file changed: ${filePath}`);
          // Update existing file info
          const existingIndex = watcherStatus.filesDetected.findIndex(f => f.filePath === filePath);
          if (existingIndex !== -1) {
            const fileInfo = await processCsvFile(filePath);
            watcherStatus.filesDetected[existingIndex] = fileInfo;
            watcherStatus.lastUpdate = new Date();
          }
        }
      });

      folderWatcher.on('unlink', (filePath: string) => {
        if (filePath.toLowerCase().endsWith('.csv')) {
          console.log(`CSV file removed: ${filePath}`);
          watcherStatus.filesDetected = watcherStatus.filesDetected.filter(f => f.filePath !== filePath);
          watcherStatus.lastUpdate = new Date();
        }
      });

      folderWatcher.on('error', (error: Error) => {
        console.error('Folder watcher error:', error);
      });

      // Start periodic checker as backup
      startPeriodicChecker();

      console.log(`Started watching folder: ${csvFolderPath}`);
      return watcherStatus;
    } catch (error) {
      console.error('Error starting folder watcher:', error);
      throw error;
    }
  });

  // Stop folder watching
  ipcMain.handle('stop-folder-watching', async () => {
    try {
      console.log('stop-folder-watching handler called');

      if (folderWatcher) {
        await folderWatcher.close();
        folderWatcher = null;
      }

      // Stop periodic checker
      stopPeriodicChecker();

      watcherStatus.isWatching = false;
      watcherStatus.lastUpdate = new Date();

      console.log('Stopped folder watching');
      return watcherStatus;
    } catch (error) {
      console.error('Error stopping folder watcher:', error);
      throw error;
    }
  });

  // Get folder watcher status
  ipcMain.handle('get-folder-watcher-status', async () => {
    return watcherStatus;
  });

  // Get CSV file data
  ipcMain.handle('get-csv-file-data', async (_event, fileName: string) => {
    try {
      const fileInfo = watcherStatus.filesDetected.find(f => f.fileName === fileName);
      if (!fileInfo) {
        throw new Error(`File not found: ${fileName}`);
      }
      return fileInfo;
    } catch (error) {
      console.error('Error getting CSV file data:', error);
      throw error;
    }
  });

  // Initialize CSV folder
  ipcMain.handle('initialize-csv-folder', async () => {
    try {
      const csvFolderPath = getSimpleCsvFolderPath();
      const success = ensureFolderExists(csvFolderPath);

      if (success) {
        // List existing CSV files
        const existingFiles = listCsvFiles(csvFolderPath);
        console.log(`CSV folder initialized at: ${csvFolderPath}`);
        console.log(`Found ${existingFiles.length} existing CSV files`);

        return {
          success: true,
          folderPath: csvFolderPath,
          existingFiles: existingFiles.length
        };
      } else {
        throw new Error('Failed to create CSV folder');
      }
    } catch (error) {
      console.error('Error initializing CSV folder:', error);
      throw error;
    }
  });

  // Open CSV folder in file explorer
  ipcMain.handle('open-csv-folder', async () => {
    try {
      const csvFolderPath = getSimpleCsvFolderPath();
      ensureFolderExists(csvFolderPath);

      // Use shell to open folder
      const { shell } = require('electron');
      await shell.openPath(csvFolderPath);

      return { success: true, folderPath: csvFolderPath };
    } catch (error) {
      console.error('Error opening CSV folder:', error);
      throw error;
    }
  });

  // Process CSV file from path (for integration with existing upload functionality)
  ipcMain.handle('process-csv-from-path', async (_event, filePath: string) => {
    try {
      const fileContent = readFileContent(filePath);
      if (!fileContent) {
        throw new Error('Failed to read file content');
      }

      return new Promise((resolve, reject) => {
        Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
              return;
            }

            const data = results.data as any[];
            if (data.length > 0) {
              resolve({
                data,
                headers: Object.keys(data[0]),
                rowCount: data.length,
                fileName: path.basename(filePath)
              });
            } else {
              reject(new Error('No data found in CSV file'));
            }
          },
          error: (error: any) => {
            reject(new Error(`Error reading file: ${error.message}`));
          }
        });
      });
    } catch (error) {
      console.error('Error processing CSV from path:', error);
      throw error;
    }
  });

  // Enable/disable auto-processing workflow
  ipcMain.handle('set-auto-processing', async (_event, enabled: boolean) => {
    try {
      workflowConfig.autoProcessing = enabled;
      watcherStatus.autoProcessing = enabled;
      watcherStatus.lastUpdate = new Date();

      console.log(`Auto-processing ${enabled ? 'enabled' : 'disabled'}`);
      return { success: true, autoProcessing: enabled };
    } catch (error) {
      console.error('Error setting auto-processing:', error);
      throw error;
    }
  });

  // Get workflow configuration
  ipcMain.handle('get-workflow-config', async () => {
    return workflowConfig;
  });

  // Update workflow configuration
  ipcMain.handle('update-workflow-config', async (_event, config: Partial<WorkflowConfig>) => {
    try {
      workflowConfig = { ...workflowConfig, ...config };
      watcherStatus.autoProcessing = workflowConfig.autoProcessing;
      watcherStatus.lastUpdate = new Date();

      console.log('Workflow config updated:', workflowConfig);
      return { success: true, config: workflowConfig };
    } catch (error) {
      console.error('Error updating workflow config:', error);
      throw error;
    }
  });

  // Manually process all files in folder
  ipcMain.handle('process-all-csv-files', async () => {
    try {
      console.log('🚀 Manual processing of all CSV files requested');
      const csvFolderPath = getSimpleCsvFolderPath();
      const backupFolderPath = getSimpleCsvBackupFolderPath();

      const result = processAllCsvFiles(csvFolderPath, backupFolderPath);

      watcherStatus.processedCount += result.processed.length;
      watcherStatus.failedCount += result.failed.length;
      watcherStatus.filesDetected = watcherStatus.filesDetected.filter(
        f => !result.processed.includes(f.fileName)
      );
      watcherStatus.lastUpdate = new Date();

      return {
        success: true,
        ...result,
        totalProcessed: watcherStatus.processedCount,
        totalFailed: watcherStatus.failedCount
      };
    } catch (error) {
      console.error('Error processing all CSV files:', error);
      throw error;
    }
  });

  // Reset processing counters
  ipcMain.handle('reset-processing-counters', async () => {
    try {
      watcherStatus.processedCount = 0;
      watcherStatus.failedCount = 0;
      watcherStatus.lastUpdate = new Date();

      console.log('Processing counters reset');
      return { success: true };
    } catch (error) {
      console.error('Error resetting counters:', error);
      throw error;
    }
  });

  // Auto-start folder watching (called when renderer is ready)
  ipcMain.handle('auto-start-watching', async () => {
    try {
      console.log('🚀 Auto-starting folder watching...');

      if (folderWatcher) {
        console.log('Folder watcher already running');
        return watcherStatus;
      }

      const csvFolderPath = getSimpleCsvFolderPath();
      const backupFolderPath = getSimpleCsvBackupFolderPath();
      ensureFolderExists(csvFolderPath);
      ensureFolderExists(backupFolderPath);

      watcherStatus = {
        isWatching: true,
        folderPath: csvFolderPath,
        backupFolderPath: backupFolderPath,
        filesDetected: [],
        lastUpdate: new Date(),
        autoProcessing: workflowConfig.autoProcessing,
        processedCount: 0,
        failedCount: 0,
        isPaused: false
      };

      // Scan and auto-process existing files
      const existingFiles = fs.readdirSync(csvFolderPath)
        .filter(file => file.toLowerCase().endsWith('.csv'))
        .map(file => path.join(csvFolderPath, file));

      console.log(`📁 Auto-start: Found ${existingFiles.length} existing CSV files`);

      for (const filePath of existingFiles) {
        const fileInfo = await processCsvFile(filePath);
        watcherStatus.filesDetected.push(fileInfo);

        // Auto-process existing files immediately
        if (workflowConfig.autoProcessing) {
          console.log(`⚡ Auto-processing existing file: ${fileInfo.fileName}`);

          // Process with staggered delay
          setTimeout(async () => {
            try {
              await processFileWorkflow(filePath);
            } catch (error) {
              console.error(`❌ Auto-processing failed for ${fileInfo.fileName}:`, error);
              watcherStatus.failedCount++;
            }
          }, 1000 + (watcherStatus.filesDetected.length * 500));
        }
      }

      // Start watching for new files
      folderWatcher = watch(csvFolderPath, {
        ignored: /[\/\\]\./,
        persistent: true,
        ignoreInitial: true
      });

      folderWatcher.on('add', async (filePath: string) => {
        if (filePath.toLowerCase().endsWith('.csv')) {
          console.log(`🔍 New CSV file detected: ${filePath}`);
          const fileInfo = await processCsvFile(filePath);
          watcherStatus.filesDetected.push(fileInfo);
          watcherStatus.lastUpdate = new Date();

          console.log(`📊 Processed CSV file: ${fileInfo.fileName}, rows: ${fileInfo.data?.length || 0}`);

          // Auto-processing workflow
          if (workflowConfig.autoProcessing) {
            console.log(`⚡ Auto-processing enabled, starting workflow for: ${fileInfo.fileName}`);

            setTimeout(async () => {
              try {
                await processFileWorkflow(filePath);
              } catch (error) {
                console.error(`❌ Auto-processing failed for ${fileInfo.fileName}:`, error);
                watcherStatus.failedCount++;
              }
            }, workflowConfig.processDelay);
          }
        }
      });

      folderWatcher.on('change', async (filePath: string) => {
        if (filePath.toLowerCase().endsWith('.csv')) {
          console.log(`📝 CSV file changed: ${filePath}`);
          const existingIndex = watcherStatus.filesDetected.findIndex(f => f.filePath === filePath);
          if (existingIndex !== -1) {
            const fileInfo = await processCsvFile(filePath);
            watcherStatus.filesDetected[existingIndex] = fileInfo;
            watcherStatus.lastUpdate = new Date();
          }
        }
      });

      folderWatcher.on('unlink', (filePath: string) => {
        if (filePath.toLowerCase().endsWith('.csv')) {
          console.log(`🗑️ CSV file removed: ${filePath}`);
          watcherStatus.filesDetected = watcherStatus.filesDetected.filter(f => f.filePath !== filePath);
          watcherStatus.lastUpdate = new Date();
        }
      });

      folderWatcher.on('error', (error: Error) => {
        console.error('Folder watcher error:', error);
      });

      // Start periodic checker as backup
      startPeriodicChecker();

      console.log(`✅ Auto-started watching folder: ${csvFolderPath}`);
      console.log(`🔄 Auto-processing: ${workflowConfig.autoProcessing ? 'ENABLED' : 'DISABLED'}`);
      console.log(`📅 Periodic checker: ENABLED (every 5 seconds)`);

      return watcherStatus;
    } catch (error) {
      console.error('Error auto-starting folder watcher:', error);
      throw error;
    }
  });

  console.log('IPC handlers setup complete');
}