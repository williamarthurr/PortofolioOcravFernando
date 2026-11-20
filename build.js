#!/usr/bin/env node
"use strict";

// Generates id.html from index.html + translations.json, then syncs dist/.
// Run: node build.js          (write outputs)
//      node build.js --check  (verify outputs are current, write nothing)

const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const SOURCE = path.join(ROOT, "index.html");
const OUTPUT = path.join(ROOT, "id.html");
const DICTIONARY = path.join(ROOT, "translations.json");
const DIST = path.join(ROOT, "dist");
const CHECK_ONLY = process.argv.includes("--check");

const source = fs.readFileSync(SOURCE, "utf8");
const translations = JSON.parse(fs.readFileSync(DICTIONARY, "utf8"));
const usedKeys = new Set(["documentTitle", "metaDescription"]);

function fail(message) {
  console.error(`build.js: ${message}`);
  process.exit(1);
}

function lookup(key, where) {
  if (!Object.prototype.hasOwnProperty.call(translations, key)) {
    fail(`missing translation "${key}" (${where})`);
  }
  usedKeys.add(key);
  return translations[key];
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Split into literal text, comments/doctype, and tags without parsing inside
// comments — the PROJECT CARD help comment contains sample markup.
function tokenize(html) {
  const tokens = [];
  const tagPattern = /<!--[\s\S]*?-->|<!doctype[^>]*>|<\/?[a-zA-Z][^>]*>/gi;
  let cursor = 0;
  let match;

  while ((match = tagPattern.exec(html)) !== null) {
    if (match.index > cursor) {
      tokens.push({ type: "text", value: html.slice(cursor, match.index) });
    }
    const raw = match[0];
    const literal = raw.startsWith("<!--") || raw.toLowerCase().startsWith("<!doctype");
    tokens.push({ type: literal ? "text" : "tag", value: raw });
    cursor = match.index + raw.length;
  }
  if (cursor < html.length) {
    tokens.push({ type: "text", value: html.slice(cursor) });
  }
  return tokens;
}

const VOID_TAGS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img",
  "input", "link", "meta", "param", "source", "track", "wbr",
]);

function generate() {
  const output = [];
  const stack = [];

  for (const token of tokenize(source)) {
    if (token.type === "text") {
      output.push(token.value);
      continue;
    }

    const raw = token.value;
    const isClosing = raw.startsWith("</");
    const nameMatch = raw.match(/^<\/?\s*([a-zA-Z][\w:-]*)/);
    const name = nameMatch ? nameMatch[1].toLowerCase() : "";
    const selfClosing = /\/\s*>$/.test(raw);

    if (isClosing) {
      if (stack.length && stack[stack.length - 1].name === name) {
        const frame = stack.pop();
        if (frame.key) {
          output.length = frame.contentStart;
          output.push(lookup(frame.key, `<${name}>`));
        }
      }
      output.push(raw);
      continue;
    }

    let tag = raw;
    const altKey = tag.match(/\bdata-i18n-alt="([^"]+)"/);
    if (altKey) {
      const value = escapeAttribute(lookup(altKey[1], "data-i18n-alt"));
      tag = /\balt="[^"]*"/.test(tag)
        ? tag.replace(/\balt="[^"]*"/, `alt="${value}"`)
        : tag.replace(/\s*\/?>$/, ` alt="${value}"$&`);
    }
    const ariaKey = tag.match(/\bdata-i18n-aria="([^"]+)"/);
    if (ariaKey) {
      const value = escapeAttribute(lookup(ariaKey[1], "data-i18n-aria"));
      tag = /\baria-label="[^"]*"/.test(tag)
        ? tag.replace(/\baria-label="[^"]*"/, `aria-label="${value}"`)
        : tag.replace(/\s*\/?>$/, ` aria-label="${value}"$&`);
    }

    output.push(tag);
    if (!VOID_TAGS.has(name) && !selfClosing) {
      const textKey = tag.match(/\bdata-i18n="([^"]+)"/);
      stack.push({
        name,
        key: textKey ? textKey[1] : null,
        contentStart: output.length,
      });
    }
  }

  if (stack.length) {
    fail(`unclosed elements: ${stack.map((frame) => frame.name).join(", ")}`);
  }

  let html = output.join("");

  html = html.replace("<html lang=\"en\">", "<html lang=\"id\">");
  html = html.replace(
    /(<meta\s+name="description"\s+content=")[\s\S]*?("\s*\/>)/,
    (_, open, close) => open + escapeAttribute(lookup("metaDescription", "meta description")) + close,
  );
  html = html.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${lookup("documentTitle", "title")}</title>`,
  );
  html = html.replace(
    /<a class="language-option[^"]*"[^>]*data-locale="(en|id)"[^>]*>[^<]*<\/a>/g,
    (anchor, locale) => {
      const selected = locale === "id";
      let updated = anchor
        .replace(/class="language-option[^"]*"/, `class="language-option${selected ? " is-selected" : ""}"`)
        .replace(/\s*aria-current="page"/, "");
      if (selected) {
        updated = updated.replace(/\bdata-locale="id"/, 'data-locale="id" aria-current="page"');
      }
      return updated;
    },
  );

  const unused = Object.keys(translations).filter((key) => !usedKeys.has(key));
  if (unused.length) {
    console.warn(`build.js: unused translation keys: ${unused.join(", ")}`);
  }

  return `<!-- Generated from index.html + translations.json by build.js. Do not edit directly. -->\n${html}`;
}

const generated = generate();
const current = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, "utf8") : null;
const normalizeEol = (value) => value.replace(/\r\n/g, "\n");

if (CHECK_ONLY) {
  const problems = [];
  if (current === null || normalizeEol(current) !== normalizeEol(generated)) problems.push("id.html");
  if (fs.existsSync(DIST)) {
    for (const file of ["index.html", "id.html", "script.js", "styles.css"]) {
      const expected = file === "id.html" ? generated : fs.readFileSync(path.join(ROOT, file), "utf8");
      const actual = fs.readFileSync(path.join(DIST, file), "utf8");
      if (normalizeEol(actual) !== normalizeEol(expected)) problems.push(`dist/${file}`);
    }
  }
  if (problems.length) {
    fail(`out of date: ${problems.join(", ")} — run \`node build.js\``);
  }
  console.log("build.js: id.html and dist/ are up to date.");
} else {
  fs.writeFileSync(OUTPUT, generated, "utf8");
  console.log("build.js: wrote id.html");
  if (fs.existsSync(DIST)) {
    for (const file of ["index.html", "id.html", "script.js", "styles.css"]) {
      fs.copyFileSync(path.join(ROOT, file), path.join(DIST, file));
    }
    console.log("build.js: synced dist/ (index.html, id.html, script.js, styles.css)");
  }
}
