#!/bin/bash

# Stop any running containers
docker-compose -f docker-compose.dev.yml down

# Build and start the development environment
docker-compose -f docker-compose.dev.yml up -d --build

# Show logs
echo "Development environment started. Use the following command to view logs:"
echo "docker-compose -f docker-compose.dev.yml logs -f"
