import { once } from 'node:events';
import { copyFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
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
  for (const language of ['en', 'tr']) {
    const cv = `kursat-kaya-cv-${language}.pdf`;
    await copyFile(join(site, 'assets', cv), join(site, 'assets', `m-${cv}`));
  }
  const build = {
    repositoryId: process.env.GITHUB_REPOSITORY_ID || '1468966983',
    revision: process.env.GITHUB_SHA || 'local',
    domain: 'kursatkaya.com'
  };
  await writeFile(join(site, 'portfolio-build.json'), JSON.stringify(build) + '\n');
} finally {
  if (server.listening) await new Promise(resolve => server.close(resolve));
  await rm(printDirectory, { recursive: true, force: true });
}
