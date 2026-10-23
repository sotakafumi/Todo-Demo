// Minimal static file server for the exported build in out/ (run `npm run build` first).
// With --lan it listens on all interfaces so phones on the same network can open the app;
// `next dev` blocks its dev assets for origins other than localhost, so it cannot do that.
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..', 'out');
const port = Number(process.env.PORT) || 3000;
const lan = process.argv.includes('--lan');
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

if (!existsSync(join(root, 'index.html'))) {
  console.error('out/index.html not found. Run `npm run build` first.');
  process.exit(1);
}

createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://localhost');
    const path = resolve(root, `.${decodeURIComponent(pathname === '/' ? '/index.html' : pathname)}`);
    // Stay inside out/, and never serve dotfiles.
    const isDotfile = path.slice(root.length + 1).split(sep).some((part) => part.startsWith('.'));
    if (!path.startsWith(root + sep) || isDotfile) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    const body = await readFile(path);
    res.writeHead(200, { 'Content-Type': contentTypes[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, lan ? '0.0.0.0' : '127.0.0.1', () => {
  console.log(`TODO app running at http://localhost:${port}`);
  if (!lan) return;
  for (const address of lanAddresses()) console.log(`  On your network: http://${address}:${port}`);
});

function lanAddresses() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((iface) => iface.family === 'IPv4' && !iface.internal)
    .map((iface) => iface.address);
}
