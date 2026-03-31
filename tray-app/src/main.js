'use strict';

const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const { exec } = require('child_process');
const SysTray = require('systray2').default;

// ─── 상태 ─────────────────────────────────────────────────
let pendingCommand = null; // 'collect' | null
let stats = { total: 0, lastCollect: null };
let isCollecting = false;

// ─── 아이콘 (base64) ──────────────────────────────────────
const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');
const iconBase64 = fs.existsSync(iconPath)
  ? fs.readFileSync(iconPath).toString('base64')
  : '';

// ─── 트레이 메뉴 ──────────────────────────────────────────
const MENU_IDX = { COLLECT: 0, DASHBOARD: 2, QUIT: 4 };

function buildMenu() {
  const collectLabel = isCollecting ? '수집 중...' : '지금 수집';
  const statsLabel   = stats.total
    ? `전체 ${stats.total}개 • ${formatLastCollect()}`
    : '아직 수집 없음';

  return {
    icon:    iconBase64,
    title:   'Social Archive',
    tooltip: `Social Archive — ${statsLabel}`,
    items: [
      { title: collectLabel, tooltip: '모든 사이트 수집 시작', checked: false, enabled: !isCollecting },
      SysTray.separator,
      { title: '대시보드 열기', tooltip: '', checked: false, enabled: true },
      SysTray.separator,
      { title: '종료', tooltip: '', checked: false, enabled: true },
    ],
  };
}

function formatLastCollect() {
  if (!stats.lastCollect) return '수집 없음';
  const mins = Math.floor((Date.now() - stats.lastCollect) / 60000);
  if (mins < 1)   return '방금 전';
  if (mins < 60)  return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

// ─── SysTray 인스턴스 ─────────────────────────────────────
const systray = new SysTray({ menu: buildMenu(), debug: false, copyDir: true });

function updateTray() {
  systray.sendAction({ type: 'update-menu', menu: buildMenu() });
}

systray.onClick(action => {
  if (action.seq_id === MENU_IDX.COLLECT && !isCollecting) {
    pendingCommand = 'collect';
    isCollecting = true;
    updateTray();
  }

  if (action.seq_id === MENU_IDX.DASHBOARD) {
    const dashUrl = 'chrome-extension://*/dashboard/index.html';
    // Chrome이 없으면 기본 브라우저로 열림 (fallback)
    exec(`start chrome "${dashUrl}"`, err => {
      if (err) exec(`start ${dashUrl}`);
    });
  }

  if (action.seq_id === MENU_IDX.QUIT) {
    systray.kill();
    server.close();
    process.exit(0);
  }
});

// ─── HTTP 서버 (Extension 폴링용) ─────────────────────────
const PORT = 27192;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /poll — Extension이 2분마다 폴링
  if (req.method === 'GET' && req.url === '/poll') {
    const command = pendingCommand;
    pendingCommand = null; // 소비
    res.writeHead(200);
    res.end(JSON.stringify({ command, stats }));
    return;
  }

  // POST /done — 수집 완료 통보
  if (req.method === 'POST' && req.url === '/done') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        stats.total       = data.total ?? stats.total;
        stats.lastCollect = Date.now();
        isCollecting = false;
        updateTray();
      } catch (_) {}
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[SocialArchive Tray] HTTP 서버 실행 중: http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[SocialArchive Tray] 포트 ${PORT} 이미 사용 중 — 트레이만 실행`);
  }
});

console.log('[SocialArchive Tray] 시작됨');
