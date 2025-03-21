import fs from 'fs';
import path from 'path';
import axios from 'axios';
import extract from 'extract-zip';
import { exec } from 'child_process';
import { promises as fsPromises } from 'fs';
import { DOWNLOAD_SOURCES, SUPPORTED_PLATFORMS, BINARIES_DIR } from '../constants.js';

// Create directories for processed binaries
const PROCESSED_DIR = path.join(BINARIES_DIR);

/**
 * Download a file from URL
 */
async function downloadFile(url: string, destPath: string, options?: any): Promise<void> {
  console.log(`Downloading from ${url}...`);
  const writer = fs.createWriteStream(destPath);
  
  try {
    const requestConfig: any = {
      url,
      method: 'GET',
      responseType: 'stream'
    };
    
    // Add custom headers for specific sources if needed
    if (options?.headers) {
      requestConfig.headers = options.headers;
    }
    
    const response = await axios(requestConfig);
    
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    writer.close();
    throw new Error(`Failed to download from ${url}: ${(error as Error).message}`);
  }
}

/**
 * Extract archives based on their format
 */
async function extractArchive(archivePath: string, extractPath: string, format: string): Promise<void> {
  console.log(`Extracting ${archivePath}...`);
  
  if (format === 'zip') {
    await extract(archivePath, { dir: extractPath });
  } else if (format === 'tar.xz' || format === 'tar.gz') {
    // Use command line tools which are more reliable for these formats
    return new Promise((resolve, reject) => {
      // Create the extract path first
      fs.mkdirSync(extractPath, { recursive: true });
      
      const command = format === 'tar.xz'
        ? `tar -xJf "${archivePath}" -C "${extractPath}"`
        : `tar -xzf "${archivePath}" -C "${extractPath}"`;
      
      exec(command, (error) => {
        if (error) {
          reject(new Error(`Extraction failed: ${error.message}`));
        } else {
          resolve();
        }
      });
    });
  } else {
    throw new Error(`Unsupported archive format: ${format}`);
  }
}

/**
 * Find binary in the extracted directory
 */
async function findBinary(extractPath: string, binaryName: string): Promise<string | null> {
  console.log(`Searching for ${binaryName} in ${extractPath}...`);
  
  // Create a queue for BFS
  const queue: string[] = [extractPath];
  
  while (queue.length > 0) {
    const currentPath = queue.shift()!;
    
    try {
      const entries = await fsPromises.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const entryPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          queue.push(entryPath);
        } else if (entry.isFile() && entry.name.toLowerCase() === binaryName.toLowerCase()) {
          console.log(`Found ${binaryName} at ${entryPath}`);
          return entryPath;
        }
      }
    } catch (error) {
      console.warn(`Error reading directory ${currentPath}: ${(error as Error).message}`);
    }
  }
  
  console.log(`Binary ${binaryName} not found`);
  return null;
}

/**
 * Check if a file path exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Process a platform's binaries
 */
async function processPlatform(platformId: string, downloadSource: any): Promise<void> {
  console.log(`\n=== Processing platform: ${platformId} ===`);
  
  const platform = SUPPORTED_PLATFORMS.find(p => p.identifier === platformId);
  if (!platform) {
    throw new Error(`Platform ${platformId} not found in supported platforms`);
  }
  
  // Create directories
  const tempDir = path.join(PROCESSED_DIR, 'temp', platformId);
  const outputDir = path.join(PROCESSED_DIR, platformId);
  await fsPromises.mkdir(tempDir, { recursive: true });
  await fsPromises.mkdir(outputDir, { recursive: true });
  
  // Get the binaries we need
  const ffmpegName = platform.binaryName.ffmpeg;
  const ffprobeName = platform.binaryName.ffprobe;
  
  // Download primary file (usually ffmpeg or bundle)
  const downloadPath = path.join(tempDir, `download.${downloadSource.format}`);
  await downloadFile(downloadSource.url, downloadPath, downloadSource.options);
  
  // Extract archive
  await extractArchive(downloadPath, tempDir, downloadSource.format);
  
  // Find and copy ffmpeg binary
  let ffmpegPath;
  if (downloadSource.ffmpegPath) {
    if (downloadSource.ffmpegPath.includes('/')) {
      // Try the exact path first
      const exactPath = path.join(tempDir, downloadSource.ffmpegPath);
      if (await fileExists(exactPath)) {
        ffmpegPath = exactPath;
      }
    }
    
    // Fall back to searching if exact path didn't work
    if (!ffmpegPath) {
      ffmpegPath = await findBinary(tempDir, path.basename(downloadSource.ffmpegPath));
    }
  }
  
  // Handle ffprobe (primary download)
  let ffprobePath;
  if (downloadSource.ffprobePath) {
    if (downloadSource.ffprobePath.includes('/')) {
      // Try the exact path first
      const exactPath = path.join(tempDir, downloadSource.ffprobePath);
      if (await fileExists(exactPath)) {
        ffprobePath = exactPath;
      }
    }
    
    // Fall back to searching if exact path didn't work
    if (!ffprobePath) {
      ffprobePath = await findBinary(tempDir, path.basename(downloadSource.ffprobePath));
    }
  }
  
  // Handle secondary download if needed (for platforms with separate downloads for ffmpeg/ffprobe)
  if (downloadSource.secondaryDownload) {
    console.log('Processing secondary download...');
    const secondaryDownload = downloadSource.secondaryDownload;
    const secondaryPath = path.join(tempDir, `secondary.${secondaryDownload.format || downloadSource.format}`);
    
    try {
      await downloadFile(secondaryDownload.url, secondaryPath, downloadSource.options);
      await extractArchive(secondaryPath, tempDir, secondaryDownload.format || downloadSource.format);
      
      // Determine which binary we're looking for in the secondary download
      const binaryName = path.basename(secondaryDownload.path);
      
      // Find the binary
      const secondaryBinaryPath = await findBinary(tempDir, binaryName);
      
      // Update ffmpeg or ffprobe path as appropriate
      if (secondaryBinaryPath) {
        if (binaryName.toLowerCase().includes('ffprobe')) {
          ffprobePath = secondaryBinaryPath;
        } else if (binaryName.toLowerCase().includes('ffmpeg')) {
          ffmpegPath = secondaryBinaryPath;
        }
      }
    } catch (error) {
      console.error(`Error processing secondary download: ${(error as Error).message}`);
    }
  }
  
  // Copy binaries to output directory
  if (ffmpegPath) {
    await fsPromises.copyFile(ffmpegPath, path.join(outputDir, ffmpegName));
    console.log(`Copied ${ffmpegName} to ${outputDir}`);
  } else {
    console.error(`Could not find ${ffmpegName}`);
  }
  
  if (ffprobePath) {
    await fsPromises.copyFile(ffprobePath, path.join(outputDir, ffprobeName));
    console.log(`Copied ${ffprobeName} to ${outputDir}`);
  } else {
    console.error(`Could not find ${ffprobeName}`);
  }
  
  // Make binaries executable (for non-Windows platforms)
  if (!platformId.startsWith('win32')) {
    if (ffmpegPath) {
      await fsPromises.chmod(path.join(outputDir, ffmpegName), 0o755);
    }
    if (ffprobePath) {
      await fsPromises.chmod(path.join(outputDir, ffprobeName), 0o755);
    }
  }
  
  console.log(`Completed processing for ${platformId}`);
}

/**
 * Main function to process all platforms
 */
async function processAllPlatforms(): Promise<void> {
  console.log('Starting binary processing for all platforms...');

  console.log("cleaning binaries directory")
  fs.rmSync("binaries", {recursive: true, force: true})
  
  // Create the processed directory
  await fsPromises.mkdir(PROCESSED_DIR, { recursive: true });
  
  // Process each platform
  for (const platformId of Object.keys(DOWNLOAD_SOURCES)) {
    try {
      await processPlatform(platformId, DOWNLOAD_SOURCES[platformId]);
    } catch (error) {
      console.error(`Error processing ${platformId}: ${(error as Error).message}`);
    }
  }
  
  console.log('\nAll platforms processed. Binaries are ready for upload to GitHub releases.');
  console.log(`Processed binaries are in: ${PROCESSED_DIR}`);
}

// Run the script
processAllPlatforms().catch(error => {
  console.error(`Processing failed: ${error.message}`);
  process.exit(1);
}).finally(() => {
  console.log("removing temp folder")
  fs.rmSync('binaries/temp', {recursive: true, force: true})
});