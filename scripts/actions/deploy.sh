#!/bin/bash

echo "Deploying to server..."

PROJECT_DIR="/home/${REMOTE_USER}/projects/null-void"
SHA_FILE="$PROJECT_DIR/.last_deployment_sha"
SERVER_ENV_FILE="$PROJECT_DIR/.env.server"
PROCESSOR_ENV_FILE="$PROJECT_DIR/.env.processor"
BACKUP_DIR="$PROJECT_DIR/backup"

trap "rm -f $SERVER_ENV_FILE $PROCESSOR_ENV_FILE" EXIT

echo "Generating .env from doppler"
doppler secrets download \
  --token "$SERVER_DOPPLER_TOKEN" \
  --format env \
  --no-file \
  > "$SERVER_ENV_FILE"

if [ $? -ne 0 ]; then
    echo "Failed to pull server secrets from doppler"
    exit 1
fi

doppler secrets download \
  --token "$PROCESSOR_DOPPLER_TOKEN" \
  --format env \
  --no-file \
  > "$PROCESSOR_ENV_FILE"

if [ $? -ne 0 ]; then
    echo "Failed to pull processor secrets from doppler"
    exit 1
fi

chmod 600 "$SERVER_ENV_FILE"
chmod 600 "$PROCESSOR_ENV_FILE"

cd $PROJECT_DIR

if [ $? -ne 0 ]; then
    echo "Failed to change directory to $PROJECT_DIR"
    exit 1
fi

docker compose up --pull always -d --force-recreate --wait --wait-timeout=90

PULL_EXIT_CODE=$?

docker compose logs --tail=50

# successful deployment branch
if [ $PULL_EXIT_CODE -eq 0 ]; then
    echo "Deployment successful"

    echo "Backing up Deployment SHA"
    echo "${CURRENT_SHA}" > "$SHA_FILE"

    echo "Reloading nginx"
    docker exec nginx nginx -s reload

    if [ $? -eq 0 ]; then
        echo "Nginx reloaded successfully"
        echo "Deployment completed successfully"
        exit 0
    fi

    echo "Failed to reload nginx, manual intervention required"
    exit 1
fi

echo "Deployment failed, attempting rollback..."

echo "Checking if backup exists"

# if backup directory does not exist or no files in the backup dir, dont bother trying ti restore, just exit
if [ ! -d ${BACKUP_DIR} ] || [ ! "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
    echo "No backup exists, cannot restore! Manual intervention needed"
    exit 1
fi

# if theres no previous sha to pin images to, then restore cannot prcoeed
if [ ! -f "$BACKUP_DIR/.last_deployment_sha" ]; then
    echo "No previous deployment SHA found, cannot pin images. Manual intervention required"
    exit 1
fi

# if backup exists, restore it
echo "Backup exists, restoring..."

# Copy backup files to project directory
rsync -a --exclude='backup/' "$BACKUP_DIR/" "$PROJECT_DIR/"

echo "Pinning image tags to last deployment sha"
LAST_DEPLOYED_SHA=$(cat "$BACKUP_DIR/.last_deployment_sha")

sed -i "s|${DOCKER_USERNAME}/null-void-server:latest|${DOCKER_USERNAME}/null-void-server:${LAST_DEPLOYED_SHA}|g" "$PROJECT_DIR/docker-compose.yml"
sed -i "s|${DOCKER_USERNAME}/null-void-processor:latest|${DOCKER_USERNAME}/null-void-processor:${LAST_DEPLOYED_SHA}|g" "$PROJECT_DIR/docker-compose.yml"
   
echo "starting services with pinned image tags"
docker compose up -d --pull always --force-recreate --wait --wait-timeout=90

ROLLBACK_EXIT_CODE=$?

docker compose logs --tail=50

if [ $ROLLBACK_EXIT_CODE -eq 0 ]; then
    echo "Rollback successful, previous version is running"

    echo "Reloading nginx"
    docker exec nginx nginx -s reload
else
    echo "Rollback also failed, manual intervention required"
fi


exit 1
