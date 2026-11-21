import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const html = read('index.html');
const css = read('assets/css/site.css');
const js = read('assets/js/app.js');

assert.match(html, /<title>Harabara Cover Generator<\/title>/);
assert.match(html, /href="\.\/assets\/css\/site\.css"/);
assert.match(html, /src="\.\/assets\/js\/app\.js" defer/);
assert.doesNotMatch(html, /<style\b|<script\s*>/i);

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(ids.length, new Set(ids).size, 'Duplicate HTML IDs');
for (const id of [...js.matchAll(/\bel\('([A-Za-z][A-Za-z0-9_-]*)'\)/g)].map(m => m[1])) {
  assert.ok(ids.includes(id), 'Missing DOM element #' + id);
}

for (const id of ['title', 'subtitle', 'width', 'height', 'cover', 'save', 'fontfile']) {
  assert.ok(ids.includes(id), 'Required control missing: ' + id);
}
assert.ok(js.includes("toDataURL('image/png')"), 'PNG export handler missing');
assert.ok(js.includes('FontFace'), 'Local font loading missing');
assert.ok(css.includes('.topnav') && css.includes('.page-content'), 'Existing site layout missing');

console.log('Static checks passed.');
