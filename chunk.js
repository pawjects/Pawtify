 /* ================================================================
    PIPED API NETWORK LAYER
 ================================================================ */
 let apiBase = null;

 async function fetchPiped(path) {
   try {
     const res = await fetch('https://piped-instances.kavin.rocks/');
     const instances = await res.json();
     const candidates = instances.filter(x => x.api_url && x.uptime_24h > 80).sort((a,b) => b.uptime_24h - a.uptime_24h).slice(0,4).map(x => x.api_url);
     if (apiBase) candidates.unshift(apiBase);

     for (const api of [...new Set(candidates)]) {
       try {
         const c = new AbortController(); setTimeout(() => c.abort(), 8000);
         const r = await fetch(`${api}${path}`, { signal: c.signal });
         if (r.ok) { apiBase = api; return await r.json(); }
       } catch(e) {}
     }
     throw new Error('API Offline');
   } catch(e) { throw e; }
 }
