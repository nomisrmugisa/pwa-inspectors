# Ngrok Setup for Remote Testing

**Last Updated:** 2025-12-04  
**Local Port:** 3000 (Vite dev server)

---

## Quick Start Command

```powershell
ngrok http 3000
```

This will expose your localhost:3000 app via a public URL.

---

## Prerequisites

### 1. Install ngrok (if not already installed)

**Option A: Using Chocolatey**
```powershell
choco install ngrok
```

**Option B: Download Manually**
1. Go to https://ngrok.com/download
2. Download Windows version
3. Extract to a folder (e.g., `C:\ngrok`)
4. Add to PATH or run from that folder

### 2. Sign up for ngrok (Free)
1. Go to https://dashboard.ngrok.com/signup
2. Create free account
3. Get your authtoken

### 3. Authenticate ngrok
```powershell
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

---

## Running ngrok

### Basic Command
```powershell
ngrok http 3000
```

### With Custom Subdomain (Requires paid plan)
```powershell
ngrok http 3000 --subdomain=pwa-inspectors
```

### With Basic Auth (Add password protection)
```powershell
ngrok http 3000 --basic-auth="username:password"
```

### With Custom Region
```powershell
ngrok http 3000 --region=eu  # Europe
ngrok http 3000 --region=us  # United States
ngrok http 3000 --region=ap  # Asia/Pacific
```

---

## Expected Output

When you run `ngrok http 3000`, you'll see:

```
ngrok

Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

---

## Important URLs

1. **Public URL:** `https://abc123.ngrok-free.app` (changes each time unless using paid plan)
2. **Web Interface:** `http://127.0.0.1:4040` (ngrok dashboard - shows requests, traffic, etc.)
3. **Local App:** `http://localhost:3000`

---

## Testing Workflow

### Step 1: Keep Dev Server Running
```powershell
# Terminal 1 - Already running
npm run dev
```

### Step 2: Start ngrok in New Terminal
```powershell
# Terminal 2 - New terminal window
ngrok http 3000
```

### Step 3: Share Public URL
Copy the `Forwarding` URL (e.g., `https://abc123.ngrok-free.app`) and share with testers.

### Step 4: Monitor Traffic
Open `http://127.0.0.1:4040` in your browser to see:
- All HTTP requests
- Request/response details
- Replay requests
- Traffic stats

---

## Important Notes for DHIS2 PWA

### ⚠️ CORS and DHIS2 API
Your app proxies requests to `https://qimsdev.5am.co.bw/qims`. When using ngrok:

1. **DHIS2 might need configuration** to accept requests from ngrok domain
2. **Service workers** might behave differently on ngrok URLs
3. **Authentication** tokens stored locally will still work

### ⚠️ HTTPS Certificate
Ngrok provides HTTPS automatically, which is required for:
- Service Workers
- PWA features
- Secure cookies

### ⚠️ Session Persistence
- Free ngrok URLs change every restart
- Use paid plan for consistent URL
- Or share new URL each time

---

## Troubleshooting

### Issue: "command not found: ngrok"
**Solution:** ngrok not in PATH. Either:
- Add ngrok folder to PATH
- Run from ngrok installation folder
- Reinstall using Chocolatey

### Issue: "Tunnel not found"
**Solution:** 
```powershell
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Issue: "Port 3000 already in use"
**Solution:** Your dev server is already running - this is correct! Just run ngrok.

### Issue: DHIS2 API requests fail
**Solution:** 
1. Check if proxy is working locally first
2. Check DHIS2 CORS settings
3. Check ngrok web interface for error details

### Issue: Slow connection
**Solution:**
- Try different region with `--region` flag
- Check network connectivity
- Free tier has bandwidth limits

---

## Advanced Configuration

### Create ngrok.yml Config File

Location: `C:\Users\SK\.ngrok2\ngrok.yml`

```yaml
version: "2"
authtoken: YOUR_AUTH_TOKEN_HERE
tunnels:
  pwa-inspectors:
    proto: http
    addr: 3000
    # Uncomment for custom subdomain (paid plan)
    # subdomain: pwa-inspectors
    # Uncomment for basic auth
    # auth: "username:password"
```

**Run with config:**
```powershell
ngrok start pwa-inspectors
```

---

## Alternative: Cloudflare Tunnel (Free)

If you prefer an alternative to ngrok:

```powershell
# Install Cloudflare Tunnel
npm install -g cloudflared

# Run tunnel
cloudflared tunnel --url http://localhost:3000
```

---

## Security Best Practices

1. ✅ **Don't share URLs publicly** - only with trusted testers
2. ✅ **Use basic auth** for sensitive testing
3. ✅ **Monitor the web interface** at http://127.0.0.1:4040
4. ✅ **Stop ngrok** when not testing (`Ctrl+C`)
5. ⚠️ **URLs contain random strings** but can still be guessed
6. ⚠️ **Free tier is public** - anyone with URL can access

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `ngrok http 3000` | Start basic tunnel |
| `ngrok http 3000 --region=eu` | Use Europe region |
| `ngrok http 3000 --basic-auth="user:pass"` | Add password |
| `Ctrl+C` | Stop ngrok |
| Visit `http://127.0.0.1:4040` | View web dashboard |

---

## Example Testing Session

```powershell
# Terminal 1 - Dev server (already running)
PS C:\Users\SK\Documents\qims\pwa-bots2\pwa-inspectors> npm run dev
# ✅ Running on http://localhost:3000

# Terminal 2 - ngrok
PS C:\Users\SK\Documents\qims\pwa-bots2\pwa-inspectors> ngrok http 3000
# ✅ Public URL: https://abc123.ngrok-free.app

# Share URL with testers
# Monitor at: http://127.0.0.1:4040

# When done testing:
# Press Ctrl+C to stop ngrok
```

---

**Need help?** 
- ngrok docs: https://ngrok.com/docs
- ngrok dashboard: https://dashboard.ngrok.com
