#!/bin/bash

# This script copies the Prisma schema to the container

# Create a temporary directory
mkdir -p ./tmp/prisma

# Copy the schema.prisma file to the temporary directory
cp ./prisma/schema.prisma ./tmp/prisma/

# Copy the schema.prisma file to the container
docker cp ./tmp/prisma search-box-app-1:/app/

# Set the correct permissions
docker exec -it search-box-app-1 chown -R nextjs:nodejs /app/prisma

# Clean up
rm -rf ./tmp

echo "Prisma schema copied to the container"

# Restart the app container
docker-compose restart app
