# Pawtify Architecture Overview

Pawtify is engineered as a static, privacy-first, browser-based music player. This document outlines the high-level technical decisions and structural layout of the application.

## Core Philosophy
1. **Zero-Backend:** Pawtify operates entirely on the client side. No audio routing, listening history, or playlist metadata is sent to any external server.
2. **Local Persistence:** Playlist states, volume toggles, and user preferences are maintained purely via the browser's `localStorage` API.
3. **Distraction-Free UI:** The interface is built to minimize cognitive load, strictly utilizing a Material Design 3 (MD3) Dark Monet theme with pure AMOLED black (`#000000`) backgrounds.

## Directory Structure
* `/css`: Contains all styling. Variables are strictly defined for AMOLED black and approved subtle cyan gradients.
* `/js`: Core application logic.
  * `player.js`: Audio context and stream routing.
  * `playlist.js`: Array management and `localStorage` syncing.
  * `ui.js`: DOM manipulation, volume toggles, and Material Symbols rendering.
* `/assets`: Contains static graphical elements (excluding UI icons, which rely entirely on Material Symbols web fonts).

## Iconography & Rendering
To ensure absolute consistency and crisp rendering across all displays, Pawtify actively rejects the use of local SVGs and OS-level emojis for interface controls. The UI relies exclusively on Google's Material Symbols library for all player controls (play, pause, skip, volume).
