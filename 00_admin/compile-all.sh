#!/bin/bash

# Compile project-a
echo "Compiling project-a..."
cd project-a
echo "y" | npm run compile

# Check if compilation was successful
if [ $? -ne 0 ]; then
  echo "Error: Failed to compile project-a"
  exit 1
fi

# Compile project-b
echo "Compiling project-b..."
cd ../project-b
echo "y" | npm run compile

# Check if compilation was successful
if [ $? -ne 0 ]; then
  echo "Error: Failed to compile project-b"
  exit 1
fi

echo "Successfully compiled all projects"