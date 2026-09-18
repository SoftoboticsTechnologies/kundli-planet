const fs = require('fs');
const path = require('path');

const dir = __dirname;
const OLD = 'allLinks: ui.nav.concat(ui.moreLinks),';
const NEW = 'allLinks: [ui.moreLinks[ui.moreLinks.length - 1]].concat(ui.nav, ui.moreLinks.slice(0, -1)),';

const skip = new Set(['index.html', 'Kundli Planet Home.dc.html']);
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && !skip.has(f));

let changed = 0;
const misses = [];
for (const f of files) {
  const p = path.join(dir, f);
  let content = fs.readFileSync(p, 'utf8');
  if (content.includes(OLD)) {
    content = content.split(OLD).join(NEW);
    fs.writeFileSync(p, content, 'utf8');
    changed++;
  } else if (content.includes('allLinks')) {
    misses.push(f);
  }
}
console.log('changed:', changed);
console.log('misses:', misses.length);
console.log(misses.join('\n'));
