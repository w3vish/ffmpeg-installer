import path from 'path';
import { PlatformInfo, DownloadSource } from './types';

/**
 * Base directory for storing binaries
 */
export const BINARIES_DIR = path.join(__dirname, '..', 'binaries');

/**
 * Configuration file path
 */
export const CONFIG_FILE_PATH = path.join(BINARIES_DIR, 'config.json');

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
  },
  {
    platform: 'linux',
    arch: 'ppc64',
    identifier: 'linux-ppc64',
    binaryName: {
      ffmpeg: 'ffmpeg',
      ffprobe: 'ffprobe'
    }
  }
];

/**
 * Default download sources for each platform
 * URLs should be replaced with actual FFmpeg binary sources
 */
export const DOWNLOAD_SOURCES: Record<string, DownloadSource> = {
    'win32-x64': {
      url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
      format: 'zip',
      ffmpegPath: 'bin/ffmpeg.exe',
      ffprobePath: 'bin/ffprobe.exe',
      version: 'latest'
    },
    'win32-ia32': {
      url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win32-gpl.zip',
      format: 'zip',
      ffmpegPath: 'bin/ffmpeg.exe',
      ffprobePath: 'bin/ffprobe.exe',
      version: 'latest'
    },
    'darwin-x64': {
      url: 'https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip',
      format: 'zip',
      ffmpegPath: 'ffmpeg',
      ffprobePath: 'ffprobe',
      version: 'latest'
    },
    'darwin-arm64': {
      url: 'https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip/arm64',
      format: 'zip',
      ffmpegPath: 'ffmpeg',
      ffprobePath: 'ffprobe',
      version: 'latest'
    },
    'linux-x64': {
      url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
      format: 'tar.xz',
      ffmpegPath: 'ffmpeg',
      ffprobePath: 'ffprobe',
      version: 'release'
    },
    'linux-ia32': {
      url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-i686-static.tar.xz',
      format: 'tar.xz',
      ffmpegPath: 'ffmpeg',
      ffprobePath: 'ffprobe',
      version: 'release'
    },
    'linux-arm': {
      url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-armhf-static.tar.xz',
      format: 'tar.xz',
      ffmpegPath: 'ffmpeg',
      ffprobePath: 'ffprobe',
      version: 'release'
    },
    'linux-arm64': {
      url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz',
      format: 'tar.xz',
      ffmpegPath: 'ffmpeg',
      ffprobePath: 'ffprobe',
      version: 'release'
    }
  };