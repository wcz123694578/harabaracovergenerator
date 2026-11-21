import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const html = read('index.html');
const css = read('assets/css/site.css');
const js = read('assets/js/app.js');
const jquery = read('assets/vendor/jquery/jquery.min.js');
const license = read('assets/vendor/jquery/LICENSE.txt');

assert.match(html, /<title>Harabara Cover Generator<\/title>/);
assert.match(html, /href="\.\/assets\/css\/site\.css"/);
assert.match(html, /src="\.\/assets\/vendor\/jquery\/jquery\.min\.js" defer/);
assert.match(html, /src="\.\/assets\/js\/app\.js" defer/);
assert.ok(
  html.indexOf('assets/vendor/jquery/jquery.min.js') < html.indexOf('assets/js/app.js'),
  'Load jQuery before the app script'
);
assert.doesNotMatch(html, /<style\b|<script\s*>/i);
assert.match(jquery.slice(0, 150), /jQuery v4\.1\.0/);
assert.match(license, /Permission is hereby granted/);
assert.match(js, /\}\)\(jQuery\)/);
assert.match(js, /\.on\('input'/);
assert.match(js, /\.on\('click'/);

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(ids.length, new Set(ids).size, 'Duplicate HTML IDs');

for (const id of [...js.matchAll(/\$el\('([A-Za-z][A-Za-z0-9_-]*)'\)/g)].map(m => m[1])) {
  assert.ok(ids.includes(id), 'Missing DOM element #' + id);
}

for (const id of ['title', 'subtitle', 'width', 'height', 'cover', 'save', 'fontfile']) {
  assert.ok(ids.includes(id), 'Required control missing: ' + id);
}
assert.ok(js.includes("toDataURL('image/png')"), 'PNG export handler missing');
assert.ok(js.includes('FontFace'), 'Local font loading missing');
assert.ok(css.includes('.topnav') && css.includes('.page-content'), 'Existing site layout missing');

console.log('Static checks passed.');
