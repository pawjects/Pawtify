# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-09-13

### Added
- **Live Search Auto-Suggestions**: Added real-time autocomplete suggestions powered by the YouTube Music API. Features an independent 150ms debounce to surface suggestions quickly while typing, distinct from the heavy search results.
- **Search Query Persistence**: Search terms are now cached in `localStorage` across sessions. Returning to the app or refreshing the page will seamlessly auto-fetch and display your last search.

### Fixed
- **Search Typing Jitter Bug**: Decoupled the search input field from the dynamic search results DOM. Typing no longer triggers a full page re-render, preserving cursor position, focus, and input composition seamlessly.

## [1.0.0] - 2024-10-25

### Added
- **Initial Release** of Pawtify.
- Fully responsive, dark-mode Material Design 3 interface.
- Complete search functionality targeting YouTube Music (Tracks, Artists, Playlists).
- Continuous background audio streaming via the YouTube IFrame API.
- Local library management (Favorites, Playlists, Recently Played).
- Progressive Web App (PWA) manifest and Service Worker for offline resilience and installation.
- Seamless deployment configuration for Vercel Serverless and Node.js environments.
