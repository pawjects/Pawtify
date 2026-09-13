const fs = require('fs');
let css = fs.readFileSync('client/styles.css', 'utf-8');

css = css.replace(
  /\.main-stage \{\n\s*padding-bottom: calc\(\n\s*var\(--mini-player-height\) \+ var\(--mobile-nav-height\) \+\n\s*env\(safe-area-inset-bottom\)\n\s*\);\n\s*\}/g,
  `.main-stage {
    padding-bottom: calc(
      var(--mini-player-height) + var(--mobile-nav-height) +
        env(safe-area-inset-bottom) + 60px
    );
  }`
);

css = css.replace(
  /\.page \{\n\s*padding: 20px 16px;\n\s*gap: 24px;\n\s*padding-bottom: calc\(\n\s*20px \+ var\(--mini-player-height\) \+ var\(--mobile-nav-height\) \+\n\s*env\(safe-area-inset-bottom\)\n\s*\);\n\s*\}/g,
  `.page {
    padding: 20px 16px;
    gap: 24px;
    padding-bottom: calc(
      20px + var(--mini-player-height) + var(--mobile-nav-height) +
        env(safe-area-inset-bottom) + 60px
    );
  }`
);

fs.writeFileSync('client/styles.css', css);
