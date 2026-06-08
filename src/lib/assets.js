// Resolve caminhos de assets respeitando a base do Vite (ex.: '/qgdaPRFWILSON/').
// Necessário porque caminhos absolutos de raiz ('/assets/...') ignoram a base
// e quebram no GitHub Pages. Mantém intactos data:, blob: e URLs externas.
export const assetUrl = (path) => {
  if (!path) return path;
  if (/^(data:|blob:|https?:)/i.test(path)) return path;
  const base = import.meta.env.BASE_URL || '/';
  return base.replace(/\/?$/, '/') + path.replace(/^\//, '');
};
