import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Utility functions for file system operations in the main process
 */

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  lastModified: Date;
  isDirectory: boolean;
  extension: string;
}

/**
 * Get the user's desktop path
 */
export function getDesktopPath(): string {
  return path.join(os.homedir(), 'Desktop');
}

/**
 * Get the simple_csv folder path on desktop
 */
export function getSimpleCsvFolderPath(): string {
  return path.join(getDesktopPath(), 'simple_csv');
}

/**
 * Get the simple_csv_bk backup folder path on desktop
 */
export function getSimpleCsvBackupFolderPath(): string {
  return path.join(getDesktopPath(), 'simple_csv_bk');
}

/**
 * Ensure a folder exists, create it if it doesn't
 */
export function ensureFolderExists(folderPath: string): boolean {
  try {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Created folder: ${folderPath}`);
      return true;
    }
    return true;
  } catch (error) {
    console.error(`Error creating folder ${folderPath}:`, error);
    return false;
  }
}

/**
 * Check if a path exists
 */
export function pathExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.error(`Error checking path ${filePath}:`, error);
    return false;
  }
}

/**
 * Get file information
 */
export function getFileInfo(filePath: string): FileInfo | null {
  try {
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    const extension = path.extname(filePath).toLowerCase();
    
    return {
      name: fileName,
      path: filePath,
      size: stats.size,
      lastModified: stats.mtime,
      isDirectory: stats.isDirectory(),
      extension
    };
  } catch (error) {
    console.error(`Error getting file info for ${filePath}:`, error);
    return null;
  }
}

/**
 * List all CSV files in a directory
 */
export function listCsvFiles(directoryPath: string): FileInfo[] {
  try {
    if (!fs.existsSync(directoryPath)) {
      return [];
    }

    const files = fs.readdirSync(directoryPath);
    const csvFiles: FileInfo[] = [];

    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const fileInfo = getFileInfo(filePath);
      
      if (fileInfo && !fileInfo.isDirectory && fileInfo.extension === '.csv') {
        csvFiles.push(fileInfo);
      }
    }

    return csvFiles.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  } catch (error) {
    console.error(`Error listing CSV files in ${directoryPath}:`, error);
    return [];
  }
}

/**
 * Read file content as string
 */
export function readFileContent(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

/**
 * Write content to file
 */
export function writeFileContent(filePath: string, content: string): boolean {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    return false;
  }
}

/**
 * Delete a file
 */
export function deleteFile(filePath: string): boolean {
  try {
    fs.unlinkSync(filePath);
    console.log(`Deleted file: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
    return false;
  }
}

/**
 * Get folder size in bytes
 */
export function getFolderSize(folderPath: string): number {
  try {
    let totalSize = 0;
    const files = fs.readdirSync(folderPath);
    
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        totalSize += getFolderSize(filePath);
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error(`Error calculating folder size for ${folderPath}:`, error);
    return 0;
  }
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Create a backup of a file
 */
export function createFileBackup(filePath: string): string | null {
  try {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`Created backup: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error(`Error creating backup for ${filePath}:`, error);
    return null;
  }
}

/**
 * Move file to backup folder with timestamp
 */
export function moveFileToBackup(filePath: string, backupFolderPath: string): string | null {
  try {
    ensureFolderExists(backupFolderPath);

    const fileName = path.basename(filePath);
    const fileExtension = path.extname(fileName);
    const fileNameWithoutExt = path.basename(fileName, fileExtension);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `${fileNameWithoutExt}_${timestamp}${fileExtension}`;
    const backupPath = path.join(backupFolderPath, backupFileName);

    fs.copyFileSync(filePath, backupPath);
    console.log(`Moved file to backup: ${filePath} → ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error(`Error moving file to backup ${filePath}:`, error);
    return null;
  }
}

/**
 * Copy file to backup folder with timestamp
 */
export function copyFileToBackup(filePath: string, backupFolderPath: string): string | null {
  try {
    ensureFolderExists(backupFolderPath);

    const fileName = path.basename(filePath);
    const fileExtension = path.extname(fileName);
    const fileNameWithoutExt = path.basename(fileName, fileExtension);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `${fileNameWithoutExt}_${timestamp}${fileExtension}`;
    const backupPath = path.join(backupFolderPath, backupFileName);

    fs.copyFileSync(filePath, backupPath);
    console.log(`Copied file to backup: ${filePath} → ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error(`Error copying file to backup ${filePath}:`, error);
    return null;
  }
}

/**
 * Process all CSV files in a folder (read, backup, delete)
 */
export function processAllCsvFiles(folderPath: string, backupFolderPath: string): {
  processed: string[];
  failed: string[];
  totalFiles: number;
} {
  const result = {
    processed: [] as string[],
    failed: [] as string[],
    totalFiles: 0
  };

  try {
    const csvFiles = listCsvFiles(folderPath);
    result.totalFiles = csvFiles.length;

    console.log(`Found ${csvFiles.length} CSV files to process in ${folderPath}`);

    for (const fileInfo of csvFiles) {
      try {
        console.log(`Processing file: ${fileInfo.name}`);

        // 1. Read file content
        const content = readFileContent(fileInfo.path);
        if (!content) {
          throw new Error('Failed to read file content');
        }

        console.log(`📄 File: ${fileInfo.name}`);
        console.log(`📊 Size: ${formatFileSize(fileInfo.size)}`);
        console.log(`📅 Modified: ${fileInfo.lastModified.toISOString()}`);
        console.log(`📝 Content preview (first 200 chars):`);
        console.log(content.substring(0, 200) + (content.length > 200 ? '...' : ''));
        console.log('---');

        // 2. Create backup
        const backupPath = copyFileToBackup(fileInfo.path, backupFolderPath);
        if (!backupPath) {
          throw new Error('Failed to create backup');
        }

        // 3. Delete original file
        const deleted = deleteFile(fileInfo.path);
        if (!deleted) {
          throw new Error('Failed to delete original file');
        }

        result.processed.push(fileInfo.name);
        console.log(`✅ Successfully processed: ${fileInfo.name}`);

      } catch (error) {
        console.error(`❌ Failed to process ${fileInfo.name}:`, error);
        result.failed.push(fileInfo.name);
      }
    }

    console.log(`\n📋 Processing Summary:`);
    console.log(`   Total files: ${result.totalFiles}`);
    console.log(`   Processed: ${result.processed.length}`);
    console.log(`   Failed: ${result.failed.length}`);

    return result;
  } catch (error) {
    console.error(`Error processing CSV files in ${folderPath}:`, error);
    return result;
  }
}
