# FusionForms Deployment Guide

## Server Setup (Ubuntu VM)

FusionForms is deployed on the Ubuntu VM and accessible via nginx reverse proxy.

### Access URLs

- **HTTP**: http://dev-codex.idoxgroup.local:8081 (redirects to HTTPS)
- **HTTPS**: https://dev-codex.idoxgroup.local:8444

### Ports

- Port 8081: HTTP (redirects to HTTPS)
- Port 8444: HTTPS with SSL

### File Locations

- **Application files**: `/var/www/fusionforms/`
- **Nginx config**: `/etc/nginx/sites-available/fusionforms`
- **SSL certificate**: `/etc/ssl/certs/fusionforms-selfsigned.crt`
- **SSL key**: `/etc/ssl/private/fusionforms-selfsigned.key`

## Deployment Process

### Quick Deployment

Use the deployment script:

```bash
./deploy.sh
```

This script will:
1. Build the production version
2. Deploy to `/var/www/fusionforms/`
3. Set proper permissions
4. Reload nginx

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

The nginx configuration (`/etc/nginx/sites-available/fusionforms`) includes:

- SSL/TLS with self-signed certificate
- HTTP to HTTPS redirect
- Static file caching (1 year for assets)
- SPA routing support (all routes serve index.html)

### Modifying Nginx Config

```bash
# Edit configuration
sudo nano /etc/nginx/sites-available/fusionforms

# Test configuration
sudo nginx -t

# Reload nginx
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

## Troubleshooting

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
