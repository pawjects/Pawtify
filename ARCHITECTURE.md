# Architecture Overview

Pawtify is engineered as a hybrid web application featuring a static, privacy-first, browser-based music player frontend, backed by a lightweight serverless-compatible API layer. This document outlines the high-level technical decisions and structural layout of the application.

## Core Philosophy

1. **Hybrid Deployment Ready:** The backend is built to run identically on standard Node.js (via Express) and serverless environments (like Vercel).
2. **Zero-Tracking Frontend:** Pawtify operates its playback state entirely on the client side. No audio routing, listening history, or playlist metadata is sent to any external server. 
3. **Local Persistence:** Playlist states, volume toggles, and user preferences are maintained purely via the browser's `localStorage` API.
4. **Distraction-Free UI:** The interface is built to minimize cognitive load, strictly utilizing a Material Design 3 (MD3) Dark Monet theme with pure AMOLED black (`#000000`) backgrounds.

## Directory Structure

* `/server`
  * Contains the API routes and server logic.
  * `index.js`: The Express.js entry point for running the application in a local, Docker, or traditional cloud environment.
  * `api/search.js`: API endpoint to securely fetch streaming metadata from external services (like YouTube Music).
* `/client`
  * Contains all frontend client-side logic, styling, and assets.
  * `src/`: Core frontend application logic, state management, UI rendering, and YouTube IFrame API integration.
  * `index.html`: The semantic HTML skeleton and PWA structure.
  * `styles.css`: All application styling, using native CSS variables for AMOLED black and subtle accents.
  * `sw.js`: Service worker handling offline caching and network-first strategies.
  * `manifest.webmanifest`: Web App Manifest defining PWA installation properties.
  * `assets/`: Contains static graphical elements (e.g., icons and logos).
* `/vercel.json`
  * Vercel-specific routing configuration to handle serverless endpoints and SPA (Single Page Application) fallbacks.

## Iconography & Rendering

To ensure consistency and crisp rendering across all displays, Pawtify relies on Font Awesome icons for all player controls (play, pause, skip, volume) and navigation.

## API Flow

1. **Search Request:** The frontend calls `/api/search?q=query`.
2. **Data Fetching:** The backend utilizes the `ytmusic-api` package to gather tracks, albums, and artists.
3. **Playback:** The frontend receives track metadata and securely streams audio using the YouTube IFrame API, providing robust playback controls.
