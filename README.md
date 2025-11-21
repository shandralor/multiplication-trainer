# 🎓 Tafel Trainer - Multiplication Practice App

A fun, Duolingo-style multiplication trainer for Dutch students to practice their times tables (1-10). Features include multiple game modes, progress tracking, profile management, and a local leaderboard system.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![React](https://img.shields.io/badge/React-19.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

## ✨ Features

### 🎮 Game Modes
- **Quiz Mode**: Test yourself with a set number of questions (10, 20, 30, or 50)
- **Practice Mode**: Unlimited practice with instant feedback
- **Timed Mode**: Race against the clock with customizable time per question (3-5 seconds)

### 📊 Progress Tracking
- **Multiple Profiles**: Support for multiple users on one device
- **Streak System**: Track consecutive days of practice with 🔥 streak counter
- **Comprehensive Statistics**:
  - Total quizzes completed
  - Overall accuracy percentage
  - Per-table mastery tracking
  - Best scores for each mode
  - Recent quiz history

### 🏆 Achievements & Leaderboard
- Local leaderboard showing top scores from all profiles
- Medal system (🥇🥈🥉) for top 3 positions
- Color-coded table mastery (green/yellow/red based on accuracy)
- Personal best tracking for Quiz and Timed modes

### 🎨 Duolingo-Style Design
- Cute animated mascot that reacts to your answers
- Colorful gradient backgrounds
- Sound effects for correct/incorrect answers
- Confetti celebration for high scores (80%+)
- Smooth animations and transitions

### 💾 Data Management
- **Browser-based storage**: All data stored locally (no backend required)
- **Export/Import**: Transfer profiles between devices using Base64 codes
- **Privacy-first**: No login, no data collection, GDPR compliant
- **Family-friendly**: Perfect for siblings sharing one device

### 🌍 Smart Question Generation
- Ensures all multiplication facts are covered
- Randomizes question order
- Repeats and reshuffles when more questions than facts are requested
- Example: Selecting tables 2, 3, 5 with 30 questions = each fact shown exactly once

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- npm, yarn, pnpm, or bun package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tafel-trainer.git
cd tafel-trainer
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## 📦 Deployment

### Deploy to Vercel

Vercel is the easiest way to deploy this Next.js application:

#### Method 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/tafel-trainer)

#### Method 2: Deploy via CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Navigate to your project directory:
```bash
cd multiplication-trainer
```

3. Run deploy command:
```bash
vercel
```

4. Follow the prompts:
   - Link to existing project or create new
   - Select your scope/team
   - Confirm project settings
   - Deploy!

#### Method 3: Deploy via Git Integration

1. Push your code to GitHub, GitLab, or Bitbucket

2. Go to [vercel.com/new](https://vercel.com/new)

3. Import your repository

4. Configure project (Vercel auto-detects Next.js):
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

5. Click "Deploy"

6. Your app will be live at `https://your-project.vercel.app`

#### Vercel Configuration

The app works out-of-the-box with Vercel's defaults. Optional `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### Deploy to Coolify

Coolify is a self-hosted alternative to Vercel/Netlify.

#### Prerequisites
- Coolify instance running (see [coolify.io](https://coolify.io) for setup)
- Docker installed on your server
- Domain name (optional but recommended)

#### Deployment Steps

1. **Connect Your Repository**
   - Log in to your Coolify dashboard
   - Click "New Resource" → "Application"
   - Select "Public Repository" or connect your Git provider
   - Enter repository URL: `https://github.com/yourusername/tafel-trainer`

2. **Configure Application**
   - **Application Name**: tafel-trainer
   - **Build Pack**: Nixpacks (auto-detected for Next.js)
   - **Port**: 3000 (default for Next.js)
   - **Branch**: main (or your default branch)

3. **Build Settings**
   Coolify auto-detects Next.js settings, but you can customize:
   
   - **Install Command**: `npm install`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   
   Or use a custom `nixpacks.toml`:
   ```toml
   [phases.setup]
   nixPkgs = ['nodejs-18_x']
   
   [phases.install]
   cmds = ['npm install']
   
   [phases.build]
   cmds = ['npm run build']
   
   [start]
   cmd = 'npm start'
   ```

4. **Environment Variables** (Optional)
   No environment variables required! The app uses browser localStorage.
   
   If you want to add custom variables:
   - Click "Environment Variables"
   - Add any custom variables
   - Example: `NODE_ENV=production`

5. **Domain Configuration**
   - Go to "Domains" tab
   - Add your domain: `tafel-trainer.yourdomain.com`
   - Coolify will auto-configure SSL via Let's Encrypt

6. **Deploy**
   - Click "Deploy" button
   - Monitor build logs in real-time
   - Once complete, app is live at your domain

#### Coolify Dockerfile (Alternative)

If you prefer Docker, create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

Then in Coolify:
- Select "Dockerfile" as build pack
- Point to your Dockerfile
- Deploy

#### Coolify Docker Compose (Alternative)

Create `docker-compose.yml`:

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

In Coolify:
- Select "Docker Compose" as build pack
- Deploy

### Other Deployment Options

#### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

#### Railway
1. Connect your GitHub repo at [railway.app](https://railway.app)
2. Railway auto-detects Next.js
3. Deploy automatically on push

#### Docker (Self-hosted)
```bash
docker build -t tafel-trainer .
docker run -p 3000:3000 tafel-trainer
```

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Storage**: Browser localStorage (no backend required)
- **Audio**: Web Audio API (for sound effects)
- **Animations**: CSS animations + Tailwind

## 📁 Project Structure

```
multiplication-trainer/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Home page (table selection)
│   ├── quiz/                
│   │   └── page.tsx         # Quiz page (all game modes)
│   ├── progress/            
│   │   └── page.tsx         # Progress dashboard
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles + custom animations
├── components/              
│   ├── mascot.tsx           # Animated mascot character
│   ├── profile-selector.tsx # Profile dropdown component
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── profile-manager.ts   # Profile & progress tracking logic
│   └── utils.ts             # Utility functions
├── public/                  # Static assets
└── README.md
```

## 🎯 How to Use

### For Students
1. **Select Tables**: Choose which multiplication tables to practice (1-10)
2. **Choose Settings**: Pick number of questions (10, 20, 30, 50) and time per question
3. **Pick Mode**:
   - Quiz: Set number of questions to complete
   - Practice: Unlimited practice
   - Timed: Race against the clock
4. **Start Learning**: Answer questions and get instant feedback!
5. **Track Progress**: View your stats, streaks, and best scores in "Mijn Voortgang"

### For Parents/Teachers
1. **Multiple Profiles**: Create profiles for each student (tap profile icon in header)
2. **Monitor Progress**: Check individual student stats in progress dashboard
3. **View Leaderboard**: See how students rank against each other
4. **Export/Import**: Transfer progress to different devices using export codes
5. **No Setup Required**: Works immediately in any modern browser

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2025 Tafel Trainer Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- Inspired by [Duolingo](https://www.duolingo.com/) for gamified learning
- Graphics style inspired by [Kenney.nl](https://kenney.nl/) (CC0 assets)
- Built with [shadcn/ui](https://ui.shadcn.com/) component library
- Mascot character designed with SVG for accessibility

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/tafel-trainer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/tafel-trainer/discussions)

## 🗺️ Roadmap

- [ ] Add more languages (English, German, French)
- [ ] Division practice mode
- [ ] Mixed operations (multiplication + division)
- [ ] Weekly challenges system
- [ ] Printable worksheets
- [ ] Teacher dashboard with classroom management
- [ ] Mobile app (React Native)

## 📊 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🔒 Privacy

This app is privacy-first and GDPR compliant:
- ✅ No data collection or analytics
- ✅ No cookies (except localStorage for progress)
- ✅ No third-party services
- ✅ All data stored locally in browser
- ✅ No login or email required
- ✅ Safe for children

---

Made with ❤️ for students learning multiplication
