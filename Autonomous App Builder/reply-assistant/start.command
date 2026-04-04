#!/bin/bash
cd "$(dirname "$0")"
echo "Installing dependencies..."
npm install
echo ""
echo "Starting Reply Assistant dev server..."
echo "Open http://localhost:5173 in your browser"
echo ""
npm run dev
