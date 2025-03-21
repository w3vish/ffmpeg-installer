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
  /**
   * Operating system platform (win32, darwin, linux, etc.)
   */
  platform: string;
  
  /**
   * CPU architecture (x64, ia32, arm64, etc.)
   */
  arch: string;
  
  /**
   * Combined platform-arch identifier
   */
  identifier: string;
  
  /**
   * Binary filenames for this platform
   */
  binaryName: {
    ffmpeg: string;
    ffprobe: string;
  };
}

/**
 * Secondary download configuration for separate ffmpeg/ffprobe downloads
 */
export interface SecondaryDownload {
  /**
   * URL to download the secondary binary
   */
  url: string;
  
  /**
   * File format of the download (if different from primary)
   */
  format?: 'zip' | 'tar.gz' | 'binary' | 'aar' | 'pkg' | 'tar.xz';
  
  /**
   * Path to binary within the archive
   */
  path: string;
}

/**
 * Platform-specific options for download and extraction
 */
export interface DownloadOptions {
  /**
   * Custom headers for download requests
   */
  headers?: Record<string, string>;
  
  /**
   * Target architecture for platform-specific downloads
   */
  arch?: string;
  
  /**
   * Other platform-specific options
   */
  [key: string]: any;
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
   * File format of the download
   */
  format: 'zip' | 'tar.gz' | 'binary' | 'aar' | 'pkg' | 'tar.xz';
 
  /**
   * Path to FFmpeg within the archive
   * Can be null for secondary download configurations
   */
  ffmpegPath: string | null;
 
  /**
   * Path to FFprobe within the archive
   * Can be null for secondary download configurations
   */
  ffprobePath: string | null;
 
  /**
   * Version of FFmpeg
   */
  version: string;
  
  /**
   * Secondary download for platforms that need separate downloads for ffmpeg/ffprobe
   */
  secondaryDownload?: SecondaryDownload;
  
  /**
   * Additional options for download and extraction
   */
  options?: DownloadOptions;
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