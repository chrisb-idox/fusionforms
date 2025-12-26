# Deployment Fix - Path Mismatch Issue

## Problem Identified

The FusionForms application was not accessible at `http://dev-codex.idoxgroup.local/fusionforms` because of a **path mismatch** between Vite and nginx configurations.

### Root Cause

1. **Vite Configuration** (`vite.config.ts`):
   - Sets `base: '/fusionforms/'`
   - Builds all assets with `/fusionforms/` prefix
   - Example: `/fusionforms/assets/index-Vtn7IIHn.js`

2. **Nginx Configuration** (before fix):
   - Served files from document root: `/var/www/fusionforms`
   - URL path: `https://dev-codex.idoxgroup.local:8444/`
   - **Missing the `/fusionforms/` path segment**

3. **Result**:
   - Browser requested: `/fusionforms/assets/index-xxx.js`
   - Nginx looked for: `/var/www/fusionforms/fusionforms/assets/index-xxx.js`
   - **404 Not Found** - assets couldn't load

## Solution Applied

Updated nginx configuration to serve the application at the `/fusionforms/` URL path:

```nginx
location /fusionforms/ {
    alias /var/www/fusionforms/;
    index index.html;
    try_files $uri $uri/ /fusionforms/index.html;
}
```

This creates the correct mapping:
- URL: `https://dev-codex.idoxgroup.local:8444/fusionforms/assets/index-xxx.js`
- File: `/var/www/fusionforms/assets/index-xxx.js`
- ✅ **Assets load correctly**

## Files Created/Modified

1. **nginx-fusionforms.conf** - Corrected nginx configuration template
2. **update-nginx.sh** - Script to apply nginx configuration
3. **DEPLOYMENT.md** - Updated with correct URLs and troubleshooting
4. **deploy.sh** - Updated to show correct URLs
5. **AGENTS.md** - Updated production URLs

## How to Fix

Run these commands to apply the fix:

```bash
# 1. Update nginx configuration
./update-nginx.sh

# 2. Verify deployment is current
./deploy.sh
```

## Correct URLs

After applying the fix:
- **HTTPS**: https://dev-codex.idoxgroup.local:8444/fusionforms/
- **HTTP**: http://dev-codex.idoxgroup.local:8081/fusionforms/ (redirects to HTTPS)

Note the `/fusionforms/` path in the URL!

## Alternative Solution (Not Recommended)

Instead of fixing nginx, you could change Vite's `base` to `'/'`:

```typescript
// vite.config.ts
export default defineConfig({
  base: '/',  // Changed from '/fusionforms/'
  // ...
})
```

This is **not recommended** because:
- The `/fusionforms/` path provides better organization on shared servers
- Matches the application name convention
- Allows multiple apps on the same domain
- Already documented in integration guides

## Verification

Test that the fix worked:

```bash
# Check nginx config
sudo nginx -t

# Test HTTPS access
curl -I https://dev-codex.idoxgroup.local:8444/fusionforms/

# Check asset paths
cat /var/www/fusionforms/index.html | grep 'src='
```

All asset paths should start with `/fusionforms/` and nginx should return 200 OK.
