#!/usr/bin/env bash
# Downloads the standalone Piper TTS binary and a default voice model into
# vendor/piper/. Idempotent — safe to re-run; skips anything already present.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENDOR_DIR="${REPO_ROOT}/vendor/piper"
VOICES_DIR="${VENDOR_DIR}/voices"

PIPER_RELEASE_URL="https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz"
VOICE_NAME="en_GB-alan-medium"
VOICE_BASE_URL="https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alan/medium"

mkdir -p "$VENDOR_DIR" "$VOICES_DIR"

if [ -x "${VENDOR_DIR}/piper" ]; then
  echo "Piper binary already present at ${VENDOR_DIR}/piper"
else
  echo "Downloading Piper binary..."
  curl -L --fail -o /tmp/piper.tar.gz "$PIPER_RELEASE_URL"
  tar -xzf /tmp/piper.tar.gz -C "$VENDOR_DIR" --strip-components=1
  rm -f /tmp/piper.tar.gz
  echo "Installed Piper binary at ${VENDOR_DIR}/piper"
fi

if [ -f "${VOICES_DIR}/${VOICE_NAME}.onnx" ] && [ -f "${VOICES_DIR}/${VOICE_NAME}.onnx.json" ]; then
  echo "Voice model already present at ${VOICES_DIR}/${VOICE_NAME}.onnx"
else
  echo "Downloading voice model (${VOICE_NAME}, ~63MB)..."
  curl -L --fail -o "${VOICES_DIR}/${VOICE_NAME}.onnx" "${VOICE_BASE_URL}/${VOICE_NAME}.onnx"
  curl -L --fail -o "${VOICES_DIR}/${VOICE_NAME}.onnx.json" "${VOICE_BASE_URL}/${VOICE_NAME}.onnx.json"
  echo "Installed voice model at ${VOICES_DIR}/${VOICE_NAME}.onnx"
fi

echo "Done. Piper binary: ${VENDOR_DIR}/piper"
echo "      Voice model:  ${VOICES_DIR}/${VOICE_NAME}.onnx"
