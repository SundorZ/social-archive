import { STORAGE_KEY } from '../shared/constants.js';

const $ = (id) => document.getElementById(id);

// ─── 저장된 값 불러오기 ───────────────────────────────────
chrome.storage.local.get(
  [STORAGE_KEY.CLAUDE_API_KEY, STORAGE_KEY.YOUTUBE_CLIENT_ID],
  (result) => {
    if (result[STORAGE_KEY.CLAUDE_API_KEY]) {
      $('claudeApiKey').value = result[STORAGE_KEY.CLAUDE_API_KEY];
    }
    if (result[STORAGE_KEY.YOUTUBE_CLIENT_ID]) {
      $('youtubeClientId').value = result[STORAGE_KEY.YOUTUBE_CLIENT_ID];
    }
  }
);

// ─── 저장 ─────────────────────────────────────────────────
$('saveBtn').addEventListener('click', () => {
  const claudeApiKey    = $('claudeApiKey').value.trim();
  const youtubeClientId = $('youtubeClientId').value.trim();

  chrome.storage.local.set({
    [STORAGE_KEY.CLAUDE_API_KEY]:    claudeApiKey,
    [STORAGE_KEY.YOUTUBE_CLIENT_ID]: youtubeClientId,
  }, () => {
    const toast = $('toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  });
});
