# Laragon Setup Instructions for Emerald STMS

This document provides instructions for making the Emerald STMS accessible at http://emeraldstms.test in Laragon.

## Quick Setup Steps

### Option 1: Auto Virtual Host (Recommended)

1. **Enable Auto Virtual Hosts in Laragon:**
   - Right-click Laragon tray icon → Preferences
   - Check "Auto create virtual hosts"
   - Document Root should be set to `public` (this makes Apache serve from the Laravel public folder)
   - Click OK

2. **Update hosts file:**
   - Laragon → Menu → Tools → Edit hosts file
   - Add this line if not already present:
     ```
     127.0.0.1 emeraldstms.test
     ```

3. **Restart Laragon:**
   - Right-click Laragon tray icon → Apache → Restart

4. **Visit the site:**
   - Open your browser and go to http://emeraldstms.test

### Option 2: Manual Virtual Host

If auto virtual hosts don't work, use the manual configuration:

1. **Copy the virtual host config:**
   - Copy `emeraldstms.test.conf` from this project root
   - Paste it into `C:\laragon\etc\apache2\sites-enabled\`

2. **Edit hosts file:**
   - Laragon → Menu → Tools → Edit hosts file
   - Add:
     ```
     127.0.0.1 emeraldstms.test
     ```

3. **Restart Apache:**
   - Laragon → Menu → Apache → Restart

4. **Visit the site:**
   - Open browser → http://emeraldstms.test

## Troubleshooting

### Site shows directory listing or 404
- **Cause:** Document root not pointing to `public` folder
- **Fix:** Ensure the virtual host DocumentRoot is `c:/laragon/www/emeraldstms/public`

### "Access forbidden!" error
- **Cause:** Directory permissions issue
- **Fix:** Check that `AllowOverride All` is set in virtual host config

### CSS/JS not loading
- **Cause:** Assets not built
- **Fix:** Run `npm install && npm run build` from project root

### Database connection error
- **Cause:** Database not created or wrong credentials
- **Fix:** 
  - Create database: `emeraldstmsdb`
  - Run migrations: `php artisan migrate`
  - Check `.env` file for correct DB credentials

### Still not working?
1. Check Apache error logs: `C:\laragon\etc\apache2\logs\error.log`
2. Ensure port 80 is not blocked by another application
3. Try accessing directly: http://localhost/emeraldstms/public

## Post-Setup

After the site is accessible, run these commands to ensure everything is set up:

```bash
# Install PHP dependencies
composer install

# Install Node dependencies
npm install

# Build frontend assets
npm run build

# Run database migrations
php artisan migrate

# Start development (runs server + queue + Vite)
composer run dev
```

## Verification

✅ Visit http://emeraldstms.test - should show the application
✅ Check browser console - no 404 errors for assets
✅ Login functionality works
✅ Database connections work

---

**Current Configuration:**
- APP_URL: http://emeraldstms.test
- Project Path: C:\laragon\www\emeraldstms
- Public Folder: C:\laragon\www\emeraldstms\public
