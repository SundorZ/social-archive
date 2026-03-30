// YouTube 좋아요 목록 (LL 플레이리스트) 인터셉터
// youtube.com/playlist?list=LL 페이지에서만 동작
// 반드시 manifest.json에 "world": "MAIN" 설정 필요

(function() {
  'use strict';

  if (window._socialArchiveYTLLLoaded) return;
  window._socialArchiveYTLLLoaded = true;

  // LL 플레이리스트 페이지가 아니면 종료
  if (!location.href.includes('list=LL')) return;

  function dispatch(items) {
    if (!items?.length) return;
    console.log('[SocialArchive] YouTube 좋아요 수집:', items.length, '개');
    window.postMessage({
      __socialArchive: true,
      type: 'YOUTUBE_LL_ITEMS_INTERCEPTED',
      payload: items,
    }, '*');
  }

  // ── 1. 초기 페이지 데이터 (ytInitialData) ────────────────
  // document_start에서 실행되므로 ytInitialData 할당을 가로챔
  let _ytInitialData = undefined;
  try {
    Object.defineProperty(window, 'ytInitialData', {
      configurable: true,
      get() { return _ytInitialData; },
      set(v) {
        _ytInitialData = v;
        // 약간 지연 후 파싱 (parser.js가 먼저 로드돼야 하므로)
        setTimeout(() => {
          const items = window._socialArchive?.parseLLFromInitialData(v);
          dispatch(items);
        }, 0);
      },
    });
  } catch (_) {
    // defineProperty 실패 시 폴링으로 대체
    let checked = false;
    const poll = setInterval(() => {
      if (window.ytInitialData && !checked) {
        checked = true;
        clearInterval(poll);
        const items = window._socialArchive?.parseLLFromInitialData(window.ytInitialData);
        dispatch(items);
      }
    }, 200);
    setTimeout(() => clearInterval(poll), 10000);
  }

  // ── 2. 스크롤 시 continuation 요청 후킹 ──────────────────
  const _fetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await _fetch.apply(this, args);
    try {
      const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
      if (url.includes('/youtubei/v1/browse')) {
        response.clone().json().then(data => {
          const items = window._socialArchive?.parseLLFromContinuation(data);
          dispatch(items);
        }).catch(() => {});
      }
    } catch (_) {}
    return response;
  };

  console.log('[SocialArchive] YouTube 좋아요 인터셉터 로드됨');
})();
