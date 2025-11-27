# Remote Access Setup Guide

## 🌐 How to Make Your App Accessible Remotely

Your app is currently running on `localhost:3000`. Here are several options to make it accessible to remote testers, ranked from easiest to most permanent.

---

## ✨ Option 1: ngrok (RECOMMENDED - Fastest & Easiest)

**Best for:** Quick testing, demos, temporary access  
**Time to setup:** 2 minutes  
**Cost:** Free tier available

### Steps:

1. **Install ngrok:**
   ```powershell
   # Using Chocolatey (if you have it)
   choco install ngrok
   
   # OR download from: https://ngrok.com/download
   # Extract and add to PATH
   ```

2. **Start ngrok tunnel:**
   ```powershell
   ngrok http 3000
   ```

3. **Share the URL:**
   - ngrok will display a public URL like: `https://abc123.ngrok.io`
   - Share this URL with your testers
   - It will tunnel to your localhost:3000

### Pros:
✅ Instant setup  
✅ HTTPS by default  
✅ No firewall configuration needed  
✅ Works behind corporate firewalls  
✅ Provides inspection UI to see requests  

### Cons:
❌ URL changes every time you restart (free tier)  
❌ Session expires after 2 hours (free tier)  
❌ Limited to 40 connections/minute (free tier)  

### ngrok Commands:
```powershell
# Basic tunnel
ngrok http 3000

# With custom subdomain (requires paid plan)
ngrok http 3000 --subdomain=my-app

# With authentication
ngrok http 3000 --auth="username:password"
```

---

## 🚀 Option 2: Cloudflare Tunnel (FREE & Reliable)

**Best for:** Longer testing periods, more professional URLs  
**Time to setup:** 5 minutes  
**Cost:** Completely FREE

### Steps:

1. **Install Cloudflare Tunnel (cloudflared):**
   ```powershell
   # Download from: https://github.com/cloudflare/cloudflared/releases
   # Or use winget:
   winget install --id Cloudflare.cloudflared
   ```

2. **Create a tunnel:**
   ```powershell
   cloudflared tunnel --url http://localhost:3000
   ```

3. **Share the URL:**
   - Cloudflare will give you a URL like: `https://random-name.trycloudflare.com`
   - Share this with testers

### Pros:
✅ Completely FREE  
✅ No account required for quick tunnels  
✅ HTTPS by default  
✅ More reliable than ngrok free tier  
✅ No connection limits  

### Cons:
❌ URL changes each time (unless you configure a named tunnel)  
❌ Requires cloudflared to be running  

### For Permanent URL (with Cloudflare account):
```powershell
# Login to Cloudflare
cloudflared tunnel login

# Create named tunnel
cloudflared tunnel create pwa-inspectors

# Run tunnel
cloudflared tunnel --url http://localhost:3000 run pwa-inspectors
```

---

## 🔧 Option 3: LocalTunnel (Simple Alternative)

**Best for:** Quick sharing without installation  
**Time to setup:** 1 minute  
**Cost:** FREE

### Steps:

1. **Install localtunnel globally:**
   ```powershell
   npm install -g localtunnel
   ```

2. **Start tunnel:**
   ```powershell
   lt --port 3000
   ```

3. **Optional - custom subdomain:**
   ```powershell
   lt --port 3000 --subdomain pwa-inspectors
   ```

### Pros:
✅ Very simple  
✅ NPM-based (familiar for developers)  
✅ Can request custom subdomain  

### Cons:
❌ Less reliable than ngrok/Cloudflare  
❌ Sometimes requires password on first visit  
❌ Can be slow  

---

## 🏠 Option 4: Network Access (LAN)

**Best for:** Testing on same network (office/home)  
**Time to setup:** Immediate  
**Cost:** FREE

### Your app is already configured for this!

1. **Find your local IP address:**
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" (usually something like `192.168.1.x`)

2. **Share the URL:**
   ```
   http://YOUR-IP-ADDRESS:3000
   ```
   Example: `http://192.168.1.100:3000`

3. **Testers must be on the same network** (same WiFi/LAN)

### Pros:
✅ No external tools needed  
✅ Fast and reliable  
✅ Already configured in your vite.config.js  

### Cons:
❌ Only works on same network  
❌ Requires firewall configuration  
❌ Not accessible from internet  

### Windows Firewall Configuration:
```powershell
# Allow Node.js through firewall
New-NetFirewallRule -DisplayName "Node.js Server" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

---

## 🌍 Option 5: Deploy to Cloud (Production)

**Best for:** Long-term testing, production use  
**Time to setup:** 15-30 minutes  
**Cost:** FREE tier available on most platforms

### Recommended Platforms:

### A. **Vercel** (Easiest for React/Vite)
```powershell
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts, it will give you a URL like:
# https://pwa-inspectors.vercel.app
```

### B. **Netlify**
```powershell
# Install Netlify CLI
npm install -g netlify-cli

# Build your app
npm run build

# Deploy
netlify deploy --prod
```

### C. **Render** (Already in your config!)
- Go to https://render.com
- Connect your GitHub repo
- Create new "Static Site"
- Build command: `npm run build`
- Publish directory: `dist`
- URL: `https://pwa-inspectors.onrender.com` (already in your config!)

### D. **GitHub Pages**
```powershell
# Install gh-pages
npm install -g gh-pages

# Add to package.json scripts:
# "deploy": "npm run build && gh-pages -d dist"

# Deploy
npm run deploy
```

---

## 📊 Comparison Table

| Solution | Setup Time | Cost | Reliability | URL Stability | Best For |
|----------|-----------|------|-------------|---------------|----------|
| **ngrok** | 2 min | Free/Paid | ⭐⭐⭐⭐ | Temporary | Quick demos |
| **Cloudflare** | 5 min | FREE | ⭐⭐⭐⭐⭐ | Temporary/Permanent | Testing |
| **LocalTunnel** | 1 min | FREE | ⭐⭐⭐ | Temporary | Quick sharing |
| **LAN Access** | 0 min | FREE | ⭐⭐⭐⭐⭐ | Stable | Same network |
| **Vercel/Netlify** | 15 min | FREE | ⭐⭐⭐⭐⭐ | Permanent | Production |

---

## 🎯 My Recommendation

**For immediate testing (next 5 minutes):**
```powershell
# Use Cloudflare Tunnel (no account needed)
cloudflared tunnel --url http://localhost:3000
```

**For this week's testing:**
```powershell
# Use ngrok with a free account (get persistent URL)
ngrok http 3000
```

**For long-term/production:**
```powershell
# Deploy to Vercel
npm run build
vercel --prod
```

---

## 🔒 Security Considerations

When exposing your app publicly:

1. **Authentication:** Your app already has DHIS2 login - good! ✅
2. **HTTPS:** All tunnel services provide HTTPS automatically ✅
3. **Rate Limiting:** Consider adding if you get too much traffic
4. **Environment Variables:** Don't expose sensitive API keys
5. **CORS:** Your vite config already handles this ✅

---

## 🚨 Troubleshooting

### Port already in use:
```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Firewall blocking:
```powershell
# Check Windows Firewall
Get-NetFirewallRule -DisplayName "Node.js Server"

# Allow port 3000
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### Can't access from other devices:
- Make sure `host: true` is in vite.config.js ✅ (already configured)
- Check your firewall settings
- Verify you're using the correct IP address

---

## 📝 Quick Start Commands

Choose one based on your needs:

```powershell
# Option 1: Cloudflare (Recommended)
cloudflared tunnel --url http://localhost:3000

# Option 2: ngrok
ngrok http 3000

# Option 3: LocalTunnel
lt --port 3000 --subdomain pwa-inspectors

# Option 4: LAN (find your IP first)
ipconfig
# Then share: http://YOUR-IP:3000

# Option 5: Deploy to Vercel
vercel
```

---

## 💡 Pro Tips

1. **Keep your dev server running** while using tunnels
2. **Use HTTPS URLs** for PWA features to work properly
3. **Test on mobile devices** using the public URL
4. **Monitor the tunnel logs** to see incoming requests
5. **Use authentication** if sharing sensitive data

---

## 📞 Need Help?

If you encounter issues:
1. Check that `npm run dev` is still running
2. Verify the tunnel service is active
3. Test the URL in an incognito window
4. Check firewall/antivirus settings
5. Try a different tunnel service

---

**Current Status:**
- ✅ Your app is running on port 3000
- ✅ Host mode is enabled (`host: true`)
- ✅ Ready for tunneling!

**Next Step:** Choose a method above and run the command! 🚀
