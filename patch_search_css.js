const fs = require('fs');
let css = fs.readFileSync('client/styles.css', 'utf-8');

// Add .search-container and clear-search styles
const searchStyles = `
.search-container {
  position: relative;
  width: 100%;
  max-width: 500px;
}
.clear-search {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  color: var(--muted);
  font-size: 1.25rem;
  line-height: 1;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
}
.clear-search:hover {
  color: var(--text);
}
.category-card {
  border-radius: var(--radius-md);
  padding: 16px;
  height: 120px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
  position: relative;
}
.category-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.3);
}
.category-card:active {
  transform: translateY(0) scale(0.98);
}
.category-card span {
  color: white;
  font-weight: 700;
  font-size: 1.125rem;
  z-index: 2;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  word-break: break-word;
}
.category-card .bg-accent {
  position: absolute;
  right: -20px;
  bottom: -20px;
  width: 80px;
  height: 80px;
  background: rgba(255,255,255,0.15);
  border-radius: 50%;
  transform: rotate(25deg);
}
`;

css = css.replace(
  /\.search-input \{/,
  searchStyles + '\n.search-input {'
);

fs.writeFileSync('client/styles.css', css);
