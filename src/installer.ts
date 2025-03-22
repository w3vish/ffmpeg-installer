#!/usr/bin/env node

import os from 'os';
import fs from 'fs';
import path from 'path';
import { CONFIG_FILE_PATH, SUPPORTED_PLATFORMS, ensureDirectoriesExist } from './constants.js';
import { downloadBinaries } from './downloader.js';
import readline from 'readline';

/**
 * Get the current platform information
 */
function getCurrentPlatform() {
  const platform = process.platform;
  const arch = process.arch;

  return SUPPORTED_PLATFORMS.find(p => p.platform === platform && p.arch === arch) || null;
}

/**
 * Verify if config file exists and is valid
 */
function verifyConfig(configPath: string): boolean {
  try {
    if (!fs.existsSync(configPath)) {
      return false;
    }
    
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    // Basic validation
    return typeof config === 'object' && config !== null && typeof config.platforms === 'object';
  } catch (error) {
    return false;
  }
}

/**
 * Create initial config file
 */
async function createInitialConfig(configPath: string): Promise<void> {
  const config = {
    platforms: {},
    lastUpdated: new Date().toISOString()
  };
  
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}

/**
 * Main installation function
 */
async function install(): Promise<void> {
  try {
    // Ensure all directories exist
    ensureDirectoriesExist();
    
    // Create initial config file if it doesn't exist
    if (!verifyConfig(CONFIG_FILE_PATH)) {
      await createInitialConfig(CONFIG_FILE_PATH);
    }
    
    // Get current platform
    const currentPlatform = getCurrentPlatform();
    
    if (!currentPlatform) {
      console.error(`Unsupported platform/architecture: ${os.platform()}-${os.arch()}`);
      console.error('Please install FFmpeg manually and set the path in your application.');
      return;
    }
    
    // Parse command-line arguments
    const args = process.argv.slice(2);
    const platformArg = args.find(arg => arg.startsWith('--platform='));
    const ffmpegOnlyArg = args.includes('--ffmpeg-only');
    const ffprobeOnlyArg = args.includes('--ffprobe-only');
    
    // Get platform identifier
    let platformIdentifier = currentPlatform.identifier;
    if (platformArg) {
      platformIdentifier = platformArg.split('=')[1];
    }
    
    // If no explicit flag is provided, ask the user what to install
    let installOptions: { ffmpeg: boolean; ffprobe: boolean };
    
    if (!ffmpegOnlyArg && !ffprobeOnlyArg) {
      // Default: install both
      const response = await promptForInstallation();
      
      switch (response) {
        case '1':
          installOptions = { ffmpeg: true, ffprobe: true };
          console.log(`Installing FFmpeg and FFprobe binaries for ${platformIdentifier}...`);
          break;
        case '2': 
          installOptions = { ffmpeg: true, ffprobe: false };
          console.log(`Installing FFmpeg binary only for ${platformIdentifier}...`);
          break;
        case '3':
          installOptions = { ffmpeg: false, ffprobe: true };
          console.log(`Installing FFprobe binary only for ${platformIdentifier}...`);
          break;
        default:
          // Install both as default
          installOptions = { ffmpeg: true, ffprobe: true };
          console.log(`Installing FFmpeg and FFprobe binaries for ${platformIdentifier}...`);
      }
    } else {
      // Use command-line arguments
      installOptions = {
        ffmpeg: ffmpegOnlyArg || (!ffmpegOnlyArg && !ffprobeOnlyArg),
        ffprobe: ffprobeOnlyArg || (!ffmpegOnlyArg && !ffprobeOnlyArg)
      };
      
      if (ffmpegOnlyArg) {
        console.log(`Installing FFmpeg binary only for ${platformIdentifier}...`);
      } else if (ffprobeOnlyArg) {
        console.log(`Installing FFprobe binary only for ${platformIdentifier}...`);
      } else {
        console.log(`Installing FFmpeg and FFprobe binaries for ${platformIdentifier}...`);
      }
    }
    
    // Download and install the binaries
    await downloadBinaries(platformIdentifier, installOptions);
  } catch (error) {
    console.error(`Installation failed: ${(error as Error).message}`);
    process.exit(1);
  }
}

/**
 * Prompt the user to select what to install
 */
function promptForInstallation(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('\nSelect components to install:');
    console.log('1. FFmpeg and FFprobe (default)');
    console.log('2. FFmpeg only');
    console.log('3. FFprobe only');
    
    rl.question('Enter your choice (1-3) or press Enter for default: ', (answer) => {
      rl.close();
      resolve(answer || '1');
    });
  });
}

// Run the installation
install().catch(error => {
  console.error(`Unexpected error during installation: ${error.message}`);
  process.exit(1);
});