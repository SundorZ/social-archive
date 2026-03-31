// YouTube 플레이리스트 인터셉터
// youtube.com/playlist?list=LL (좋아요) 또는 ?list=WL (저장) 페이지에서 동작
// 반드시 manifest.json에 "world": "MAIN" 설정 필요

(function() {
  'use strict';

  if (window._socialArchiveYTLLLoaded) return;
  window._socialArchiveYTLLLoaded = true;

  // LL / WL 플레이리스트 페이지가 아니면 종료
  const listId = new URLSearchParams(location.search).get('list');
  if (listId !== 'LL' && listId !== 'WL') return;

  function getSource() {
    const id = new URLSearchParams(location.search).get('list');
    return id === 'LL' ? 'liked' : 'saved';
  }

  function dispatch(items) {
    if (!items?.length) return;
    const source = getSource();
    const tagged = items.map(i => ({ ...i, source }));
    console.log('[SocialArchive] YouTube 수집:', tagged.length, '개 (source:', source, ')');
    window.postMessage({
      __socialArchive: true,
      type: 'YOUTUBE_LL_ITEMS_INTERCEPTED',
      payload: tagged,
    }, '*');
  }

  // ── 1. 초기 페이지 데이터 (ytInitialData) ────────────────
  let _ytInitialData = undefined;
  try {
    Object.defineProperty(window, 'ytInitialData', {
      configurable: true,
      get() { return _ytInitialData; },
      set(v) {
        _ytInitialData = v;
        setTimeout(() => {
          const items = window._socialArchive?.parseLLFromInitialData(v);
          dispatch(items);
        }, 0);
      },
    });
  } catch (_) {
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

  console.log('[SocialArchive] YouTube 인터셉터 로드됨 (list=' + listId + ')');
})();
