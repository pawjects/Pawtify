import re

with open('docs/app.js', 'r') as f:
    code = f.read()

# 1. Add Timeout & Toast globals
timeout_funcs = """
let ytLoadTimeout = null;

function showToast(msg) {
  let toast = document.getElementById("toast-container");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-container";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function clearYtLoadTimeout() {
  if (ytLoadTimeout) {
    clearTimeout(ytLoadTimeout);
    ytLoadTimeout = null;
  }
}

function startYtLoadTimeout() {
  clearYtLoadTimeout();
  state.isLoading = true;
  refreshPlaybackUI();
  ytLoadTimeout = setTimeout(() => {
    console.warn("YouTube Player timed out loading video");
    handlePlaybackError();
  }, 10000);
}

function handlePlaybackError() {
  clearYtLoadTimeout();
  state.isLoading = false;
  state.isPlaying = false;
  refreshPlaybackUI();
  showToast("Track unavailable or timed out. Skipping...");
  setTimeout(() => {
    nextTrack();
  }, 1500);
}
"""

code = code.replace("let pendingVideoId = null;", timeout_funcs + "\nlet pendingVideoId = null;")


# 2. Patch onPlayerStateChange
state_change_old = """
  function onPlayerStateChange(event) {
    if (event.data === 1) { // PLAYING
      state.isPlaying = true;
      state.isLoading = false;
"""
state_change_new = """
  function onPlayerStateChange(event) {
    if (event.data === 1) { // PLAYING
      clearYtLoadTimeout();
      state.isPlaying = true;
      state.isLoading = false;
"""
code = code.replace(state_change_old, state_change_new)

buffering_add = """
    } else if (event.data === 2) { // PAUSED
"""
buffering_add_new = """
    } else if (event.data === 3) { // BUFFERING
      state.isLoading = true;
      refreshPlaybackUI();
    } else if (event.data === 2) { // PAUSED
"""
code = code.replace(buffering_add, buffering_add_new)

# 3. Patch onError
error_old = """
        'onError': (e) => { 
          console.warn("YouTube Player Error:", e.data); 
          setTimeout(() => { nextTrack(); }, 2000); 
        }
"""
error_new = """
        'onError': (e) => { 
          console.warn("YouTube Player Error:", e.data); 
          handlePlaybackError();
        }
"""
code = code.replace(error_old, error_new)


# 4. Remove duplicate play function
# Find first 'async function play(' and second 'async function play('
# We'll split and keep the first one up to the end of the first play function
parts = code.split('async function play(song, queue = null, autoplay = true) {')
if len(parts) == 3:
    # There are two implementations.
    # parts[0] is everything before first play
    # parts[1] is the body of the first play + everything up to second play
    # parts[2] is the body of the second play + rest of file
    
    # We want to replace the second implementation with just the rest of the file
    # The second implementation ends at the first '}' that is unindented, but it's easier to find the next function:
    # "function pause()"
    rest_of_file = parts[2].split('function pause() {', 1)
    if len(rest_of_file) == 2:
        code = parts[0] + 'async function play(song, queue = null, autoplay = true) {' + parts[1] + 'function pause() {' + rest_of_file[1]

# 5. Patch play function to use startYtLoadTimeout
play_body_old = """
  if (ytPlayerReady && ytPlayer) {
    if (autoplay) ytPlayer.loadVideoById(playableSong.id);
    else ytPlayer.cueVideoById(playableSong.id);
"""
play_body_new = """
  if (autoplay) startYtLoadTimeout();
  if (ytPlayerReady && ytPlayer) {
    if (autoplay) ytPlayer.loadVideoById(playableSong.id);
    else ytPlayer.cueVideoById(playableSong.id);
"""
code = code.replace(play_body_old, play_body_new)


# 6. Patch togglePlay to use startYtLoadTimeout
toggle_play_old = """
  else {
    if (ytPlayerReady && ytPlayer && ytPlayer.getIframe) {
"""
toggle_play_new = """
  else {
    startYtLoadTimeout();
    if (ytPlayerReady && ytPlayer && ytPlayer.getIframe) {
"""
code = code.replace(toggle_play_old, toggle_play_new)

# 7. Patch refreshPlaybackUI to support loading spinner on all toggle-play buttons
refresh_ui_old = """
   const playToggle = document.querySelector('[data-action="toggle-play"]');
   if (playToggle && playToggle.querySelector("i")) {
     playToggle.innerHTML = state.isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
   }
"""
refresh_ui_new = """
   const playToggles = document.querySelectorAll('[data-action="toggle-play"]');
   playToggles.forEach(playToggle => {
     if (playToggle && playToggle.querySelector("i")) {
       if (state.isLoading) {
         playToggle.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
       } else {
         playToggle.innerHTML = state.isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
       }
     }
   });
"""
code = code.replace(refresh_ui_old, refresh_ui_new)

with open('docs/app.js', 'w') as f:
    f.write(code)

