'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { atomicWriteFile } = require('./atomic-file');

function serializeMarkdownMemory({ name, description, metadata = {}, content = '' }) {
  const metaLines = ['---'];
  if (name) metaLines.push(`name: ${name}`);
  if (description) metaLines.push(`description: ${description}`);
  if (Object.keys(metadata).length > 0) {
    metaLines.push('metadata:');
    for (const [k, v] of Object.entries(metadata)) {
      metaLines.push(`  ${k}: ${v}`);
    }
  }
  metaLines.push('---');
  return `${metaLines.join('\n')}\n\n${content.trim()}\n`;
}

function parseMarkdownMemory(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { content: raw };

  const frontmatterStr = match[1];
  const content = match[2];
  const result = { metadata: {}, content };

  let currentSection = null;
  for (const line of frontmatterStr.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (line.startsWith('  ') && currentSection === 'metadata') {
      const idx = trimmed.indexOf(':');
      if (idx !== -1) {
        result.metadata[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
      }
    } else {
      const idx = trimmed.indexOf(':');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (key === 'metadata') {
          currentSection = 'metadata';
        } else {
          currentSection = null;
          result[key] = val;
        }
      }
    }
  }
  return result;
}

function saveMarkdownMemory(dir, memory) {
  const fileName = `${memory.name.replace(/[^a-zA-Z0-9_-]/g, '-')}.md`;
  const filePath = path.join(dir, fileName);
  atomicWriteFile(filePath, serializeMarkdownMemory(memory));
  return filePath;
}

function loadMarkdownMemory(dir, name) {
  const fileName = `${name.replace(/[^a-zA-Z0-9_-]/g, '-')}.md`;
  const filePath = path.join(dir, fileName);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  return parseMarkdownMemory(raw);
}

function listMarkdownMemories(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') && !f.startsWith('.'));
  return files.map(f => {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    const parsed = parseMarkdownMemory(raw);
    return { fileName: f, ...parsed };
  });
}

module.exports = {
  serializeMarkdownMemory,
  parseMarkdownMemory,
  saveMarkdownMemory,
  loadMarkdownMemory,
  listMarkdownMemories
};
