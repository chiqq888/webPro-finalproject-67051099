export const MAX_PRODUCT_VIDEO_BYTES = 50_000_000;
export const PRODUCT_VIDEO_PREFIX = '/api/product-videos/';

export function isProductMediaUrlValid(value) {
  if (typeof value !== 'string') return false;
  if (value.startsWith('/')) {
    return value.length > 1 && !value.startsWith('//') && !value.includes('\\');
  }

  if (!/^https?:\/\//i.test(value)) return false;
  try {
    return Boolean(new URL(value).hostname);
  } catch {
    return false;
  }
}

const youtubeHostnames = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

function getYouTubeVideoId(url) {
  const path = url.pathname.replace(/\/$/, '');
  if (url.hostname === 'youtu.be') return path.slice(1);
  if (path === '/watch') return url.searchParams.get('v');
  return /^\/(?:embed|shorts|live)\/([^/]+)$/.exec(path)?.[1];
}

export function getProductVideoSource(value) {
  if (!isProductMediaUrlValid(value)) return null;
  if (value.startsWith('/')) return { type: 'file', src: value };

  const url = new URL(value);
  if (!youtubeHostnames.has(url.hostname)) return { type: 'file', src: value };

  const id = getYouTubeVideoId(url);
  if (typeof id !== 'string' || !/^[a-z0-9_-]{11}$/i.test(id)) return null;
  return { type: 'youtube', id };
}
