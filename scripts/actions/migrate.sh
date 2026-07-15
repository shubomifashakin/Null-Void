#!/bin/bash
set -e  

echo "Pulling migration image..."
docker pull $DOCKER_USERNAME/null-void-migrate:$CURRENT_SHA

DATABASE_URL=$(doppler secrets get DATABASE_URL --plain --token "$DOPPLER_TOKEN")

echo "Running migrations with Doppler secrets..."
docker run --rm \
  --network system_wide_network \
  -e DATABASE_URL="$DATABASE_URL" \
  $DOCKER_USERNAME/null-void-migrate:$CURRENT_SHA

echo "Migrations completed successfully"