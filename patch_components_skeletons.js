const fs = require('fs');
let code = fs.readFileSync('client/src/components/components.js', 'utf-8');

// Add Skeleton Functions
const skeletonFuncs = `
export function renderSongRowSkeleton() {
  return \`
    <div class="skeleton-song-row">
      <div class="skeleton skeleton-cover-sm"></div>
      <div class="skeleton-text-wrap">
        <div class="skeleton skeleton-text-main" style="width: 60%;"></div>
        <div class="skeleton skeleton-text-sub" style="width: 40%;"></div>
      </div>
      <div class="skeleton skeleton-text-sub" style="width: 32px; margin-left: auto;"></div>
    </div>
  \`;
}

export function renderCardSkeleton(isRound = false) {
  return \`
    <div class="skeleton-card">
      <div class="skeleton skeleton-card-cover" style="border-radius: \${isRound ? '50%' : 'var(--radius-md)'}; margin-bottom: 12px; aspect-ratio: 1/1;"></div>
      <div class="skeleton skeleton-card-title" style="margin-left: 0;"></div>
      <div class="skeleton skeleton-card-meta" style="margin-left: 0;"></div>
    </div>
  \`;
}

export function renderHomeGridSkeleton() {
  return \`
    <div class="home-grid-card" style="pointer-events:none;">
      <div class="skeleton" style="width:56px; height:56px; flex-shrink:0;"></div>
      <div class="skeleton skeleton-text-main" style="width: 70%; margin: 0;"></div>
    </div>
  \`;
}

export function renderHomeScrollSkeleton() {
  return \`
    <div class="home-scroll-card" style="pointer-events:none;">
      <div class="skeleton" style="width:140px; height:140px; border-radius:var(--radius-md); margin-bottom:12px; aspect-ratio: 1/1;"></div>
      <div class="skeleton skeleton-text-main" style="width: 80%; margin: 0 0 8px 0; border-radius: 4px;"></div>
      <div class="skeleton skeleton-text-sub" style="width: 50%; margin: 0; border-radius: 4px;"></div>
    </div>
  \`;
}
\n`;

code = code.replace(/export function renderHomeGridCard/, skeletonFuncs + 'export function renderHomeGridCard');

fs.writeFileSync('client/src/components/components.js', code);
