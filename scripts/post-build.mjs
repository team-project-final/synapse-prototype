import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// GitHub Pages SPA fallback (https://github.com/rafgraph/spa-github-pages)
// 404.html bounces /repo/some/deep/path → /repo/?/some/deep/path so the
// root index.html (which exists, so HTTP 200) can restore the URL via
// history.replaceState and let React Router pick it up. This avoids the
// console "404 Failed to load resource" that the naive index→404 copy leaves.

// pathSegmentsToKeep = 1 keeps "/synapse-prototype" before /?/...
const pathSegmentsToKeep = 1;

const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Redirecting…</title>
    <script type="text/javascript">
      var pathSegmentsToKeep = ${pathSegmentsToKeep};
      var l = window.location;
      l.replace(
        l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
        l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
        l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
        (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
        l.hash
      );
    </script>
  </head>
  <body></body>
</html>
`;

const dist = resolve(process.cwd(), 'dist');
await writeFile(resolve(dist, '404.html'), html, 'utf8');
console.log('post-build: dist/404.html written (SPA redirect to /?/...)');
