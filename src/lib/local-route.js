/** Local routes must remain local even with a conventional trailing slash. */
export function localRoute(pathname) {
  const path = typeof pathname === 'string' ? pathname.replace(/\/+$/, '') : '';
  if (path === '/local-library') return 'library';
  if (path === '/local-audience') return 'audience';
  return null;
}
