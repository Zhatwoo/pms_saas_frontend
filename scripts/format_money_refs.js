/* eslint-disable @typescript-eslint/no-require-imports */
// scripts/format_money_refs.js
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..'); // project root (PMS_frontend)

function getAllTsxFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllTsxFiles(filePath));
    } else if (filePath.endsWith('.tsx')) {
      results.push(filePath);
    }
  });
  return results;
}

function ensureImport(content) {
  if (content.includes('formatPeso')) return content;
  const lines = content.split('\n');
  // Find last import line
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) lastImportIdx = i;
  }
  const importLine = "import { formatPeso } from '@/lib/currency';";
  if (lastImportIdx >= 0) {
    lines.splice(lastImportIdx + 1, 0, importLine);
  } else {
    // No imports, insert at top
    lines.unshift(importLine);
  }
  return lines.join('\n');
}

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // 1. Replace backticks `₱${expr}`
  content = content.replace(/`₱\$\{([^}]+)\}`/g, (m, expr) => `{formatPeso(${expr.trim()})}`);
  // 2. Replace template literals with prefix '₱' and number formatting
  content = content.replace(/`\s*₱\s*\$\{([^}]+)\}\s*`/g, (m, expr) => `{formatPeso(${expr.trim()})}`);
  // 3. Replace JSX "₱{expr}" or "{expr} ₱"
  content = content.replace(/₱\{([^}]+)\}/g, (m, expr) => `{formatPeso(${expr.trim()})}`);
  content = content.replace(/\{([^}]+)\}\s*₱/g, (m, expr) => `{formatPeso(${expr.trim()})}`);
  // 4. Replace "${expr} ₱" inside strings (unlikely but handle)
  content = content.replace(/\$\{([^}]+)\}\s*₱/g, (m, expr) => `{formatPeso(${expr.trim()})}`);
  // 5. Replace Number(...).toLocaleString preceded by peso
  content = content.replace(/₱\{\s*Number\(([^)]+)\)\.toLocaleString\([^}]*\)\s*\}/g, (m, expr) => `{formatPeso(${expr.trim()})}`);
  // 6. Replace backticks with Number toLocaleString
  content = content.replace(/`\s*₱\s*\$\{Number\(([^)]+)\)\.toLocaleString\([^}]*\)\}`/g, (m, expr) => `{formatPeso(${expr.trim()})}`);

  // Ensure import if we introduced formatPeso
  if (content !== original) {
    content = ensureImport(content);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function main() {
  const files = getAllTsxFiles(ROOT);
  files.forEach(replaceInFile);
}

main();
