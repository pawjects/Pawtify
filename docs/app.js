(() => {
 // Switched to the Vispark JioSaavn Wrapper API
 const API_BASE = "https://api.music.vispark.in/api";
 const LOGO_URL = "https://raw.githubusercontent.com/pawjects/Pawtify/refs/heads/main/assets/pawtify.png";

 const STORAGE = {
   THEME: "pawtify-theme",
   REPEAT: "pawtify-repeat",
   SHUFFLE: "pawtify-shuffle",
   FAVORITES: "pawtify-favorites",
   PLAYLISTS: "pawtify-playlists",
   QUEUE: "pawtify-queue",
   CURRENT_SONG: "pawtify-current-song",
   CURRENT_TIME: "pawtify-current-time",
   VOLUME: "pawtify-volume",
   RECENT_SEARCHES: "pawtify-recent-searches",
   RECENT_PLAYED: "pawtify-recently-played"
 };

 const appMain = document.getElementById("app-main");
 const playerBar = document.getElementById("player-bar");
 const miniPlayer = document.getElementById("mini-player");
 const overlayRoot = document.getElementById("overlay-root");
 const fullscreenPlayer = document.getElementById("fullscreen-player");
 const lyricsPanel = document.getElementById("lyrics-panel");
 const artistProfile = document.getElementById("artist-profile");
 const queuePanel = document.getElementById("queue-panel");
 const sidebarPlaylists = document.getElementById("sidebar-playlists");

 const songCatalog = new Map();
 const audio = new Audio();
 audio.preload = "metadata";

 const storedVol = loadJSON(STORAGE.VOLUME, 0.7);
 const initialVol = typeof storedVol === "number" && !isNaN(storedVol) ? storedVol : 0.7;

 const state = {
   route: { name: "home", playlistId: null },
   theme: loadJSON(STORAGE.THEME, "dark"),
   repeatMode: loadJSON(STORAGE.REPEAT, "none"),
   shuffleMode: loadJSON(STORAGE.SHUFFLE, false),
   searchQuery: "",
   searchTab: "songs",
   libraryTab: "favorites",
   searchLoading: false,
   searchResults: { songs: [], artists: [] },
   recentSearches: normalizeRecentSearches(loadJSON(STORAGE.RECENT_SEARCHES, [])),
   currentSong: loadJSON(STORAGE.CURRENT_SONG, null),
   queue: dedupeSongs(loadJSON(STORAGE.QUEUE, [])),
   currentSongIndex: 0,
   isPlaying: false,
   isLoading: true, // Start in loading state for home UI
   progress: 0,
   duration: 0,
   volume: Math.max(0, Math.min(1, initialVol)),
   favorites: dedupeSongs(loadJSON(STORAGE.FAVORITES, [])),
   playlists: normalizePlaylists(loadJSON(STORAGE.PLAYLISTS, [{ id: "default", name: "My Playlist", songs: [] }])),
   trendingSongs: [],
   indieSongs: [],
   englishSongs: [],
   recommendedSongs: [],
   recentlyPlayed: loadJSON(STORAGE.RECENT_PLAYED, []),
   pendingSearchQuery: "",
   modal: null,
   fullscreenPlayer: false,
   lyricsPanel: false,
   lyricsData: null,
   lyricsLoading: false,
   artistProfile: null,
   queuePanel: false
 };

 let searchTimer = null;
 let searchRequestToken = 0;
 let lyricsScrollTimeout = null;

 function initApp() {
   try {
     seedCatalog();
     restoreCurrentSongIndex();
     restoreAudioPosition();

     if (state.currentSong?.audioUrl) {
       audio.src = state.currentSong.audioUrl;
     }
     audio.volume = state.volume;

     bindGlobalEvents();
     bindAudioEvents();

     if (!window.location.hash) {
       window.location.hash = "#/";
     }

     // Check for first visit and show welcome
     const firstVisit = loadJSON("pawtify-welcome-seen", false);
     if (!firstVisit) {
       state.modal = { type: "welcome" };
       saveJSON("pawtify-welcome-seen", true);
     }

     // 1. RENDER IMMEDIATELY to prevent blank UI
     renderCurrentRoute();

     // 2. Fetch data asynchronously
     loadTrendingSongs().then(() => {
       if (state.currentSong) {
         loadRecommendations();
       }
     });

   } catch (e) {
     console.error("Critical initialization error:", e);
     if (appMain) {
       appMain.innerHTML = `<div class="empty-state"><h2>App Error</h2><p>Something went wrong loading Pawtify. Please refresh the page.</p></div>`;
     }
   }
 }

 // Start the application
 initApp();

 /* ================================================================
    GLOBAL EVENTS
 ================================================================ */
 function bindGlobalEvents() {
   window.addEventListener("hashchange", renderCurrentRoute);

   document.addEventListener("click", async (event) => {
     const routeButton = event.target.closest("[data-route]");
     if (routeButton) {
       event.preventDefault();
       navigate(routeButton.dataset.route);
       return;
     }

     const actionNode = event.target.closest("[data-action]");
     if (!actionNode) return;

     const action = actionNode.dataset.action;
     const songId = actionNode.dataset.songId || null;
     const source = actionNode.dataset.source || null;
     const playlistId = actionNode.dataset.playlistId || null;

     try {
       if (action === "play-something") {
         event.preventDefault();
         await playSomething();
         return;
       }

       if (action === "toggle-play") {
         event.preventDefault();
         await togglePlay();
         return;
       }

       if (action === "next-track") {
         event.preventDefault();
         await nextTrack();
         return;
       }

       if (action === "prev-track") {
         event.preventDefault();
         previousTrack();
         return;
       }

       if (action === "play-song" && songId) {
         event.preventDefault();
         await playSongById(songId, source, playlistId);
         return;
       }

       if (action === "toggle-favorite" && songId) {
         event.preventDefault();
         const song = getSongById(songId);
         if (song) toggleFavorite(song);
         return;
       }

       if (action === "open-song-details") {
         event.preventDefault();
         openSongDetails();
         return;
       }

       if (action === "share-song") {
         event.preventDefault();
         await shareCurrentSong();
         return;
       }

       if (action === "open-playlist-picker" && songId) {
         event.preventDefault();
         state.modal = { type: "playlistPicker", songId };
         renderOverlay();
         return;
       }

       if (action === "playlist-toggle-song" && songId && playlistId) {
         event.preventDefault();
         const song = getSongById(songId);
         if (!song) return;
         const playlist = state.playlists.find((entry) => entry.id === playlistId);
         if (!playlist) return;

         const exists = playlist.songs.some((item) => item.id === song.id);
         if (exists) {
           removeFromPlaylist(song.id, playlistId);
         } else {
           addToPlaylist(song, playlistId);
         }
         state.modal = { type: "playlistPicker", songId };
         renderOverlay();
         renderSidebarPlaylists();
         return;
       }

       if (action === "open-create-playlist") {
         event.preventDefault();
         state.modal = { type: "createPlaylist" };
         renderOverlay();
         return;
       }

       if (action === "close-modal") {
         event.preventDefault();
         state.modal = null;
         renderOverlay();
         return;
       }

       if (action === "open-fullscreen-player") {
         event.preventDefault();
         state.fullscreenPlayer = true;
         renderFullscreenPlayer();
         return;
       }

       if (action === "close-fullscreen-player") {
         event.preventDefault();
         state.fullscreenPlayer = false;
         renderFullscreenPlayer();
         return;
       }

       if (action === "toggle-repeat") {
         event.preventDefault();
         toggleRepeat();
         return;
       }

       if (action === "toggle-shuffle") {
         event.preventDefault();
         toggleShuffle();
         return;
       }

       if (action === "download-song") {
         event.preventDefault();
         downloadCurrentSong();
         return;
       }

       if (action === "open-lyrics") {
         event.preventDefault();
         openLyrics();
         return;
       }

       if (action === "close-lyrics") {
         event.preventDefault();
         state.lyricsPanel = false;
         renderLyricsPanel();
         return;
       }

       if (action === "open-artist-profile") {
         event.preventDefault();
         const artistName = actionNode.dataset.artist || "";
         if (artistName) openArtistProfile(artistName);
         return;
       }

       if (action === "close-artist-profile") {
         event.preventDefault();
         state.artistProfile = null;
         renderArtistProfile();
         return;
       }

       if (action === "open-queue") {
         event.preventDefault();
         state.queuePanel = true;
         renderQueuePanel();
         return;
       }

       if (action === "close-queue") {
         event.preventDefault();
         state.queuePanel = false;
         renderQueuePanel();
         return;
       }

       if (action === "remove-from-queue" && songId) {
         event.preventDefault();
         removeFromQueue(songId);
         return;
       }

       if (action === "clear-queue") {
         event.preventDefault();
         clearQueue();
         return;
       }

       if (action === "open-app-info") {
         event.preventDefault();
         state.modal = { type: "appInfo" };
         renderOverlay();
         return;
       }

       if (action === "set-search-tab") {
         event.preventDefault();
         state.searchTab = actionNode.dataset.value || "songs";
         if (state.route.name === "search") renderCurrentRoute();
         return;
       }

       if (action === "set-library-tab") {
         event.preventDefault();
         state.libraryTab = actionNode.dataset.value || "favorites";
         if (state.route.name === "library") renderCurrentRoute();
         return;
       }

       if (action === "clear-search-history") {
         event.preventDefault();
         state.recentSearches = [];
         saveJSON(STORAGE.RECENT_SEARCHES, []);
         if (state.route.name === "search") renderCurrentRoute();
         return;
       }

       if (action === "use-recent-search") {
         event.preventDefault();
         const query = actionNode.dataset.query || "";
         state.searchQuery = query;
         if (state.route.name !== "search") {
           state.pendingSearchQuery = query;
           navigate("/search");
           return;
         }
         renderCurrentRoute();
         const input = document.getElementById("search-input");
         if (input) {
           input.value = query;
           input.focus();
         }
         runSearch(query);
         return;
       }

       if (action === "remove-recent-search") {
         event.preventDefault();
         const query = actionNode.dataset.query || "";
         state.recentSearches = state.recentSearches.filter((entry) => entry.query !== query);
         saveJSON(STORAGE.RECENT_SEARCHES, state.recentSearches);
         if (state.route.name === "search") renderCurrentRoute();
         return;
       }

       if (action === "play-all-playlist" && playlistId) {
         event.preventDefault();
         const playlist = state.playlists.find((entry) => entry.id === playlistId);
         if (playlist?.songs.length) {
           await play(playlist.songs[0], playlist.songs, true);
         }
         return;
       }

       if (action === "shuffle-playlist" && playlistId) {
         event.preventDefault();
         if (playlistId.startsWith("artist-")) {
           const artistName = playlistId.replace("artist-", "");
           if (state.artistProfile?.songs?.length) {
             const shuffled = [...state.artistProfile.songs].sort(() => Math.random() - 0.5);
             await play(shuffled[0], shuffled, true);
           } else {
             const songs = await searchSongs(artistName, 0, 20);
             if (songs.length) {
               const shuffled = [...songs].sort(() => Math.random() - 0.5);
               await play(shuffled[0], shuffled, true);
             }
           }
           return;
         }
         const playlist = state.playlists.find((entry) => entry.id === playlistId);
         if (!playlist?.songs.length) return;
         const shuffled = [...playlist.songs].sort(() => Math.random() - 0.5);
         await play(shuffled[0], shuffled, true);
         return;
       }

       if (action === "delete-playlist" && playlistId) {
         event.preventDefault();
         if (playlistId === "default") return;
         const playlist = state.playlists.find((entry) => entry.id === playlistId);
         if (!playlist) return;
         if (window.confirm(`Delete "${playlist.name}"?`)) {
           deletePlaylist(playlistId);
           if (state.route.name === "playlist" && state.route.playlistId === playlistId) {
             navigate("/library");
           } else {
             renderCurrentRoute();
           }
         }
         return;
       }

       if (action === "dismiss-overlay" && event.target === actionNode) {
         event.preventDefault();
         state.modal = null;
         renderOverlay();
         return;
       }
     } catch (err) {
       console.error("Action error:", err);
     }
   });

   document.addEventListener("input", (event) => {
     const target = event.target;

     if (target.id === "search-input") {
       state.searchQuery = target.value;
       if (!state.searchQuery.trim()) {
         state.searchLoading = false;
         state.searchResults = { songs: [], artists: [] };
         searchRequestToken += 1;
         if (searchTimer) {
           window.clearTimeout(searchTimer);
           searchTimer = null;
         }
         if (state.route.name === "search") renderCurrentRoute();
         return;
       }

       state.searchLoading = true;
       if (searchTimer) window.clearTimeout(searchTimer);
       searchTimer = window.setTimeout(() => {
         runSearch(state.searchQuery);
       }, 500);
     }

     if (target.id === "seekbar") {
       const nextTime = Number.parseFloat(target.value);
       if (!Number.isNaN(nextTime)) seekTo(nextTime);
     }

     if (target.id === "volume-slider" || target.id === "fs-volume-slider") {
       const nextVolume = Number.parseFloat(target.value) / 100;
       if (!Number.isNaN(nextVolume)) setVolume(nextVolume);
     }

     if (target.id === "fs-seekbar") {
       const nextTime = Number.parseFloat(target.value);
       if (!Number.isNaN(nextTime)) seekTo(nextTime);
     }
   });

   document.addEventListener("submit", (event) => {
     const form = event.target;
     if (form.id !== "create-playlist-form") return;
     event.preventDefault();
     const input = form.querySelector("input[name='playlistName']");
     const name = (input?.value || "").trim();
     if (!name) return;

     createPlaylist(name);
     state.modal = null;
     renderCurrentRoute();
     renderOverlay();
     renderSidebarPlaylists();
   });

   document.addEventListener("keydown", (event) => {
     if (event.key === "Escape") {
       if (state.lyricsPanel) {
         state.lyricsPanel = false;
         renderLyricsPanel();
         return;
       }
       if (state.artistProfile) {
         state.artistProfile = null;
         renderArtistProfile();
         return;
       }
       if (state.queuePanel) {
         state.queuePanel = false;
         renderQueuePanel();
         return;
       }
       if (state.fullscreenPlayer) {
         state.fullscreenPlayer = false;
         renderFullscreenPlayer();
         return;
       }
       if (state.modal) {
         state.modal = null;
         renderOverlay();
       }
     }
   });
 }

 window.addEventListener("resize", () => {
   if (state.fullscreenPlayer) {
     renderFullscreenPlayer();
   }
 });

 /* ================================================================
    AUDIO EVENTS
 ================================================================ */
 function bindAudioEvents() {
   audio.addEventListener("timeupdate", () => {
     state.progress = audio.currentTime || 0;
     state.duration = audio.duration || state.currentSong?.durationSec || 0;
     if (state.currentSong) saveJSON(STORAGE.CURRENT_TIME, state.progress);
     refreshPlaybackUI();
     syncLyricsWithPlayback();
   });

   audio.addEventListener("loadedmetadata", () => {
     state.duration = audio.duration || state.currentSong?.durationSec || 0;
     const savedPosition = Number.parseFloat(loadJSON(STORAGE.CURRENT_TIME, 0));
     if (state.currentSong && Number.isFinite(savedPosition) && savedPosition > 0) {
       const seekTime = Math.min(savedPosition, Math.max(0, state.duration - 0.25));
       if (seekTime > 0 && Math.abs(audio.currentTime - seekTime) > 0.1) {
         audio.currentTime = seekTime;
         state.progress = seekTime;
       }
     }
     state.isLoading = false;
     refreshPlaybackUI();
   });

   audio.addEventListener("ended", () => {
     if (state.repeatMode === "one") {
       audio.currentTime = 0;
       audio.play();
       return;
     }
     nextTrack();
   });

   audio.addEventListener("error", () => {
     state.isLoading = false;
     state.isPlaying = false;
     refreshPlaybackUI();
   });
 }

 /* ================================================================
    ROUTING
 ================================================================ */
 function parseRoute() {
   const raw = window.location.hash.replace(/^#/, "") || "/";
   const normalized = raw.startsWith("/") ? raw : `/${raw}`;

   if (normalized === "/" || normalized === "") return { name: "home", playlistId: null };
   if (normalized === "/search") return { name: "search", playlistId: null };
   if (normalized === "/library") return { name: "library", playlistId: null };
   if (normalized.startsWith("/playlist/")) {
     const id = decodeURIComponent(normalized.replace("/playlist/", "").trim());
     return { name: "playlist", playlistId: id || null };
   }
   return { name: "home", playlistId: null };
 }

 function navigate(route) {
   const next = route.startsWith("/") ? route : `/${route}`;
   window.location.hash = `#${next}`;
 }

 /* ================================================================
    SEARCH
 ================================================================ */
 async function runSearch(query) {
   const q = (query || "").trim();
   if (!q) return;
   const token = ++searchRequestToken;

   try {
     const [songs, artists] = await Promise.all([
       searchSongs(q, 0, 10),
       searchArtists(q, 0, 10)
     ]);

     if (token !== searchRequestToken) return;

     state.searchResults = { songs, artists };
     state.searchLoading = false;
     rememberSongs(songs);

     const item = { query: q, timestamp: Date.now() };
     state.recentSearches = [item, ...state.recentSearches.filter((entry) => entry.query.toLowerCase() !== q.toLowerCase())].slice(0, 10);
     saveJSON(STORAGE.RECENT_SEARCHES, state.recentSearches);

     if (state.route.name === "search") renderCurrentRoute();
   } catch (error) {
     if (token !== searchRequestToken) return;
     console.error("Search failed:", error);
     state.searchLoading = false;
     if (state.route.name === "search") renderCurrentRoute();
   }
 }

 /* ================================================================
    RENDER: MASTER
 ================================================================ */
 function renderCurrentRoute() {
   if (!appMain) return;
   
   try {
     state.route = parseRoute();
     markActiveNav();

     if (state.route.name === "search") {
       appMain.innerHTML = renderSearchPage();
       const searchInput = document.getElementById("search-input");
       if (searchInput) searchInput.value = state.searchQuery;
       if (state.pendingSearchQuery) {
         const pending = state.pendingSearchQuery;
         state.pendingSearchQuery = "";
         runSearch(pending);
       }
     } else if (state.route.name === "library") {
       appMain.innerHTML = renderLibraryPage();
     } else if (state.route.name === "playlist") {
       appMain.innerHTML = renderPlaylistPage(state.route.playlistId);
     } else {
       appMain.innerHTML = renderHomePage();
     }

     renderPlayerBar();
     renderMiniPlayer();
     renderFullscreenPlayer();
     renderLyricsPanel();
     renderArtistProfile();
     renderQueuePanel();
     renderOverlay();
     renderSidebarPlaylists();
     refreshPlaybackUI();
   } catch (e) {
     console.error("Routing rendering error:", e);
   }
 }

 /* ================================================================
    RENDER: HOME PAGE
 ================================================================ */
 function renderHomePage() {
   const greeting = getGreeting();
   
   // Safely ensure arrays exist before slicing
   const rec = Array.isArray(state.recommendedSongs) ? state.recommendedSongs.slice(0, 10) : [];
   const trending = Array.isArray(state.trendingSongs) ? state.trendingSongs.slice(0, 10) : [];
   const indie = Array.isArray(state.indieSongs) ? state.indieSongs.slice(0, 10) : [];
   const english = Array.isArray(state.englishSongs) ? state.englishSongs.slice(0, 10) : [];
   const featured = trending.slice(0, 6);

   const loaderHTML = `<div class="empty-state"><div class="spinner" style="margin:0 auto 16px;"></div><h2>Loading...</h2></div>`;

   return `
     <section class="page">
       <div class="home-greeting">
         <h1><i class="fa-solid fa-music" style="margin-right:10px; color:var(--green); font-size:0.85em;"></i>${escapeHTML(greeting)}</h1>
         <button class="settings-btn" data-action="open-app-info" type="button" aria-label="About Pawtify">
           <i class="fa-solid fa-gear"></i>
         </button>
       </div>

       <div class="home-grid">
         ${state.favorites.length ? renderHomeGridCard(state.favorites[0], "favorites") : ""}
         ${state.playlists[0]?.songs?.length ? renderHomeGridCard(state.playlists[0].songs[0], "playlist") : ""}
         ${featured[0] ? renderHomeGridCard(featured[0], "trending") : ""}
         ${featured[1] ? renderHomeGridCard(featured[1], "trending") : ""}
         ${featured[2] ? renderHomeGridCard(featured[2], "trending") : ""}
         ${featured[3] ? renderHomeGridCard(featured[3], "trending") : ""}
       </div>

       <div class="home-section">
         <h2 class="home-section-title"><i class="fa-solid fa-fire" style="margin-right:8px; color:var(--green);"></i>Trending Now</h2>
         <div class="home-scroll">
           ${state.isLoading ? loaderHTML : (trending.length ? trending.map((s, i) => renderHomeScrollCard(s, i, "trending")).join("") : '<div class="empty-state">No songs available right now.</div>')}
         </div>
       </div>

       ${(!state.isLoading && indie.length) ? `
       <div class="home-section">
         <h2 class="home-section-title"><i class="fa-solid fa-indian-rupee-sign" style="margin-right:8px; color:var(--green);"></i>Indie Favourites</h2>
         <div class="home-scroll">
           ${indie.map((s, i) => renderHomeScrollCard(s, i, "indie")).join("")}
         </div>
       </div>` : ""}

       ${(!state.isLoading && english.length) ? `
       <div class="home-section">
         <h2 class="home-section-title"><i class="fa-solid fa-globe" style="margin-right:8px; color:var(--green);"></i>Global Hits</h2>
         <div class="home-scroll">
           ${english.map((s, i) => renderHomeScrollCard(s, i, "english")).join("")}
         </div>
       </div>` : ""}

       <div class="home-section">
         <h2 class="home-section-title"><i class="fa-solid fa-radio" style="margin-right:8px; color:var(--green);"></i>Just For You</h2>
         <div class="home-scroll">
           ${rec.length ? rec.map((s, i) => renderHomeScrollCard(s, i, "recommended")).join("") : '<div class="empty-state">Play more songs to get personalised recommendations</div>'}
         </div>
       </div>
     </section>
   `;
 }

 function getGreeting() {
   const hour = new Date().getHours();
   if (hour < 12) return "Good morning";
   if (hour < 17) return "Good afternoon";
   return "Good evening";
 }

 function renderHomeGridCard(song, source) {
   if (!song) return "";
   return `
     <div class="home-grid-card" data-action="play-song" data-song-id="${escapeHTML(song.id)}" data-source="${escapeHTML(source)}" type="button">
       <img src="${escapeHTML(song.coverUrl)}" alt="${escapeHTML(song.title)}" />
       <span>${escapeHTML(song.title)}</span>
     </div>
   `;
 }

 function renderHomeScrollCard(song, index, source) {
   if (!song) return "";
   return `
     <div class="home-scroll-card" data-action="play-song" data-song-id="${escapeHTML(song.id)}" data-source="${escapeHTML(source)}" type="button">
       <div class="scroll-cover-wrap">
         <img src="${escapeHTML(song.coverUrl)}" alt="${escapeHTML(song.title)}" />
       </div>
       <h3>${escapeHTML(song.title)}</h3>
       <p>${escapeHTML(song.artist)}</p>
     </div>
   `;
 }

 /* ================================================================
    RENDER: SEARCH PAGE
 ================================================================ */
 function renderSearchPage() {
   const hasQuery = state.searchQuery.trim().length > 0;
   return `
     <section class="page">
       <div class="page-header">
         <h1 class="page-title">Search</h1>
       </div>
       <div class="search-bar">
         <i class="fa-solid fa-magnifying-glass search-icon"></i>
         <input id="search-input" class="search-input" placeholder="What do you want to listen to?" autocomplete="off" />
         ${state.searchLoading ? '<div class="spinner" style="position:absolute;right:16px;top:50%;transform:translateY(-50%);"></div>' : ""}
       </div>

       ${hasQuery ? renderSearchResults() : renderSearchHistory()}
     </section>
   `;
 }

 function renderSearchResults() {
   const songs = state.searchResults.songs;
   const artists = state.searchResults.artists;

   return `
     <div class="tab-list">
       <button class="tab-btn ${state.searchTab === "songs" ? "active" : ""}" data-action="set-search-tab" data-value="songs" type="button">Songs</button>
       <button class="tab-btn ${state.searchTab === "artists" ? "active" : ""}" data-action="set-search-tab" data-value="artists" type="button">Artists</button>
     </div>

     ${state.searchTab === "songs"
       ? `<div class="song-table">${songs.length ? songs.map((s, i) => renderSongRow(s, i + 1, "search")).join("") : '<div class="empty-state">No songs found.</div>'}</div>`
       : `<div class="card-grid">${artists.length ? artists.map((a, i) => renderArtistSearchCard(a, i)).join("") : '<div class="empty-state">No artists found.</div>'}</div>`}
   `;
 }

 function renderSearchHistory() {
   return `
     <div>
       <div class="page-header">
         <h2 class="page-title" style="font-size:1.25rem;">Recent Searches</h2>
         ${state.recentSearches.length ? '<button class="btn btn-soft" data-action="clear-search-history" type="button">Clear All</button>' : ""}
       </div>
       <div class="card-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
         ${state.recentSearches.length
           ? state.recentSearches.map((item) => `
             <div class="card" style="display:flex; align-items:center; justify-content:space-between; padding:16px 20px;">
               <button class="recent-left" data-action="use-recent-search" data-query="${escapeHTML(item.query)}" type="button" style="text-align:left; flex:1;">
                 <div style="font-weight:700; font-size:1rem;">${escapeHTML(item.query)}</div>
                 <div style="font-size:0.8125rem; color:var(--muted); margin-top:4px;">${new Date(item.timestamp).toLocaleDateString()}</div>
               </button>
               <button class="song-action-btn" style="opacity:1;" data-action="remove-recent-search" data-query="${escapeHTML(item.query)}" type="button" aria-label="Remove">
                 <i class="fa-solid fa-xmark"></i>
               </button>
             </div>
           `).join("")
           : '<div class="empty-state">No recent searches.</div>'}
       </div>
     </div>
   `;
 }

 /* ================================================================
    RENDER: LIBRARY PAGE
 ================================================================ */
 function renderLibraryPage() {
   const favorites = state.favorites;
   return `
     <section class="page">
       <div class="page-header">
         <h1 class="page-title">Your Library</h1>
         <button class="btn btn-soft" data-action="open-create-playlist" type="button">
           <i class="fa-solid fa-plus"></i> New Playlist
         </button>
       </div>

       <div class="tab-list">
         <button class="tab-btn ${state.libraryTab === "favorites" ? "active" : ""}" data-action="set-library-tab" data-value="favorites" type="button">Favorites</button>
         <button class="tab-btn ${state.libraryTab === "playlists" ? "active" : ""}" data-action="set-library-tab" data-value="playlists" type="button">Playlists</button>
       </div>

       ${state.libraryTab === "favorites"
         ? `<div class="song-table">${favorites.length ? favorites.map((s, i) => renderSongRow(s, i + 1, "favorites")).join("") : '<div class="empty-state">No favorites yet. Tap the heart icon to save songs.</div>'}</div>`
         : `<div class="card-grid">${state.playlists.length ? state.playlists.map((p, i) => renderPlaylistCard(p, i)).join("") : '<div class="empty-state">No playlists yet.</div>'}</div>`}
     </section>
   `;
 }

 /* ================================================================
    RENDER: PLAYLIST PAGE
 ================================================================ */
 function renderPlaylistPage(playlistId) {
   const playlist = state.playlists.find((item) => item.id === playlistId);
   if (!playlist) {
     return `
       <section class="page">
         <div class="empty-state">
           <i class="fa-solid fa-music"></i>
           <h2>Playlist Not Found</h2>
           <p>This playlist does not exist anymore.</p>
           <button class="btn btn-primary" data-route="/library" type="button" style="margin-top:16px;">Back to Library</button>
         </div>
       </section>
     `;
   }

   const cover = playlist.songs[0]?.coverUrl || "";

   return `
     <section class="page">
       <div class="hero-player" style="background: linear-gradient(180deg, rgba(40,40,40,0.8) 0%, var(--dark-gray) 100%);">
         ${cover ? `<img class="hero-cover" src="${escapeHTML(cover)}" alt="" />` : `<div class="hero-cover" style="background:var(--elevated); display:grid; place-items:center;"><i class="fa-solid fa-music" style="font-size:4rem; color:var(--muted);"></i></div>`}
         <div class="hero-details">
           <span class="hero-kicker">Playlist</span>
           <h1 class="hero-title">${escapeHTML(playlist.name)}</h1>
           <div class="hero-meta">
             <img src="${LOGO_URL}" alt="" />
             <span>Pawtify</span>
             <span>\u2022</span>
             <span>${playlist.songs.length} songs</span>
           </div>
           <div class="hero-actions">
             <button class="btn-play" data-action="play-all-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button"><i class="fa-solid fa-play"></i></button>
             <button class="btn-icon" data-action="shuffle-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button"><i class="fa-solid fa-shuffle"></i></button>
             ${playlist.id !== "default" ? `<button class="btn-icon" data-action="delete-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button"><i class="fa-solid fa-trash"></i></button>` : ""}
           </div>
         </div>
       </div>

       <div class="song-table">
         ${playlist.songs.length
           ? playlist.songs.map((s, i) => renderSongRow(s, i + 1, "playlist", playlist.id)).join("")
           : '<div class="empty-state">This playlist is empty.</div>'}
       </div>
     </section>
   `;
 }

 /* ================================================================
    RENDER: CARDS & ROWS
 ================================================================ */
 function renderArtistSearchCard(artist, index) {
   if (!artist) return "";
   return `
     <article class="card" data-action="open-artist-profile" data-artist="${escapeHTML(artist.name)}" type="button">
       <div class="card-cover-wrap" style="border-radius:999px;">
         <img class="card-cover" src="${escapeHTML(artist.imageUrl)}" alt="${escapeHTML(artist.name)}" style="border-radius:999px;" />
       </div>
       <h3 class="card-title">${escapeHTML(artist.name)}</h3>
       <p class="card-meta">${escapeHTML(artist.type)}</p>
     </article>
   `;
 }

 function renderPlaylistCard(playlist, index) {
   const cover = playlist.songs[0]?.coverUrl || "";
   return `
     <article class="card" data-route="/playlist/${encodeURIComponent(playlist.id)}" type="button">
       <div class="card-cover-wrap">
         ${cover
           ? `<img class="card-cover" src="${escapeHTML(cover)}" alt="${escapeHTML(playlist.name)}" />`
           : `<div class="card-cover" style="display:grid; place-items:center; background:var(--hover);"><i class="fa-solid fa-music" style="font-size:2rem; color:var(--muted);"></i></div>`}
       </div>
       <h3 class="card-title">${escapeHTML(playlist.name)}</h3>
       <p class="card-meta">${playlist.songs.length} ${playlist.songs.length === 1 ? "song" : "songs"}</p>
     </article>
   `;
 }

 function renderSongRow(song, index, source, playlistId = "") {
   if (!song) return "";
   const active = state.currentSong?.id === song.id;
   const isFav = state.favorites.some((item) => item.id === song.id);
   return `
     <div class="song-row ${active ? "active" : ""}" data-action="play-song" data-song-id="${escapeHTML(song.id)}" data-source="${escapeHTML(source)}" data-playlist-id="${escapeHTML(playlistId)}" type="button">
       <div class="song-index">
         ${active && state.isPlaying ? '<i class="fa-solid fa-volume-high" style="font-size:0.75rem;"></i>' : `<span>${index}</span>`}
       </div>
       <img class="song-cover-sm" src="${escapeHTML(song.coverUrl)}" alt="" />
       <div class="song-info">
         <div class="song-title">${escapeHTML(song.title)}</div>
         <div class="song-artist" data-action="open-artist-profile" data-artist="${escapeHTML(song.artist)}" onclick="event.stopPropagation();">${escapeHTML(song.artist)}</div>
       </div>
       <div class="song-duration">${escapeHTML(song.duration || "0:00")}</div>
       <button class="song-action-btn ${isFav ? 'active' : ''}" data-action="toggle-favorite" data-song-id="${escapeHTML(song.id)}" type="button" onclick="event.stopPropagation();">
         <i class="${isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
       </button>
       <button class="song-action-btn" data-action="open-playlist-picker" data-song-id="${escapeHTML(song.id)}" type="button" onclick="event.stopPropagation();">
         <i class="fa-solid fa-plus"></i>
       </button>
     </div>
   `;
 }

 /* ================================================================
    RENDER: DESKTOP PLAYER BAR
 ================================================================ */
 function renderPlayerBar() {
   if (!playerBar) return;

   if (!state.currentSong) {
     playerBar.innerHTML = `
       <div class="player-bar-left">
         <div class="song-cover-sm" style="background:var(--elevated);"></div>
         <div class="player-bar-info"><div class="player-bar-title" style="color:var(--muted);">Not Playing</div></div>
       </div>
       <div class="player-bar-center"></div>
       <div class="player-bar-right"></div>
     `;
     return;
   }

   const song = state.currentSong;
   const isFav = state.favorites.some((item) => item.id === song.id);
   const qualityLabel = getQualityLabel(song);

   playerBar.innerHTML = `
     <div class="player-bar-left">
       <img class="player-bar-cover" src="${escapeHTML(song.coverUrl)}" alt="" />
       <div class="player-bar-info">
         <div class="player-bar-title">${escapeHTML(song.title)}</div>
         <div style="display:flex; align-items:center; gap:4px;">
           <div class="player-bar-artist" data-action="open-artist-profile" data-artist="${escapeHTML(song.artist)}">${escapeHTML(song.artist)}</div>
           <span class="player-quality-badge">${escapeHTML(qualityLabel)}</span>
         </div>
       </div>
       <button class="player-bar-like ${isFav ? 'active' : ''}" data-action="toggle-favorite" data-song-id="${escapeHTML(song.id)}" type="button">
         <i class="${isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
       </button>
     </div>

     <div class="player-bar-center">
       <div class="player-controls">
         <button class="control-btn ${state.shuffleMode ? 'shuffle-active' : ''}" data-action="toggle-shuffle" type="button" aria-label="Shuffle"><i class="fa-solid fa-shuffle"></i></button>
         <button class="control-btn" data-action="prev-track" type="button" aria-label="Previous"><i class="fa-solid fa-backward-step"></i></button>
         <button class="control-btn main" data-action="toggle-play" type="button" aria-label="Play/Pause">
           ${state.isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>'}
         </button>
         <button class="control-btn" data-action="next-track" type="button" aria-label="Next"><i class="fa-solid fa-forward-step"></i></button>
         <button class="control-btn ${state.repeatMode !== 'none' ? 'repeat-active' : ''}" data-action="toggle-repeat" type="button" aria-label="Repeat">
           <i class="${state.repeatMode === 'one' ? 'fa-solid fa-1' : 'fa-solid fa-repeat'}"></i>
         </button>
       </div>
       <div class="progress-row">
         <span class="time-label" id="time-current">${formatTime(state.progress)}</span>
         <input id="seekbar" class="seekbar" type="range" min="0" max="${Math.max(1, Math.floor(state.duration || song.durationSec || 1))}" value="${Math.floor(state.progress || 0)}" />
         <span class="time-label" id="time-total">${formatTime(state.duration || song.durationSec || 0)}</span>
       </div>
     </div>

     <div class="player-bar-right">
       <button class="control-btn" data-action="open-queue" type="button" aria-label="Queue"><i class="fa-solid fa-list-ul"></i></button>
       <button class="control-btn" data-action="open-playlist-picker" data-song-id="${escapeHTML(song.id)}" type="button" aria-label="Add to playlist"><i class="fa-solid fa-plus"></i></button>
       <button class="control-btn" data-action="open-song-details" type="button" aria-label="Details"><i class="fa-solid fa-circle-info"></i></button>
       <i class="fa-solid fa-volume-high" style="color:var(--muted); font-size:0.875rem;"></i>
       <input id="volume-slider" class="volume-slider" type="range" min="0" max="100" value="${Math.round(state.volume * 100)}" />
     </div>
   `;
 }

 /* ================================================================
    RENDER: MOBILE MINI PLAYER
 ================================================================ */
 function renderMiniPlayer() {
   if (!miniPlayer) return;

   if (!state.currentSong) {
     miniPlayer.innerHTML = "";
     miniPlayer.classList.add("hidden");
     return;
   }

   miniPlayer.classList.remove("hidden");
   const song = state.currentSong;
   const isFav = state.favorites.some((item) => item.id === song.id);
   const progressPercent = state.duration > 0 ? (state.progress / state.duration) * 100 : 0;

   miniPlayer.innerHTML = `
     <div class="mini-player-inner">
       <div class="mini-player-main" data-action="open-fullscreen-player">
         <img class="mini-player-cover" src="${escapeHTML(song.coverUrl)}" alt="" />
         <div class="mini-player-info">
           <div class="mini-player-title">${escapeHTML(song.title)}</div>
           <div class="mini-player-artist">${escapeHTML(song.artist)}</div>
         </div>
       </div>
       <div class="mini-player-btns">
         <button class="mini-player-btn" data-action="open-queue" type="button" aria-label="Queue">
           <i class="fa-solid fa-list-ul"></i>
         </button>
         <button class="mini-player-btn ${isFav ? 'active' : ''}" data-action="toggle-favorite" data-song-id="${escapeHTML(song.id)}" type="button" style="color: ${isFav ? 'var(--green)' : 'var(--muted)'};">
           <i class="${isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
         </button>
         <button class="mini-player-btn" data-action="toggle-play" type="button" aria-label="Play/Pause">
           ${state.isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>'}
         </button>
       </div>
     </div>
     <div class="mini-progress">
       <div class="mini-progress-fill" style="width: ${progressPercent}%;"></div>
     </div>
   `;
 }

 /* ================================================================
    RENDER: SIDEBAR PLAYLISTS
 ================================================================ */
 function renderSidebarPlaylists() {
   if (!sidebarPlaylists) return;
   sidebarPlaylists.innerHTML = state.playlists.map((playlist) => {
     const isActive = state.route.name === "playlist" && state.route.playlistId === playlist.id;
     const cover = playlist.songs[0]?.coverUrl || "";
     return `
       <button class="sidebar-playlist-item ${isActive ? 'active' : ''}" data-route="/playlist/${encodeURIComponent(playlist.id)}" type="button">
         ${cover
           ? `<img class="sidebar-playlist-thumb" src="${escapeHTML(cover)}" alt="" />`
           : `<div class="sidebar-playlist-thumb empty"><i class="fa-solid fa-music"></i></div>`}
         <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTML(playlist.name)}</span>
       </button>
     `;
   }).join("");
 }

 function markActiveNav() {
   document.querySelectorAll(".nav-link").forEach((btn) => {
     const route = btn.dataset.route;
     const active =
       (route === "/" && state.route.name === "home") ||
       (route === "/search" && state.route.name === "search") ||
       (route === "/library" && (state.route.name === "library" || state.route.name === "playlist"));
     btn.classList.toggle("active", active);
   });

   document.querySelectorAll(".mobile-nav-item").forEach((btn) => {
     const route = btn.dataset.route;
     const active =
       (route === "/" && state.route.name === "home") ||
       (route === "/search" && state.route.name === "search") ||
       (route === "/library" && (state.route.name === "library" || state.route.name === "playlist"));
     btn.classList.toggle("active", active);
   });
 }

 /* ================================================================
    PLAYBACK UI REFRESH
 ================================================================ */
 function refreshPlaybackUI() {
   const seek = document.getElementById("seekbar");
   if (seek) {
     const maxVal = Math.max(1, Math.floor(state.duration || state.currentSong?.durationSec || 1));
     seek.max = String(maxVal);
     seek.value = String(Math.floor(state.progress || 0));
     const pct = maxVal > 0 ? (Math.floor(state.progress || 0) / maxVal) * 100 : 0;
     seek.style.background = `linear-gradient(90deg, var(--green) 0%, var(--green-hover) ${pct}%, rgba(255,255,255,0.15) ${pct}%)`;
   }

   const fsSeek = document.getElementById("fs-seekbar");
   if (fsSeek) {
     const fsMax = Math.max(1, Math.floor(state.duration || state.currentSong?.durationSec || 1));
     fsSeek.max = String(fsMax);
     fsSeek.value = String(Math.floor(state.progress || 0));
     const fsPct = fsMax > 0 ? (Math.floor(state.progress || 0) / fsMax) * 100 : 0;
     fsSeek.style.background = `linear-gradient(90deg, var(--green) 0%, var(--green-hover) ${fsPct}%, rgba(255,255,255,0.15) ${fsPct}%)`;
   }

   const currentLabel = document.getElementById("time-current");
   if (currentLabel) currentLabel.textContent = formatTime(state.progress);
   const totalLabel = document.getElementById("time-total");
   if (totalLabel) totalLabel.textContent = formatTime(state.duration || state.currentSong?.durationSec || 0);

   const playToggle = document.querySelector('[data-action="toggle-play"]');
   if (playToggle && playToggle.querySelector("i")) {
     playToggle.innerHTML = state.isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
   }

   const volumeSlider = document.getElementById("volume-slider");
   if (volumeSlider) {
     volumeSlider.value = String(Math.round(state.volume * 100));
     const volPct = Math.round(state.volume * 100);
     volumeSlider.style.background = `linear-gradient(90deg, var(--green) 0%, var(--green-hover) ${volPct}%, rgba(255,255,255,0.15) ${volPct}%)`;
   }

   const fsVol = document.getElementById("fs-volume-slider");
   if (fsVol) {
     fsVol.value = String(Math.round(state.volume * 100));
     const volPct = Math.round(state.volume * 100);
     fsVol.style.background = `linear-gradient(90deg, var(--green) 0%, var(--green-hover) ${volPct}%, rgba(255,255,255,0.15) ${volPct}%)`;
   }

   renderPlayerBar();
   renderMiniPlayer();
   renderFullscreenPlayer();
   renderLyricsPanel();
   renderQueuePanel();
 }

 /* ================================================================
    PLAYBACK CONTROLS
 ================================================================ */
 async function playSomething() {
   if (state.currentSong) {
     await togglePlay();
     return;
   }
   
   let defaultQueue = state.queue.length ? state.queue : state.trendingSongs;
   if (!defaultQueue.length) {
      await loadTrendingSongs();
      defaultQueue = state.trendingSongs;
   }
   if (defaultQueue.length) await play(defaultQueue[0], defaultQueue, true);
 }

 async function play(song, queue = null, autoplay = true) {
   if (!song) return;
   let playableSong = song;
   if (!playableSong.audioUrl) {
     const details = await getSongDetails(playableSong.id);
     if (details?.audioUrl) playableSong = details;
   }
   if (!playableSong.audioUrl) return;

   rememberSongs([playableSong]);
   state.currentSong = playableSong;

   if (queue?.length) {
     state.queue = dedupeSongs(queue);
     const index = state.queue.findIndex((item) => item.id === playableSong.id);
     state.currentSongIndex = index >= 0 ? index : 0;
   } else {
     const index = state.queue.findIndex((item) => item.id === playableSong.id);
     if (index >= 0) {
       state.currentSongIndex = index;
     } else {
       state.queue = dedupeSongs([playableSong, ...state.queue]);
       state.currentSongIndex = 0;
     }
   }

   state.progress = 0;
   state.duration = playableSong.durationSec || 0;
   state.isPlaying = autoplay;
   state.lyricsData = null;

   audio.src = playableSong.audioUrl;
   audio.currentTime = 0;
   saveJSON(STORAGE.CURRENT_TIME, 0);

   if (autoplay) {
     try {
       await audio.play();
       state.isPlaying = true;
     } catch (error) {
       console.warn("Playback blocked:", error);
       state.isPlaying = false;
     }
   }

   addRecentlyPlayed(playableSong.id);
   persistPlayer();
   await loadRecommendations();
   renderCurrentRoute();
 }

 function pause() {
   audio.pause();
   state.isPlaying = false;
   persistPlayer();
   refreshPlaybackUI();
 }

 async function togglePlay() {
   if (!state.currentSong) {
     await playSomething();
     return;
   }
   if (state.isPlaying) {
     pause();
     return;
   }
   try {
     await audio.play();
     state.isPlaying = true;
   } catch (error) {
     console.warn("Resume blocked:", error);
     state.isPlaying = false;
   }
   persistPlayer();
   refreshPlaybackUI();
 }

 async function nextTrack() {
   if (!state.currentSong) {
     await playSomething();
     return;
   }

   if (state.shuffleMode && state.queue.length > 1) {
     const remaining = state.queue.filter((_, i) => i !== state.currentSongIndex);
     const next = remaining[Math.floor(Math.random() * remaining.length)];
     const nextIndex = state.queue.findIndex((s) => s.id === next.id);
     if (nextIndex >= 0) {
       state.currentSongIndex = nextIndex;
       await play(state.queue[nextIndex], state.queue, true);
       return;
     }
   }

   const nextIndex = state.currentSongIndex + 1;
   if (nextIndex < state.queue.length) {
     await play(state.queue[nextIndex], state.queue, true);
     return;
   }
   if (state.repeatMode === "all" && state.queue.length > 1) {
     await play(state.queue[0], state.queue, true);
     return;
   }
   
   const nextSong = await getNextSong(state.currentSong.id);
   if (!nextSong) {
     refreshPlaybackUI();
     return;
   }
   state.queue = dedupeSongs([...state.queue, nextSong]);
   await play(nextSong, state.queue, true);
 }

 function previousTrack() {
   if (!state.currentSong) return;
   if (audio.currentTime > 3) {
     seekTo(0);
     return;
   }
   if (!state.queue.length) return;
   const prevIndex = (state.currentSongIndex - 1 + state.queue.length) % state.queue.length;
   const song = state.queue[prevIndex];
   play(song, state.queue, state.isPlaying);
 }

 function seekTo(seconds) {
   if (!Number.isFinite(seconds)) return;
   audio.currentTime = Math.max(0, seconds);
   state.progress = audio.currentTime;
   saveJSON(STORAGE.CURRENT_TIME, state.progress);
   refreshPlaybackUI();
 }

 function setVolume(value) {
   const clamped = Math.max(0, Math.min(1, value));
   state.volume = clamped;
   audio.volume = clamped;
   saveJSON(STORAGE.VOLUME, clamped);
   refreshPlaybackUI();
 }

 /* ================================================================
    FAVORITES & PLAYLISTS
 ================================================================ */
 function toggleFavorite(song) {
   const exists = state.favorites.some((item) => item.id === song.id);
   if (exists) {
     state.favorites = state.favorites.filter((item) => item.id !== song.id);
   } else {
     state.favorites = dedupeSongs([...state.favorites, song]);
     rememberSongs([song]);
   }
   saveJSON(STORAGE.FAVORITES, state.favorites);
   renderCurrentRoute();
   renderPlayerBar();
   renderMiniPlayer();
   renderFullscreenPlayer();
   renderLyricsPanel();
   renderQueuePanel();
 }

 function addToPlaylist(song, playlistId) {
   state.playlists = state.playlists.map((playlist) => {
     if (playlist.id !== playlistId) return playlist;
     if (playlist.songs.some((item) => item.id === song.id)) return playlist;
     return { ...playlist, songs: dedupeSongs([...playlist.songs, song]) };
   });
   saveJSON(STORAGE.PLAYLISTS, state.playlists);
   seedCatalog();
 }

 function removeFromPlaylist(songId, playlistId) {
   state.playlists = state.playlists.map((playlist) => {
     if (playlist.id !== playlistId) return playlist;
     return { ...playlist, songs: playlist.songs.filter((song) => song.id !== songId) };
   });
   saveJSON(STORAGE.PLAYLISTS, state.playlists);
 }

 function createPlaylist(name) {
   const playlist = {
     id: `playlist-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
     name,
     songs: []
   };
   state.playlists = [...state.playlists, playlist];
   saveJSON(STORAGE.PLAYLISTS, state.playlists);
   renderCurrentRoute();
   renderSidebarPlaylists();
 }

 function deletePlaylist(playlistId) {
   state.playlists = state.playlists.filter((playlist) => playlist.id !== playlistId);
   if (!state.playlists.length) {
     state.playlists = [{ id: "default", name: "My Playlist", songs: [] }];
   }
   saveJSON(STORAGE.PLAYLISTS, state.playlists);
   renderSidebarPlaylists();
 }

 /* ================================================================
    DATA LOADING
 ================================================================ */
 async function loadTrendingSongs() {
   try {
     // Execute 3 simple standard search queries concurrently
     const [trendingReq, indieReq, englishReq] = await Promise.all([
       apiGet("/search/songs", { query: "top charts hindi", page: 0, limit: 12 }),
       apiGet("/search/songs", { query: "indie acoustic", page: 0, limit: 12 }),
       apiGet("/search/songs", { query: "global top 50 pop", page: 0, limit: 12 })
     ]);
     
     const parseSafe = (res) => (res && res.success && res.data && res.data.results) 
       ? res.data.results.map(transformSong).filter(s => s && s.id) 
       : [];
     
     state.trendingSongs = parseSafe(trendingReq);
     state.indieSongs = parseSafe(indieReq);
     state.englishSongs = parseSafe(englishReq);
     
     const all = dedupeSongs([...state.trendingSongs, ...state.indieSongs, ...state.englishSongs]);
     rememberSongs(all);

     if (!state.currentSong && all.length && !state.queue.length) {
       state.queue = dedupeSongs(all);
       saveJSON(STORAGE.QUEUE, state.queue);
     }
   } catch (error) {
     console.error("Unable to load trending songs:", error);
   } finally {
     state.isLoading = false;
     renderCurrentRoute();
   }
 }

 async function loadRecommendations() {
   if (!state.currentSong?.id) {
     state.recommendedSongs = [];
     return;
   }
   try {
     state.recommendedSongs = await getSongRecommendations(state.currentSong.id, 12);
     rememberSongs(state.recommendedSongs);
   } catch (error) {
     console.error("Unable to load recommendations:", error);
     state.recommendedSongs = [];
   }
 }

 /* ================================================================
    SONG DETAILS & SHARING
 ================================================================ */
 async function openSongDetails() {
   if (!state.currentSong) return;
   let song = state.currentSong;
   if (!song.releaseDate || !song.genre || !song.album) {
     const full = await getSongDetails(song.id);
     if (full) {
       song = { ...song, ...full };
       state.currentSong = song;
       rememberSongs([song]);
       persistPlayer();
     }
   }
   state.modal = { type: "songDetails" };
   renderOverlay();
 }

 async function shareCurrentSong() {
   if (!state.currentSong) return;
   const song = state.currentSong;
   const shareText = `${song.title} by ${song.artist} on Pawtify`;
   const shareUrl = `${window.location.origin}${window.location.pathname}#/`;
   try {
     if (navigator.share) {
       await navigator.share({ title: song.title, text: shareText, url: shareUrl });
       return;
     }
   } catch (error) {
     console.warn("Native share failed:", error);
   }
   try {
     await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
     alert("Song link copied to clipboard.");
   } catch (error) {
     console.error("Clipboard write failed:", error);
   }
 }

 async function playSongById(songId, source, playlistId) {
   const song = getSongById(songId);
   if (!song) return;
   if (state.currentSong?.id === song.id) {
     await togglePlay();
     return;
   }
   const queue = resolveQueueBySource(source, playlistId, song);
   await play(song, queue, true);
 }

 function resolveQueueBySource(source, playlistId, fallbackSong) {
   if (source === "search") return state.searchResults.songs;
   if (source === "favorites") return state.favorites;
   if (source === "recommended") return state.recommendedSongs;
   if (source === "queue") return state.queue;
   if (source === "artist") {
     return state.artistProfile?.songs?.length ? state.artistProfile.songs : [fallbackSong];
   }
   if (source === "playlist" && playlistId) {
     return state.playlists.find((playlist) => playlist.id === playlistId)?.songs || [fallbackSong];
   }
   return state.queue.length ? state.queue : [fallbackSong];
 }

 function restoreCurrentSongIndex() {
   if (!state.currentSong) {
     state.currentSongIndex = 0;
     return;
   }
   const found = state.queue.findIndex((song) => song.id === state.currentSong.id);
   state.currentSongIndex = found >= 0 ? found : 0;
 }

 function restoreAudioPosition() {
   if (!state.currentSong) return;
   const savedTime = Number.parseFloat(loadJSON(STORAGE.CURRENT_TIME, 0));
   if (!Number.isNaN(savedTime)) state.progress = savedTime;
 }

 function persistPlayer() {
   saveJSON(STORAGE.CURRENT_SONG, state.currentSong);
   saveJSON(STORAGE.QUEUE, state.queue);
   saveJSON(STORAGE.CURRENT_TIME, state.progress);
   saveJSON(STORAGE.RECENT_PLAYED, state.recentlyPlayed);
 }

 function addRecentlyPlayed(songId) {
   const without = state.recentlyPlayed.filter((id) => id !== songId);
   state.recentlyPlayed = [songId, ...without].slice(0, 25);
   saveJSON(STORAGE.RECENT_PLAYED, state.recentlyPlayed);
 }

 function getSongById(id) {
   if (!id) return null;
   return songCatalog.get(String(id)) || null;
 }

 function seedCatalog() {
   rememberSongs(state.queue);
   rememberSongs(state.favorites);
   rememberSongs(state.playlists.flatMap((playlist) => Array.isArray(playlist.songs) ? playlist.songs : []));
   rememberSongs(state.trendingSongs);
   rememberSongs(state.indieSongs);
   rememberSongs(state.englishSongs);
   rememberSongs(state.recommendedSongs);
   if (state.currentSong) rememberSongs([state.currentSong]);
 }

 function rememberSongs(songs) {
   if (!Array.isArray(songs)) return;
   songs.forEach((song) => {
     if (!song?.id) return;
     songCatalog.set(String(song.id), song);
   });
 }

 function dedupeSongs(songs) {
   if (!Array.isArray(songs)) return [];
   const seen = new Set();
   return songs.filter((song) => {
     if (!song?.id) return false;
     if (seen.has(song.id)) return false;
     seen.add(song.id);
     return true;
   });
 }

 function normalizePlaylists(playlists) {
   if (!Array.isArray(playlists) || playlists.length === 0) {
     return [{ id: "default", name: "My Playlist", songs: [] }];
   }
   return playlists
     .map((playlist, index) => ({
       id: String(playlist.id || `playlist-${index}`),
       name: String(playlist.name || `Playlist ${index + 1}`),
       songs: dedupeSongs(Array.isArray(playlist.songs) ? playlist.songs : [])
     }))
     .filter((playlist) => playlist.name.trim().length > 0);
 }

 function normalizeRecentSearches(items) {
   if (!Array.isArray(items)) return [];
   return items
     .map((entry) => ({
       query: String(entry?.query || "").trim(),
       timestamp: Number(entry?.timestamp) || Date.now()
     }))
     .filter((entry) => entry.query.length > 0)
     .slice(0, 10);
 }

 /* ================================================================
    RENDER: OVERLAY / MODAL
 ================================================================ */
 function renderOverlay() {
   if (!overlayRoot) return;
   if (!state.modal) {
     overlayRoot.innerHTML = "";
     return;
   }

   if (state.modal.type === "songDetails") {
     const song = state.currentSong;
     if (!song) {
       overlayRoot.innerHTML = "";
       return;
     }
     const qualityLabel = getQualityLabel(song);
     overlayRoot.innerHTML = `
       <section class="overlay" data-action="dismiss-overlay">
         <article class="modal">
           <header class="modal-head">
             <h2 class="modal-title">Song Details</h2>
             <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
               <i class="fa-solid fa-xmark"></i>
             </button>
           </header>
           <div class="modal-body">
             <div style="display:flex; gap:16px; align-items:center;">
               <img src="${escapeHTML(song.coverUrl)}" style="width:80px; height:80px; border-radius:var(--radius-sm); object-fit:cover;" alt="" />
               <div>
                 <h3 style="font-size:1.25rem; font-weight:700;">${escapeHTML(song.title)}</h3>
                 <p style="color:var(--muted); margin-top:4px;">${escapeHTML(song.artist)}</p>
               </div>
             </div>
             <div class="meta-list">
               <p class="meta-item"><b>Album:</b> ${escapeHTML(song.album || "Unknown")}</p>
               <p class="meta-item"><b>Genre:</b> ${escapeHTML(song.genre || "Unknown")}</p>
               <p class="meta-item"><b>Duration:</b> ${escapeHTML(song.duration || "0:00")}</p>
               <p class="meta-item"><b>Quality:</b> ${escapeHTML(qualityLabel)}</p>
               <p class="meta-item"><b>Release:</b> ${escapeHTML(song.releaseDate || "Unknown")}</p>
             </div>
           </div>
         </article>
       </section>
     `;
     return;
   }

   if (state.modal.type === "playlistPicker") {
     const song = getSongById(state.modal.songId);
     if (!song) {
       overlayRoot.innerHTML = "";
       return;
     }
     overlayRoot.innerHTML = `
       <section class="overlay" data-action="dismiss-overlay">
         <article class="modal">
           <header class="modal-head">
             <h2 class="modal-title">Add to Playlist</h2>
             <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
               <i class="fa-solid fa-xmark"></i>
             </button>
           </header>
           <div class="modal-body">
             <p style="color:var(--muted); font-size:0.875rem;">${escapeHTML(song.title)} \u2022 ${escapeHTML(song.artist)}</p>
             <div style="display:flex; flex-direction:column; gap:8px;">
               ${state.playlists.map((playlist) => {
                 const exists = playlist.songs.some((item) => item.id === song.id);
                 return `
                   <button class="btn btn-soft" style="justify-content:space-between;" data-action="playlist-toggle-song" data-song-id="${escapeHTML(song.id)}" data-playlist-id="${escapeHTML(playlist.id)}" type="button">
                     <span>${escapeHTML(playlist.name)}</span>
                     <span style="color:var(--muted); font-size:0.8125rem;">${exists ? "Remove" : "Add"}</span>
                   </button>
                 `;
               }).join("")}
             </div>
             <button class="btn btn-primary" data-action="open-create-playlist" type="button">Create New Playlist</button>
           </div>
         </article>
       </section>
     `;
     return;
   }

   if (state.modal.type === "createPlaylist") {
     overlayRoot.innerHTML = `
       <section class="overlay" data-action="dismiss-overlay">
         <article class="modal">
           <header class="modal-head">
             <h2 class="modal-title">Create Playlist</h2>
             <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
               <i class="fa-solid fa-xmark"></i>
             </button>
           </header>
           <form id="create-playlist-form" class="modal-body">
             <div class="form-row">
               <label class="form-label" for="playlist-name">Playlist Name</label>
               <input class="text-input" id="playlist-name" name="playlistName" required placeholder="My Awesome Playlist" maxlength="40" />
             </div>
             <button class="btn btn-primary" type="submit">Create Playlist</button>
           </form>
         </article>
       </section>
     `;
     return;
   }

   if (state.modal.type === "welcome") {
     const year = new Date().getFullYear();
     overlayRoot.innerHTML = `
       <section class="overlay welcome-overlay" data-action="dismiss-overlay">
         <article class="modal welcome-modal">
           <div class="welcome-content">
             <div class="welcome-logo">
               <img src="${LOGO_URL}" alt="Pawtify" />
             </div>
             <h1 class="welcome-title">Welcome to <span style="color:var(--green);">Pawtify</span></h1>
             <p class="welcome-subtitle">Your personal music streaming experience</p>
             <div class="welcome-features">
               <div class="welcome-feature">
                 <i class="fa-solid fa-music"></i>
                 <span>Stream millions of songs</span>
               </div>
               <div class="welcome-feature">
                 <i class="fa-solid fa-list-ul"></i>
                 <span>Create & manage playlists</span>
               </div>
               <div class="welcome-feature">
                 <i class="fa-solid fa-heart"></i>
                 <span>Save your favourites</span>
               </div>
               <div class="welcome-feature">
                 <i class="fa-solid fa-download"></i>
                 <span>Download & listen offline</span>
               </div>
             </div>
             <div class="welcome-dev">
               <p><i class="fa-brands fa-github" style="color:var(--green);"></i> <b>Pawtify</b> is an <b>open source</b> project</p>
               <p style="margin-top:6px; font-size:0.8rem; color:var(--muted);">Built with ❤️ by <a href="https://github.com/pawjects" target="_blank" rel="noopener" style="color:var(--green);">Pawjects ORG</a></p>
               <p style="font-size:0.75rem; color:var(--muted); margin-top:4px;">Contribute on <a href="https://github.com/pawjects/Pawtify" target="_blank" rel="noopener" style="color:var(--green);">GitHub</a></p>
             </div>
             <button class="btn-primary welcome-cta" data-action="close-modal" type="button">
               <i class="fa-solid fa-play"></i> Get Started
             </button>
             <p class="welcome-meta">© ${year} Pawtify. All rights reserved.</p>
           </div>
         </article>
       </section>
     `;
     return;
   }

   if (state.modal.type === "appInfo") {
     overlayRoot.innerHTML = `
       <section class="overlay" data-action="dismiss-overlay">
         <article class="modal">
           <header class="modal-head">
             <h2 class="modal-title"><i class="fa-solid fa-paw" style="margin-right:8px; color:var(--green);"></i>About Pawtify</h2>
             <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
               <i class="fa-solid fa-xmark"></i>
             </button>
           </header>
           <div class="modal-body">
             <div style="display:flex; align-items:center; gap:16px; margin-bottom:8px;">
               <img src="${LOGO_URL}" style="width:64px; height:64px; border-radius:var(--radius-md); object-fit:cover; box-shadow:0 8px 24px rgba(0,0,0,0.4);" alt="Pawtify" />
               <div>
                 <h3 style="font-size:1.1rem; font-weight:700; font-family:var(--font-display);">Pawtify</h3>
                 <p style="color:var(--muted); font-size:0.8125rem; margin-top:4px;">A Spotify-style music experience.</p>
               </div>
             </div>
             <div class="meta-list">
               <p class="meta-item"><i class="fa-brands fa-github" style="margin-right:8px; color:var(--green);"></i><b>GitHub:</b> <a href="https://github.com/pawjects/Pawtify" target="_blank" rel="noopener" style="color:var(--green); text-decoration:underline;">github.com/pawjects/Pawtify</a></p>
               <p class="meta-item"><i class="fa-solid fa-code" style="margin-right:8px; color:var(--green);"></i><b>Developer:</b> Pawjects ORG</p>
               <p class="meta-item"><i class="fa-brands fa-telegram" style="margin-right:8px; color:var(--green);"></i><b>Telegram Bot:</b> <a href="https://t.me/PawtifyRobot" target="_blank" rel="noopener" style="color:var(--green); text-decoration:underline;">@PawtifyRobot</a></p>
               <p class="meta-item"><i class="fa-solid fa-heart" style="margin-right:8px; color:var(--danger);"></i><b>Made with love</b> for music lovers everywhere.</p>
             </div>
             <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--border);">
               <p style="font-size:0.75rem; color:var(--muted); text-align:center;">\u00A9 2026 Pawtify. All rights reserved.</p>
             </div>
           </div>
         </article>
       </section>
     `;
   }
 }

 /* ================================================================
    API
 ================================================================ */
 async function apiGet(path, params = {}) {
   try {
     const url = new URL(`${API_BASE}${path}`);
     Object.entries(params).forEach(([key, value]) => {
       if (value === undefined || value === null || value === "") return;
       url.searchParams.set(key, String(value));
     });
     
     const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), 15000);
     
     const response = await fetch(url.toString(), { signal: controller.signal });
     clearTimeout(timeoutId);
     
     if (!response.ok) return { success: false, data: null };
     const payload = await response.json();
     return payload;
   } catch (error) {
     console.warn("API fetch failed:", path, error.message);
     return { success: false, data: null };
   }
 }

 function transformSong(raw) {
   if (!raw) return null;
   
   try {
     let artist = "Unknown Artist";
     if (raw.artists?.primary && Array.isArray(raw.artists.primary)) {
       artist = raw.artists.primary.map((a) => a.name).join(", ");
     } else if (raw.primaryArtists) {
       artist = raw.primaryArtists;
     } else if (typeof raw.subtitle === 'string') {
       artist = raw.subtitle;
     } else if (typeof raw.description === 'string' && raw.description.includes('·')) {
       artist = raw.description.split('·')[1]?.trim() || "Unknown Artist";
     }

     const img = raw.image;
     const coverUrl = Array.isArray(img) && img.length > 0
       ? (img.find(i => i.quality === '500x500')?.url || img.find(i => i.quality === '150x150')?.url || img[img.length - 1]?.url)
       : (typeof img === 'string' ? img : LOGO_URL);

     const dl = raw.downloadUrl;
     let audioUrl = Array.isArray(dl) && dl.length > 0 
       ? (dl.find(d => d.quality === '320kbps' || d.quality === '320')?.url || dl[dl.length - 1]?.url) 
       : (typeof dl === 'string' ? dl : "");
     if (!audioUrl && raw.url) audioUrl = raw.url; 

     const durationSec = Number(raw.duration) || 0;

     return {
       id: String(raw.id),
       title: raw.name || raw.title || "Unknown Song",
       artist: artist,
       album: raw.album?.name || raw.album || "",
       coverUrl: coverUrl || LOGO_URL,
       audioUrl: audioUrl || "",
       durationSec: durationSec,
       duration: formatTime(durationSec),
       releaseDate: raw.year || raw.releaseDate || "",
       genre: raw.language || "",
       description: `Song by ${artist}`
     };
   } catch (err) {
     console.warn("Error parsing song", err);
     return null;
   }
 }

 function transformArtist(raw) {
   if (!raw) return null;
   try {
     const img = raw.image;
     const imageUrl = Array.isArray(img) && img.length > 0
       ? (img.find(i => i.quality === '500x500')?.url || img[img.length - 1]?.url)
       : (typeof img === 'string' ? img : LOGO_URL);

     return {
       id: String(raw.id),
       name: raw.name || raw.title || "Unknown Artist",
       imageUrl: imageUrl || LOGO_URL,
       type: raw.type || raw.role || raw.description || "Artist",
       bio: Array.isArray(raw.bio) ? raw.bio[0]?.text : (typeof raw.bio === 'string' ? raw.bio : "")
     };
   } catch (err) {
     console.warn("Error parsing artist", err);
     return null;
   }
 }

 async function searchSongs(query, page = 0, limit = 10) {
   const payload = await apiGet("/search/songs", { query, page, limit });
   if (!payload.success || !payload.data?.results) return [];
   return payload.data.results.map(transformSong).filter(s => s && s.id);
 }

 async function searchArtists(query, page = 0, limit = 10) {
   const payload = await apiGet("/search/artists", { query, page, limit });
   if (!payload.success || !payload.data?.results) return [];
   return payload.data.results.map(transformArtist).filter(a => a && a.id);
 }

 async function getSongDetails(id) {
   const payload = await apiGet(`/songs/${id}`);
   if (!payload.success || !payload.data) return null;
   const song = Array.isArray(payload.data) ? payload.data[0] : payload.data;
   return song ? transformSong(song) : null;
 }

 async function getSongRecommendations(id, limit = 10) {
   const payload = await apiGet(`/songs/${id}/suggestions`, { limit });
   if (!payload.success) return [];
   const results = Array.isArray(payload.data) ? payload.data : (payload.data?.results || []);
   return results.slice(0, limit).map(transformSong).filter(s => s && s.id);
 }

 async function getSongLyrics(id) {
   // API endpoint for lyrics has been dropped by most wrappers; return null to trigger smooth UI fallback
   return null;
 }

 async function getNextSong(currentSongId) {
   if (!currentSongId) {
     const trending = state.trendingSongs.length ? state.trendingSongs : await getTrendingSongsFallback();
     if (!trending.length) return null;
     return trending[Math.floor(Math.random() * trending.length)];
   }
   try {
     const suggestions = await getSongRecommendations(currentSongId, 14);
     if (suggestions.length) {
       const next = suggestions.find((song) => !state.recentlyPlayed.includes(song.id));
       return next || suggestions[0];
     }
   } catch (error) {
     console.error("Suggestion lookup failed:", error);
   }
   
   const trending = state.trendingSongs.length ? state.trendingSongs : await getTrendingSongsFallback();
   if (!trending.length) return null;
   return trending.find((song) => !state.recentlyPlayed.includes(song.id)) || trending[0];
 }

 async function getTrendingSongsFallback() {
   const payload = await apiGet("/search/songs", { query: "trending", page: 0, limit: 15 });
   if (payload.success && payload.data?.results) {
     return dedupeSongs(payload.data.results.map(transformSong).filter(s => s && s.id));
   }
   return [];
 }

 /* ================================================================
    UTILITIES
 ================================================================ */
 function formatTime(value) {
   const seconds = Math.max(0, Math.floor(Number(value) || 0));
   const minutes = Math.floor(seconds / 60);
   const remain = seconds % 60;
   return `${minutes}:${String(remain).padStart(2, "0")}`;
 }

 function escapeHTML(text) {
   return String(text ?? "")
     .replaceAll("&", "&")
     .replaceAll("<", "<")
     .replaceAll(">", ">")
     .replaceAll('"', """)
     .replaceAll("'", "'");
 }

 function loadJSON(key, fallback) {
   try {
     const raw = localStorage.getItem(key);
     if (raw === null) return fallback;
     return JSON.parse(raw);
   } catch (error) {
     console.error(`Failed to load ${key}:`, error);
     return fallback;
   }
 }

 function saveJSON(key, value) {
   try {
     localStorage.setItem(key, JSON.stringify(value));
   } catch (error) {
     console.error(`Failed to save ${key}:`, error);
   }
 }

 function getQualityLabel(song) {
   if (!song?.audioUrl) return "auto";
   if (song.audioUrl.includes("320")) return "320kbps";
   if (song.audioUrl.includes("160")) return "160kbps";
   return "128kbps";
 }

 /* ================================================================
    RENDER: FULLSCREEN PLAYER
 ================================================================ */
 function renderFullscreenPlayer() {
   if (!fullscreenPlayer) return;
   if (!state.currentSong || !state.fullscreenPlayer) {
     fullscreenPlayer.classList.remove("active");
     fullscreenPlayer.innerHTML = "";
     return;
   }
   fullscreenPlayer.classList.add("active");
   const song = state.currentSong;
   const isFav = state.favorites.some((item) => item.id === song.id);
   const fsMax = Math.max(1, Math.floor(state.duration || song.durationSec || 1));
   const fsPct = fsMax > 0 ? (Math.floor(state.progress || 0) / fsMax) * 100 : 0;
   const volPct = Math.round(state.volume * 100);
   const repeatIcon = state.repeatMode === "one" ? "fa-solid fa-1" : "fa-solid fa-repeat";
   const repeatActive = state.repeatMode !== "none" ? "active" : "";
   const shuffleActive = state.shuffleMode ? "active" : "";
   const qualityLabel = getQualityLabel(song);

   fullscreenPlayer.innerHTML = `
     <div class="fs-backdrop"></div>
     <div class="fs-content">
       <div class="fs-header">
         <button class="fs-close-btn" data-action="close-fullscreen-player" type="button" aria-label="Close">
           <i class="fa-solid fa-chevron-down"></i>
         </button>
         <span class="fs-quality-badge">${escapeHTML(qualityLabel)}</span>
       </div>
       <div class="fs-body">
         <div class="fs-cover-wrap">
           <img class="fs-cover" src="${escapeHTML(song.coverUrl)}" alt="${escapeHTML(song.title)}" />
         </div>
         <div class="fs-info">
           <div class="fs-text">
             <div class="fs-title">${escapeHTML(song.title)}</div>
             <div class="fs-artist" data-action="open-artist-profile" data-artist="${escapeHTML(song.artist)}">${escapeHTML(song.artist)}</div>
           </div>
           <button class="fs-heart ${isFav ? 'active' : ''}" data-action="toggle-favorite" data-song-id="${escapeHTML(song.id)}" type="button">
             <i class="${isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
           </button>
         </div>
         <div class="fs-progress">
           <input id="fs-seekbar" class="fs-seekbar" type="range" min="0" max="${fsMax}" value="${Math.floor(state.progress || 0)}" style="background: linear-gradient(90deg, var(--green) 0%, var(--green-hover) ${fsPct}%, rgba(255,255,255,0.15) ${fsPct}%)" />
           <div class="fs-time">
             <span>${formatTime(state.progress)}</span>
             <span>${formatTime(state.duration || song.durationSec || 0)}</span>
           </div>
         </div>
         <div class="fs-extra-controls">
           <button class="fs-extra-btn ${shuffleActive}" data-action="toggle-shuffle" type="button" aria-label="Shuffle">
             <i class="fa-solid fa-shuffle"></i>
           </button>
           <button class="fs-extra-btn ${repeatActive}" data-action="toggle-repeat" type="button" aria-label="Repeat">
             <i class="${repeatIcon}"></i>
           </button>
           <button class="fs-extra-btn" data-action="open-queue" type="button" aria-label="Queue">
             <i class="fa-solid fa-list-ul"></i>
           </button>
           <button class="fs-extra-btn" data-action="open-lyrics" type="button" aria-label="Lyrics">
             <i class="fa-solid fa-align-center"></i>
           </button>
           <button class="fs-extra-btn" data-action="download-song" type="button" aria-label="Download">
             <i class="fa-solid fa-download"></i>
           </button>
         </div>
         <div class="fs-controls">
           <button class="fs-btn" data-action="prev-track" type="button" aria-label="Previous">
             <i class="fa-solid fa-backward-step"></i>
           </button>
           <button class="fs-btn fs-play" data-action="toggle-play" type="button" aria-label="Play/Pause">
             ${state.isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>'}
           </button>
           <button class="fs-btn" data-action="next-track" type="button" aria-label="Next">
             <i class="fa-solid fa-forward-step"></i>
           </button>
         </div>
         <div class="fs-volume">
           <i class="fa-solid fa-volume-high" style="font-size:0.875rem; color:var(--muted);"></i>
           <input id="fs-volume-slider" class="fs-volume-slider" type="range" min="0" max="100" value="${volPct}" style="background: linear-gradient(90deg, var(--green) 0%, var(--green-hover) ${volPct}%, rgba(255,255,255,0.15) ${volPct}%)" />
         </div>
         <div class="fs-actions">
           <button data-action="open-playlist-picker" data-song-id="${escapeHTML(song.id)}" type="button" aria-label="Add to playlist">
             <i class="fa-solid fa-plus"></i>
           </button>
           <button data-action="open-song-details" type="button" aria-label="Details">
             <i class="fa-solid fa-circle-info"></i>
           </button>
           <button data-action="share-song" type="button" aria-label="Share">
             <i class="fa-solid fa-share-nodes"></i>
           </button>
         </div>
       </div>
     </div>
   `;
   requestAnimationFrame(() => {
     const fsSeekEl = document.getElementById("fs-seekbar");
     if (fsSeekEl) {
       const pct = fsMax > 0 ? (Math.floor(state.progress || 0) / fsMax) * 100 : 0;
       fsSeekEl.style.background = `linear-gradient(90deg, var(--green) 0%, var(--green-hover) ${pct}%, rgba(255,255,255,0.15) ${pct}%)`;
     }
     const fsVolEl = document.getElementById("fs-volume-slider");
     if (fsVolEl) {
       fsVolEl.style.background = `linear-gradient(90deg, var(--green) 0%, var(--green-hover) ${volPct}%, rgba(255,255,255,0.15) ${volPct}%)`;
     }
   });
 }

 /* ================================================================
    REPEAT & SHUFFLE
 ================================================================ */
 function toggleRepeat() {
   const modes = ["none", "all", "one"];
   const currentIdx = modes.indexOf(state.repeatMode);
   state.repeatMode = modes[(currentIdx + 1) % modes.length];
   saveJSON(STORAGE.REPEAT, state.repeatMode);
   renderFullscreenPlayer();
   renderPlayerBar();
 }

 function toggleShuffle() {
   state.shuffleMode = !state.shuffleMode;
   if (state.shuffleMode && state.queue.length > 1) {
     const remaining = state.queue.filter((_, i) => i !== state.currentSongIndex);
     const shuffled = remaining.sort(() => Math.random() - 0.5);
     state.queue = [...state.queue.slice(0, state.currentSongIndex + 1), ...shuffled];
   }
   saveJSON(STORAGE.SHUFFLE, state.shuffleMode);
   renderFullscreenPlayer();
   renderPlayerBar();
 }

 /* ================================================================
    DOWNLOAD
 ================================================================ */
 async function downloadCurrentSong() {
   if (!state.currentSong?.audioUrl) {
     alert("No audio URL available for download.");
     return;
   }
   try {
     const a = document.createElement("a");
     a.href = state.currentSong.audioUrl;
     a.download = `${state.currentSong.title} - ${state.currentSong.artist}.mp3`;
     a.target = "_blank";
     a.rel = "noopener";
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
   } catch (err) {
     console.error("Download failed:", err);
     alert("Download failed. Try again.");
   }
 }

 /* ================================================================
    LYRICS
 ================================================================ */
 async function openLyrics() {
   if (!state.currentSong) return;
   state.lyricsPanel = true;
   state.lyricsLoading = true;
   renderLyricsPanel();

   if (!state.lyricsData) {
     const lyrics = await getSongLyrics(state.currentSong.id);
     state.lyricsData = lyrics;
   }
   state.lyricsLoading = false;
   renderLyricsPanel();
 }

 function renderLyricsPanel() {
   if (!lyricsPanel) return;
   if (!state.lyricsPanel) {
     lyricsPanel.classList.remove("active");
     lyricsPanel.innerHTML = "";
     return;
   }
   lyricsPanel.classList.add("active");
   const song = state.currentSong;
   if (!song) {
     lyricsPanel.innerHTML = "";
     return;
   }

   if (state.lyricsLoading) {
     lyricsPanel.innerHTML = `
       <div class="lyrics-header">
         <h2><i class="fa-solid fa-align-center" style="margin-right:8px; color:var(--green);"></i>Lyrics</h2>
         <button class="lyrics-close-btn" data-action="close-lyrics" type="button" aria-label="Close">
           <i class="fa-solid fa-xmark"></i>
         </button>
       </div>
       <div class="lyrics-empty">
         <div class="spinner" style="width:32px; height:32px;"></div>
         <h2>Loading lyrics...</h2>
       </div>
     `;
     return;
   }

   const lyrics = state.lyricsData || [];
   const hasLyrics = lyrics.length > 0;

   lyricsPanel.innerHTML = `
     <div class="lyrics-header">
       <div>
         <h2><i class="fa-solid fa-align-center" style="margin-right:8px; color:var(--green);"></i>Lyrics</h2>
         <p style="color:var(--muted); font-size:0.8125rem; margin-top:4px;">${escapeHTML(song.title)} \u2022 ${escapeHTML(song.artist)}</p>
       </div>
       <button class="lyrics-close-btn" data-action="close-lyrics" type="button" aria-label="Close">
         <i class="fa-solid fa-xmark"></i>
       </button>
     </div>
     <div class="lyrics-content" id="lyrics-content">
       ${hasLyrics
         ? lyrics.map((line, i) => `<div class="lyrics-line ${i === 0 ? 'active' : ''}" data-line="${i}" id="lyrics-line-${i}">${escapeHTML(line)}</div>`).join("")
         : `<div class="lyrics-empty">
             <i class="fa-solid fa-music"></i>
             <h2>No lyrics available</h2>
             <p>Lyrics for "${escapeHTML(song.title)}" are not available.</p>
            </div>`}
     </div>
   `;
 }

 function syncLyricsWithPlayback() {
   if (!state.lyricsPanel || !state.lyricsData || state.lyricsData.length === 0) return;
   if (!state.duration || state.duration <= 0) return;

   const progressPct = state.progress / state.duration;
   const totalLines = state.lyricsData.length;
   const currentLineIdx = Math.min(
     Math.floor(progressPct * totalLines),
     totalLines - 1
   );

   document.querySelectorAll(".lyrics-line").forEach((el, i) => {
     el.classList.remove("active", "past");
     if (i < currentLineIdx) {
       el.classList.add("past");
     } else if (i === currentLineIdx) {
       el.classList.add("active");
     }
   });

   const activeLine = document.getElementById(`lyrics-line-${currentLineIdx}`);
   const lyricsContent = document.getElementById("lyrics-content");
   if (activeLine && lyricsContent) {
     if (lyricsScrollTimeout) clearTimeout(lyricsScrollTimeout);
     lyricsScrollTimeout = setTimeout(() => {
       activeLine.scrollIntoView({ behavior: "smooth", block: "center" });
     }, 100);
   }
 }

 /* ================================================================
    ARTIST PROFILE
 ================================================================ */
 async function openArtistProfile(artistName) {
   state.artistProfile = { name: artistName, loading: true, songs: [], imageUrl: "" };
   renderArtistProfile();
   try {
     const [songs, artists] = await Promise.all([
       searchSongs(artistName, 0, 20),
       searchArtists(artistName, 0, 1)
     ]);
     const artist = artists[0] || { imageUrl: LOGO_URL, type: "Artist" };
     state.artistProfile = {
       name: artistName,
       loading: false,
       songs: songs,
       imageUrl: artist.imageUrl,
       type: artist.type || "Artist"
     };
     rememberSongs(songs);
     renderArtistProfile();
   } catch (err) {
     console.error("Artist profile failed:", err);
     if (state.artistProfile) {
        state.artistProfile.loading = false;
     }
     renderArtistProfile();
   }
 }

 function renderArtistProfile() {
   if (!artistProfile) return;
   if (!state.artistProfile) {
     artistProfile.classList.remove("active");
     artistProfile.innerHTML = "";
     return;
   }
   artistProfile.classList.add("active");
   const artist = state.artistProfile;
   artistProfile.innerHTML = `
     <div class="artist-hero">
       <button class="artist-hero-back" data-action="close-artist-profile" type="button" aria-label="Back">
         <i class="fa-solid fa-chevron-down"></i>
       </button>
       <img class="artist-hero-img" src="${escapeHTML(artist.imageUrl || LOGO_URL)}" alt="${escapeHTML(artist.name)}" />
       <div class="artist-hero-name">${escapeHTML(artist.name)}</div>
       <div class="artist-hero-meta">${escapeHTML(artist.type || "Artist")} \u2022 ${artist.songs?.length || 0} songs</div>
       <div class="artist-hero-actions">
         <button class="btn-play" data-action="play-song" data-song-id="${escapeHTML(artist.songs?.[0]?.id || "")}" data-source="artist" type="button">
           <i class="fa-solid fa-play"></i>
         </button>
         <button class="btn-icon" data-action="shuffle-playlist" data-playlist-id="artist-${escapeHTML(artist.name)}" type="button">
           <i class="fa-solid fa-shuffle"></i>
         </button>
       </div>
     </div>
     <div class="artist-section">
       <h3><i class="fa-solid fa-music" style="margin-right:8px; color:var(--green);"></i>Popular</h3>
       <div class="song-table">
         ${artist.loading
           ? '<div class="empty-state"><div class="spinner" style="margin:0 auto 16px;"></div><h2>Loading...</h2></div>'
           : artist.songs?.length
             ? artist.songs.map((s, i) => renderSongRow(s, i + 1, "artist")).join("")
             : '<div class="empty-state"><i class="fa-solid fa-music"></i><h2>No songs found</h2></div>'}
       </div>
     </div>
   `;
 }

 /* ================================================================
    QUEUE PANEL
 ================================================================ */
 function renderQueuePanel() {
   if (!queuePanel) return;
   if (!state.queuePanel) {
     queuePanel.classList.remove("active");
     queuePanel.innerHTML = "";
     return;
   }
   queuePanel.classList.add("active");
   const queue = state.queue;
   const currentIdx = state.currentSongIndex;

   const nowPlaying = currentIdx >= 0 && currentIdx < queue.length ? queue[currentIdx] : null;
   const upcoming = queue.slice(currentIdx + 1);
   const previous = queue.slice(0, currentIdx);

   queuePanel.innerHTML = `
     <div class="queue-header">
       <h2><i class="fa-solid fa-list-ul" style="margin-right:8px; color:var(--green);"></i>Queue</h2>
       <div class="queue-header-actions">
         <button class="queue-clear-btn" data-action="clear-queue" type="button">Clear</button>
         <button class="queue-close-btn" data-action="close-queue" type="button" aria-label="Close">
           <i class="fa-solid fa-xmark"></i>
         </button>
       </div>
     </div>
     <div class="queue-list">
       ${!queue.length
         ? '<div class="empty-state"><i class="fa-solid fa-list-ul"></i><h2>Queue is empty</h2><p>Add songs to start listening.</p></div>'
         : ""}

       ${nowPlaying ? `
         <div class="queue-section-title">Now Playing</div>
         <div class="queue-item active" data-action="play-song" data-song-id="${escapeHTML(nowPlaying.id)}" data-source="queue" type="button">
           <div class="queue-item-index"><i class="fa-solid fa-volume-high" style="font-size:0.75rem;"></i></div>
           <img class="queue-item-cover" src="${escapeHTML(nowPlaying.coverUrl)}" alt="" />
           <div class="queue-item-info">
             <div class="queue-item-title">${escapeHTML(nowPlaying.title)}</div>
             <div class="queue-item-artist">${escapeHTML(nowPlaying.artist)}</div>
           </div>
         </div>
       ` : ""}

       ${upcoming.length ? `
         <div class="queue-section-title">Next Up</div>
         ${upcoming.map((s, i) => `
           <div class="queue-item" data-action="play-song" data-song-id="${escapeHTML(s?.id || "")}" data-source="queue" type="button">
             <div class="queue-item-index">${currentIdx + i + 2}</div>
             <img class="queue-item-cover" src="${escapeHTML(s?.coverUrl || "")}" alt="" />
             <div class="queue-item-info">
               <div class="queue-item-title">${escapeHTML(s?.title || "")}</div>
               <div class="queue-item-artist">${escapeHTML(s?.artist || "")}</div>
             </div>
             <button class="queue-item-remove" data-action="remove-from-queue" data-song-id="${escapeHTML(s?.id || "")}" type="button" onclick="event.stopPropagation();" aria-label="Remove">
               <i class="fa-solid fa-xmark"></i>
             </button>
           </div>
         `).join("")}
       ` : ""}

       ${previous.length ? `
         <div class="queue-section-title">Previous</div>
         ${previous.map((s, i) => `
           <div class="queue-item" data-action="play-song" data-song-id="${escapeHTML(s?.id || "")}" data-source="queue" type="button">
             <div class="queue-item-index">${i + 1}</div>
             <img class="queue-item-cover" src="${escapeHTML(s?.coverUrl || "")}" alt="" />
             <div class="queue-item-info">
               <div class="queue-item-title">${escapeHTML(s?.title || "")}</div>
               <div class="queue-item-artist">${escapeHTML(s?.artist || "")}</div>
             </div>
           </div>
         `).join("")}
       ` : ""}
     </div>
   `;
 }

 function removeFromQueue(songId) {
   const idx = state.queue.findIndex(s => s.id === songId);
   if (idx === -1) return;
   if (idx < state.currentSongIndex) {
     state.currentSongIndex--;
   } else if (idx === state.currentSongIndex) {
     return;
   }
   state.queue = state.queue.filter(s => s.id !== songId);
   saveJSON(STORAGE.QUEUE, state.queue);
   renderQueuePanel();
   renderPlayerBar();
 }

 function clearQueue() {
   if (!state.currentSong) {
     state.queue = [];
   } else {
     state.queue = [state.currentSong];
     state.currentSongIndex = 0;
   }
   saveJSON(STORAGE.QUEUE, state.queue);
   renderQueuePanel();
   renderPlayerBar();
 }
})();