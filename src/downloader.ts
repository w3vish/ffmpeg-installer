import fs from 'fs';
import path from 'path';
import axios from 'axios';
import extract from 'extract-zip';
import tar from 'tar';
import { promises as fsPromises } from 'fs';
import { DOWNLOAD_SOURCES, CONFIG_FILE_PATH, BINARIES_DIR } from './constants';
import { ensureDir, makeExecutable, verifyFile } from './verify';
import { getPlatformDir } from './paths';
import { ConfigFile, DownloadSource } from './types';

/**
 * Download a file from a URL with progress tracking
 * @param url URL to download from
 * @param destPath Destination path
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
  const writer = fs.createWriteStream(destPath);

  try {
    // Get file size first if possible to calculate percentage
    let totalSize: number | undefined;
    try {
      const headResponse = await axios.head(url);
      totalSize = parseInt(headResponse.headers['content-length'] || '0', 10);
    } catch (error) {
      console.log('Could not determine file size, progress will show bytes only');
    }

    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      onDownloadProgress: (progressEvent) => {
        // This won't work directly with stream response, we'll use data events instead
      }
    });

    // Set up progress tracking
    let downloadedBytes = 0;
    const startTime = Date.now();
    let lastLogged = startTime;

    // Update progress at most 10 times per second to avoid console spam
    const updateInterval = 100; // ms

    response.data.on('data', (chunk: Buffer) => {
      downloadedBytes += chunk.length;

      const now = Date.now();
      if (now - lastLogged > updateInterval) {
        const elapsedSeconds = (now - startTime) / 1000;
        const speedMBps = ((downloadedBytes / (1024 * 1024)) / elapsedSeconds).toFixed(2);

        if (totalSize) {
          // If we know the total size, show percentage
          const percentage = ((downloadedBytes / totalSize) * 100).toFixed(1);
          const downloadedMB = (downloadedBytes / (1024 * 1024)).toFixed(2);
          const totalMB = (totalSize / (1024 * 1024)).toFixed(2);

          // Clear line and update progress
          process.stdout.write(`\rDownloading: ${percentage}% (${downloadedMB}MB of ${totalMB}MB) at ${speedMBps}MB/s`);
        } else {
          // If we don't know the total size, just show bytes
          const downloadedMB = (downloadedBytes / (1024 * 1024)).toFixed(2);
          process.stdout.write(`\rDownloading: ${downloadedMB}MB at ${speedMBps}MB/s`);
        }

        lastLogged = now;
      }
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        // Print a newline to ensure next console output starts on fresh line
        console.log('\nDownload complete!');
        resolve();
      });
      writer.on('error', reject);
    });
  } catch (error) {
    writer.close();
    throw new Error(`Failed to download from ${url}: ${(error as Error).message}`);
  }
}

/**
 * Extract a zip file with progress indication
 * @param zipPath Path to the zip file
 * @param extractPath Path to extract to
 */
async function extractZip(zipPath: string, extractPath: string): Promise<void> {
  console.log('Extracting zip file...');
  try {
    await extract(zipPath, { dir: extractPath });
    console.log('Extraction complete!');
  } catch (error) {
    throw new Error(`Failed to extract zip file: ${(error as Error).message}`);
  }
}

/**
 * Extract a tar file with progress indication
 * @param tarPath Path to the tar file
 * @param extractPath Path to extract to
 */
async function extractTarFile(tarPath: string, extractPath: string): Promise<void> {
  console.log('Extracting tar file...');
  try {
    await tar.extract({
      file: tarPath,
      cwd: extractPath,
      onentry: (entry) => {
        process.stdout.write(`\rExtracting: ${entry.path}`);
      }
    });
    console.log('\nExtraction complete!');
  } catch (error) {
    throw new Error(`Failed to extract tar file: ${(error as Error).message}`);
  }
}



/**
 * Find binary file in the extracted directory
 * @param extractPath Root path of extracted files
 * @param binaryName Name of binary to find (ffmpeg, ffprobe, etc.)
 * @returns Path to the found binary or null if not found
 */
async function findBinaryInDirectory(extractPath: string, binaryName: string): Promise<string | null> {
  // Create a queue for BFS
  const queue: string[] = [extractPath];
  const isWindows = process.platform === 'win32';

  // For Windows, we need to check for .exe extension
  const searchName = isWindows ?
    binaryName.endsWith('.exe') ? binaryName : `${binaryName}.exe` :
    binaryName;

  while (queue.length > 0) {
    const currentPath = queue.shift()!;

    try {
      const entries = await fsPromises.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          queue.push(entryPath);
        } else if (entry.isFile() && entry.name.toLowerCase() === searchName.toLowerCase()) {
          return entryPath;
        }
      }
    } catch (error) {
      console.warn(`Error reading directory ${currentPath}: ${(error as Error).message}`);
      continue;
    }
  }

  return null;
}

/**
 * Download and install binaries for a specific platform
 * @param platformIdentifier Platform identifier
 * @param installOptions Options specifying which binaries to install
 */
export async function downloadBinaries(
  platformIdentifier: string, 
  installOptions: { ffmpeg: boolean; ffprobe: boolean } = { ffmpeg: true, ffprobe: true }
): Promise<void> {
  const downloadSource = DOWNLOAD_SOURCES[platformIdentifier];

  if (!downloadSource) {
    throw new Error(`No download source available for platform: ${platformIdentifier}`);
  }

  const platformDir = getPlatformDir(platformIdentifier);
  await ensureDir(platformDir);

  // Create a temporary directory for extraction
  const tempDir = path.join(platformDir, 'temp_extract');
  await ensureDir(tempDir);

  // Temporary download path
  const downloadFormat = downloadSource.format;
  const downloadPath = path.join(tempDir, `download.${downloadFormat}`);

  try {
    console.log(`Downloading binaries for ${platformIdentifier}...`);
    await downloadFile(downloadSource.url, downloadPath);

    console.log(`Extracting binaries for ${platformIdentifier}...`);
    // Extract based on format
    if (downloadFormat === 'zip') {
      await extractZip(downloadPath, tempDir);
    } else if (downloadFormat === 'tar.xz' || downloadFormat === 'tar.gz') {
      await extractTarFile(downloadPath, tempDir);
    } else if (downloadFormat === 'aar' || downloadFormat === 'pkg') {
      console.warn(`Format ${downloadFormat} requires manual installation steps`);
      // Special handling for Android or FreeBSD
    } else if (downloadFormat === 'binary') {
      // The download is already the binary, just rename it
      if (installOptions.ffmpeg) {
        const ffmpegPath = path.join(platformDir, path.basename(downloadSource.ffmpegPath));
        await fsPromises.rename(downloadPath, ffmpegPath);
      }
    }

    // Find and copy the requested binaries in the extracted files
    if (downloadFormat !== 'binary') {
      let ffmpegPath = null;
      let ffprobePath = null;

      console.log(`Searching for binaries in extracted files...`);

      // Process FFmpeg if requested
      if (installOptions.ffmpeg) {
        // Try to find using the paths specified in downloadSource first
        if (downloadSource.ffmpegPath) {
          const exactFFmpegPath = path.join(tempDir, downloadSource.ffmpegPath);
          if (fs.existsSync(exactFFmpegPath)) {
            ffmpegPath = exactFFmpegPath;
          }
        }

        // If exact path didn't work, search for the binary
        if (!ffmpegPath) {
          const ffmpegName = path.basename(downloadSource.ffmpegPath);
          ffmpegPath = await findBinaryInDirectory(tempDir, ffmpegName);

          if (!ffmpegPath) {
            throw new Error(`Could not find ffmpeg binary in extracted files`);
          }
        }

        // Copy the binary to the platform directory
        const ffmpegDestPath = path.join(platformDir, path.basename(downloadSource.ffmpegPath));
        console.log(`Copying FFmpeg binary to final location...`);
        await fsPromises.copyFile(ffmpegPath, ffmpegDestPath);

        // Make binary executable (for non-Windows platforms)
        if (!platformIdentifier.startsWith('win32')) {
          await makeExecutable(ffmpegDestPath);
        }
      }

      // Process FFprobe if requested
      if (installOptions.ffprobe) {
        // Try to find using the paths specified in downloadSource first
        if (downloadSource.ffprobePath) {
          const exactFFprobePath = path.join(tempDir, downloadSource.ffprobePath);
          if (fs.existsSync(exactFFprobePath)) {
            ffprobePath = exactFFprobePath;
          }
        }

        // If exact path didn't work, search for the binary
        if (!ffprobePath) {
          const ffprobeName = path.basename(downloadSource.ffprobePath);
          ffprobePath = await findBinaryInDirectory(tempDir, ffprobeName);

          if (!ffprobePath) {
            throw new Error(`Could not find ffprobe binary in extracted files`);
          }
        }

        // Copy the binary to the platform directory
        const ffprobeDestPath = path.join(platformDir, path.basename(downloadSource.ffprobePath));
        console.log(`Copying FFprobe binary to final location...`);
        await fsPromises.copyFile(ffprobePath, ffprobeDestPath);

        // Make binary executable (for non-Windows platforms)
        if (!platformIdentifier.startsWith('win32')) {
          await makeExecutable(ffprobeDestPath);
        }
      }
    }

    // Update config file with only the installed binaries
    await updateConfig(platformIdentifier, downloadSource, installOptions);

    console.log(`Successfully installed requested binaries for ${platformIdentifier}`);
  } catch (error) {
    throw new Error(`Failed to install binaries for ${platformIdentifier}: ${(error as Error).message}`);
  } finally {
    // Clean up temporary files
    try {
      if (fs.existsSync(tempDir)) {
        await fsPromises.rm(tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn(`Failed to clean up temporary directory: ${tempDir}`);
    }
  }
}


/**
 * Update the configuration file after installing binaries
 * @param platformIdentifier Platform identifier
 * @param downloadSource Download source information
 * @param installOptions Options specifying which binaries were installed
 */
async function updateConfig(
  platformIdentifier: string, 
  downloadSource: DownloadSource, 
  installOptions: { ffmpeg: boolean; ffprobe: boolean }
): Promise<void> {
  let config: ConfigFile;

  // Read existing config or create new one
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const configData = await fsPromises.readFile(CONFIG_FILE_PATH, 'utf8');
      config = JSON.parse(configData);
    } else {
      config = {
        platforms: {},
        lastUpdated: new Date().toISOString()
      };
    }
  } catch (error) {
    config = {
      platforms: {},
      lastUpdated: new Date().toISOString()
    };
  }

  // Initialize platform config if it doesn't exist
  if (!config.platforms[platformIdentifier]) {
    // Create an empty object that matches the expected type
    config.platforms[platformIdentifier] = {};
  }
  
  // Update config with new binaries, preserving any existing binary configs not being updated
  if (installOptions.ffmpeg) {
    config.platforms[platformIdentifier].ffmpeg = {
      version: downloadSource.version,
      url: downloadSource.url,
      relativePath: downloadSource.ffmpegPath
    };
  }

  if (installOptions.ffprobe) {
    config.platforms[platformIdentifier].ffprobe = {
      version: downloadSource.version,
      url: downloadSource.url,
      relativePath: downloadSource.ffprobePath
    };
  }

  config.lastUpdated = new Date().toISOString();

  // Save updated config
  await ensureDir(path.dirname(CONFIG_FILE_PATH));
  await fsPromises.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf8');
}