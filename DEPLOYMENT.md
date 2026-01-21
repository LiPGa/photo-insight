# Vercel Deployment Guide

This guide walks through deploying PhotoInsight to Vercel with automatic PR preview functionality.

## Prerequisites

- A [Vercel account](https://vercel.com/signup) (free tier works)
- GitHub repository with PhotoInsight code
- Required API keys (Gemini, Supabase, Cloudinary)

## Quick Setup

### 1. Connect Repository to Vercel

**Option A: Using Vercel Dashboard (Recommended for PR Previews)**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Project"
3. Select your GitHub repository (LiPGa/photo-insight)
4. Vercel will auto-detect the Vite framework

**Option B: Using Vercel CLI**

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel
```

### 2. Configure Environment Variables

In your Vercel project dashboard, go to **Settings → Environment Variables** and add:

| Variable Name | Description | Required | Example |
|--------------|-------------|----------|---------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key | ✅ Yes | `AIza...` |
| `VITE_SUPABASE_URL` | Supabase project URL | ⚠️ Optional* | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | ⚠️ Optional* | `eyJh...` |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ⚠️ Optional* | `your-cloud` |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary upload preset | ⚠️ Optional* | `preset-name` |
| `VITE_MOCK_API` | Use mock data (dev only) | No | `true` |

**Important Notes:**
- All variables need the `VITE_` prefix to be accessible in the browser
- Set variables for **Production**, **Preview**, and **Development** environments
- *Optional variables: App works in guest mode without Supabase/Cloudinary, but with limited features

### 3. Deploy

**First Deployment:**
```bash
# Using Vercel CLI
vercel --prod

# Or just push to main branch (auto-deploys if GitHub connected)
git push origin main
```

**Subsequent Deployments:**
- Push to `main` branch → Auto-deploys to production
- Create/update PR → Auto-creates preview deployment

## PR Preview Setup

Vercel automatically creates preview deployments for pull requests when connected via GitHub.

### How It Works

1. **Create a PR** on GitHub
2. **Vercel automatically**:
   - Builds the PR branch
   - Deploys to a unique preview URL
   - Comments on the PR with the preview link
3. **Every PR commit** triggers a new preview deployment
4. **PR merged/closed** → Preview deployment removed

### Customizing PR Previews

Edit `vercel.json` to customize behavior:

```json
{
  "github": {
    "enabled": true,           // Enable GitHub integration
    "autoAlias": true,         // Auto-create branch aliases
    "silent": false,           // Comment preview URLs on PRs
    "autoJobCancelation": true // Cancel outdated deployments
  }
}
```

### Preview URLs

Each PR gets a unique URL like:
```
https://photo-insight-<pr-hash>-<team>.vercel.app
```

Plus branch-specific alias:
```
https://photo-insight-git-<branch>-<team>.vercel.app
```

## Project Structure

```
vercel.json         # Vercel configuration
├── buildCommand    # npm run build (Vite build)
├── outputDirectory # dist/ (Vite output)
├── rewrites        # SPA routing (all routes → index.html)
├── headers         # Cache control for assets
└── github          # PR preview settings
```

## Troubleshooting

### Build Fails

**Check build logs** in Vercel dashboard:
```bash
# Or test build locally
npm run build
```

**Common issues:**
- Missing environment variables
- TypeScript errors
- Import path issues

### Environment Variables Not Working

- Ensure variables start with `VITE_` prefix
- Check they're set for correct environment (Preview/Production)
- Redeploy after adding variables

### PR Previews Not Appearing

1. Check GitHub integration: **Settings → Git**
2. Ensure "Automatically create comments" is enabled
3. Verify GitHub app has repository access
4. Check deployment status in Vercel dashboard

### SPA Routing Issues

If routes return 404, verify `vercel.json` has:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Advanced Configuration

### Custom Domains

1. Go to **Settings → Domains**
2. Add your domain
3. Configure DNS (Vercel provides instructions)

### Performance Optimization

The `vercel.json` includes:
- Asset caching (1 year for `/assets/*`)
- SPA routing rewrites
- Automatic compression

### Branch Deployments

Configure specific branches for auto-deployment:
1. **Settings → Git**
2. Add branch patterns under "Deploy Hooks"

## Monitoring

- **Analytics**: Enable in project settings
- **Logs**: Runtime logs available in dashboard
- **Insights**: Core Web Vitals tracking

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Environment Variables](https://vercel.com/docs/environment-variables)
- [Preview Deployments](https://vercel.com/docs/deployments/preview-deployments)

## Support

For issues specific to:
- **PhotoInsight app**: Check CLAUDE.md and README.md
- **Vercel platform**: [Vercel Support](https://vercel.com/support)
- **Deployment config**: Review `vercel.json` settings
