#!/bin/bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
npx vite build -c ./vite.config.js --base /brain_net_map/
rm -rf ../../dist/brain_net_map
mkdir -p ../../dist
mv ./dist/ ../../dist/brain_net_map
