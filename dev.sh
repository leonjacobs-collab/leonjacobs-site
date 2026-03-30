#!/bin/bash
# Launch Next.js dev server only
# Usage: ./dev.sh
# Stop:  Ctrl+C

DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  Site:   http://localhost:3000"
echo "  Editor: run leon-editor in a separate terminal"
echo ""

cd "$DIR" && npm run dev
