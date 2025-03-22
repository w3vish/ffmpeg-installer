// index.ts
import fs from 'fs';
import path from 'path';
import { CONFIG_FILE_PATH, BINARIES_DIR, ensureDirectoriesExist, SUPPORTED_PLATFORMS } from './constants.js';
import { ConfigFile } from './types.js';

/**
 * Get the current platform information
 */
function getCurrentPlatform() {
  const platform = process.platform;
  const arch = process.arch;

  return SUPPORTED_PLATFORMS.find(p => p.platform === platform && p.arch === arch) || null;
}

/**
 * Get the installed FFmpeg binaries for the current platform
 */
function getInstalledBinaries() {
  // Ensure directories exist
  ensureDirectoriesExist();
  
  const currentPlatform = getCurrentPlatform();
  
  if (!currentPlatform) {
    throw new Error('Unsupported platform. Please install FFmpeg manually.');
  }
  
  try {
    // Check if config file exists
    if (!fs.existsSync(CONFIG_FILE_PATH)) {
      throw new Error('FFmpeg binaries are not installed. Please run the installation script.');
    }
    
    // Read config file
    const configData = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
    const config: ConfigFile = JSON.parse(configData);
    
    // Get platform config
    const platformConfig = config.platforms[currentPlatform.identifier];
    
    if (!platformConfig || (!platformConfig.ffmpeg && !platformConfig.ffprobe)) {
      throw new Error(`FFmpeg binaries for ${currentPlatform.identifier} are not installed. Please run the installation script.`);
    }
    
    // Get binary paths
    const ffmpegPath = platformConfig.ffmpeg 
      ? path.join(BINARIES_DIR, currentPlatform.identifier, platformConfig.ffmpeg.relativePath)
      : '';
    
    const ffprobePath = platformConfig.ffprobe
      ? path.join(BINARIES_DIR, currentPlatform.identifier, platformConfig.ffprobe.relativePath)
      : '';
    
    // Verify that binaries exist
    if (ffmpegPath && !fs.existsSync(ffmpegPath)) {
      throw new Error(`FFmpeg binary not found at ${ffmpegPath}. Please reinstall.`);
    }
    
    if (ffprobePath && !fs.existsSync(ffprobePath)) {
      throw new Error(`FFprobe binary not found at ${ffprobePath}. Please reinstall.`);
    }
    
    // Return in the expected format
    return {
      ffmpeg: platformConfig.ffmpeg ? {
        path: ffmpegPath,
        version: platformConfig.ffmpeg.version,
        url: platformConfig.ffmpeg.url
      } : undefined,
      ffprobe: platformConfig.ffprobe ? {
        path: ffprobePath,
        version: platformConfig.ffprobe.version,
        url: platformConfig.ffprobe.url
      } : undefined,
      platform: currentPlatform.platform,
      arch: currentPlatform.arch
    };
  } catch (error) {
    console.error(`Error getting FFmpeg binaries: ${(error as Error).message}`);
    throw error;
  }
}

// Export the installed binaries
export default getInstalledBinaries();