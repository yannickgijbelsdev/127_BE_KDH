#!/bin/bash

# Script to update all logo URLs and build versions

OLD_LOGO="https://customer-assets.emergentagent.com/job_053c424a-d7ee-4a13-a916-f7596c34862b/artifacts/qy7ga8qf_2025_Logo_127.png"
NEW_LOGO="https://customer-assets.emergentagent.com/job_tool-metrics/artifacts/w5126i9x_127_2025_Official_Logo.png"

# Update logo in all component files
find /app/frontend/src/components -type f -name "*.jsx" -exec sed -i "s|${OLD_LOGO}|${NEW_LOGO}|g" {} \;

# Update BUILD_VERSION from 1.5.0 to 1.6.0
find /app/frontend/src/components -type f -name "*.jsx" -exec sed -i "s/const BUILD_VERSION = '1.5.0'/const BUILD_VERSION = '1.6.0'/g" {} \;

echo "✅ Logo and build version updated in all files"
