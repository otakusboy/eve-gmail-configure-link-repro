import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Markdown } from '../src/markdown.tsx';

const root = new URL('../', import.meta.url);
const provenance = JSON.parse(await readFile(new URL('SOURCE-PROVENANCE.json', root), 'utf8'));
for (const file of provenance.snapshots) {
  const contents = await readFile(new URL(file.localPath, root));
  assert.equal(createHash('sha256').update(contents).digest('hex'), file.sha256,
    `Snapshot changed: ${file.localPath}`);
}
const paragraph = await readFile(new URL('src/gmail-paragraph.md', root), 'utf8');
assert(paragraph.includes('[Configure](#configure)'));
const rendered = renderToStaticMarkup(createElement(Markdown, null, paragraph));
const anchor = rendered.match(/<a[^>]*href="#configure"[^>]*>.*?<\/a>/)?.[0];
assert(anchor, 'The actual component must render the authored Configure link');
console.log('Unchanged upstream component output:');
console.log(anchor);
await writeFile(new URL('index.html', root), `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Gmail Configure link reproduction</title>
<style>
body { margin: 24px; font: 16px/1.5 system-ui; }
main { max-width: 760px; margin: auto; }
a { color: #06c; }
#configure { margin-top: 100vh; padding-bottom: 100vh; }
</style>
<main>
<h1>Gmail Configure link reproduction</h1>
<p>Reduced component reproduction. This is not the full eve website.</p>
<h2>Actual Gmail paragraph, rendered by the unchanged Markdown component</h2>
${rendered}
<h2>Browser control</h2>
<p><a id="fragment-control" href="#configure">Native fragment control</a></p>
<section id="configure"><h2>Configure</h2><p>Matching section ID from the integration detail page.</p></section>
</main>
</html>
`);
