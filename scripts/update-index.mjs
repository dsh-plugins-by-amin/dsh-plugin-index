// update-index.mjs — dihantar dari workflow setiap repo plugin (Actions).
// Env yang dijangka: ORG, PLUGIN_REPO, TAG, SHA, INDEX_TOKEN
import fs from 'node:fs';

const ORG = process.env.ORG;
const PLUGIN = process.env.PLUGIN_REPO;
const TAG = process.env.TAG;
const SHA = process.env.SHA;
const TOKEN = process.env.INDEX_TOKEN;
const REPO = 'dsh-plugin-index';
const FILE = 'index.json';

if (!ORG || !PLUGIN || !TAG || !SHA || !TOKEN) {
  console.error('update-index: env kurang (ORG/PLUGIN_REPO/TAG/SHA/INDEX_TOKEN)');
  process.exit(1);
}
if (!/^[0-9a-f]{40}$/i.test(SHA)) { console.error('update-index: SHA tidak valid'); process.exit(1); }

const raw = await (await fetch(`https://raw.githubusercontent.com/${ORG}/${REPO}/main/${FILE}`, {
  headers: { 'User-Agent': 'index-updater' }
})).text();
const idx = JSON.parse(raw);
if (idx.format !== 1) { console.error('update-index: format index bukan 1'); process.exit(1); }

const pkg = `@${ORG}/${PLUGIN}`;
let entry = idx.plugins.find((p) => p.name === pkg);
if (!entry) {
  entry = {
    name: pkg,
    title: { en: PLUGIN },
    description: { en: '' },
    author: ORG,
    repository: { url: `https://github.com/${ORG}/${PLUGIN}` },
    versions: []
  };
  idx.plugins.push(entry);
}

const version = TAG.replace(/^v/, '');
let versions = entry.versions.filter((v) => v.version !== version);
versions.push({
  version,
  publishTimestamp: Math.floor(Date.now() / 1000),
  source: { type: 'git', url: `https://github.com/${ORG}/${PLUGIN}`, commit: SHA.toLowerCase() }
});
versions.sort((a, b) => b.version.localeCompare(a.version, 'en', { numeric: true }));
entry.versions = versions.slice(0, 5);

const body = JSON.stringify(idx, null, 2) + '\n';
const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'User-Agent': 'index-updater',
  'Content-Type': 'application/json'
};

const cur = await (await fetch(`https://api.github.com/repos/${ORG}/${REPO}/contents/${FILE}`, { headers })).json();
const put = await fetch(`https://api.github.com/repos/${ORG}/${REPO}/contents/${FILE}`, {
  method: 'PUT',
  headers,
  body: JSON.stringify({
    message: `index: ${PLUGIN} ${version}`,
    content: Buffer.from(body).toString('base64'),
    sha: cur.sha
  })
});
const result = await put.text();
console.log('update-index:', put.status, result.slice(0, 200));
process.exit(put.ok ? 0 : 1);
