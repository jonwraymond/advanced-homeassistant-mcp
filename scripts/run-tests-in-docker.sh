#!/bin/bash
# scripts/run-tests-in-docker.sh

set -e

# Build and start the test containers
echo "Building and starting test containers..."
docker-compose -f docker-compose.test.yml build
docker-compose -f docker-compose.test.yml up -d mockha

# Wait for mock Home Assistant to start
echo "Waiting for mock Home Assistant to initialize..."
sleep 5

# Run the tests
echo "Running tests..."
docker-compose -f docker-compose.test.yml run --rm test

# Capture exit code
EXIT_CODE=$?

# Stop all containers
echo "Stopping test containers..."
docker-compose -f docker-compose.test.yml down

# Exit with the test exit code
exit $EXIT_CODE