// Pinterest fetch/XHR 후킹
// 수집 대상: 저장한 핀 (보드 피드)
// 반드시 manifest.json에 "world": "MAIN" 설정 필요

(function() {
  'use strict';

  if (window._socialArchivePinterestLoaded) return;
  window._socialArchivePinterestLoaded = true;

  const RESOURCE_PATTERNS = [
    '/resource/BoardFeedResource/',
    '/resource/UserFeedResource/',
    '/resource/PinsFeedResource/',
    '/resource/UserActivityPinsResource/',
    '/resource/SavedFeedResource/',
    '/resource/UserPinsResource/',
  ];

  function isTarget(url) {
    if (typeof url !== 'string') return false;
    if (RESOURCE_PATTERNS.some(p => url.includes(p))) return true;
    // 새 get/ 엔드포인트: ?source_url=...pins... 또는 boards
    if (url.includes('/get/') || url.includes('get/?')) {
      return url.includes('_pins') || url.includes('pins%2F') ||
             url.includes('_boards') || url.includes('boards%2F');
    }
    return false;
  }

  function handleData(url, data) {
    // Pinterest 응답 구조: resource_response.data (배열 or {results:[]})
    const resourceData = data?.resource_response?.data;
    let rawItems = [];

    if (Array.isArray(resourceData)) {
      rawItems = resourceData;
    } else if (Array.isArray(resourceData?.results)) {
      rawItems = resourceData.results;
    } else if (resourceData?.pins) {
      rawItems = Object.values(resourceData.pins);
    }

    if (!rawItems.length) return;

    const parsed = rawItems
      .map(item => window._socialArchive?.parsePinterestPin(item))
      .filter(item => item && item.originalId);

    if (!parsed.length) return;

    console.log('[SocialArchive] Pinterest 수집:', parsed.length, '개');

    window.postMessage({
      __socialArchive: true,
      type: 'PINTEREST_ITEMS_INTERCEPTED',
      payload: parsed,
    }, '*');
  }

  // ── fetch 후킹 ───────────────────────────────────────────
  const _fetch = window.fetch;

  window.fetch = async function(...args) {
    const response = await _fetch.apply(this, args);

    try {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
      if (isTarget(url)) {
        response.clone().json().then(data => handleData(url, data)).catch(() => {});
      }
    } catch (_) {}

    return response;
  };

  // ── XHR 후킹 ────────────────────────────────────────────
  const _XHR = window.XMLHttpRequest;

  window.XMLHttpRequest = function() {
    const xhr = new _XHR();
    let _url = '';

    const origOpen = xhr.open.bind(xhr);
    xhr.open = function(method, url, ...rest) {
      _url = url;
      return origOpen(method, url, ...rest);
    };

    xhr.addEventListener('load', function() {
      if (!isTarget(_url)) return;
      try {
        const data = JSON.parse(xhr.responseText);
        handleData(_url, data);
      } catch (_) {}
    });

    return xhr;
  };

  window.XMLHttpRequest.prototype = _XHR.prototype;

  console.log('[SocialArchive] Pinterest 인터셉터 로드됨');
})();
