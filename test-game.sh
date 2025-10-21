#!/bin/bash

echo "🎮 Animal Jenga Game - Test Runner"
echo "===================================="
echo ""

# Check if files exist
echo "📁 Checking game files..."
files=("index.html" "game.js" "style.css" "README.md")
all_exist=true

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file exists"
    else
        echo "✗ $file is missing!"
        all_exist=false
    fi
done

echo ""

if [ "$all_exist" = true ]; then
    echo "✓ All files present!"
    echo ""
    echo "🚀 Starting local web server on port 8000..."
    echo ""
    echo "Open your browser and go to:"
    echo "👉 http://localhost:8000"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""

    python3 -m http.server 8000
else
    echo "✗ Some files are missing. Please check the installation."
    exit 1
fi
