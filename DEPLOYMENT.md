# 🚀 Deployment Guide - Tafel Trainer

Complete deployment instructions for Vercel and Coolify.

## Table of Contents
- [Vercel Deployment](#vercel-deployment)
- [Coolify Deployment](#coolify-deployment)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Vercel Deployment

### Quick Deploy (Recommended)

1. **One-Click Deploy**
   
   Click the button below to deploy instantly:
   
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/tafel-trainer)

2. **Configure**
   - Sign in with GitHub/GitLab/Bitbucket
   - Give your project a name
   - Click "Deploy"
   - Done! Your app will be live in ~2 minutes

### Deploy via Git Integration

1. **Push to Git**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/tafel-trainer.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your repository
   - Vercel auto-detects Next.js settings
   - Click "Deploy"

3. **Custom Domain (Optional)**
   - Go to Project Settings → Domains
   - Add your domain: `tafel-trainer.yourdomain.com`
   - Update DNS records as instructed
   - SSL certificate auto-configured

### Deploy via CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   
   Follow prompts:
   - Set up and deploy? **Y**
   - Which scope? (Select your account)
   - Link to existing project? **N** (first time)
   - What's your project's name? **tafel-trainer**
   - In which directory is your code located? **./**
   - Auto-detected settings OK? **Y**

4. **Production Deploy**
   ```bash
   vercel --prod
   ```

### Vercel Configuration (Optional)

Create `vercel.json` for custom settings:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

### Vercel Environment Variables

No environment variables are required! The app uses browser localStorage.

If you want to add custom variables:
1. Go to Project Settings → Environment Variables
2. Add variables (example):
   - `NODE_ENV` = `production`
   - `NEXT_PUBLIC_APP_URL` = `https://tafel-trainer.yourdomain.com`

---

## Coolify Deployment

### Prerequisites
- Coolify instance running (v4+)
- Domain name (optional but recommended)
- Git repository (GitHub, GitLab, or Gitea)

### Method 1: Git Repository (Recommended)

1. **Create New Resource**
   - Log in to Coolify dashboard
   - Click "New Resource"
   - Select "Application"

2. **Connect Repository**
   - **Source**: Public Repository or Git Provider
   - **Repository URL**: `https://github.com/yourusername/tafel-trainer`
   - **Branch**: `main` (or your default branch)

3. **Configure Application**
   - **Name**: `tafel-trainer`
   - **Build Pack**: Nixpacks (auto-detected)
   - **Port**: `3000`
   - **Publish Directory**: Leave empty (auto-detected)

4. **Build Configuration** (Auto-detected, but you can verify)
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Start Command: `npm start`

5. **Domain Setup**
   - Click "Domains" tab
   - Add domain: `tafel-trainer.yourdomain.com`
   - Coolify generates SSL via Let's Encrypt
   - Update DNS records:
     ```
     A Record: @ → Your Server IP
     CNAME: www → @
     ```

6. **Deploy**
   - Click "Deploy" button
   - Monitor build logs
   - App live in ~3-5 minutes

### Method 2: Dockerfile

1. **Create Dockerfile** (already included in repo)

2. **In Coolify**:
   - Create new Application
   - Select "Dockerfile" as build pack
   - Point to your Dockerfile
   - Configure port: `3000`
   - Deploy

### Method 3: Docker Compose

1. **Create docker-compose.yml**:
   ```yaml
   version: '3.8'
   
   services:
     tafel-trainer:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
       restart: unless-stopped
   ```

2. **In Coolify**:
   - Select "Docker Compose" as build pack
   - Coolify will use your compose file
   - Deploy

### Coolify Custom Build Settings

Create `nixpacks.toml` in project root:

```toml
[phases.setup]
nixPkgs = ['nodejs-18_x']

[phases.install]
cmds = ['npm ci']

[phases.build]
cmds = ['npm run build']

[start]
cmd = 'npm start'
```

### Coolify Environment Variables

1. Go to "Environment Variables" tab
2. No variables required, but you can add:
   - `NODE_ENV` = `production`
   - `PORT` = `3000`

### Coolify Automatic Deployments

Enable automatic deployments on git push:

1. Go to "General" tab
2. Enable "Automatic Deployment"
3. Select branch: `main`
4. Coolify will rebuild on every push

### Coolify Health Check

Add health check endpoint:

1. Go to "Health Check" tab
2. Set path: `/`
3. Expected status: `200`
4. Interval: `30s`

### Coolify Logs

View real-time logs:
- Build logs: Click on deployment
- Runtime logs: "Logs" tab
- Download logs: "Download" button

---

## Environment Variables

This app requires **NO environment variables** to run! 🎉

Everything works with browser localStorage. However, you can optionally add:

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `NEXT_PUBLIC_APP_URL` | App URL for metadata | Auto-detected |

### Setting Environment Variables

**Vercel:**
```bash
vercel env add VARIABLE_NAME
```

**Coolify:**
- Dashboard → Environment Variables → Add

**Local Development:**
Create `.env.local`:
```bash
NODE_ENV=development
PORT=3000
```

---

## Troubleshooting

### Build Fails on Vercel

**Error**: `Module not found`
```bash
# Solution: Clear cache and rebuild
vercel --prod --force
```

**Error**: `Out of memory`
```json
// Add to package.json scripts
"build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
```

### Build Fails on Coolify

**Error**: `npm install failed`
```bash
# Solution: Use npm ci instead
# Update build command to: npm ci && npm run build
```

**Error**: `Port already in use`
```bash
# Solution: Change port in Coolify settings
# Or update next.config.ts to use PORT env variable
```

### App Not Loading

1. **Check Build Logs**
   - Vercel: Click deployment → View Function Logs
   - Coolify: Logs tab

2. **Check DNS**
   ```bash
   nslookup tafel-trainer.yourdomain.com
   ```

3. **Check SSL**
   - Wait 5-10 minutes for SSL to provision
   - Force HTTPS in domain settings

### localStorage Not Working

**Issue**: Data not persisting
- Check browser privacy settings
- Ensure cookies/localStorage enabled
- Try different browser

### Performance Issues

**Slow Loading**:
1. Enable static optimization:
   ```typescript
   // next.config.ts
   export default {
     output: 'export', // For static export
   }
   ```

2. Add CDN (Vercel has built-in CDN)

3. Enable compression:
   ```typescript
   // next.config.ts
   export default {
     compress: true,
   }
   ```

---

## Post-Deployment Checklist

- [ ] App loads correctly
- [ ] All pages accessible (/, /quiz, /progress)
- [ ] Profile creation works
- [ ] Quiz saves scores
- [ ] Progress dashboard displays stats
- [ ] Export/import functionality works
- [ ] Sound effects play
- [ ] Animations smooth
- [ ] Mobile responsive
- [ ] SSL certificate active
- [ ] Custom domain configured (if applicable)

---

## Advanced Configuration

### Custom Domain with SSL

**Vercel:**
1. Add domain in Project Settings
2. Update DNS:
   ```
   CNAME www.yourdomain.com → cname.vercel-dns.com
   A yourdomain.com → 76.76.21.21
   ```
3. SSL auto-configured

**Coolify:**
1. Add domain in Domains tab
2. Update DNS to server IP
3. Let's Encrypt SSL auto-configured

### CDN & Caching

**Vercel** (built-in CDN):
```typescript
// next.config.ts
export default {
  images: {
    domains: ['yourdomain.com'],
  },
}
```

**Coolify** (with Cloudflare):
1. Add site to Cloudflare
2. Update nameservers
3. Enable "Proxied" for CDN

### Monitoring

**Vercel Analytics**:
```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function Layout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

**Coolify Monitoring**:
- Built-in resource monitoring
- View CPU/Memory in dashboard

---

## Backup & Migration

### Backup Profile Data

Users can export their profiles:
1. Go to "Mijn Voortgang"
2. Click "Exporteer Profiel"
3. Save the code

### Migrate Between Deployments

1. Export profiles from old deployment
2. Import on new deployment
3. No data loss!

---

## Need Help?

- **Documentation**: [Next.js Docs](https://nextjs.org/docs)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Coolify Docs**: [coolify.io/docs](https://coolify.io/docs)
- **Issues**: [GitHub Issues](https://github.com/yourusername/tafel-trainer/issues)

---

Happy Deploying! 🚀
