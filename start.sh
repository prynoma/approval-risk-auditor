#!/bin/bash

echo "Installing dependencies..."
bun install

echo "Starting the agent..."
bun run agent
