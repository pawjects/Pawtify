# Pawtify

Pawtify is a privacy-friendly, browser-based static music player featuring local playlist controls and distraction-free streaming. It relies on YouTube as an audio engine without any tracking or heavy bloat. 

Built with a modular frontend ES6 architecture and an Express API proxy, it guarantees a seamless and robust audio experience on desktop and mobile.

## Key Features

- **No Tracking:** Fully client-side storage using `localStorage` for offline history and favorites.
- **YouTube Engine:** Background audio engine streams seamlessly with Media Session API support.
- **Modern UI:** Material Design 3 and AMOLED dark mode inspired aesthetic.
- **Progressive Web App (PWA):** Installable directly to your device with a built-in Service Worker.
- **Search & Discovery:** Robust search filters (songs, artists, playlists) powered by the open-source `ytmusic-api`.

## Tech Stack

- **Frontend:** Vanilla JavaScript (ES6 Modules), CSS3, HTML5
- **Backend:** Node.js, Express (API Proxy)
- **Data Persistence:** Client-side `localStorage`
- **Integrations:** YouTube IFrame Player API, `ytmusic-api`

## Repository Structure

```
├── client/
│   ├── public/       # Static assets, icons, service worker, and manifest
│   └── src/          # Modular ES6 frontend source code
│       ├── components/  # Reusable UI modules and renderers
│       ├── config/      # Global state, constants, and DOM bindings
│       ├── core/        # Event delegation and logic handlers
│       ├── services/    # External APIs and YouTube backend integration
│       └── utils/       # Helper functions
├── server/
│   ├── index.js      # Express HTTP Server
│   └── api/          # Backend API routes
└── package.json      # Dependencies and scripts
```

## Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/pawjects/Pawtify.git
   cd Pawtify
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in Browser:**
   Navigate to `http://localhost:3000` to view the application.

## Contribution

We welcome community forks and contributions!
- Keep modules loosely coupled.
- Stick to the Vanilla ES6 module architecture for frontend changes.
- Ensure any backend API calls remain proxied through the Express server to prevent CORS issues.
- Test your changes thoroughly against standard browser environments.

## License

This project is licensed under the MIT License.
