#!/usr/bin/env node

import os from 'os';
import { CONFIG_FILE_PATH } from './constants.js';
import { downloadBinaries } from './downloader.js';
import { getCurrentPlatform } from './paths.js';
import { verifyConfig, createInitialConfig } from './verify.js';

import readline from 'readline';

/**
 * Main installation function
 */
async function install(): Promise<void> {
  try {
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