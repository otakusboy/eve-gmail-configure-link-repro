import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function startServer(port = 0) {
  const html = await readFile(new URL('../index.html', import.meta.url));
  const server = createServer((request, response) => {
    if (request.url === '/favicon.ico') {
      response.writeHead(404);
      response.end();
      return;
    }
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(html);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return server;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const server = await startServer(Number(process.env.PORT ?? 3091));
  console.log(`Open http://127.0.0.1:${server.address().port}/integrations/chat-sdk-gmail`);
  console.log('Click Configure in the actual paragraph, then compare Native fragment control.');
}
