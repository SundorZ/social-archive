// Instagram fetch/XHR 후킹
// 수집 대상: 저장한 게시물
// 반드시 manifest.json에 "world": "MAIN" 설정 필요

(function() {
  'use strict';

  if (window._socialArchiveInterceptorLoaded) return;
  window._socialArchiveInterceptorLoaded = true;

  const TARGET_PATHS = [
    '/api/v1/feed/saved/',
    '/api/v1/feed/collection/',
  ];

  function isTarget(url) {
    if (typeof url !== 'string') return false;
    return TARGET_PATHS.some(p => url.includes(p));
  }

  function handleData(url, data) {
    let rawItems = data?.items || data?.feed_items || [];

    if (!rawItems.length) return;

    const parsed = rawItems
      .map(item => window._socialArchive.parseInstagramItem(item, 'saved'))
      .filter(item => item.originalId);

    if (!parsed.length) return;

    console.log('[SocialArchive] Instagram 수집:', parsed.length, '개');

    window.postMessage({
      __socialArchive: true,
      type: 'INSTAGRAM_ITEMS_INTERCEPTED',
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

  console.log('[SocialArchive] Instagram 인터셉터 로드됨 (저장)');
})();
