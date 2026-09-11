import re

with open('docs/app.js', 'r') as f:
    content = f.read()

old_func = """ /* ================================================================
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
 }"""

new_func = """ /* ================================================================
    PIPED API NETWORK LAYER
 ================================================================ */
 let apiBase = null;
 const FALLBACK_APIS = [
   'https://pipedapi.private.coffee',
   'https://pipedapi.adminforge.de',
   'https://pipedapi.r4fo.com',
   'https://api.piped.yt',
   'https://pipedapi.drgns.space',
   'https://pipedapi.leptons.xyz',
   'https://pipedapi.in.projectsegfau.lt',
   'https://pipedapi.moomoo.me',
   'https://pipedapi.us.projectsegfau.lt',
   'https://pipedapi.ngn.tf',
   'https://watchapi.whatever.social',
   'https://pipedapi.slipfox.xyz'
 ];
 let dynamicApis = [];
 let fetchedRegistry = false;

 function getApiPool() {
   const pool = new Set([...FALLBACK_APIS, ...dynamicApis]);
   if (apiBase) {
     pool.delete(apiBase);
     return [apiBase, ...Array.from(pool)];
   }
   return Array.from(pool);
 }

 function fetchDynamicRegistry() {
   if (fetchedRegistry) return;
   fetchedRegistry = true;
   fetch('https://piped-instances.kavin.rocks/')
     .then(res => res.json())
     .then(instances => {
       const healthy = instances.filter(x => x.api_url && x.uptime_24h > 80).map(x => x.api_url);
       dynamicApis = healthy;
     })
     .catch(e => console.warn('Failed to fetch dynamic API registry:', e));
 }

 async function fetchPiped(path) {
   fetchDynamicRegistry();
   const pool = getApiPool();
   
   return new Promise((resolve, reject) => {
     let failed = 0;
     let hasResolved = false;
     
     for (const api of pool) {
       const controller = new AbortController();
       const timeoutId = setTimeout(() => controller.abort(), 3500);
       
       fetch(`${api}${path}`, { signal: controller.signal })
         .then(async (r) => {
           clearTimeout(timeoutId);
           if (!r.ok) throw new Error('Not OK');
           const text = await r.text();
           const data = JSON.parse(text);
           
           if (!hasResolved) {
             hasResolved = true;
             apiBase = api;
             resolve(data);
           }
         })
         .catch((e) => {
           failed++;
           if (failed === pool.length && !hasResolved) {
             reject(new Error('All API instances failed'));
           }
         });
     }
   });
 }"""

# We'll use regex to replace it so we don't have to worry about exact leading whitespace
pattern = re.compile(r'\s*/\*\s*================================================================\s*PIPED API NETWORK LAYER\s*================================================================\s*\*/\s*let apiBase = null;\s*async function fetchPiped\(path\)\s*\{.*?\s*\}\s*catch\(e\)\s*\{\s*throw e;\s*\}\s*\}', re.DOTALL)

new_content = pattern.sub(new_func, content)

with open('docs/app.js', 'w') as f:
    f.write(new_content)

print("Done")
