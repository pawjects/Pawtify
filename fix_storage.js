const fs = require('fs');
let configFile = fs.readFileSync('client/src/config/config.js', 'utf8');

configFile = configFile.replace(
  "RECENT_SEARCHES: 'pawtify-recent-searches',",
  "RECENT_SEARCHES: 'pawtify-recent-searches',\n  SEARCH_QUERY: 'pawtify-search-query',"
);

configFile = configFile.replace(
  "searchQuery: '',",
  "searchQuery: loadJSON('pawtify-search-query', '')," // hardcoding string to avoid variable reference issue if STORAGE isn't fully defined yet, but wait, loadJSON uses STORAGE.SEARCH_QUERY.
);

fs.writeFileSync('client/src/config/config.js', configFile);
console.log('config.js updated');

let eventsFile = fs.readFileSync('client/src/core/events.js', 'utf8');

// Replace all state.searchQuery assignments
eventsFile = eventsFile.replace(
  /state\.searchQuery\s*=\s*'';/g,
  "state.searchQuery = ''; saveJSON(STORAGE.SEARCH_QUERY, '');"
);

eventsFile = eventsFile.replace(
  /state\.searchQuery\s*=\s*category;/g,
  "state.searchQuery = category; saveJSON(STORAGE.SEARCH_QUERY, category);"
);

eventsFile = eventsFile.replace(
  /state\.searchQuery\s*=\s*mood;/g,
  "state.searchQuery = mood; saveJSON(STORAGE.SEARCH_QUERY, mood);"
);

eventsFile = eventsFile.replace(
  /state\.searchQuery\s*=\s*query;/g,
  "state.searchQuery = query; saveJSON(STORAGE.SEARCH_QUERY, query);"
);

eventsFile = eventsFile.replace(
  /state\.searchQuery\s*=\s*target\.value;/g,
  "state.searchQuery = target.value; saveJSON(STORAGE.SEARCH_QUERY, target.value);"
);

fs.writeFileSync('client/src/core/events.js', eventsFile);
console.log('events.js updated');
