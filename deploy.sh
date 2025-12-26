#!/bin/bash
# FusionForms Deployment Script
# Builds and deploys the application to production

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DEPLOY_DIR="/home/IDOXGROUP.LOCAL/chris.brighouse/production/fusionforms"

echo -e "${BLUE}Starting FusionForms deployment...${NC}"

# Build the application
echo -e "${BLUE}Building application...${NC}"
npm run build

# Create production directory if it doesn't exist
mkdir -p "$DEPLOY_DIR"

# Copy files to production directory
echo -e "${BLUE}Deploying to $DEPLOY_DIR/dist...${NC}"
rm -rf "$DEPLOY_DIR/dist"
cp -r dist "$DEPLOY_DIR/"

# Reload nginx
echo -e "${BLUE}Reloading nginx...${NC}"
sudo systemctl reload nginx

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Access the application at:${NC}"
echo -e "  HTTP:  http://dev-codex.idoxgroup.local/fusionforms/"
