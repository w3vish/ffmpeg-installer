# FFmpeg Installer

[![npm version](https://img.shields.io/npm/v/ffmpeg-installer.svg)](https://www.npmjs.com/package/ffmpeg-installer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A cross-platform FFmpeg binary installer for Node.js applications. This package automatically downloads and configures FFmpeg binaries for your platform, making it easy to use FFmpeg in your Node.js projects without manual installation.

## Features

- 🚀 Automatic FFmpeg/FFprobe binary installation
- 🔄 Cross-platform support (Windows, macOS, Linux, and more)
- 📦 Simple API for accessing binary paths
- ⚙️ Customizable installation options
- ✨ Optimized download with progress tracking
- 🔍 Flexible - install only what you need (FFmpeg only, FFprobe only, or both)

## Installation

```bash
# Install both FFmpeg and FFprobe (default)
npm install ffmpeg-installer

# Install only FFmpeg
npm install ffmpeg-installer --ffmpeg-only

# Install only FFprobe
npm install ffmpeg-installer --ffprobe-only
```

## Usage

### Basic Usage

```javascript
// ES modules
import ffmpeg from 'ffmpeg-installer';

// CommonJS
const ffmpeg = require('ffmpeg-installer');

console.log('FFmpeg path:', ffmpeg.ffmpegPath);
console.log('FFprobe path:', ffmpeg.ffprobePath);
console.log('FFmpeg version:', ffmpeg.version);
```

### With child_process

```javascript
import { spawn } from 'child_process';
import { ffmpegPath } from 'ffmpeg-installer';

const process = spawn(ffmpegPath, [
  '-i', 'input.mp4',
  '-c:v', 'libx264',
  '-preset', 'fast',
  'output.mp4'
]);

process.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

process.stderr.on('data', (data) => {
  console.log(`stderr: ${data}`);
});

process.on('close', (code) => {
  console.log(`Child process exited with code ${code}`);
});
```

### With fluent-ffmpeg

```javascript
import ffmpeg from 'fluent-ffmpeg';
import { ffmpegPath, ffprobePath } from 'ffmpeg-installer';

// Set paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Use fluent-ffmpeg
ffmpeg('input.mp4')
  .output('output.mp4')
  .on('end', () => {
    console.log('Conversion finished');
  })
  .on('error', (err) => {
    console.error('Error:', err);
  })
  .run();
```

## Advanced Usage

### Custom Platform Installation

You can install binaries for a specific platform by providing the `--platform` flag:

```bash
npm install ffmpeg-installer --platform=win32-x64
```

Supported platforms:
- `win32-x64` - Windows 64-bit
- `win32-ia32` - Windows 32-bit
- `darwin-x64` - macOS 64-bit
- `darwin-arm64` - macOS Apple Silicon
- `linux-x64` - Linux 64-bit
- `linux-arm64` - Linux ARM 64-bit
- `linux-armv7l` - Linux ARM v7

### Install Only What You Need

You can choose to install only FFmpeg or only FFprobe:

```bash
# FFmpeg only
npm install ffmpeg-installer --ffmpeg-only

# FFprobe only
npm install ffmpeg-installer --ffprobe-only

# Combine with platform specific installation
npm install ffmpeg-installer --platform=darwin-arm64 --ffmpeg-only
```

## API

The package exports the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `path` | `string` | Path to the FFmpeg binary (alias for `ffmpegPath`) |
| `ffmpegPath` | `string` | Path to the FFmpeg binary |
| `ffprobePath` | `string` | Path to the FFprobe binary |
| `version` | `string` | Version of the FFmpeg binaries |
| `url` | `string` | URL from where the binaries were downloaded |
| `platform` | `string` | Current platform identifier |
| `arch` | `string` | Current architecture identifier |

## How It Works

This package follows these steps during installation:

1. **Platform Detection**: Automatically identifies your system's platform and architecture
2. **Download**: Fetches the appropriate FFmpeg binaries from reliable sources
3. **Extraction**: Unpacks the downloaded archive
4. **Configuration**: Sets up the binaries and creates a configuration file
5. **Cleanup**: Removes temporary files

The downloaded binaries are stored in a platform-specific directory within the package, making them accessible across your application.

## Troubleshooting

### Permission Issues

If you encounter permission errors when running the binaries:

```bash
# For Linux/macOS
chmod +x /path/to/ffmpeg
chmod +x /path/to/ffprobe
```

### Installation Failures

If the installation fails, you can try:

```bash
npm install ffmpeg-installer --unsafe-perm
```

### Custom Binary Location

If you have FFmpeg binaries installed elsewhere, you can manually set the path in your app:

```javascript
import { spawn } from 'child_process';

// Override the path
const ffmpegPath = '/custom/path/to/ffmpeg';
const process = spawn(ffmpegPath, [...your args]);
```

## License

MIT © Vishal Suryavanshi