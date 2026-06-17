const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      results.push(fullPath);
    }
  });
  return results;
}

const distDir = path.join(__dirname, '../dist_test');
if (!fs.existsSync(distDir)) {
  console.error('dist_test does not exist');
  process.exit(1);
}

const files = walk(distDir).filter(f => f.endsWith('.js') || f.endsWith('.d.ts'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace require("@/...") or require('@/...')
  content = content.replace(/require\((['"])(@\/)(.*?)(['"])\)/g, (match, quote1, alias, relPath, quote2) => {
    const fileDir = path.dirname(file);
    const targetPath = path.join(distDir, relPath);
    let relative = path.relative(fileDir, targetPath).replace(/\\/g, '/');
    if (!relative.startsWith('.')) {
      relative = './' + relative;
    }
    changed = true;
    return `require(${quote1}${relative}${quote2})`;
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Resolved aliases in: ${path.relative(distDir, file)}`);
  }
});
console.log('Finished resolving aliases.');
