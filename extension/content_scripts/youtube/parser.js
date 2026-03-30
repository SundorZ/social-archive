// YouTube Innertube 응답 → Content 스키마 변환
// NOTE: MAIN world에서 실행되므로 import 사용 불가 → 전역 함수로 선언

window._socialArchive = window._socialArchive || {};

/**
 * playlistVideoRenderer 객체 → Content 스키마
 */
window._socialArchive.parseYouTubeLLItem = function(renderer) {
  const videoId = renderer.videoId;
  if (!videoId) return null;

  // 제목
  const title = renderer.title?.runs?.[0]?.text
    || renderer.title?.simpleText
    || '';

  // 채널명 / 채널 ID
  const channelRun = renderer.shortBylineText?.runs?.[0];
  const channelName = channelRun?.text || '';
  const channelId   = channelRun?.navigationEndpoint?.browseEndpoint?.browseId || '';

  // 썸네일 (가장 큰 것)
  const thumbs = renderer.thumbnail?.thumbnails || [];
  const bestThumb = thumbs.reduce((a, b) => ((b.width || 0) > (a.width || 0) ? b : a), thumbs[0] || {});
  const thumbnailUrl = (bestThumb.url || '').replace(/^\/\//, 'https://');

  // 길이 파싱 → Shorts 판단
  const lengthText = renderer.lengthText?.simpleText || renderer.lengthText?.accessibility?.accessibilityData?.label || '';
  const parts = lengthText.split(':').map(Number);
  let totalSec = 0;
  if (parts.length === 2) totalSec = parts[0] * 60 + parts[1];
  else if (parts.length === 3) totalSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
  const isShort = totalSec > 0 && totalSec <= 60;

  return {
    originalId:   videoId,
    platform:     'youtube',
    contentType:  isShort ? 'short' : 'video',
    source:       'liked',
    url:          `https://www.youtube.com/watch?v=${videoId}`,
    thumbnailUrl,
    title,
    description:  '',
    authorName:   channelName,
    authorId:     channelId,
    savedAt:      Date.now(),
    hashtags:     [],
  };
};

/**
 * ytInitialData에서 LL 플레이리스트 항목 추출
 */
window._socialArchive.parseLLFromInitialData = function(ytData) {
  const items = [];
  try {
    // 구조: contents > twoColumnBrowseResults > tabs[0] > ... > playlistVideoListRenderer > contents
    const contents = ytData
      ?.contents
      ?.twoColumnBrowseResultsRenderer
      ?.tabs?.[0]
      ?.tabRenderer
      ?.content
      ?.sectionListRenderer
      ?.contents?.[0]
      ?.itemSectionRenderer
      ?.contents?.[0]
      ?.playlistVideoListRenderer
      ?.contents || [];

    for (const c of contents) {
      if (c.playlistVideoRenderer) {
        const parsed = window._socialArchive.parseYouTubeLLItem(c.playlistVideoRenderer);
        if (parsed) items.push(parsed);
      }
    }
  } catch (_) {}
  return items;
};

/**
 * /youtubei/v1/browse 응답(스크롤 continuation)에서 항목 추출
 */
window._socialArchive.parseLLFromContinuation = function(data) {
  const items = [];
  try {
    const continuationItems = data
      ?.onResponseReceivedActions?.[0]
      ?.appendContinuationItemsAction
      ?.continuationItems || [];

    for (const c of continuationItems) {
      if (c.playlistVideoRenderer) {
        const parsed = window._socialArchive.parseYouTubeLLItem(c.playlistVideoRenderer);
        if (parsed) items.push(parsed);
      }
    }
  } catch (_) {}
  return items;
};
