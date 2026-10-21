/* ==========================================================================
   The private archive.

   Reads the rendered private tree in `.archive-site`, assembles one full-text
   archive grouped by Writing, The Usual, Projects and Art (Poetry is public
   and lives on the home page), and encrypts it with a password. Only the
   ciphertext is written: `archive/index.html` becomes a small gate that
   decrypts in the browser with WebCrypto.

   Diary images are inlined as data URIs before encryption. They used to be
   plain files under `/resources/diary/`, which meant the gate protected the
   words but the photographs were public URLs. The private source no longer
   contains them at all; the build stages them from PRIVATE_ROOT and this
   script carries them inside the ciphertext.

   Run `scripts/archive.sh`. The password is typed at a hidden prompt and is
   never written anywhere. `.archive-site` is a plaintext private tree; the
   shell script removes it even when the build fails.

   Static GitHub Pages has no server-side login. This is encryption, not
   authentication: the ciphertext is public and a strong password is the lock.
   ========================================================================== */

import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const root = process.cwd();
// The archive build includes the unpublished (private) writing posts; the
// public `_site` deliberately does not.
const site = path.join(root, '.archive-site');
const ITERATIONS = 310_000;

function hidden(question) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error('No terminal for the password. Set ARCHIVE_PASSWORD.'));
      return;
    }

    process.stdout.write(question);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let value = '';

    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener('data', onData);
    };

    /*
     * A terminal delivers typed characters one at a time, but a paste arrives
     * as one chunk and may include the carriage return. Handle the chunk
     * character by character, and finish at the first newline: treating the
     * whole chunk as one character would store the newline in the password
     * and leave the prompt waiting.
     */
    const onData = chunk => {
      for (const char of chunk) {
        if (char === String.fromCharCode(13) || char === String.fromCharCode(10)) {
          cleanup();
          process.stdout.write(String.fromCharCode(10));
          resolve(value);
          return;
        } else if (char === String.fromCharCode(3)) {
          cleanup();
          process.exit(1);
        } else if (char === String.fromCharCode(127) || char === String.fromCharCode(8)) {
          value = value.slice(0, -1);
        } else {
          value += char;
        }
      }
    };

    stdin.on('data', onData);
  });
}

async function askPassword() {
  if (process.env.ARCHIVE_PASSWORD) return process.env.ARCHIVE_PASSWORD;

  const first = await hidden('Archive password: ');
  const second = await hidden('Again: ');
  if (first !== second) throw new Error('The passwords do not match.');
  if (first.length < 8) throw new Error('Use at least 8 characters.');
  return first;
}

async function entries(directory) {
  const full = path.join(site, directory);
  let listing;
  try {
    listing = await fs.readdir(full, { withFileTypes: true });
  } catch {
    return [];
  }

  const found = [];
  for (const entry of listing) {
    if (!entry.isDirectory()) continue;
    let html;
    try {
      html = await fs.readFile(path.join(full, entry.name, 'index.html'), 'utf8');
    } catch {
      continue;
    }

    const article = html.match(/<article[\s\S]*?<\/article>/)?.[0];
    if (!article) continue;

    const date = article
      .match(/<p class="entry-meta">\s*([^<·]+?)\s*(?:·|<\/p>)/)?.[1]
      ?.trim() ?? '';
    const title = article
      .match(/<h1 class="entry-title">([\s\S]*?)<\/h1>/)?.[1]
      ?.trim() ?? entry.name;

    found.push({ article, date, title, time: Date.parse(date) || 0 });
  }

  return found
    .sort((a, b) => b.time - a.time)
    .map((entry, index) => ({ ...entry, id: `archive-${directory}-${index}` }));
}

/**
 * The card list. The full article is in a template; a click opens it in the
 * reader, so the archive reads as an index first and an article second.
 */
function cards(entries) {
  return `<ul class="list archive-list">
${entries.map(entry => `    <li>
      <a href="#${entry.id}" data-archive-open="${entry.id}">
        <span class="row-title">${entry.title}</span>
        <span class="row-meta">${entry.date}</span>
      </a>
    </li>`).join('\n')}
  </ul>`;
}

/** The full articles, inert until the reader clones one. */
function articleTemplates(entries) {
  return entries
    .map(entry => `  <template id="${entry.id}" data-archive-entry>${entry.article}</template>`)
    .join('\n');
}

async function listIn(page) {
  try {
    const html = await fs.readFile(path.join(site, page), 'utf8');
    return html.match(/<ul class="list">[\s\S]*?<\/ul>/)?.[0] ?? '';
  } catch {
    return '';
  }
}

/** The Spotify embed from the private playlist page. */
async function playlistEmbed() {
  try {
    const html = await fs.readFile(path.join(site, 'art/playlist/index.html'), 'utf8');
    return html.match(/<div class="playlist">[\s\S]*?<\/div>/)?.[0] ?? '';
  } catch {
    return '';
  }
}

function countItems(html) {
  return (html.match(/<li\b/g) ?? []).length;
}

/** The five diary photographs, as they appear in the rendered articles. */
const IMAGE_SRC = /(<img\b[^>]*\bsrc=")(\/resources\/diary\/[^"]+)("[^>]*>)/g;

function mimeFor(file) {
  switch (path.extname(file).toLowerCase()) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.gif': return 'image/gif';
    default: return 'application/octet-stream';
  }
}

/**
 * A smaller copy of a diary photograph, when `sips` can make one.
 *
 * The originals total about 12 MB. Base64 would grow that by a third on every
 * archive load. `-Z 1600` keeps the long edge at 1600 px, which is more than
 * the reading column uses. If resizing fails, the original is used rather than
 * dropping the picture.
 */
async function shrink(source, target) {
  try {
    await execFileAsync('/usr/bin/sips', [
      '-Z', '1600',
      '-s', 'format', 'jpeg',
      '-s', 'formatOptions', '82',
      source,
      '--out', target,
    ]);
    return target;
  } catch {
    return source;
  }
}

/**
 * Replace each diary image URL with a data URI.
 *
 * The archive is a single encrypted document. An `<img src>` pointing at a
 * public path would leave the photograph outside the password, so a missing
 * source is an error rather than a broken picture in a private page.
 */
async function inlineDiaryImages(archive) {
  const matches = [...archive.matchAll(IMAGE_SRC)];
  if (!matches.length) return archive;

  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'eai-archive-'));
  const staged = path.join(root, '.archive-src');
  try {
    let out = '';
    let last = 0;

    for (const match of matches) {
      const [whole, before, src, after] = match;
      const at = match.index ?? 0;
      const decoded = decodeURIComponent(src);
      const relative = decoded.replace(/^\//, '');

      /*
       * `resources/diary/` is excluded from the rendered site on purpose: it is
       * private static material and must not appear in a public `_site`. It is
       * present in the staged source tree, which is where the builder reads it
       * before the shell removes that tree.
       */
      let source = null;
      for (const base of [staged, site]) {
        const candidate = path.join(base, relative);
        try {
          await fs.access(candidate);
          source = candidate;
          break;
        } catch {
          // Try the next root.
        }
      }
      if (!source) {
        throw new Error(`The archive references ${src}, but no staged copy exists for it.`);
      }

      const base = path.basename(decoded).replace(/[^a-z0-9._-]+/gi, '-');
      const target = path.join(temporary, `${base}.jpg`);
      const chosen = await shrink(source, target);
      const bytes = await fs.readFile(chosen);
      const mime = chosen.toLowerCase().endsWith('.jpg') ? 'image/jpeg' : mimeFor(source);
      const uri = `data:${mime};base64,${bytes.toString('base64')}`;

      out += archive.slice(last, at) + `${before}${uri}${after}`;
      last = at + whole.length;
    }

    return out + archive.slice(last);
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
}

function section(id, title, sub, count, body) {
  return `
    <section class="home-section" id="${id}">
      <div class="section-head">
        <h2 class="section-title">${title}</h2>
        <p class="section-sub">${sub}</p>
        <span class="archive-count">${count}</span>
      </div>
      ${body}
    </section>`;
}

function buildArchive({ writing, diary, projects, art, playlist }) {
  const projectCount = countItems(projects);
  const artCount = countItems(art);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Archive — Richard Jiang</title>
  <link rel="icon" href="/resources/favicon_io/favicon.ico" type="image/x-icon">
  <link rel="stylesheet" href="/styles/site.css">
</head>
<body>
  <header class="site-head">
    <a class="wordmark" href="/">Richard Jiang</a>
    <nav class="site-nav" aria-label="Archive">
      <a href="/">Back to the site</a>
    </nav>
  </header>

  <main class="shell">
    <div id="archive-index">
      <section class="intro">
        <h1>Richard Jiang</h1>
        <p class="intro-line">The Good, The Bad, and The Ugly</p>
        <p class="intro-copy">What I think. Writing, projects, and art.</p>
      </section>

      ${section(
        'writing',
        'Writing',
        'essays, project notes, and things I wanted to keep.',
        writing.length,
        cards(writing),
      )}
      ${section(
        'usual',
        'The Usual',
        'stream-of-subconscious · don’t be offended — it’s just my mind floating',
        diary.length,
        cards(diary),
      )}
      ${section('projects', 'Projects', 'technical reports · experiments · github repos', projectCount, projects)}
      ${section('art', 'Art', 'music, films, and paintings', artCount, art + playlist)}
    </div>

    <div id="archive-reader" class="archive-reader" hidden>
      <button class="archive-back" type="button">← Archive</button>
      <div id="archive-reader-body"></div>
    </div>

${articleTemplates([...writing, ...diary])}
  </main>

  <footer class="site-foot">
    <span>Richard Jiang</span>
    <span>Writing, projects, and art.</span>
  </footer>

  <script src="/js/site.js" defer></script>
</body>
</html>
`;
}

function buildGate(salt, iv, encrypted, iterations) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Archive — Richard Jiang</title>
  <link rel="icon" href="/resources/favicon_io/favicon.ico" type="image/x-icon">
  <link rel="stylesheet" href="/styles/site.css">
</head>
<body class="gate">
  <main class="gate-panel">
    <p class="gate-eyebrow">Richard Jiang</p>
    <h1 class="gate-title">Archive</h1>
    <p class="gate-copy">This page is private. Enter the password.</p>

    <form id="gate-form" class="gate-form">
      <input id="gate-password" type="password" autocomplete="current-password" aria-label="Archive password" autofocus>
      <button type="submit">Open</button>
    </form>
    <p id="gate-status" class="gate-status" role="status"></p>
  </main>

  <script>
  (function () {
    var SALT = "${salt}";
    var IV = "${iv}";
    var DATA = "${encrypted}";
    var ITERATIONS = ${iterations};

    function bytes(value) {
      var binary = atob(value);
      var out = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
      return out;
    }

    async function open(password) {
      var material = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']
      );
      var key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: bytes(SALT), iterations: ITERATIONS, hash: 'SHA-256' },
        material,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      var plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(IV) }, key, bytes(DATA));
      return new TextDecoder().decode(plain);
    }

    var form = document.getElementById('gate-form');
    var status = document.getElementById('gate-status');
    var input = document.getElementById('gate-password');

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (!window.crypto || !crypto.subtle) {
        status.textContent = 'This page needs a secure connection.';
        return;
      }

      status.textContent = 'Opening…';
      try {
        var html = await open(input.value);
        document.open();
        document.write(html);
        document.close();
      } catch (error) {
        status.textContent = 'That password does not open it.';
        input.select();
      }
    });
  })();
  </script>
</body>
</html>
`;
}

async function main() {
  try {
    await fs.access(path.join(site, 'index.html'));
  } catch {
    throw new Error('No .archive-site build found. Run scripts/archive.sh.');
  }

  const writing = await entries('writing');
  const diary = await entries('diary');
  const projects = await listIn('projects/index.html');
  const art = await listIn('art/index.html');
  const playlist = await playlistEmbed();

  if (!writing.length && !diary.length) {
    throw new Error('The archive found no rendered entries.');
  }

  const password = await askPassword();
  const archive = await inlineDiaryImages(
    buildArchive({ writing, diary, projects, art, playlist }),
  );

  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(archive, 'utf8'),
    cipher.final(),
    cipher.getAuthTag(),
  ]);

  const gate = buildGate(
    salt.toString('base64'),
    iv.toString('base64'),
    encrypted.toString('base64'),
    ITERATIONS,
  );

  const target = path.join(root, 'archive', 'index.html');
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, gate, 'utf8');
  await fs.writeFile(path.join(site, 'archive', 'index.html'), gate, 'utf8');

  console.log(`archive: ${writing.length} writing, ${diary.length} diary entries`);
  console.log(`projects: ${countItems(projects)}   art: ${countItems(art)}`);
  console.log(`gate written to ${path.relative(root, target)}`);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
