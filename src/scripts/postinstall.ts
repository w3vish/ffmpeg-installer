import os from 'os';
import { CONFIG_FILE_PATH } from '../constants';
import { downloadBinaries } from '../downloader';
import { getCurrentPlatform } from '../paths';
import { verifyConfig, createInitialConfig } from '../verify';

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
    
    // Determine which binaries to install
    const installOptions = {
      ffmpeg: !ffprobeOnlyArg || ffmpegOnlyArg, // Install ffmpeg if not ffprobe-only OR explicitly ffmpeg-only
      ffprobe: !ffmpegOnlyArg || ffprobeOnlyArg // Install ffprobe if not ffmpeg-only OR explicitly ffprobe-only
    };
    
    // Get platform identifier
    let platformIdentifier = currentPlatform.identifier;
    if (platformArg) {
      platformIdentifier = platformArg.split('=')[1];
    }
    
    // Log what we're installing
    if (ffmpegOnlyArg) {
      console.log(`Installing FFmpeg binary only for ${platformIdentifier}...`);
    } else if (ffprobeOnlyArg) {
      console.log(`Installing FFprobe binary only for ${platformIdentifier}...`);
    } else {
      console.log(`Installing FFmpeg and FFprobe binaries for ${platformIdentifier}...`);
    }

    // Download and install the binaries
    await downloadBinaries(platformIdentifier, installOptions);
  } catch (error) {
    console.error(`Installation failed: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Run the installation
install().catch(error => {
  console.error(`Unexpected error during installation: ${error.message}`);
  process.exit(1);
});