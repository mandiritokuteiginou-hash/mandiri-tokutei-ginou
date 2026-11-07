# reel-editor

Pipeline: **yt-dlp** (download referensi) -> **FFmpeg** (ekstrak audio) -> **Whisper** (subtitle) -> **Remotion / HyperFrames** (edit & render).

## Setup
```bash
npm install
pip3 install yt-dlp openai-whisper   # butuh ffmpeg di PATH
npm i -g hyperframes
```

## Pakai
```bash
npm run dl -- "<url reel>" reel_favorit     # -> references/reel_favorit.mp4
npm run transcribe -- references/reel_favorit.mp4   # -> downloads/*.srt
npm run studio                              # preview Remotion
npm run render                              # -> out/reel.mp4
npm run hf:init                             # scaffold HyperFrames (HTML composition)
```
Unduh hanya konten yang kamu punya hak pakai.
