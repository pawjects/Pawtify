<div align="center">
  <img src="https://raw.githubusercontent.com/pawjects/Pawtify/refs/heads/main/assets/pawtify.png" alt="Pawtify Logo" width="120" />

  # 🎧 Pawtify

  **A modern, lightweight, and privacy-friendly music streaming experience built for the web.**

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-000000?logo=vercel)](https://vercel.com)
  [![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js)](https://nodejs.org)
  [![GitHub stars](https://img.shields.io/github/stars/pawjects/Pawtify?style=flat-square)](https://github.com/pawjects/Pawtify/stargazers)
  [![GitHub issues](https://img.shields.io/github/issues/pawjects/Pawtify?style=flat-square)](https://github.com/pawjects/Pawtify/issues)
  [![GitHub release](https://img.shields.io/github/v/release/pawjects/Pawtify?style=flat-square)](https://github.com/pawjects/Pawtify/releases)
  [![PWA Supported](https://img.shields.io/badge/PWA-Supported-5A0FC8?style=flat-square&logo=pwa)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

  [Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Architecture](#-architecture) • [Contributing](#-contributing)
</div>

---

## ✨ Overview

**Pawtify** is a free and open-source music streaming web application designed with simplicity, speed, and modern design principles. It provides an immersive listening experience without overwhelming the user with unnecessary elements. 

<div align="center">
  <img src="https://raw.githubusercontent.com/pawjects/Pawtify/refs/heads/main/assets/pawtify.png" alt="Pawtify App Screenshot" width="600" style="border-radius: 12px; box-shadow: 0px 4px 15px rgba(0,0,0,0.5);" />
  <p><i>(Replace with actual app screenshot showing the UI)</i></p>
</div>

Whether you're discovering new music, searching for your favorite artist, or managing your personal library, Pawtify provides a clean, distraction-free environment across phones, tablets, and desktops.

---

## 🚀 Features

### 🎵 Music Streaming
- **Smooth Playback**: Uninterrupted audio streaming with a responsive player.
- **High-Quality Audio**: Immersive listening experience with low latency.
- **Continuous Playback**: Seamlessly transition between tracks.
- **Video Toggle**: Watch the official music video directly within the app when available.

### 🔍 Powerful Search
- **Comprehensive Results**: Quickly discover songs, artists, albums, and playlists.
- **Smart Fallbacks**: Intelligent stream routing ensures you always get the best available audio source.

### 📚 Your Library & Playlists
- **Personal Collections**: Keep your favorite tracks and artists organized in one place.
- **Recently Played**: Easily jump back into what you were listening to.
- **Custom Playlists**: Create, manage, and curate your own playlists.

### 📱 Progressive Web App (PWA)
- **Installable**: Add Pawtify directly to your home screen for a native app-like experience.
- **Offline Resiliency**: Built-in service workers cache the app shell for faster loading and basic offline support.

### 🎨 Modern Interface
- **Minimalist Design**: Clean, AMOLED-friendly dark mode with intuitive navigation.
- **Responsive**: Adapts perfectly to desktop, tablet, and mobile screens.

---

## 🛠️ Installation & Setup

You can easily run Pawtify locally for development or deploy it to your own server.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `bun` package manager

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/pawjects/Pawtify.git
   cd Pawtify
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

### Production Build

1. **Build the project**
   ```bash
   npm run build
   ```
   This will synchronize the static assets into the `public/` directory.

2. **Start the production server**
   ```bash
   npm start
   ```

---

## 💻 Usage

Once the application is running:

1. **Search & Discover:** Use the search bar to find artists, tracks, and playlists.
2. **Playback Controls:** The bottom player bar allows you to pause, skip, and toggle the underlying video stream via the TV icon.
3. **Library Management:** Navigate to the "Library" tab to see your recently played items and manage custom playlists.
4. **PWA Installation:** Click the "Install" prompt in your browser's address bar or the in-app banner to install Pawtify locally for a native app experience.

---

## 🏗️ Project Structure

Pawtify is built with a clean, modular structure, utilizing vanilla JavaScript on the frontend and a lightweight Express/Serverless backend.

```
Pawtify/
├── api/                  # Backend API routes (Vercel Serverless compatible)
│   └── search.js         # Unified search handler utilizing ytmusic-api
├── app/                  # Frontend source files
│   ├── app.js            # Core client-side application logic
│   ├── index.html        # Main entry point and UI skeleton
│   ├── styles.css        # Application styling and themes
│   ├── manifest.json     # PWA manifest
│   └── sw.js             # Service worker for offline caching
├── assets/               # Static assets (images, icons)
├── scripts/              # Build and utility scripts
├── server.js             # Express server for local and containerized deployments
├── vercel.json           # Vercel deployment configuration
└── package.json          # Project dependencies and scripts
```

---

## 🌍 Deployment

Pawtify is fully configured for one-click deployment on **Vercel**. 

1. Push your repository to GitHub.
2. Import the project in the Vercel Dashboard.
3. Vercel will automatically detect the `vercel.json` configuration and deploy the app seamlessly, utilizing serverless functions for the API routes.

Alternatively, you can deploy the app as a standard Node.js application or via Docker using the provided `server.js` entry point.

---

## 🤝 Contributing

We welcome contributions from the community! Whether it's fixing a bug, improving the UI, or adding a new feature, your help is appreciated.

1. **Fork** the repository.
2. **Create** a new branch (`git checkout -b feature/AmazingFeature`).
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`).
4. **Push** to the branch (`git push origin feature/AmazingFeature`).
5. **Open** a Pull Request.

Please read our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) for more details.

---

## 🔒 Privacy & Security

Pawtify is designed to be privacy-friendly:
- **No Tracking**: We do not embed third-party analytics or trackers.
- **Local Storage**: Your library, playlists, and preferences are stored locally in your browser.

For security reports, please review our [Security Policy](SECURITY.md).

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">
  Made with ❤️ by <b>Pawjects</b>
</div>

