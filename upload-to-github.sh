#!/bin/bash

# Script to upload processed binaries to GitHub Releases
# You'll need GitHub CLI (gh) installed: https://cli.github.com/manual/installation

# Configuration
RELEASE_TAG="v1.0.0"
RELEASE_NAME="FFmpeg Binaries v1.0.0"
RELEASE_NOTES="Pre-compiled FFmpeg binaries for multiple platforms"
PROCESSED_DIR="./binaries"

# Create a new release
echo "Creating GitHub release ${RELEASE_TAG}..."
gh release create $RELEASE_TAG \
  --title "$RELEASE_NAME" \
  --notes "$RELEASE_NOTES"

# Upload each platform's binaries
for platform_dir in "$PROCESSED_DIR"/*/; do
  platform=$(basename "$platform_dir")
  
  echo "Uploading binaries for ${platform}..."
  
  # Upload each binary in the platform directory
  for binary in "$platform_dir"/*; do
    binary_name=$(basename "$binary")
    new_name="${platform}-${binary_name}"  # Rename binary to include platform

    # Copy to a temporary location with the new name
    temp_binary="/tmp/${new_name}"
    cp "$binary" "$temp_binary"

    # Upload with new name
    gh release upload $RELEASE_TAG "$temp_binary" --clobber
      
    echo "Uploaded ${new_name}"
  done
done

echo "All binaries uploaded to GitHub release ${RELEASE_TAG}"
