import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { promises as fsPromises } from 'fs';
import { CONFIG_FILE_PATH } from './constants.js';
import { getPlatformDir } from './paths.js';
import { ConfigFile } from './types.js';
import { ensureDir, makeExecutable } from './verify.js';

// Repository info for GitHub releases
const GITHUB_REPO = 'w3vish/ffmpeg-installer';
const GITHUB_RELEASE_TAG = 'v1.0.0'; // Update this when you create new releases

/**
 * Download a file from a URL with progress tracking
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
      responseType: 'stream'
    });

    // Set up progress tracking
    let downloadedBytes = 0;
    const startTime = Date.now();
    let lastLogged = startTime;
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
 * Get the download URL for a binary from GitHub releases
 */
function getGitHubReleaseUrl(platformIdentifier: string, binaryName: string): string {
  return `https://github.com/${GITHUB_REPO}/releases/download/${GITHUB_RELEASE_TAG}/${platformIdentifier}-${binaryName}`;
}

/**
 * Download and install binaries for a specific platform from GitHub releases
 */
export async function downloadBinaries(
  platformIdentifier: string, 
  installOptions: { ffmpeg: boolean; ffprobe: boolean } = { ffmpeg: true, ffprobe: true }
): Promise<void> {
  const platformDir = getPlatformDir(platformIdentifier);
  await ensureDir(platformDir);

  // Get binary names based on platform
  const isWindows = platformIdentifier.startsWith('win32');
  const ffmpegName = isWindows ? 'ffmpeg.exe' : 'ffmpeg';
  const ffprobeName = isWindows ? 'ffprobe.exe' : 'ffprobe';

  try {
    console.log(`Downloading binaries for ${platformIdentifier} from GitHub releases...`);
    
    // Download FFmpeg if requested
    if (installOptions.ffmpeg) {
      const ffmpegUrl = getGitHubReleaseUrl(platformIdentifier, ffmpegName);
      const ffmpegDestPath = path.join(platformDir, ffmpegName);
      
      console.log(`Downloading FFmpeg for ${platformIdentifier}...`);
      await downloadFile(ffmpegUrl, ffmpegDestPath);
      
      // Make binary executable (for non-Windows platforms)
      if (!isWindows) {
        await makeExecutable(ffmpegDestPath);
      }
    }
    
    // Download FFprobe if requested
    if (installOptions.ffprobe) {
      const ffprobeUrl = getGitHubReleaseUrl(platformIdentifier, ffprobeName);
      const ffprobeDestPath = path.join(platformDir, ffprobeName);
      
      console.log(`Downloading FFprobe for ${platformIdentifier}...`);
      await downloadFile(ffprobeUrl, ffprobeDestPath);
      
      // Make binary executable (for non-Windows platforms)
      if (!isWindows) {
        await makeExecutable(ffprobeDestPath);
      }
    }

    // Update config file
    await updateConfig(platformIdentifier, {
      ffmpegName,
      ffprobeName,
      version: GITHUB_RELEASE_TAG
    }, installOptions);

    console.log(`Successfully installed requested binaries for ${platformIdentifier}`);
  } catch (error) {
    throw new Error(`Failed to install binaries for ${platformIdentifier}: ${(error as Error).message}`);
  }
}

/**
 * Update the configuration file after installing binaries
 */
async function updateConfig(
  platformIdentifier: string, 
  binaryInfo: { ffmpegName: string, ffprobeName: string, version: string },
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
    config.platforms[platformIdentifier] = {};
  }
  
  // Update config with new binaries
  if (installOptions.ffmpeg) {
    config.platforms[platformIdentifier].ffmpeg = {
      version: binaryInfo.version,
      url: getGitHubReleaseUrl(platformIdentifier, binaryInfo.ffmpegName),
      relativePath: binaryInfo.ffmpegName
    };
  }

  if (installOptions.ffprobe) {
    config.platforms[platformIdentifier].ffprobe = {
      version: binaryInfo.version,
      url: getGitHubReleaseUrl(platformIdentifier, binaryInfo.ffprobeName),
      relativePath: binaryInfo.ffprobeName
    };
  }

  config.lastUpdated = new Date().toISOString();

  // Save updated config
  await ensureDir(path.dirname(CONFIG_FILE_PATH));
  await fsPromises.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf8');
}