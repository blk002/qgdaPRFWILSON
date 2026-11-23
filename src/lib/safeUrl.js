/**
 * Valida uma URL externa para uso seguro em links (<a href>),
 * permitindo apenas protocolos http: e https:.
 */
export function getSafeExternalUrl(rawUrl, fallback = '') {
  const candidate = typeof rawUrl === 'string' ? rawUrl.trim() : '';
  if (!candidate) return fallback;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
    return fallback;
  } catch {
    return fallback;
  }
}
