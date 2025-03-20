import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

/**
 * Verify if a file exists and is executable
 * @param filePath Path to the file to verify
 * @returns True if the file exists and is executable, false otherwise
 */
export function verifyFile(filePath: string): boolean {
  try {
    const stats = fs.statSync(filePath);
    return stats.isFile();
  } catch (err) {
    return false;
  }
}

/**
 * Ensure a directory exists
 * @param dirPath Path to the directory
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fsPromises.mkdir(dirPath, { recursive: true });
  } catch (err) {
    // Directory already exists or cannot be created
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw err;
    }
  }
}

/**
 * Make a file executable
 * @param filePath Path to the file
 */
export async function makeExecutable(filePath: string): Promise<void> {
  try {
    const stats = await fsPromises.stat(filePath);
    
    // Add executable permissions (read/write/execute for owner, read/execute for group and others)
    const mode = stats.mode | 0o755;
    await fsPromises.chmod(filePath, mode);
  } catch (err) {
    throw new Error(`Failed to make file executable: ${filePath}, error: ${(err as Error).message}`);
  }
}

/**
 * Verify if the configuration file exists and is valid
 * @param configPath Path to the configuration file
 * @returns True if the configuration file exists and is valid, false otherwise
 */
export function verifyConfig(configPath: string): boolean {
  try {
    if (!fs.existsSync(configPath)) {
      return false;
    }

    const configData = fs.readFileSync(configPath, 'utf8');
    JSON.parse(configData);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Create the initial configuration file
 * @param configPath Path to the configuration file
 */
export async function createInitialConfig(configPath: string): Promise<void> {
  const config = {
    platforms: {},
    lastUpdated: new Date().toISOString()
  };

  await ensureDir(path.dirname(configPath));
  await fsPromises.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
}