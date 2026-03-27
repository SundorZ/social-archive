import { DB_NAME, DB_VERSION, STORE_NAME } from './constants.js';

/**
 * Content 스키마 v1
 *
 * id 형식: "{platform}_{originalId}"
 * 예: "instagram_3456789012" / "youtube_dQw4w9WgXcQ"
 */
export function createContent(data) {
  const now = Date.now();
  return {
    // ── 식별자
    id: `${data.platform}_${data.originalId}`,
    originalId: data.originalId,
    platform: data.platform,          // 'instagram' | 'youtube'
    contentType: data.contentType,    // 'post' | 'reel' | 'video' | 'short'

    // ── 수집 메타
    collectedAt: now,
    savedAt: data.savedAt || now,
    source: data.source,              // 'liked' | 'saved'

    // ── 원본 콘텐츠
    url: data.url || '',
    thumbnailUrl: data.thumbnailUrl || '',
    title: data.title || '',
    description: data.description || '',
    authorName: data.authorName || '',
    authorId: data.authorId || '',
    authorProfileUrl: data.authorProfileUrl || '',

    // ── 분류
    categories: data.categories || [],
    classifiedBy: data.classifiedBy || null,
    classificationRaw: data.classificationRaw || null,

    // ── 통계 (수집 시점 스냅샷)
    likeCount: data.likeCount || 0,
    viewCount: data.viewCount || 0,
    commentCount: data.commentCount || 0,

    // ── 사용자 메모
    userNote: '',
    userTags: [],
    isArchived: false,

    // ── 원본 보존
    rawData: data.rawData || null,
  };
}

// ─── IndexedDB 초기화 ─────────────────────────────────────
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (db.objectStoreNames.contains(STORE_NAME)) return;

      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

      // 단일 인덱스
      store.createIndex('platform',    'platform',    { unique: false });
      store.createIndex('source',      'source',      { unique: false });
      store.createIndex('savedAt',     'savedAt',     { unique: false });
      store.createIndex('collectedAt', 'collectedAt', { unique: false });
      store.createIndex('authorId',    'authorId',    { unique: false });
      store.createIndex('isArchived',  'isArchived',  { unique: false });

      // 다중 값 인덱스 (카테고리 배열 검색용)
      store.createIndex('categories',  'categories',  { unique: false, multiEntry: true });

      // 복합 인덱스 (플랫폼 + 저장일 — 가장 빈번한 쿼리)
      store.createIndex('platform_savedAt', ['platform', 'savedAt'], { unique: false });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror  = () => reject(request.error);
  });
}
