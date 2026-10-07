# Pawtify 🎵

> A privacy-first, ad-free music streaming Progressive Web App with an AMOLED dark aesthetic, Spotify-inspired layout, and local playlist management.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-1db954.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 🌟 Highlights

- **🚫 Privacy-First & Tracker-Free:** No analytics, no telemetry, no cookies, no tracking. All favorites, custom playlists, listening history, and preferences stay 100% locally on your device via `localStorage` and `IndexedDB`.
- **🌙 AMOLED Black & Spotify-Inspired Theme:** Deep pitch-black surfaces with subtle atmospheric emerald glow, high-contrast readable typography, and smooth transitions designed for OLED battery savings.
- **⚡ Native Feel:** Blocked unwanted text highlighting and image drag-ghosting while maintaining instant touch response, native gestures, smooth scrolling, and accessible inputs.
- **📱 Installable Progressive Web App (PWA):** Install to Android, iOS, Windows, macOS, or ChromeOS with custom icons, theme colors, and offline static asset caching via Service Workers.
- **🎧 Background Playback & Media Session:** Lock screen controls, notification playback controls, artwork display, and hardware media key support.
- **🔍 Global Discovery & Curation:** Search millions of tracks, official artist profiles, and playlists powered by lightweight, direct search endpoints.
- **🗂️ Complete Library Management:** Custom playlists, Liked Songs, Recently Played history, queue reordering, and one-click JSON backup export/import.
- **⚙️ Native-Grade Settings Menu:** Categorized configuration for Account/Profile, Appearance, Playback, Downloads/Storage, Privacy & Data, App Settings, and About.

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm v9 or later (or yarn / pnpm / bun)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/pawjects/Pawtify.git
   cd Pawtify
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment (Optional):**
   ```bash
   cp .env.example .env
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 🛠️ Scripts & Commands

| Command | Purpose |
|---|---|
| `npm start` | Starts the Express server in production mode on the configured `$PORT` (default: 3000) |
| `npm run dev` | Starts the server for local development |
| `npm run build` | Builds/verifies static assets for production deployment |
| `npm run lint` | Syntax checks all server scripts and client JavaScript modules |
| `npm run format` | Formats code with Prettier |

---

## 🌐 Deployment

### Deploy to Vercel

Pawtify is pre-configured for seamless zero-config deployment on [Vercel](https://vercel.com) using the included `vercel.json`:

1. Fork or push your repository to GitHub.
2. Import the repository into your Vercel Dashboard.
3. Keep the default settings (Framework preset: `Other`).
4. Deploy!

### Deploy via Docker / Container

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📁 Project Architecture

```
Pawtify/
├── client/                     # Frontend client (Vanilla ES6 Modules)
│   ├── assets/                 # High-resolution logos, PWA icons, masks
│   ├── src/
│   │   ├── components/         # UI view modules (home, library, you, playerBar, etc.)
│   │   ├── config/             # App configuration, routing, DOM elements
│   │   ├── core/               # State sync, event bus, playlist normalization
│   │   ├── services/           # Search, YouTube audio engine, data loaders
│   │   └── utils/              # IndexedDB helpers, sanitization, formatters
│   ├── index.html              # Single-page application entry point
│   ├── manifest.json           # Progressive Web App manifest
│   ├── sw.js                   # Service Worker cache controller
│   └── styles.css              # Unified AMOLED & Spotify-inspired design system
├── server/                     # Backend API proxy
│   ├── api/                    # Route handlers (search, metadata, suggestions)
│   └── index.js                # Express static server & API proxy
├── .env.example                # Sample environment configuration
├── .gitignore                  # Git ignore rules for public repository
├── package.json                # Project dependencies and script definitions
├── vercel.json                 # Vercel serverless deployment specification
└── README.md                   # Project documentation
```

---

## 🔒 Privacy & Security

Pawtify does not include third-party trackers, analytics pixels, advertising scripts, or centralized databases. All user state (playlists, favorites, settings, history) remains exclusively on the client machine. To transfer or back up your music library across devices, use the built-in **Export JSON** and **Import File** tools inside **You → Settings → Privacy & Data**.

---

## 🤝 Contributing

Contributions, feedback, and bug reports are warmly welcome!
- Check existing issues or open a new one before submitting major changes.
- Ensure your changes pass `npm run lint` and maintain responsive layouts down to 320px screens.
- Adhere to the clean vanilla architecture (no intrusive framework dependencies).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
