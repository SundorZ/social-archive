import { openDB, createContent } from '../shared/content_schema.js';
import { STORE_NAME } from '../shared/constants.js';

let _db = null;

async function getDB() {
  if (!_db) _db = await openDB();
  return _db;
}

// ─── 추가 / 업데이트 ──────────────────────────────────────

/**
 * 단일 콘텐츠 저장 (중복이면 무시, 새것이면 추가)
 * @returns {boolean} true = 신규 저장, false = 이미 존재
 */
export async function upsertContent(rawData) {
  const db = await getDB();
  const content = createContent(rawData);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const getReq = store.get(content.id);
    getReq.onsuccess = () => {
      if (getReq.result) {
        // 이미 존재 → 무시
        resolve(false);
      } else {
        const putReq = store.put(content);
        putReq.onsuccess = () => resolve(true);
        putReq.onerror   = () => reject(putReq.error);
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * 배치 저장 (중복 제외 후 신규만 저장)
 * @returns {number} 신규 저장된 개수
 */
export async function upsertMany(rawDataArray) {
  let newCount = 0;
  for (const item of rawDataArray) {
    const isNew = await upsertContent(item);
    if (isNew) newCount++;
  }
  return newCount;
}

// ─── 조회 ─────────────────────────────────────────────────

/** 전체 조회 (최신순) */
export async function getAllContents(includeArchived = false) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      let items = req.result;
      if (!includeArchived) items = items.filter(i => !i.isArchived);
      items.sort((a, b) => b.savedAt - a.savedAt);
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

/** 플랫폼 필터 조회 */
export async function getByPlatform(platform) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const index = tx.objectStore(STORE_NAME).index('platform');
    const req = index.getAll(platform);
    req.onsuccess = () => resolve(req.result.filter(i => !i.isArchived).sort((a, b) => b.savedAt - a.savedAt));
    req.onerror   = () => reject(req.error);
  });
}

/** 카테고리 필터 조회 */
export async function getByCategory(category) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const index = tx.objectStore(STORE_NAME).index('categories');
    const req = index.getAll(category);
    req.onsuccess = () => resolve(req.result.filter(i => !i.isArchived).sort((a, b) => b.savedAt - a.savedAt));
    req.onerror   = () => reject(req.error);
  });
}

/** 단건 조회 */
export async function getById(id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

// ─── 업데이트 ─────────────────────────────────────────────

/** 분류 결과 업데이트 */
export async function updateClassification(id, { categories, classifiedBy, classificationRaw }) {
  const db = await getDB();
  const content = await getById(id);
  if (!content) return false;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const updated = { ...content, categories, classifiedBy, classificationRaw };
    const req = store.put(updated);
    req.onsuccess = () => resolve(true);
    req.onerror   = () => reject(req.error);
  });
}

/** 사용자 메모/태그 업데이트 */
export async function updateUserData(id, { userNote, userTags }) {
  const db = await getDB();
  const content = await getById(id);
  if (!content) return false;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const updated = { ...content, userNote, userTags };
    const req = tx.objectStore(STORE_NAME).put(updated);
    req.onsuccess = () => resolve(true);
    req.onerror   = () => reject(req.error);
  });
}

/** 아카이브 (소프트 삭제) */
export async function archiveContent(id) {
  const db = await getDB();
  const content = await getById(id);
  if (!content) return false;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put({ ...content, isArchived: true });
    req.onsuccess = () => resolve(true);
    req.onerror   = () => reject(req.error);
  });
}

// ─── 통계 ─────────────────────────────────────────────────

export async function getStats() {
  const all = await getAllContents();
  const byPlatform = {};
  const byCategory = {};

  for (const item of all) {
    byPlatform[item.platform] = (byPlatform[item.platform] || 0) + 1;
    for (const cat of item.categories) {
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }
  }

  return { total: all.length, byPlatform, byCategory };
}

// ─── 전체 내보내기 ────────────────────────────────────────
export async function exportAll() {
  return getAllContents(true);
}
