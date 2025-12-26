# FusionForms Deployment Guide

## Server Setup (Ubuntu VM)

FusionForms is deployed on the Ubuntu VM and served via the main dev-codex nginx configuration on standard HTTP port 80.

### Access URLs

- **Production**: http://dev-codex.idoxgroup.local/fusionforms/

### File Locations

- **Application files**: `/home/IDOXGROUP.LOCAL/chris.brighouse/production/fusionforms/dist`
- **Nginx config**: `/etc/nginx/sites-available/dev-codex` (shared with other apps)
- **Dev server**: Port 5174 (when running `npm run dev`)

## Deployment Process

### Standard Deployment

Deploy the application to production:

```bash
./deploy.sh
```

This script will:
1. Build the production version (`npm run build`)
2. Deploy to `/home/IDOXGROUP.LOCAL/chris.brighouse/production/fusionforms/dist`
3. Reload nginx

The application will be immediately accessible at http://dev-codex.idoxgroup.local/fusionforms/

### Manual Deployment

If you need to deploy manually:

```bash
# 1. Build the application
npm run build

# 2. Copy files to web directory
sudo rm -rf /var/www/fusionforms/*
sudo cp -r dist/* /var/www/fusionforms/
sudo chown -R www-data:www-data /var/www/fusionforms

# 3. Reload nginx
sudo systemctl reload nginx
```

## Nginx Configuration

FusionForms is served via the main `/etc/nginx/sites-available/dev-codex` configuration alongside other applications (graphcycle, datafix).

The relevant nginx location block:

```nginx
location /fusionforms {
    alias /home/IDOXGROUP.LOCAL/chris.brighouse/production/fusionforms/dist;
    try_files $uri $uri/ /fusionforms/index.html;
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
The nginx configuration is shared with other applications. To modify only the FusionForms section:

```bash
# Edit the dev-codex configuration
sudo nano /etc/nginx/sites-available/dev-codex

# Find the "# fusionforms production" section
# Make your changes

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

Or use the update script to fix common issues:

```bash
./update-nginx.sh

# Apply the configuration
./update-nginx.sh

# Or manually:
sudo cp nginx-fusionforms.conf /etc/nginx/sites-available/fusionforms
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Certificate

A self-signed SSL certificate is used. Browsers will show a security warning - this is expected for development.

### Renewing SSL Certificate

```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/fusionforms-selfsigned.key \
  -out /etc/ssl/certs/fusionforms-selfsigned.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=dev-codex.idoxgroup.local"

sudo systemctl reload nginx
```

## TApplication not loading or assets returning 404

This usually means the nginx path doesn't match the Vite `base` configuration.

**Check 1**: Verify nginx serves at `/fusionforms/`
```bash
curl -I https://dev-codex.idoxgroup.local:8444/fusionforms/
# Should return 200 OK
```

**Check 2**: Verify asset paths in index.html
```bash
grep 'src=' /var/www/fusionforms/index.html
# Should show paths like /fusionforms/assets/...
```

**Fix**: Run `./update-nginx.sh` to update the nginx configuration.

### roubleshooting

### Check nginx status
```bash
sudo systemctl status nginx
```

### View nginx error logs
```bash
sudo tail -f /var/log/nginx/error.log
```

### Check if ports are listening
```bash
ss -tuln | grep -E ':(8081|8444)'
```

### Test nginx configuration
```bash
sudo nginx -t
```

### Verify file permissions
```bash
ls -la /var/www/fusionforms/
```

## Related Projects

Other projects on the same VM:
- **datafix**: ports 8080 (HTTP), 8443 (HTTPS)
- **graphcycle**: (location TBD)

## Notes

- Node version warning during build (using 18.19.1, Vite 7 recommends ≥20.19) is non-critical
- The application is a React SPA with client-side routing
- All API calls are client-side only (no backend server required)
