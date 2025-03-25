#!/bin/bash

# Simple script to serve the API documentation

# Default port
PORT=${1:-8080}

echo "Starting documentation server on port $PORT..."
echo "Access the documentation at: http://localhost:$PORT"

# Check if python3 is installed
if command -v python3 &>/dev/null; then
    # Use Python's built-in HTTP server
    cd "$(dirname "$0")"
    python3 -m http.server $PORT
elif command -v npx &>/dev/null; then
    # Use serve package with npx
    cd "$(dirname "$0")"
    npx serve -p $PORT
else
    echo "Error: This script requires either Python 3 or Node.js with npx."
    echo "Please install one of these tools to serve the documentation."
    exit 1
fi