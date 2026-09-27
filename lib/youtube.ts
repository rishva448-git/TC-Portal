/**
 * Extracts YouTube Video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);

  return (match && match[2].length === 11) ? match[2] : null;
}

export function isValidYouTubeUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be'].includes(hostname);
  } catch {
    return false;
  }
}

export function getYouTubeThumbnail(videoId: string): string {
  if (!videoId) return '/placeholder-video.png';
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export interface YouTubeMetadata {
  title: string;
  authorName?: string;
  thumbnailUrl: string;
  videoId: string;
}

export async function fetchVerifiedYouTubeMetadata(url: string): Promise<YouTubeMetadata | null> {
  const videoId = extractYouTubeId(url);
  if (!videoId || !isValidYouTubeUrl(url)) return null;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;
    const response = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!response.ok) return null;

    const data = await response.json();
    if (typeof data.title !== 'string' || !data.title.trim()) return null;
    return {
      title: data.title.trim(),
      authorName: typeof data.author_name === 'string' ? data.author_name : '',
      thumbnailUrl: getYouTubeThumbnail(videoId),
      videoId,
    };
  } catch {
    return null;
  }
}

export async function fetchYouTubeMetadata(url: string): Promise<YouTubeMetadata | null> {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TechveonsPortal/1.0)',
      },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        title: data.title || '',
        authorName: data.author_name || '',
        thumbnailUrl: getYouTubeThumbnail(videoId),
        videoId,
      };
    }
  } catch (error) {
    console.error('Failed to fetch YouTube oEmbed metadata:', error);
  }

  return {
    title: '',
    thumbnailUrl: getYouTubeThumbnail(videoId),
    videoId,
  };
}

