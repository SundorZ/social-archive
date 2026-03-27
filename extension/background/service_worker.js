import { upsertMany, getStats, getAllContents, updateClassification } from './storage_manager.js';
import { MSG, STORAGE_KEY } from '../shared/constants.js';
import { fetchAllLikedVideos, fetchAllSavedVideos } from './youtube_api.js';
import { classifyOne } from '../shared/ai_classifier.js';

// ─── 메시지 라우터 ────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case MSG.INSTAGRAM_ITEMS:
      handleInstagramItems(message.payload).then(sendResponse);
      break;

    case MSG.YOUTUBE_SYNC_START:
      handleYouTubeSync().then(sendResponse);
      break;

    case MSG.YOUTUBE_SAVED_SYNC_START:
      handleYouTubeSavedSync().then(sendResponse);
      break;

    case MSG.RECLASSIFY_ALL:
      handleReclassifyAll().then(sendResponse);
      break;

    case MSG.GET_STATS:
      getStats().then(sendResponse);
      break;

    default:
      sendResponse({ ok: false, error: `Unknown message type: ${message.type}` });
  }
  return true; // 비동기 응답을 위해 필수
});

// ─── 분류 후 저장 ─────────────────────────────────────────
async function classifyAndSave(items) {
  const { [STORAGE_KEY.CLAUDE_API_KEY]: apiKey } = await chrome.storage.local.get(STORAGE_KEY.CLAUDE_API_KEY);
  const classified = await Promise.all(
    items.map(async (item) => {
      const result = await classifyOne(item, apiKey || null);
      return { ...item, ...result };
    })
  );
  return upsertMany(classified);
}

// ─── Instagram 인터셉트 처리 ──────────────────────────────
async function handleInstagramItems(items) {
  if (!items?.length) return { ok: true, newCount: 0 };

  try {
    const newCount = await classifyAndSave(items);
    console.log(`[SocialArchive] Instagram: ${newCount}개 신규 저장 (총 ${items.length}개 수신)`);

    // popup에 배지 업데이트
    updateBadge();

    return { ok: true, newCount };
  } catch (err) {
    console.error('[SocialArchive] Instagram 저장 실패:', err);
    return { ok: false, error: err.message };
  }
}

// ─── YouTube 동기화 ───────────────────────────────────────
async function handleYouTubeSync() {
  try {
    const items = await fetchAllLikedVideos((count) => {
      // 진행률을 popup으로 전송
      chrome.runtime.sendMessage({ type: MSG.YOUTUBE_SYNC_PROGRESS, count }).catch(() => {});
    });

    const newCount = await classifyAndSave(items);
    updateBadge();

    chrome.runtime.sendMessage({ type: MSG.YOUTUBE_SYNC_DONE, newCount }).catch(() => {});
    return { ok: true, newCount };
  } catch (err) {
    console.error('[SocialArchive] YouTube 동기화 실패:', err);
    return { ok: false, error: err.message };
  }
}

// ─── YouTube Watch Later 동기화 ───────────────────────────
async function handleYouTubeSavedSync() {
  try {
    const items = await fetchAllSavedVideos((count) => {
      chrome.runtime.sendMessage({ type: MSG.YOUTUBE_SAVED_SYNC_PROGRESS, count }).catch(() => {});
    });

    const newCount = await classifyAndSave(items);
    updateBadge();

    chrome.runtime.sendMessage({ type: MSG.YOUTUBE_SAVED_SYNC_DONE, newCount }).catch(() => {});
    return { ok: true, newCount };
  } catch (err) {
    console.error('[SocialArchive] YouTube 저장 동기화 실패:', err);
    return { ok: false, error: err.message };
  }
}

// ─── 기존 아이템 전체 재분류 ──────────────────────────────
async function handleReclassifyAll() {
  try {
    const { [STORAGE_KEY.CLAUDE_API_KEY]: apiKey } = await chrome.storage.local.get(STORAGE_KEY.CLAUDE_API_KEY);
    const all = await getAllContents();
    // 수동 분류 제외, 미분류 또는 '기타'만 있는 항목 재분류
    const unclassified = all.filter(item =>
      item.classifiedBy !== 'manual' &&
      (!item.categories?.length ||
        (item.categories.length === 1 && item.categories[0] === '기타'))
    );

    let done = 0;
    for (const item of unclassified) {
      const result = await classifyOne(item, apiKey || null);
      await updateClassification(item.id, result);
      done++;
      chrome.runtime.sendMessage({
        type: MSG.RECLASSIFY_PROGRESS,
        done,
        total: unclassified.length,
      }).catch(() => {});
    }

    return { ok: true, done };
  } catch (err) {
    console.error('[SocialArchive] 재분류 실패:', err);
    return { ok: false, error: err.message };
  }
}

// ─── 배지 업데이트 ────────────────────────────────────────
async function updateBadge() {
  try {
    const stats = await getStats();
    const text = stats.total > 999 ? '999+' : String(stats.total);
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
  } catch (_) {}
}

// ─── 알람 (주기적 자동 동기화) ───────────────────────────
chrome.alarms.create('auto_sync_youtube', { periodInMinutes: 60 * 24 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'auto_sync_youtube') {
    handleYouTubeSync().catch(console.error);
  }
});

// ─── 설치 시 초기화 ───────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  console.log('[SocialArchive] Extension 설치 완료');
  updateBadge();
});
