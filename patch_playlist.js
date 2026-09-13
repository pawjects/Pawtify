const fs = require('fs');
let events = fs.readFileSync('client/src/core/events.js', 'utf-8');

events = events.replace(
  /if \(action === 'open-playlist-profile'\) \{[\s\S]*?return;\n\s*\}/,
  `if (action === 'open-playlist-profile') {
        event.preventDefault();
        const pid = actionNode.dataset.playlistId;
        if (pid) {
          const titleNode =
            actionNode.querySelector('span') ||
            actionNode.querySelector('.card-title');
          const name = titleNode ? titleNode.innerText : 'Playlist';
          const img = actionNode.querySelector('img')?.src || '';
          
          if (titleNode) {
            saveRecentItem('playlist', {
              id: pid,
              title: name,
              subtitle: 'Playlist',
              imageUrl: img,
            });
          }
          
          // Pre-populate temporary playlist to show loading state
          if (!state.ytPlaylists) state.ytPlaylists = {};
          if (!state.ytPlaylists[pid]) {
             state.ytPlaylists[pid] = { id: pid, name: name, coverUrl: img, songs: [], isLoading: true, isSystem: true };
             
             fetch(\`/api/search?type=playlist_videos&q=\${pid}\`)
               .then(res => res.json())
               .then(data => {
                  state.ytPlaylists[pid].songs = data.items || [];
                  state.ytPlaylists[pid].isLoading = false;
                  window.dispatchEvent(new CustomEvent('routechange'));
               })
               .catch(e => {
                  state.ytPlaylists[pid].isLoading = false;
                  showToast('Error loading playlist.');
                  window.dispatchEvent(new CustomEvent('routechange'));
               });
          }
          
          window.location.hash = '/playlist/' + pid;
        }
        return;
      }`
);

fs.writeFileSync('client/src/core/events.js', events);
