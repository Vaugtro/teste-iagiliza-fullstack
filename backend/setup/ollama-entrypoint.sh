#!/bin/bash
set -e

# 1. Start the ollama server in the background
echo "Starting Ollama server in background..."
/bin/ollama serve &
pid=$!

# 2. Wait for the server to be ready
echo "Waiting for server to become healthy..."
# Use "ollama list" as the health check.
# This will fail until the server is ready to accept connections.
# We redirect stdout (>) and stderr (2>&1) to /dev/null to keep the log clean.
until ollama list > /dev/null 2>&1; do
    echo "Server not ready yet. Waiting 1 second..."
    sleep 1
done

echo "Ollama server is healthy!"

# 3. Pull the qwen3:8b model (now that the server is running)
echo "Pulling qwen3:8b model..."
ollama pull qwen3:8b
echo "qwen3:8b: pull complete."

# 4. Bring the server process to the foreground / wait for it
echo "Server is running."
wait $pid