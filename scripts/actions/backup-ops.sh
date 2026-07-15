#!/bin/bash
set -e

PROJECT_DIR="/home/$REMOTE_USER/projects/null-void"
BACKUP_DIR="$PROJECT_DIR/backup"


if [ -d "$PROJECT_DIR" ] && [ "$(ls -A $PROJECT_DIR 2>/dev/null)" ]; then
  echo "Backing up current deployment..."
  mkdir -p "$BACKUP_DIR"

  rsync -a --exclude='backup/' --exclude='.env.server' --exclude='.env.processor' "$PROJECT_DIR/" "$BACKUP_DIR/"
  echo "Backup complete"
else
  echo "No existing deployment found, skipping backup"
  mkdir -p "$PROJECT_DIR"
fi