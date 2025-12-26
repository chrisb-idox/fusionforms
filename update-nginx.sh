#!/bin/bash
# Update nginx configuration for FusionForms in dev-codex config
# Fixes the try_files directive to properly serve the SPA

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Updating nginx configuration for FusionForms...${NC}"

# Backup current config
echo -e "${BLUE}Backing up current dev-codex configuration...${NC}"
sudo cp /etc/nginx/sites-available/dev-codex /etc/nginx/sites-available/dev-codex.backup.$(date +%Y%m%d-%H%M%S)

# Update the fusionforms location block in dev-codex config
echo -e "${BLUE}Updating fusionforms location block...${NC}"
sudo sed -i '/# fusionforms production/,/^    }$/ {
    /try_files/ s|try_files $uri $uri/ /index.html =404;|try_files $uri $uri/ /fusionforms/index.html;|
}' /etc/nginx/sites-available/dev-codex

# Test configuration
echo -e "${BLUE}Testing nginx configuration...${NC}"
sudo nginx -t

# Reload nginx
echo -e "${BLUE}Reloading nginx...${NC}"
sudo systemctl reload nginx

echo -e "${GREEN}Nginx configuration updated successfully!${NC}"
echo -e "${GREEN}Access the application at:${NC}"
echo -e "  HTTP:  http://dev-codex.idoxgroup.local/fusionforms/"
echo -e ""
echo -e "${YELLOW}Note: The app is served from port 80 via the dev-codex nginx config${NC}"
