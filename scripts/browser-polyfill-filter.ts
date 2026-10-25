/** Only app sources and path-browserify require our browser globals prelude. */
export function needsBrowserPolyfills(code: string, id: string, appRoot: string): boolean {
  if (id.startsWith('\0') || id.startsWith('rolldown:')) return false;
  const path = id.split('?')[0].replaceAll('\\', '/');
  const root = appRoot.replaceAll('\\', '/').replace(/\/$/, '');
  const isAppSource = path.startsWith(`${root}/`) && /\.[cm]?[jt]sx?$/.test(path);
  const isPathBrowserify = path.includes('/node_modules/path-browserify/') && /\.[cm]?js$/.test(path);
  return (isAppSource || isPathBrowserify) && /(^|[^\w.$])(Buffer|process|global)([^\w$]|$)/.test(code);
}
