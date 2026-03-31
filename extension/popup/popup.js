import { MSG } from '../shared/constants.js';

const $ = (id) => document.getElementById(id);

// ─── 통계 로드 ────────────────────────────────────────────
function loadStats() {
  chrome.runtime.sendMessage({ type: MSG.GET_STATS }, (stats) => {
    if (!stats) return;

    $('totalCount').textContent = stats.total;
    $('igCount').textContent    = `${stats.byPlatform.instagram || 0}개`;
    $('ytCount').textContent    = `${stats.byPlatform.youtube   || 0}개`;
    $('ptCount').textContent    = `${stats.byPlatform.pinterest || 0}개`;

    $('todayCount').textContent = '-';
  });
}

// ─── 상태 메시지 ──────────────────────────────────────────
function setStatus(msg, type = '') {
  const el = $('status');
  el.textContent = msg;
  el.className = `status ${type}`;
}

// ─── 기존 아이템 재분류 ───────────────────────────────────
$('reclassifyBtn').addEventListener('click', () => {
  $('reclassifyBtn').disabled = true;
  setStatus('분류 중...', 'syncing');

  chrome.runtime.sendMessage({ type: MSG.RECLASSIFY_ALL }, (result) => {
    $('reclassifyBtn').disabled = false;
    if (result?.ok) {
      setStatus(`완료: ${result.done}개 분류됨`, 'success');
    } else {
      setStatus(`오류: ${result?.error || '알 수 없는 오류'}`, 'error');
    }
  });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === MSG.RECLASSIFY_PROGRESS) {
    setStatus(`분류 중... ${msg.done}/${msg.total}개`, 'syncing');
  }
});

// ─── 대시보드 열기 ────────────────────────────────────────
$('dashboardBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/index.html') });
});

// ─── 설정 페이지 ──────────────────────────────────────────
$('settingsBtn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// ─── 초기화 ───────────────────────────────────────────────
loadStats();
