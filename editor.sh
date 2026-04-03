#!/bin/bash
# Launch editor server + client
# Usage: ./editor.sh
# Stop:  Ctrl+C (kills both)

DIR="$(cd "$(dirname "$0")" && pwd)"

trap 'kill 0' EXIT

echo "Starting editor server (port 4445)..."
(cd "$DIR/editor/server" && node index.js) &

echo "Starting editor client (port 4444)..."
(cd "$DIR/editor/client" && npx vite) &

echo ""
echo "  Editor: http://localhost:4444"
echo ""

wait
