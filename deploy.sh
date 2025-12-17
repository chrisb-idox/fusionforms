#!/bin/bash
# FusionForms Deployment Script
# Builds and deploys the application to /var/www/fusionforms

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting FusionForms deployment...${NC}"

# Build the application
echo -e "${BLUE}Building application...${NC}"
npm run build

# Copy files to web directory
echo -e "${BLUE}Deploying to /var/www/fusionforms...${NC}"
sudo rm -rf /var/www/fusionforms/*
sudo cp -r dist/* /var/www/fusionforms/
sudo chown -R www-data:www-data /var/www/fusionforms

# Reload nginx
echo -e "${BLUE}Reloading nginx...${NC}"
sudo systemctl reload nginx

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Access the application at:${NC}"
echo -e "  HTTP:  http://dev-codex.idoxgroup.local:8081"
echo -e "  HTTPS: https://dev-codex.idoxgroup.local:8444"
