// Pinterest 응답 데이터 → Content 스키마 변환
// MAIN world에서 실행 (interceptor.js와 함께 로드됨)

(function() {
  'use strict';

  window._socialArchive = window._socialArchive || {};

  /**
   * Pinterest pin 객체 → Content 스키마
   * @param {object} pin - Pinterest 내부 API 핀 데이터
   * @returns {object|null}
   */
  window._socialArchive.parsePinterestPin = function(pin) {
    if (!pin?.id) return null;

    const boardName = pin.board?.name || pin.board_name || null;
    const boardUrl  = pin.board?.url
      ? `https://www.pinterest.com${pin.board.url}`
      : null;

    return {
      originalId:   String(pin.id),
      platform:     'pinterest',
      contentType:  'pin',
      source:       'saved',
      url:          `https://www.pinterest.com/pin/${pin.id}/`,
      thumbnailUrl: pin.images?.orig?.url
                 || pin.images?.['736x']?.url
                 || pin.images?.['474x']?.url
                 || null,
      title:        (typeof pin.title === 'string' ? pin.title : null) || (typeof pin.description === 'string' ? pin.description?.slice(0, 120) : null) || '',
      description:  (typeof pin.description === 'string' ? pin.description : '') || '',
      authorName:   pin.pinner?.username || '',
      authorId:     pin.pinner?.id ? String(pin.pinner.id) : '',
      collection:   boardName ? { name: boardName, url: boardUrl } : null,
      likeCount:    pin.reaction_counts?.['1'] || 0,
      viewCount:    pin.repin_count || 0,
      hashtags:     [],
    };
  };
})();
