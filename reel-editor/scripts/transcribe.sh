#!/usr/bin/env bash
# FFmpeg extracts audio, Whisper transcribes. Usage: npm run transcribe -- <video> [model]
set -euo pipefail
in="${1:?usage: transcribe.sh <video> [model]}"; model="${2:-base}"
base="$(basename "${in%.*}")"
ffmpeg -y -i "$in" -vn -ac 1 -ar 16000 "downloads/${base}.wav"
whisper "downloads/${base}.wav" --model "$model" --output_format srt --output_dir downloads
echo "Subtitle: downloads/${base}.srt"
