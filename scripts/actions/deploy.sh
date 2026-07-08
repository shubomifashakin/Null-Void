#!/bin/bash

set -e

echo "Deploying to server..."

cd /home/${REMOTE_USER}/projects/null-void/
docker compose pull
docker compose up -d --force-recreate
docker compose logs --tail=50

docker exec nginx nginx -t
docker exec nginx nginx -s reload

echo "Successfully deployed to server"