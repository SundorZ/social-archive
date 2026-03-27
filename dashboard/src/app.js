// ─── 상태 ─────────────────────────────────────────────────
let allContents = [];
let filtered    = [];

const state = {
  platform: 'all',
  category: 'all',
  sort:     'savedAt',
  search:   '',
};

// ─── DOM refs ─────────────────────────────────────────────
const grid          = document.getElementById('grid');
const searchInput   = document.getElementById('searchInput');
const totalBadge    = document.getElementById('totalBadge');
const categoryFilters = document.getElementById('categoryFilters');

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

  // 플랫폼
  if (state.platform !== 'all') {
    items = items.filter(i => i.platform === state.platform);
  }

  // 카테고리
  if (state.category !== 'all') {
    items = items.filter(i => i.categories?.includes(state.category));
  }

  // 검색
  if (state.search) {
    const q = state.search.toLowerCase();
    items = items.filter(i =>
      (i.title        || '').toLowerCase().includes(q) ||
      (i.description  || '').toLowerCase().includes(q) ||
      (i.authorName   || '').toLowerCase().includes(q)
    );
  }

  // 정렬
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

  const platformIcon = item.platform === 'instagram' ? '📸' : '▶';
  const platformLabel = item.platform === 'instagram' ? 'Instagram' : 'YouTube';

  const tags = (item.categories || [])
    .map(c => `<span class="tag">${escHtml(c)}</span>`)
    .join('');

  const date = item.savedAt ? formatDate(item.savedAt) : '';

  return `
    <div class="card" onclick="window.open('${escHtml(item.url)}','_blank')">
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

// ─── 이벤트 ───────────────────────────────────────────────
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-filter]');
  if (!btn) return;

  const { filter, value } = btn.dataset;

  // 같은 그룹 active 해제
  document.querySelectorAll(`[data-filter="${filter}"]`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  state[filter] = value;
  applyFilters();
});

searchInput.addEventListener('input', (e) => {
  state.search = e.target.value.trim();
  applyFilters();
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
