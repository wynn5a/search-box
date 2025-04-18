#!/bin/bash

# Stop any running containers
docker-compose down

# Build and start the production environment
docker-compose up -d --build

# Show logs
echo "Production environment started. Use the following command to view logs:"
echo "docker-compose logs -f"
