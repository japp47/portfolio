/*
 * Serves dist/ the way Netlify does, which `vite preview` does not: an unknown path gets
 * 404.html with a real 404 status, instead of falling back to the home page.
 *
 *   npm run build && npm run serve     → http://localhost:4178
 *
 * Use it to check the 404 page, and anything else that depends on real status codes.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', 'dist');
const PORT = Number(process.env.PORT ?? 4178);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
  '.webmanifest': 'application/manifest+json',
};

/** The file Netlify would serve for a path: the file itself, or index.html inside a folder. */
function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  // keep the lookup inside dist/, whatever the request says
  const candidate = path.join(ROOT, path.normalize(decoded));
  if (!candidate.startsWith(ROOT)) return null;

  for (const file of [candidate, path.join(candidate, 'index.html')]) {
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  }
  return null;
}

http
  .createServer((req, res) => {
    const file = resolveFile(req.url ?? '/');
    const notFound = path.join(ROOT, '404.html');

    if (!file) {
      const body = fs.existsSync(notFound) ? fs.readFileSync(notFound) : 'Not found';
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      res.end(body);
      console.log(`404  ${req.url}`);
      return;
    }

    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    res.end(fs.readFileSync(file));
  })
  .listen(PORT, () => {
    console.log(`dist/ on http://localhost:${PORT}  (unknown paths get 404.html, like Netlify)`);
  });
