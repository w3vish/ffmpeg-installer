# @w3vish/ffmpeg-installer

[![npm version](https://img.shields.io/npm/v/@w3vish/ffmpeg-installer.svg)](https://www.npmjs.com/package/@w3vish/ffmpeg-installer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A cross-platform FFmpeg binary installer for Node.js applications. This package provides a simple way to download and configure FFmpeg binaries for your platform, making it easy to use FFmpeg in your Node.js projects without manual installation.

## ⚠️ ESM Only
**This package only supports ES Modules**. CommonJS require() is not supported.

## Installation

```bash
# Install the package
npm install @w3vish/ffmpeg-installer
```

After installation, run the CLI tool to install binaries:

```bash
# Install binaries via CLI
npx @w3vish/ffmpeg-installer
```

The CLI will prompt you to select which components to install:
1. FFmpeg and FFprobe (default)
2. FFmpeg only
3. FFprobe only

## Usage

```javascript
// Import the package
import FFmpegInstaller from '@w3vish/ffmpeg-installer';

// Access the data directly
console.log('FFmpeg path:', FFmpegInstaller.ffmpeg.path);
console.log('FFprobe path:', FFmpegInstaller.ffprobe.path);
console.log('FFmpeg version:', FFmpegInstaller.ffmpeg.version);
console.log('Platform:', FFmpegInstaller.platform);
console.log('Architecture:', FFmpegInstaller.arch);
```

### With child_process

```javascript
import { spawn } from 'child_process';
import FFmpegInstaller from '@w3vish/ffmpeg-installer';

const process = spawn(FFmpegInstaller.ffmpeg.path, [
  '-i', 'input.mp4',
  '-c:v', 'libx264',
  'output.mp4'
]);

process.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
});
```

### With fluent-ffmpeg

```javascript
import ffmpeg from 'fluent-ffmpeg';
import FFmpegInstaller from '@w3vish/ffmpeg-installer';

// Set paths
ffmpeg.setFfmpegPath(FFmpegInstaller.ffmpeg.path);
ffmpeg.setFfprobePath(FFmpegInstaller.ffprobe.path);

// Use fluent-ffmpeg
ffmpeg('input.mp4')
  .output('output.mp4')
  .on('end', () => {
    console.log('Conversion finished');
  })
  .run();
```

## CLI Options

When running the installer CLI, you can specify options:

```bash
npx @w3vish/ffmpeg-installer --platform=darwin-arm64 --ffmpeg-only
```

Available options:
- `--platform=<platform>`: Specify platform (win32-x64, darwin-arm64, linux-x64, etc.)
- `--ffmpeg-only`: Install only FFmpeg
- `--ffprobe-only`: Install only FFprobe

## Supported Platforms

- Windows (win32-x64, win32-ia32)
- macOS (darwin-x64, darwin-arm64)
- Linux (linux-x64, linux-arm64, linux-armv7l)

## Return Object Structure

The package exports an `FFmpegInstaller` object with this structure:

```javascript
{
  ffmpeg: {
    path: '/path/to/ffmpeg',
    version: 'v1.0.0',
    url: 'https://github.com/w3vish/ffmpeg-installer/releases/download/v1.0.0/linux-x64-ffmpeg'
  },
  ffprobe: {
    path: '/path/to/ffprobe',
    version: 'v1.0.0',
    url: 'https://github.com/w3vish/ffmpeg-installer/releases/download/v1.0.0/linux-x64-ffprobe'
  },
  platform: 'linux',
  arch: 'x64'
}
```

## TypeScript Types

The package includes TypeScript definitions:

```typescript
// Main installer result
export interface FFmpegInstaller {
  ffmpeg?: BinaryInfo;
  ffprobe?: BinaryInfo;
  platform: string;
  arch: string;
}

// Binary information
export interface BinaryInfo {
  path: string;
  version: string;
  url: string;
}
```

## Troubleshooting

### Permission Issues

If you encounter permission errors when running the binaries on Linux/macOS:

```bash
chmod +x /path/to/ffmpeg
chmod +x /path/to/ffprobe
```

### Installation Failures

If the installation fails, try:

```bash
npm install @w3vish/ffmpeg-installer --unsafe-perm
```

## License

MIT