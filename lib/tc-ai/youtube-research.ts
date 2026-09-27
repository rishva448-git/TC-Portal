import { COMPANY_KNOWLEDGE } from './company-knowledge';
import { getYouTubeThumbnail } from '@/lib/youtube';

interface YouTubeSearchItem {
  id?: { videoId?: string };
  snippet?: { title?: string; description?: string; defaultAudioLanguage?: string };
}

interface YouTubeVideoSnippet {
  id: string;
  title: string;
  description: string;
  language: string;
}

async function searchVideos(query: string, count: number, tamilRequested: boolean): Promise<YouTubeVideoSnippet[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YouTube research is unavailable because YOUTUBE_API_KEY is not configured. No unverified video links were generated.');

  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.search = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: String(Math.min(10, count)),
    q: query,
    key: apiKey,
    ...(tamilRequested ? { relevanceLanguage: 'ta', regionCode: 'IN' } : {}),
  }).toString();
  const searchResponse = await fetch(searchUrl, { signal: AbortSignal.timeout(12000), cache: 'no-store' });
  if (!searchResponse.ok) throw new Error(`YouTube search returned HTTP ${searchResponse.status}.`);
  const searchData = await searchResponse.json() as { items?: YouTubeSearchItem[] };
  const candidates = [...new Set((searchData.items || []).map((item) => item.id?.videoId).filter((id): id is string => Boolean(id)))];
  if (candidates.length === 0) return [];

  const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
  detailsUrl.search = new URLSearchParams({ part: 'snippet', id: candidates.join(','), key: apiKey }).toString();
  const detailsResponse = await fetch(detailsUrl, { signal: AbortSignal.timeout(12000), cache: 'no-store' });
  if (!detailsResponse.ok) throw new Error(`YouTube video verification returned HTTP ${detailsResponse.status}.`);
  const detailsData = await detailsResponse.json() as { items?: Array<{ id: string; snippet?: { title?: string; description?: string; defaultAudioLanguage?: string; defaultLanguage?: string } }> };

  const verified = await Promise.all((detailsData.items || []).map(async (item): Promise<YouTubeVideoSnippet | null> => {
    const title = item.snippet?.title?.trim();
    if (!title) return null;
    const description = item.snippet?.description || '';
    const language = item.snippet?.defaultAudioLanguage || item.snippet?.defaultLanguage || '';
    if (tamilRequested && !language.toLowerCase().startsWith('ta')) return null;

    try {
      const oembed = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${item.id}`)}&format=json`, {
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
      });
      if (!oembed.ok) return null;
      return { id: item.id, title, description, language };
    } catch {
      return null;
    }
  }));
  return verified.filter((item): item is YouTubeVideoSnippet => item !== null);
}

export async function researchYouTubeTraining(query: string, count: number, requestedRole?: string): Promise<string> {
  const tamilRequested = /tamil|தமிழ்|tamizh/i.test(query);
  const includeAllRoles = !requestedRole && /each|every|all roles|all departments|each sector|ovvoru|ellaa/i.test(query);
  const roles = includeAllRoles
    ? COMPANY_KNOWLEDGE.roles
    : requestedRole
      ? COMPANY_KNOWLEDGE.roles.filter((role) => {
          const normalizedRole = requestedRole.toLowerCase();
          return role.name.toLowerCase() === normalizedRole ||
            role.name.toLowerCase().includes(normalizedRole) ||
            normalizedRole.includes(role.name.toLowerCase()) ||
            (normalizedRole.includes('frontend') && role.name === 'Frontend Developer') ||
            (normalizedRole.includes('backend') && role.name === 'Backend Developer') ||
            (normalizedRole.includes('marketing') && role.name === 'Sales & Marketing') ||
            (normalizedRole.includes('designer') && role.name === 'UI/UX & Graphic Designer') ||
            (normalizedRole.includes('video editor') && role.name === 'Video Editor') ||
            (normalizedRole.includes('automation') && role.name === 'AI Automation & AI Agents');
        })
      : [];
  const targets = roles.length > 0 ? roles : [{ name: requestedRole || 'Requested topic', recommendedSkills: [query] }];
  const requestedCount = Math.max(1, Math.min(30, count));
  const perRole = Math.max(1, Math.min(10, includeAllRoles ? requestedCount : Math.ceil(requestedCount / targets.length)));
  const roleResults = await Promise.all(targets.map(async (target) => {
    const skills = 'recommendedSkills' in target ? target.recommendedSkills.slice(0, 4).join(' ') : query;
    const skillTerms = (skills.toLowerCase().match(/[a-z0-9+#.]{3,}/g) || []).filter((term) => !['the', 'and', 'for', 'with', 'tamil', 'video', 'videos', 'tutorial', 'tutorials'].includes(term));
    const searchQuery = `${tamilRequested ? 'Tamil' : ''} ${target.name} ${skills}`.trim();
    const results = await searchVideos(searchQuery, perRole, tamilRequested);
    const relevant = results.filter((video) => {
      const content = `${video.title} ${video.description}`.toLowerCase();
      return skillTerms.some((term) => content.includes(term));
    });
    return { target, results: relevant };
  }));

  const seen = new Set<string>();
  const sections: string[] = [];
  for (const { target, results } of roleResults) {
    const unique = results.filter((video) => {
      if (seen.has(video.id)) return false;
      seen.add(video.id);
      return true;
    });
    const required = /frontend|backend/i.test(target.name) && /required|mandatory/i.test(query);
    const rows = unique.slice(0, perRole).map((video, index) => {
      const why = 'recommendedSkills' in target
        ? target.recommendedSkills[0]
        : query.replace(/\b(find|search|research|give|prepare|need|want|tamil|video|videos|tutorial|tutorials)\b/gi, '').trim() || 'the requested skill';
      const description = video.description.trim().replace(/\s+/g, ' ').slice(0, 320);
      const metadataText = `${video.title} ${video.description}`;
      const difficulty = /\b(beginner|basics|basic|introduction|intro|fundamentals|for beginners)\b/i.test(metadataText)
        ? 'Beginner'
        : /\b(advanced|expert|deep dive)\b/i.test(metadataText)
          ? 'Advanced'
          : 'Admin review required';
      const videoNumber = String(index + 1).padStart(2, '0');
      return `VIDEO ${videoNumber}\n\nTitle:\n${video.title}\n\nYouTube URL:\nhttps://www.youtube.com/watch?v=${video.id}\n\nRole:\n${target.name}\n\nPurpose:\nSupports learning ${why} for ${target.name}.\n\nCategory:\nTechnical\n\nDifficulty:\n${difficulty}\n\nPriority:\n${required ? 'Required' : 'Normal'}\n\nDescription:\n${description}\n\nThumbnail:\n${getYouTubeThumbnail(video.id)}`;
    });
    const heading = `==================================================\n${target.name.toUpperCase()}\n==================================================`;
    const shortfall = rows.length < perRole ? `\nVerified ${rows.length} of ${perRole} requested video(s); additional matching videos could not be verified.` : '';
    sections.push(`${heading}\n${rows.length ? `${rows.join('\n\n')}${shortfall}` : 'Could not verify a direct YouTube video for this requirement.'}`);
  }

  return `**Verified YouTube research**\nSearch source: YouTube Data API; each direct video link was checked against YouTube oEmbed. ${tamilRequested ? 'Tamil results are included only when YouTube declares Tamil as the video audio language.' : ''}\n\n${sections.join('\n\n')}`;
}