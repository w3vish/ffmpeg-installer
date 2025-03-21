import path from 'path';
import os from 'os';
import fs from 'fs';
import { DownloadSource, PlatformInfo } from './types.js';

/**
 * Get user's home directory in a cross-platform way
 */
export function getUserHomeDir(): string {
  return os.homedir();
}

/**
 * Get application data directory based on platform
 */
export function getAppDataDir(): string {
  const homeDir = getUserHomeDir();
  
  // Platform-specific app data locations
  switch (os.platform()) {
    case 'win32':
      return process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');
    case 'darwin':
      return path.join(homeDir, 'Library', 'Application Support');
    default: // Linux and others
      return process.env.XDG_DATA_HOME || path.join(homeDir, '.local', 'share');
  }
}

// Define a consistent application name for storing data
export const APP_NAME = 'ffmpeg-installer';

// Directory for storing FFmpeg binaries
export const BINARIES_DIR = path.join(getAppDataDir(), APP_NAME, 'binaries');

// Path to the configuration file
export const CONFIG_FILE_PATH = path.join(getAppDataDir(), APP_NAME, 'config.json');

// Make sure directories exist
export function ensureDirectoriesExist(): void {
  const dirs = [
    path.dirname(CONFIG_FILE_PATH),
    BINARIES_DIR
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
/**
 * Supported platforms
 */
export const SUPPORTED_PLATFORMS: PlatformInfo[] = [
  {
    platform: 'win32',
    arch: 'x64',
    identifier: 'win32-x64',
    binaryName: {
      ffmpeg: 'ffmpeg.exe',
      ffprobe: 'ffprobe.exe'
    }
  },
  {
    platform: 'win32',
    arch: 'ia32',
    identifier: 'win32-ia32',
    binaryName: {
      ffmpeg: 'ffmpeg.exe',
      ffprobe: 'ffprobe.exe'
    }
  },
  {
    platform: 'darwin',
    arch: 'x64',
    identifier: 'darwin-x64',
    binaryName: {
      ffmpeg: 'ffmpeg',
      ffprobe: 'ffprobe'
    }
  },
  {
    platform: 'darwin',
    arch: 'arm64',
    identifier: 'darwin-arm64',
    binaryName: {
      ffmpeg: 'ffmpeg',
      ffprobe: 'ffprobe'
    }
  },
  {
    platform: 'linux',
    arch: 'x64',
    identifier: 'linux-x64',
    binaryName: {
      ffmpeg: 'ffmpeg',
      ffprobe: 'ffprobe'
    }
  },
  {
    platform: 'linux',
    arch: 'ia32',
    identifier: 'linux-ia32',
    binaryName: {
      ffmpeg: 'ffmpeg',
      ffprobe: 'ffprobe'
    }
  },
  {
    platform: 'linux',
    arch: 'arm',
    identifier: 'linux-arm',
    binaryName: {
      ffmpeg: 'ffmpeg',
      ffprobe: 'ffprobe'
    }
  },
  {
    platform: 'linux',
    arch: 'arm64',
    identifier: 'linux-arm64',
    binaryName: {
      ffmpeg: 'ffmpeg',
      ffprobe: 'ffprobe'
    }
  }
];

/**
 * Default download sources for each platform
 * URLs have been updated to use working sources
 */
export const DOWNLOAD_SOURCES: Record<string, DownloadSource> = {
  // Windows x64
  'win32-x64': {
    url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
    format: 'zip',
    ffmpegPath: 'bin/ffmpeg.exe',
    ffprobePath: 'bin/ffprobe.exe',
    version: 'latest'
  },

  // Windows ia32 (32-bit)
  // Using a specific release version from GyanD's repository
  'win32-ia32': {
    url: 'https://github.com/GyanD/codexffmpeg/releases/download/6.1.1/ffmpeg-6.1.1-essentials_build.zip',
    format: 'zip',
    ffmpegPath: 'bin/ffmpeg.exe',
    ffprobePath: 'bin/ffprobe.exe',
    version: '6.1.1'
  },

  // macOS Intel (x64)
  'darwin-x64': {
    url: 'https://evermeet.cx/ffmpeg/ffmpeg-7.0.2.zip',
    format: 'zip',
    ffmpegPath: 'ffmpeg',
    ffprobePath: null, // Will be downloaded separately
    version: '7.0.2',
    // Adding a secondary download for ffprobe
    secondaryDownload: {
      url: 'https://evermeet.cx/ffmpeg/ffprobe-7.0.2.zip',
      format: 'zip',
      path: 'ffprobe'
    }
  },

  // macOS Apple Silicon (arm64)
  'darwin-arm64': {
    url: 'https://evermeet.cx/ffmpeg/ffmpeg-7.0.2.zip',
    format: 'zip',
    ffmpegPath: 'ffmpeg',
    ffprobePath: null, // Will be downloaded separately
    version: '7.0.2',
    // Adding a secondary download for ffprobe
    secondaryDownload: {
      url: 'https://evermeet.cx/ffmpeg/ffprobe-7.0.2.zip',
      format: 'zip',
      path: 'ffprobe'
    },
    // Flag to indicate this is an ARM build
    options: { arch: 'arm64' }
  },

  // Linux x64
  'linux-x64': {
    url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
    format: 'tar.xz',
    ffmpegPath: 'ffmpeg',
    ffprobePath: 'ffprobe', 
    version: 'release'
  },

  // Linux ia32 (32-bit)
  'linux-ia32': {
    url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-i686-static.tar.xz',
    format: 'tar.xz',
    ffmpegPath: 'ffmpeg',
    ffprobePath: 'ffprobe',
    version: 'release'
  },

  // Linux ARM (armhf)
  'linux-arm': {
    url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-armhf-static.tar.xz',
    format: 'tar.xz',
    ffmpegPath: 'ffmpeg',
    ffprobePath: 'ffprobe',
    version: 'release'
  },

  // Linux ARM64
  'linux-arm64': {
    url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz',
    format: 'tar.xz',
    ffmpegPath: 'ffmpeg',
    ffprobePath: 'ffprobe',
    version: 'release'
  },
};