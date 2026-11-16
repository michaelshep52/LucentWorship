import { createHash } from 'node:crypto';

/** Cache only the entry's static graph and the two explicitly local route graphs. */
export function localShellPlugin() {
  return {
    name: 'lucent-local-shell',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const chunks = Object.values(bundle).filter(item => item.type === 'chunk');
      const entry = chunks.find(item => item.isEntry);
      const roots = chunks.filter(item => /\/pages\/Local(?:Library|Audience)\.jsx$/.test(item.facadeModuleId || ''));
      if (!entry || roots.length !== 2) throw new Error('Local shell route graph is incomplete');
      const files = new Set(['index.html']);
      function visit(chunk) {
        if (files.has(chunk.fileName)) return;
        files.add(chunk.fileName);
        for (const css of chunk.viteMetadata?.importedCss || []) files.add(css);
        for (const name of chunk.imports) {
          const dependency = bundle[name];
          if (!dependency || dependency.type !== 'chunk') throw new Error('Unexpected external local-shell import');
          visit(dependency);
        }
        // Deliberately do not follow dynamic imports into the cloud application.
      }
      [entry, ...roots].forEach(visit);
      const paths = [...files].sort().map(file => '/' + file);
      // Version the complete shell and worker policy, not just hashed asset names.
      // Otherwise an HTML-only update can reuse/overwrite the active cache.
      const hash = createHash('sha256').update(localShellWorker(paths, 'VERSION'));
      for (const file of [...files].sort()) {
        const asset = bundle[file];
        if (!asset) throw new Error('Missing offline shell asset: ' + file);
        hash.update(file).update('\0').update(asset.type === 'chunk' ? asset.code : asset.source);
      }
      const digest = hash.digest('hex').slice(0, 20);
      this.emitFile({ type: 'asset', fileName: 'lucent-local-sw.js', source: localShellWorker(paths, digest) });
    },
  };
}

export function localShellWorker(paths, version) {
  return `const CACHE = ${JSON.stringify('lucent-local-shell-' + version)};
const PATHS = ${JSON.stringify(paths)};
const allowed = new Set(PATHS);
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  try {
    // A partial installation must never become an active offline shell.
    await cache.addAll(PATHS.map(path => new Request(path, {cache:'reload', credentials:'omit', redirect:'error'})));
  } catch (error) { await caches.delete(CACHE); throw error; }
})()));
// No skipWaiting: an update must not replace assets under an active rehearsal.
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const name of await caches.keys()) {
    if (name.startsWith('lucent-local-shell-') && name !== CACHE) await caches.delete(name);
  }
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.search) return;
  const local = /^\\/local-(library|audience)\\/*$/.test(url.pathname);
  const path = request.mode === 'navigate' ? (local ? '/index.html' : null) : (allowed.has(url.pathname) && url.pathname !== '/index.html' ? url.pathname : null);
  if (!path) return;
  // Only preinstalled public static assets. Never store runtime or cloud responses.
  event.respondWith(caches.open(CACHE).then(cache => cache.match(path)).then(response => response || new Response('Offline app files are missing. Reconnect and prepare offline launch again.', {status:503, headers:{'Content-Type':'text/plain'}})));
});
`;
}
