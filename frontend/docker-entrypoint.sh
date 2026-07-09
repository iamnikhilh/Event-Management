#!/bin/sh
set -eu

HTML_DIR="/usr/share/nginx/html"
RUNTIME_FILE="${HTML_DIR}/runtime-config.js"

if [ -n "${API_BASE_URL:-}" ]; then
  escaped=$(printf '%s' "$API_BASE_URL" | sed 's/\\/\\\\/g; s/"/\\"/g')
  printf 'window.__API_BASE_URL__="%s";\n' "$escaped" > "$RUNTIME_FILE"
else
  printf 'window.__API_BASE_URL__="";\n' > "$RUNTIME_FILE"
fi

exec "$@"
