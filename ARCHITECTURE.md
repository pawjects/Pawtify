# Pawtify Architecture Overview

Pawtify is engineered as a hybrid web application featuring a static, privacy-first, browser-based music player frontend, backed by a lightweight serverless-compatible API layer. This document outlines the high-level technical decisions and structural layout of the application.

## Core Philosophy
1. **Hybrid Deployment Ready:** The backend is built to run identically on standard Node.js (via Express) and Vercel Serverless Functions.
2. **Zero-Tracking Frontend:** Pawtify operates its playback state entirely on the client side. No audio routing, listening history, or playlist metadata is sent to any external server. 
3. **Local Persistence:** Playlist states, volume toggles, and user preferences are maintained purely via the browser's `localStorage` API.
4. **Distraction-Free UI:** The interface is built to minimize cognitive load, strictly utilizing a Material Design 3 (MD3) Dark Monet theme with pure AMOLED black (`#000000`) backgrounds.

## Directory Structure
* `/api`
  * Contains the serverless API routes (`search.js`). These endpoints securely fetch streaming metadata from external services (like YouTube Music).
* `/app`
  * Contains all frontend client-side logic and styling.
  * `app.js`: Core frontend application logic, state management, UI rendering, and YouTube IFrame API integration.
  * `index.html`: The semantic HTML skeleton and PWA structure.
  * `styles.css`: All application styling, using native CSS variables for AMOLED black and subtle accents.
  * `sw.js`: Service worker handling offline caching and network-first strategies.
  * `manifest.json`: Web App Manifest defining PWA installation properties.
* `/assets`
  * Contains static graphical elements (e.g., `pawtify.png`).
* `/scripts`
  * Build scripts (`build.js`) responsible for packaging the app into the `/public` directory for deployment.
* `/server.js`
  * The Express.js entry point for running the application in a local, Docker, or traditional cloud environment (like Google Cloud Run).
* `/vercel.json`
  * Vercel-specific routing configuration to handle serverless endpoints and SPA (Single Page Application) fallbacks.

## Iconography & Rendering
To ensure absolute consistency and crisp rendering across all displays, Pawtify actively rejects the use of local SVGs and OS-level emojis for interface controls. The UI relies exclusively on Font Awesome icons for all player controls (play, pause, skip, volume) and navigation.

## API Flow
1. **Search Request:** The frontend calls `/api/search?q=query`.
2. **Data Fetching:** The backend (running on Node or Vercel) utilizes the `ytmusic-api` to gather tracks, albums, and artists.
3. **Playback:** The frontend receives track metadata and securely streams audio using the YouTube IFrame API, circumventing CORS issues while providing robust playback controls.
