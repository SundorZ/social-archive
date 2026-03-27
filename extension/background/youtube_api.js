import {
  YOUTUBE_API_BASE,
  YOUTUBE_SCOPES,
  YOUTUBE_MAX_RESULTS,
  YOUTUBE_MAX_PAGES,
} from '../shared/constants.js';

const WATCH_LATER_PLAYLIST_ID = 'WL';

// ─── OAuth 토큰 ───────────────────────────────────────────

async function getAuthToken(interactive = true) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive, scopes: YOUTUBE_SCOPES }, (token) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(token);
    });
  });
}

async function removeCachedToken(token) {
  return new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, resolve);
  });
}

// ─── API 요청 (401 시 토큰 갱신 후 1회 재시도) ──────────
async function apiFetch(url, token, retry = true) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401 && retry) {
    await removeCachedToken(token);
    const newToken = await getAuthToken(false);
    return apiFetch(url, newToken, false);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || `YouTube API ${res.status}`);
  }

  return res.json();
}

// ─── 좋아요 동영상 한 페이지 ─────────────────────────────
async function fetchLikedPage(token, pageToken = null) {
  const params = new URLSearchParams({
    part:       'snippet,contentDetails,statistics',
    myRating:   'like',
    maxResults: String(YOUTUBE_MAX_RESULTS),
    ...(pageToken && { pageToken }),
  });

  const data = await apiFetch(`${YOUTUBE_API_BASE}/videos?${params}`, token);

  return {
    items:         (data.items || []).map(v => parseYouTubeItem(v, 'liked')),
    nextPageToken: data.nextPageToken || null,
  };
}

// ─── 전체 좋아요 수집 (페이지네이션) ─────────────────────
export async function fetchAllLikedVideos(onProgress) {
  const token     = await getAuthToken();
  let allItems    = [];
  let pageToken   = null;
  let page        = 0;

  do {
    const result  = await fetchLikedPage(token, pageToken);
    allItems      = allItems.concat(result.items);
    pageToken     = result.nextPageToken;
    page++;

    onProgress?.(allItems.length);

    // 쿼터 과부하 방지
    if (pageToken) await delay(500);

  } while (pageToken && page < YOUTUBE_MAX_PAGES);

  return allItems;
}

// ─── Watch Later 한 페이지 (playlistItems) ──────────────
async function fetchPlaylistPage(token, playlistId, pageToken = null) {
  const params = new URLSearchParams({
    part:       'snippet,contentDetails',
    playlistId,
    maxResults: String(YOUTUBE_MAX_RESULTS),
    ...(pageToken && { pageToken }),
  });

  return apiFetch(`${YOUTUBE_API_BASE}/playlistItems?${params}`, token);
}

// ─── 비디오 ID 배치 → 상세 정보 ─────────────────────────
async function fetchVideoDetailsBatch(token, videoIds) {
  if (!videoIds.length) return [];
  const params = new URLSearchParams({
    part: 'snippet,contentDetails,statistics',
    id:   videoIds.join(','),
  });

  const data = await apiFetch(`${YOUTUBE_API_BASE}/videos?${params}`, token);
  return data.items || [];
}

// ─── 전체 Watch Later 수집 ────────────────────────────────
export async function fetchAllSavedVideos(onProgress) {
  const token   = await getAuthToken();
  let allItems  = [];
  let pageToken = null;
  let page      = 0;

  do {
    const data = await fetchPlaylistPage(token, WATCH_LATER_PLAYLIST_ID, pageToken);
    const playlistItems = data.items || [];

    // playlistItems에서 videoId 추출
    const videoIds = playlistItems
      .map(pi => pi.snippet?.resourceId?.videoId)
      .filter(Boolean);

    if (videoIds.length) {
      const videos = await fetchVideoDetailsBatch(token, videoIds);
      const parsed = videos.map(v => parseYouTubeItem(v, 'saved'));
      allItems = allItems.concat(parsed);
    }

    pageToken = data.nextPageToken || null;
    page++;
    onProgress?.(allItems.length);

    if (pageToken) await delay(500);

  } while (pageToken && page < YOUTUBE_MAX_PAGES);

  return allItems;
}

// ─── YouTube item → Content 스키마 ───────────────────────
function parseYouTubeItem(item, source = 'liked') {
  const s = item.snippet;
  const isShort = (s.title || '').toLowerCase().includes('#shorts')
    || (Number(item.contentDetails?.duration?.match(/PT(\d+)S/)?.[1]) || 999) <= 60;

  return {
    originalId:       item.id,
    platform:         'youtube',
    contentType:      isShort ? 'short' : 'video',
    source,
    savedAt:          new Date(s.publishedAt).getTime(),
    url:              `https://www.youtube.com/watch?v=${item.id}`,
    thumbnailUrl:     s.thumbnails?.high?.url || s.thumbnails?.default?.url || '',
    title:            s.title || '',
    description:      (s.description || '').slice(0, 500),
    authorName:       s.channelTitle || '',
    authorId:         s.channelId    || '',
    authorProfileUrl: '',
    likeCount:        Number(item.statistics?.likeCount   || 0),
    viewCount:        Number(item.statistics?.viewCount   || 0),
    commentCount:     Number(item.statistics?.commentCount || 0),
    rawData:          item,
  };
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
