import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sirv from 'sirv';
import { render } from './render.mjs';

const site = fileURLToPath(new URL('../site/', import.meta.url));
const printDirectory = await mkdtemp(join(tmpdir(), 'portfolio-cv-'));
const server = createServer(sirv(site, { dev: true }));
try {
  process.env.CV_PRINT_DIR = printDirectory;
  await import('../build.mjs');
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  await render(`http://127.0.0.1:${server.address().port}/`, printDirectory);
} finally {
  if (server.listening) await new Promise(resolve => server.close(resolve));
  await rm(printDirectory, { recursive: true, force: true });
}
