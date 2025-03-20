/**
 * Represents metadata for a binary
 */
export interface BinaryInfo {
  /**
   * Full path to the binary executable
   */
  path: string;
 
  /**
   * Version of the binary
   */
  version: string;
 
  /**
   * URL where the binary was downloaded from
   */
  url: string;
}

/**
 * Represents information about a binary in the config file
 */
export interface ConfigBinaryInfo {
  /**
   * Version of the binary
   */
  version: string;
 
  /**
   * URL where the binary was downloaded from
   */
  url: string;
 
  /**
   * Relative path to the binary within the platform directory
   */
  relativePath: string;
}

/**
 * Represents the result of the FFmpeg installation
 */
export interface FFmpegInstaller {
  /**
   * FFmpeg binary information (optional for ffprobe-only installations)
   */
  ffmpeg?: BinaryInfo;
 
  /**
   * FFprobe binary information (optional for ffmpeg-only installations)
   */
  ffprobe?: BinaryInfo;
 
  /**
   * Platform identifier
   */
  platform: string;
 
  /**
   * Architecture identifier
   */
  arch: string;
}

/**
 * Platform information
 */
export interface PlatformInfo {
  platform: string;
  arch: string;
  identifier: string;
  binaryName: {
    ffmpeg: string;
    ffprobe: string;
  };
}

/**
 * Download source configuration
 */
export interface DownloadSource {
  /**
   * URL to download the binary
   */
  url: string;
 
  /**
   * File format of the download (zip, tar.gz, etc.)
   */
  format: 'zip' | 'tar.gz' | 'binary' | 'aar' | 'pkg' | 'tar.xz';
 
  /**
   * Path to FFmpeg within the archive
   */
  ffmpegPath: string;
 
  /**
   * Path to FFprobe within the archive
   */
  ffprobePath: string;
 
  /**
   * Version of FFmpeg
   */
  version: string;
}

/**
 * Configuration file structure
 */
export interface ConfigFile {
  /**
   * Map of platform identifiers to binary information
   */
  platforms: Record<string, {
    ffmpeg?: ConfigBinaryInfo;
    ffprobe?: ConfigBinaryInfo;
  }>;
 
  /**
   * Last updated timestamp
   */
  lastUpdated: string;
}