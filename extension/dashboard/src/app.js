// ─── 상태 ─────────────────────────────────────────────────
let allContents   = [];
let filtered      = [];
let currentItem   = null;
let selectedCats  = []; // 모달 카테고리 선택 상태

const ALL_CATEGORIES = ['육아', '요리', '여행', 'IT', 'AI', '운동', '인테리어', '패션', '뷰티', '금융', '자기계발', '반려동물', '기타'];

const state = {
  platform: 'all',
  source:   'all',
  category: 'all',
  sort:     'savedAt',
  search:   '',
};

// ─── DOM refs ─────────────────────────────────────────────
const grid            = document.getElementById('grid');
const searchInput     = document.getElementById('searchInput');
const totalBadge      = document.getElementById('totalBadge');
const categoryFilters = document.getElementById('categoryFilters');
const detailModal     = document.getElementById('detailModal');

// ─── 초기화 ───────────────────────────────────────────────
async function init() {
  allContents = await window._db.getAllContents();
  buildCategoryFilters();
  applyFilters();
  updateCounts();
}

// ─── 필터 적용 ────────────────────────────────────────────
function applyFilters() {
  let items = [...allContents];

  if (state.platform !== 'all') {
    items = items.filter(i => i.platform === state.platform);
  }
  if (state.source !== 'all') {
    items = items.filter(i => i.source === state.source);
  }
  if (state.category !== 'all') {
    items = items.filter(i => i.categories?.includes(state.category));
  }
  if (state.search) {
    const q = state.search.toLowerCase();
    items = items.filter(i =>
      (i.title        || '').toLowerCase().includes(q) ||
      (i.description  || '').toLowerCase().includes(q) ||
      (i.authorName   || '').toLowerCase().includes(q)
    );
  }

  items.sort((a, b) => (b[state.sort] || 0) - (a[state.sort] || 0));
  filtered = items;
  renderGrid();
}

// ─── 카운트 업데이트 ──────────────────────────────────────
function updateCounts() {
  document.getElementById('cnt-all').textContent       = allContents.length;
  document.getElementById('cnt-instagram').textContent = allContents.filter(i => i.platform === 'instagram').length;
  document.getElementById('cnt-youtube').textContent   = allContents.filter(i => i.platform === 'youtube').length;
  totalBadge.textContent = `${filtered.length}개`;
}

// ─── 카테고리 필터 버튼 생성 ─────────────────────────────
function buildCategoryFilters() {
  categoryFilters.innerHTML = '';
  const cats = new Set();
  allContents.forEach(i => i.categories?.forEach(c => cats.add(c)));

  const allBtn = makeFilterBtn('all', '전체', 'category');
  allBtn.classList.add('active');
  categoryFilters.appendChild(allBtn);

  for (const cat of cats) {
    categoryFilters.appendChild(makeFilterBtn(cat, cat, 'category'));
  }
}

function makeFilterBtn(value, label, filterType) {
  const btn = document.createElement('button');
  btn.className = 'filter-btn';
  btn.dataset.filter = filterType;
  btn.dataset.value  = value;
  btn.textContent    = label;
  return btn;
}

// ─── 그리드 렌더링 ────────────────────────────────────────
function renderGrid() {
  totalBadge.textContent = `${filtered.length}개`;

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty" style="grid-column:1/-1">
        <div class="empty-icon">📭</div>
        <div class="empty-title">콘텐츠가 없습니다</div>
        <div class="empty-desc">Instagram을 방문하거나 YouTube 동기화를 실행해주세요.</div>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(renderCard).join('');
}

function renderCard(item) {
  const thumb = item.thumbnailUrl
    ? `<img class="card-thumb" src="${escHtml(item.thumbnailUrl)}" alt="" loading="lazy" onerror="this.style.display='none'">`
    : `<div class="card-thumb-placeholder">${item.platform === 'youtube' ? '▶' : '📷'}</div>`;

  const platformIcon  = item.platform === 'instagram' ? '📸' : '▶';
  const platformLabel = item.platform === 'instagram' ? 'Instagram' : 'YouTube';
  const tags = (item.categories || []).map(c => `<span class="tag">${escHtml(c)}</span>`).join('');
  const date = item.savedAt ? formatDate(item.savedAt) : '';

  return `
    <div class="card" data-id="${escHtml(item.id)}">
      <button class="card-delete" data-delete-id="${escHtml(item.id)}" title="삭제">×</button>
      ${thumb}
      <div class="card-body">
        <div class="card-platform">
          <span class="platform-icon">${platformIcon}</span>
          ${platformLabel}
        </div>
        <div class="card-title">${escHtml(item.title || '제목 없음')}</div>
        <div class="card-tags">${tags}</div>
        <div class="card-footer">
          <span class="card-date">${date}</span>
          <span class="card-author">@${escHtml(item.authorName || '')}</span>
        </div>
      </div>
    </div>`;
}

// ─── 상세 모달 ────────────────────────────────────────────
function openModal(item) {
  currentItem = item;

  // 썸네일
  const thumbWrap = document.getElementById('modalThumbWrap');
  thumbWrap.innerHTML = item.thumbnailUrl
    ? `<img src="${escHtml(item.thumbnailUrl)}" alt="" onerror="this.parentNode.innerHTML='<div class=modal-thumb-placeholder>${item.platform === 'youtube' ? '▶' : '📷'}</div>'">`
    : `<div class="modal-thumb-placeholder">${item.platform === 'youtube' ? '▶' : '📷'}</div>`;

  // 메타
  const platformLabel = item.platform === 'instagram' ? '📸 Instagram' : '▶ YouTube';
  const sourceBadge   = item.source === 'liked'
    ? `<span class="modal-source-badge badge-liked">좋아요</span>`
    : `<span class="modal-source-badge badge-saved">저장됨</span>`;
  document.getElementById('modalMeta').innerHTML = `${platformLabel} ${sourceBadge}`;

  document.getElementById('modalTitle').textContent  = item.title || '제목 없음';
  document.getElementById('modalAuthor').textContent = item.authorName ? `@${item.authorName}` : '';
  document.getElementById('modalDesc').textContent   = item.description || '';

  // 통계
  const stats = [];
  if (item.likeCount)    stats.push(`♥ ${item.likeCount.toLocaleString()}`);
  if (item.viewCount)    stats.push(`▶ ${item.viewCount.toLocaleString()}`);
  if (item.commentCount) stats.push(`💬 ${item.commentCount.toLocaleString()}`);
  document.getElementById('modalStats').innerHTML = stats.map(s => `<span class="modal-stat">${s}</span>`).join('');

  // 카테고리 칩 (편집 가능)
  selectedCats = [...(item.categories || [])];
  renderCatChips();

  // 메모
  document.getElementById('modalNote').value = item.userNote || '';

  // URL 버튼
  document.getElementById('modalUrlBtn').href = item.url || '#';

  detailModal.classList.remove('hidden');
}

function renderCatChips() {
  // ALL_CATEGORIES + 아이템에만 있는 커스텀 카테고리 합산
  const extra = selectedCats.filter(c => !ALL_CATEGORIES.includes(c));
  const all   = [...ALL_CATEGORIES, ...extra];

  document.getElementById('catChips').innerHTML = all.map(cat => {
    const on = selectedCats.includes(cat);
    return `<button class="cat-chip${on ? ' selected' : ''}" data-cat="${escHtml(cat)}">${escHtml(cat)}</button>`;
  }).join('');
}

function closeModal() {
  detailModal.classList.add('hidden');
  currentItem = null;
  selectedCats = [];
}

// ─── 이벤트 ───────────────────────────────────────────────
document.addEventListener('click', (e) => {
  // 삭제 버튼
  const delBtn = e.target.closest('.card-delete');
  if (delBtn) {
    const id = delBtn.dataset.deleteId;
    window._db.deleteContent(id).then(() => {
      allContents = allContents.filter(i => i.id !== id);
      applyFilters();
      updateCounts();
    });
    return;
  }

  // 카드 클릭 → 모달 열기
  const card = e.target.closest('.card[data-id]');
  if (card) {
    const item = allContents.find(i => i.id === card.dataset.id);
    if (item) openModal(item);
    return;
  }

  // 모달 바깥 클릭 → 닫기
  if (e.target === detailModal) { closeModal(); return; }

  // 모달 닫기 버튼
  if (e.target.id === 'modalClose') { closeModal(); return; }

  // 카테고리 칩 토글
  const chip = e.target.closest('.cat-chip');
  if (chip && currentItem) {
    const cat = chip.dataset.cat;
    if (selectedCats.includes(cat)) {
      selectedCats = selectedCats.filter(c => c !== cat);
    } else {
      selectedCats.push(cat);
    }
    renderCatChips();
    return;
  }

  // 카테고리 저장
  if (e.target.id === 'saveCatBtn' && currentItem) {
    window._db.updateCategories(currentItem.id, selectedCats).then(() => {
      const idx = allContents.findIndex(i => i.id === currentItem.id);
      if (idx !== -1) allContents[idx] = { ...allContents[idx], categories: selectedCats };
      currentItem = { ...currentItem, categories: selectedCats };
      buildCategoryFilters(); // 사이드바 카테고리 목록 갱신
      e.target.textContent = '저장됨 ✓';
      setTimeout(() => { e.target.textContent = '카테고리 저장'; }, 1500);
    });
    return;
  }

  // 메모 저장
  if (e.target.id === 'saveNoteBtn' && currentItem) {
    const note = document.getElementById('modalNote').value;
    window._db.updateUserMemo(currentItem.id, note).then(() => {
      const idx = allContents.findIndex(i => i.id === currentItem.id);
      if (idx !== -1) allContents[idx] = { ...allContents[idx], userNote: note };
      currentItem = { ...currentItem, userNote: note };
      e.target.textContent = '저장됨 ✓';
      setTimeout(() => { e.target.textContent = '메모 저장'; }, 1500);
    });
    return;
  }

  // 그룹 타이틀 클릭 → 토글
  const groupTitle = e.target.closest('.filter-group-title');
  if (groupTitle) {
    groupTitle.closest('.filter-group').classList.toggle('collapsed');
    return;
  }

  // 필터 버튼
  const btn = e.target.closest('[data-filter]');
  if (!btn) return;

  const { filter, value } = btn.dataset;
  document.querySelectorAll(`[data-filter="${filter}"]`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state[filter] = value;
  applyFilters();
});

// ESC 키로 모달 닫기
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

searchInput.addEventListener('input', (e) => {
  state.search = e.target.value.trim();
  applyFilters();
});

// ─── 새로고침 ─────────────────────────────────────────────
document.getElementById('refreshBtn').addEventListener('click', async () => {
  allContents = await window._db.getAllContents();
  buildCategoryFilters();
  applyFilters();
  updateCounts();
});

// ─── JSON 내보내기 ────────────────────────────────────────
document.getElementById('exportBtn').addEventListener('click', async () => {
  const items = await window._db.getAllContents();
  const blob  = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href     = url;
  a.download = `social-archive-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// ─── 유틸 ─────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
}

// ─── 시작 ─────────────────────────────────────────────────
init();
