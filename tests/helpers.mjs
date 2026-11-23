import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export const USER_INVOKED_DOMAIN_SKILLS = [
  'ui-craft-floor',
  'ui-review',
  'ui-polish',
  'ui-shape',
  'backend-security-floor',
  'security-review',
];

export const TOUCHED_AGENT_SKILLS = [
  'ask-matt',
  'code-review',
  'ui-craft-floor',
  'ui-polish',
  'ui-review',
  'ui-shape',
  'backend-security-floor',
  'security-review',
  'setup-matt-pocock-skills',
  'improve-codebase-architecture',
];

export const KNOWN_DICTIONARY_SLUGS = new Set([
  'afk',
  'agent',
  'agent-mode',
  'agents-md',
  'automated-check',
  'clearing',
  'compaction',
  'context',
  'context-pointer',
  'context-window',
  'effort',
  'environment',
  'grilling',
  'harness',
  'human-in-the-loop',
  'human-review',
  'mcp',
  'memory-system',
  'model',
  'parametric-knowledge',
  'primary-source',
  'progressive-disclosure',
  'prototyping',
  'secondary-source',
  'session',
  'skill',
  'smart-zone',
  'spec',
  'stateful',
  'stateless',
  'subagent',
  'ticket',
  'token',
  'tool',
  'tool-call',
  'turn',
  'vibe-coding',
]);

export const AVOIDED_GLOSSARY_SYNONYMS =
  /\b(coding aspect|skillset mode|domain mode|embedded rules|rule pack|baseline rules)\b/i;

/**
 * Normalizes CRLF line endings to LF for cross-platform mirror comparison.
 */
export function normalizeNewlines(text) {
  return text.replace(/\r\n/g, '\n');
}

/**
 * Extracts YAML frontmatter from a markdown skill file, asserting its presence.
 */
export function extractFrontmatter(markdown, filePath) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, `${filePath} must begin with YAML frontmatter`);
  return match[1];
}

/**
 * Recursively collects sorted file paths under `dir`.
 * Accepts either an extension allowlist array or `{ extensions, relative }`.
 */
export function collectFilesRecursive(dir, options = {}) {
  const extensions = Array.isArray(options) ? options : options.extensions;
  const relative = !Array.isArray(options) && Boolean(options.relative);
  const results = [];
  if (!fs.existsSync(dir)) return results;

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const full = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (!extensions || extensions.some((ext) => entry.name.endsWith(ext))) {
        results.push(relative ? path.relative(dir, full).replace(/\\/g, '/') : full);
      }
    }
  }

  walk(dir);
  return results.sort();
}

/**
 * Validates that a human-facing docs page obeys `.agents/writing-docs.md`.
 */
export function assertDocsCompliance(content, fileLabel, requiredHeadings, options = {}) {
  const { allowSkillsUpdateMention = false, requireAskMattLink = true } = options;

  assert.doesNotMatch(content, /^#\s+/m, `${fileLabel} must not contain an H1 heading`);

  const installCommandPattern = allowSkillsUpdateMention
    ? /(?:npx skills@latest add|claude plugin (?:marketplace )?add|claude plugin install|codex plugin|gemini skills install)/i
    : /\b(npx skills|claude plugin|codex plugin|gemini skills)\b/i;
  assert.doesNotMatch(content, installCommandPattern, `${fileLabel} must not contain install commands`);

  assert.doesNotMatch(content, /skills\/engineering\//i, `${fileLabel} must not link to internal skill source files`);
  assert.doesNotMatch(
    content,
    /github\.com\/(mattpocock\/skills|PeterPhan369\/peterskills)/i,
    `${fileLabel} must not contain source repo links`
  );

  const proseWithoutSlugs = content
    .replace(/https?:\/\/[^\s)]+/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\b(ask-matt|setup-matt-pocock-skills)\b/g, '');
  assert.doesNotMatch(proseWithoutSlugs, /\b(matt|pocock|peter)\b/i, `${fileLabel} must not name authors`);

  const links = [...content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((m) => m[1]);
  assert.ok(links.length > 0, `${fileLabel} must contain links`);
  for (const href of links) {
    assert.match(href, /^https:\/\//, `${fileLabel} links must all be absolute https://, found "${href}"`);
  }

  const dictLinks = links.filter((href) => href.startsWith('https://www.aihero.dev/ai-coding-dictionary/'));
  const seenSlugs = new Set();
  for (const href of dictLinks) {
    const slug = href.replace('https://www.aihero.dev/ai-coding-dictionary/', '');
    assert.ok(KNOWN_DICTIONARY_SLUGS.has(slug), `${fileLabel} references unknown AI Coding Dictionary slug "${slug}"`);
    assert.ok(!seenSlugs.has(slug), `${fileLabel} must link AI Coding Dictionary slug "${slug}" on first use only`);
    seenSlugs.add(slug);
  }

  let lastIdx = -1;
  for (const heading of requiredHeadings) {
    const idx = content.indexOf(heading);
    assert.ok(idx !== -1, `${fileLabel} must include heading "${heading}"`);
    assert.ok(idx > lastIdx, `${fileLabel} heading "${heading}" must preserve template order`);
    lastIdx = idx;
  }

  if (requireAskMattLink) {
    assert.ok(
      content.includes('https://aihero.dev/skills-ask-matt'),
      `${fileLabel} must link to https://aihero.dev/skills-ask-matt`
    );
  }
}
