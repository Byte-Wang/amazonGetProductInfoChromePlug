#!/usr/bin/env bash
set -euo pipefail

if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

ROOT_DIR="$(pwd)"
DIST_DIR="$ROOT_DIR/dist"
mkdir -p "$DIST_DIR"

resolve_cmd_array() {
  if command -v javascript-obfuscator >/dev/null 2>&1; then
    OBFUSCATE_CMD_ARR=(javascript-obfuscator)
    return 0
  fi
  if command -v npx >/dev/null 2>&1; then
    OBFUSCATE_CMD_ARR=(npx javascript-obfuscator)
    return 0
  fi
  if command -v npm >/dev/null 2>&1; then
    OBFUSCATE_CMD_ARR=(npm exec --yes javascript-obfuscator)
    return 0
  fi
  if [ -x "$ROOT_DIR/node_modules/.bin/javascript-obfuscator" ]; then
    OBFUSCATE_CMD_ARR=("$ROOT_DIR/node_modules/.bin/javascript-obfuscator")
    return 0
  fi
  return 1
}

if ! resolve_cmd_array; then
  echo "Error: Could not find a way to run javascript-obfuscator."
  echo "- Ensure Node.js and npm are installed."
  echo "- Optionally run: npm install --save-dev javascript-obfuscator"
  exit 1
fi

find "$ROOT_DIR" -type f -name "*.js" \
  -not -path "$DIST_DIR/*" \
  -not -path "$ROOT_DIR/node_modules/*" \
  -not -path "$ROOT_DIR/.git/*" -print0 | \
while IFS= read -r -d '' SRC; do
  REL="${SRC#$ROOT_DIR/}"
  OUT_DIR="$DIST_DIR/$(dirname "$REL")"
  OUT_FILE="$DIST_DIR/$REL"
  mkdir -p "$OUT_DIR"
  "${OBFUSCATE_CMD_ARR[@]}" "$SRC" \
    --output "$OUT_FILE" \
    --compact true \
    --control-flow-flattening true \
    --dead-code-injection true \
    --string-array true \
    --numbers-to-expressions true \
    --simplify true
done

echo "Obfuscation complete: $DIST_DIR"

# Copy non-JS files preserving structure (exclude pack.sh, node_modules, .git, dist)
find "$ROOT_DIR" -type f \
  -not -path "$DIST_DIR/*" \
  -not -path "$ROOT_DIR/node_modules/*" \
  -not -path "$ROOT_DIR/.git/*" \
  -not -name "*.js" \
  -not -name "*.mjs" \
  -not -name "*.cjs" \
  -not -name "pack.sh" -print0 | \
while IFS= read -r -d '' SRC; do
  REL="${SRC#$ROOT_DIR/}"
  OUT_DIR="$DIST_DIR/$(dirname "$REL")"
  OUT_FILE="$DIST_DIR/$REL"
  mkdir -p "$OUT_DIR"
  cp -p "$SRC" "$OUT_FILE"
done

echo "Copied non-JS files to: $DIST_DIR"
