#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function renameCssToWxss(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      renameCssToWxss(full);
    } else if (entry.name.endsWith('.css')) {
      const newName = full.slice(0, -4) + '.wxss';
      fs.renameSync(full, newName);
    }
  }
}

renameCssToWxss(path.resolve(__dirname, '../dist/build/mp-weixin'));
console.log('✅ Renamed all .css → .wxss');
