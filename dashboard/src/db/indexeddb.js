// Extension과 동일한 DB 이름/버전 사용
const DB_NAME    = 'social_archive_v1';
const DB_VERSION = 1;
const STORE_NAME = 'contents';

let _db = null;

async function openDB() {
  if (_db) return _db;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror   = () => reject(req.error);
    req.onupgradeneeded = () => {/* Extension이 이미 생성 */};
  });
}

async function getAllContents() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result.filter(i => !i.isArchived));
    req.onerror   = () => reject(req.error);
  });
}

// 전역 노출 (app.js에서 사용)
window._db = { getAllContents };
