#!/usr/bin/env bash
# yt-dlp: download a reference reel. Usage: npm run dl -- <url> [name]
set -euo pipefail
url="${1:?usage: download.sh <url> [name]}"; name="${2:-reel_favorit}"
yt-dlp -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b" --merge-output-format mp4 \
  -o "references/${name}.%(ext)s" "$url"
echo "Saved references/${name}.mp4"
