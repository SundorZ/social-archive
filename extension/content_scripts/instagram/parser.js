// Instagram API 응답 → Content 스키마 변환
// NOTE: MAIN world에서 실행되므로 import 사용 불가 → 전역 함수로 선언

window._socialArchive = window._socialArchive || {};

/**
 * Instagram media 객체 → Content 스키마
 * @param {Object} item  - API 응답의 items[] 원소
 * @param {string} source - 'liked' | 'saved'
 */
window._socialArchive.parseInstagramItem = function(item, source) {
  // liked feed: { media: {...} }, saved feed: 직접 media 객체
  const media = item.media || item;

  const isVideo = media.media_type === 2; // 1=이미지, 2=비디오/릴스

  // 썸네일 추출
  let thumbnailUrl = '';
  if (media.image_versions2?.candidates?.length) {
    thumbnailUrl = media.image_versions2.candidates[0].url;
  } else if (media.thumbnail_url) {
    thumbnailUrl = media.thumbnail_url;
  } else if (media.carousel_media?.[0]?.image_versions2?.candidates?.[0]) {
    thumbnailUrl = media.carousel_media[0].image_versions2.candidates[0].url;
  }

  // 캡션 텍스트
  const caption = media.caption?.text || '';
  const title   = caption.slice(0, 120) || `Instagram ${isVideo ? '릴스' : '게시물'}`;

  // 해시태그 추출
  const hashtags = (caption.match(/#[\wㄱ-ㅎ가-힣]+/g) || []).map(t => t.slice(1));

  return {
    originalId:     String(media.pk || media.id || ''),
    platform:       'instagram',
    contentType:    isVideo ? 'reel' : 'post',
    source,
    savedAt:        (media.taken_at || 0) * 1000,
    url:            `https://www.instagram.com/p/${media.code}/`,
    thumbnailUrl,
    title,
    description:    caption,
    authorName:     media.user?.username || '',
    authorId:       String(media.user?.pk || ''),
    authorProfileUrl: media.user?.profile_pic_url || '',
    likeCount:      media.like_count    || 0,
    viewCount:      media.play_count    || 0,
    commentCount:   media.comment_count || 0,
    hashtags,       // 추가 필드 (분류에 활용)
    rawData:        media,
  };
};
