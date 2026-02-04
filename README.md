# CodePulse

Track your team's GitHub activity and code quality at a glance.

## Setup

### 1. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: CodePulse
   - **Homepage URL**: Your domain (e.g., `https://codepulse.yourdomain.com`)
   - **Authorization callback URL**: `https://yourdomain.com/api/auth/callback`
4. Save the **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your credentials in `.env.local`.

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Or use: vercel env add GITHUB_CLIENT_ID
```

### 4. Connect Your Domain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain
3. Update DNS records as instructed

## Development

```bash
# Run locally
vercel dev
```

## Features

- 🔐 Login with GitHub
- 📊 View all your repositories
- 👥 Track team member activity
- ✅ Code quality indicators
- 📈 Commit history visualization
