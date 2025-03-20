import os from 'os';
import path from 'path';
import { SUPPORTED_PLATFORMS, BINARIES_DIR } from './constants'
import { PlatformInfo } from './types';

/**
 * Get the current platform information
 * @returns Platform information or null if unsupported
 */
export function getCurrentPlatform(): PlatformInfo | null {
    const platform = os.platform();
    const arch = os.arch();

    return SUPPORTED_PLATFORMS.find((p: any) => p.platform === platform && p.arch === arch) || null;
}

/**
 * Get platform information by identifier
 * @param identifier Platform identifier
 * @returns Platform information or null if not found
 */
export function getPlatformByIdentifier(identifier: string): PlatformInfo | null {
    return SUPPORTED_PLATFORMS.find((p: any) => p.identifier === identifier) || null;
}

/**
 * Get the binary path for a specific platform
 * @param platformIdentifier Platform identifier
 * @param binary Binary type ('ffmpeg' or 'ffprobe')
 * @returns Path to the binary
 */
export function getBinaryPath(platformIdentifier: string, binary: 'ffmpeg' | 'ffprobe'): string {
    const platform = getPlatformByIdentifier(platformIdentifier);

    if (!platform) {
        throw new Error(`Unsupported platform/architecture: ${platformIdentifier}`);
    }

    return path.join(BINARIES_DIR, platformIdentifier, platform.binaryName[binary]);
}

/**
 * Get the directory path for a specific platform
 * @param platformIdentifier Platform identifier
 * @returns Path to the platform directory
 */
export function getPlatformDir(platformIdentifier: string): string {
    return path.join(BINARIES_DIR, platformIdentifier);
}