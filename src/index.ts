import fs from 'fs';
import { CONFIG_FILE_PATH } from './constants';
import { getCurrentPlatform, getBinaryPath } from './paths';
import { verifyFile } from './verify';
import { FFmpegInstaller, BinaryInfo, ConfigFile } from './types';

/**
 * Get the installed FFmpeg and FFprobe binaries for the current platform
 * @returns FFmpeg installer information
 */
function getInstalledBinaries(): FFmpegInstaller {
  const currentPlatform = getCurrentPlatform();

  if (!currentPlatform) {
    throw new Error(`Unsupported platform/architecture: ${process.platform}-${process.arch}`);
  }

  const platformIdentifier = currentPlatform.identifier;

  // Check if configuration file exists
  if (!fs.existsSync(CONFIG_FILE_PATH)) {
    throw new Error('FFmpeg binaries are not installed. Please run the installation script.');
  }

  let config: ConfigFile;
  try {
    const configData = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
    config = JSON.parse(configData);
  } catch (error) {
    throw new Error(`Error reading config file: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Validate platform configuration
  const platformConfig = config.platforms[platformIdentifier];
  if (!platformConfig) {
    throw new Error(`FFmpeg binaries for ${platformIdentifier} are not installed. Please run the installation script.`);
  }

  // Get binary paths
  const ffmpegPath = getBinaryPath(platformIdentifier, 'ffmpeg');
  const ffprobePath = getBinaryPath(platformIdentifier, 'ffprobe');

  // Verify binaries exist
  const ffmpegExists = verifyFile(ffmpegPath);
  const ffprobeExists = verifyFile(ffprobePath);

  // Construct binary information safely
  const ffmpegInfo: BinaryInfo | undefined = platformConfig.ffmpeg && ffmpegExists ? {
    path: ffmpegPath,
    version: platformConfig.ffmpeg.version,
    url: platformConfig.ffmpeg.url,
  } : undefined;

  const ffprobeInfo: BinaryInfo | undefined = platformConfig.ffprobe && ffprobeExists ? {
    path: ffprobePath,
    version: platformConfig.ffprobe.version,
    url: platformConfig.ffprobe.url,
  } : undefined;

  return {
    ffmpeg: ffmpegInfo,
    ffprobe: ffprobeInfo,
    platform: currentPlatform.platform,
    arch: currentPlatform.arch,
  };
}

// Get binary data once to avoid redundant function calls
const installedBinaries = getInstalledBinaries();

// Export main functionality
export default installedBinaries;

// Export individual paths for convenience
export const path = installedBinaries.ffmpeg?.path;
export const ffmpegPath = installedBinaries.ffmpeg?.path;
export const ffprobePath = installedBinaries.ffprobe?.path;
export const version = installedBinaries.ffmpeg?.version;
export const url = installedBinaries.ffmpeg?.url;
