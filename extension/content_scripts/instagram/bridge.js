// ISOLATED world 브릿지
// MAIN world(interceptor.js)에서 postMessage로 받은 데이터를
// chrome.runtime.sendMessage로 서비스 워커에 전달

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (!event.data?.__socialArchive) return;

  const { type, payload } = event.data;

  try { chrome.runtime.sendMessage({ type, payload }).catch(() => {}); } catch (_) {}
});
