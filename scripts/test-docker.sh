#!/bin/bash

# Copy the test environment file
cp .env.docker.test .env

# Run Docker Compose with the dev configuration
docker-compose -f docker-compose.dev.yml up --build
