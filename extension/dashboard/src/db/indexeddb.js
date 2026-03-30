// Chrome MV3에서 서비스워커와 익스텐션 페이지의 IndexedDB가 격리될 수 있으므로
// 모든 DB 연산은 서비스워커 메시지를 통해 수행합니다

function sendMsg(payload) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage(payload, resolve);
  });
}

async function getAllContents() {
  return sendMsg({ type: 'GET_ALL_CONTENTS' });
}

async function deleteContent(id) {
  return sendMsg({ type: 'DELETE_CONTENT', id });
}

async function updateUserMemo(id, note) {
  return sendMsg({ type: 'UPDATE_MEMO', id, userNote: note });
}

async function updateCategories(id, categories) {
  return sendMsg({ type: 'UPDATE_CATEGORIES', id, categories });
}

// 전역 노출 (app.js에서 사용)
window._db = { getAllContents, deleteContent, updateUserMemo, updateCategories };
