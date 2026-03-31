import { upsertMany, getStats, getAllContents, updateClassification, archiveContent, updateUserData } from './storage_manager.js';
import { MSG, STORAGE_KEY } from '../shared/constants.js';
import { classifyOne } from '../shared/ai_classifier.js';

// ─── 메시지 라우터 ────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case MSG.INSTAGRAM_ITEMS:
      handleInstagramItems(message.payload).then(sendResponse);
      break;

    case MSG.YOUTUBE_LL_ITEMS:
      handleYouTubeLLItems(message.payload).then(sendResponse);
      break;

    case MSG.PINTEREST_ITEMS:
      handlePinterestItems(message.payload).then(sendResponse);
      break;

    case MSG.COLLECT_ALL:
      autoCollectAll().then(() => sendResponse({ ok: true }));
      break;

    case MSG.RECLASSIFY_ALL:
      handleReclassifyAll().then(sendResponse);
      break;

    case MSG.GET_STATS:
      getStats().then(sendResponse);
      break;

    // ── 대시보드 DB 접근 (서비스워커 통과) ──────────────
    case MSG.GET_ALL_CONTENTS:
      getAllContents().then(sendResponse);
      break;

    case MSG.DELETE_CONTENT:
      archiveContent(message.id).then(sendResponse);
      break;

    case MSG.UPDATE_MEMO:
      updateUserData(message.id, { userNote: message.userNote, userTags: [] })
        .then(sendResponse);
      break;

    case MSG.UPDATE_CATEGORIES:
      updateClassification(message.id, {
        categories: message.categories,
        classifiedBy: 'manual',
        classificationRaw: null,
      }).then(sendResponse);
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
    updateBadge();
    return { ok: true, newCount };
  } catch (err) {
    console.error('[SocialArchive] Instagram 저장 실패:', err);
    return { ok: false, error: err.message };
  }
}

// ─── YouTube LL 인터셉트 처리 ─────────────────────────────
async function handleYouTubeLLItems(items) {
  if (!items?.length) return { ok: true, newCount: 0 };

  try {
    const newCount = await classifyAndSave(items);
    console.log(`[SocialArchive] YouTube: ${newCount}개 신규 저장 (총 ${items.length}개 수신)`);
    updateBadge();
    return { ok: true, newCount };
  } catch (err) {
    console.error('[SocialArchive] YouTube 저장 실패:', err);
    return { ok: false, error: err.message };
  }
}

// ─── Pinterest 인터셉트 처리 ──────────────────────────────
async function handlePinterestItems(items) {
  if (!items?.length) return { ok: true, newCount: 0 };

  try {
    const newCount = await classifyAndSave(items);
    console.log(`[SocialArchive] Pinterest: ${newCount}개 신규 저장 (총 ${items.length}개 수신)`);
    updateBadge();
    return { ok: true, newCount };
  } catch (err) {
    console.error('[SocialArchive] Pinterest 저장 실패:', err);
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

// ─── 원클릭 전체 수집 ─────────────────────────────────────
const COLLECT_SITES = [
  { url: 'https://www.instagram.com/k10613/saved/',   label: 'Instagram',      wait: 10000 },
  { url: 'https://www.youtube.com/playlist?list=LL', label: 'YouTube 좋아요', wait: 10000 },
  { url: 'https://www.youtube.com/playlist?list=WL', label: 'YouTube 저장',   wait: 10000 },
  { url: 'https://kr.pinterest.com/psi861010/',       label: 'Pinterest',      wait: 10000 },
];

async function autoCollectAll() {
  chrome.runtime.sendMessage({ type: MSG.COLLECT_PROGRESS, step: 1, total: 1, label: '전체 수집 중' }).catch(() => {});
  // 모든 탭을 동시에 열고 병렬로 대기 후 닫기
  await Promise.all(
    COLLECT_SITES.map(async ({ url, wait }) => {
      const tab = await chrome.tabs.create({ url, active: false });
      await new Promise(r => setTimeout(r, wait));
      chrome.tabs.remove(tab.id).catch(() => {});
    })
  );
  updateBadge();
  chrome.runtime.sendMessage({ type: MSG.COLLECT_DONE }).catch(() => {});
}

// ─── 트레이 앱 폴링 알람 ──────────────────────────────────
const TRAY_URL = 'http://localhost:27192';

// 기존 알람 제거 후 재생성 (30초 간격)
chrome.alarms.clear('tray_poll', () => {
  chrome.alarms.create('tray_poll', { periodInMinutes: 0.5 });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'tray_poll') return;
  try {
    const res = await fetch(`${TRAY_URL}/poll`, { signal: AbortSignal.timeout(3000) });
    const { command } = await res.json();
    if (command === 'collect') {
      await autoCollectAll();
      const stats = await getStats();
      fetch(`${TRAY_URL}/done`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stats),
      }).catch(() => {});
    }
  } catch (_) {} // 트레이 미실행 시 무시
});

// ─── 배지 업데이트 ────────────────────────────────────────
async function updateBadge() {
  try {
    const stats = await getStats();
    const text = stats.total > 999 ? '999+' : String(stats.total);
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
  } catch (_) {}
}

// ─── 설치 시 초기화 ───────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  console.log('[SocialArchive] Extension 설치 완료');
  updateBadge();
});
