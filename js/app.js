'use strict';

const PENCIL_SVG = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75z"/></svg>';
const TRASH_SVG = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm3-3h6l1 2h4v2H2V6h4z"/></svg>';
const PIN_SVG = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/></svg>';
const ADD_BOOKMARK_SVG = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2zm-2 6h-2v2h-2v2h2v2h2v-2h2v-2h-2V9z"/></svg>';
const ADD_FOLDER_SVG = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2zm5 9h-2v2h-2v2h2v2h2v-2h2v-2h-2v-2z"/></svg>';

const DEFAULT_ENGINES = [
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=%s' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=%s' },
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=%s' },
];

const state = {
  tree: null,
  editMode: false,
  query: '',
  modal: null, // { mode, type, id, parentId, index }
  usage: {},
  nodeById: {},
  wallpaper: null,
  engines: DEFAULT_ENGINES.slice(),
  engineId: 'baidu',
  maskDepth: 0,
  layout: 'classic',
  pinned: [],
  showSmart: false, // 是否显示「常用书签」「最近访问」
  showDock: true,   // 是否显示底部 Dock 栏
  showFreqVisited: true, // 底部 Dock 栏是否显示「经常访问」（按访问频次自动生成）
  showAboutBtn: true, // 是否显示左下角「关于 / 打赏」按钮
  zenMode: false,   // 清爽模式（右上角叶子切换，不持久化）
  autoHideSidebar: false, // 左侧书签栏自动隐藏（鼠标移入滑出）
  noIconStyle: 'globe', // 未获取到图标的书签：'globe' 显示默认地球 | 'letter' 显示标题首字
  faviconCache: {}, // 已获取图标缓存：书签URL -> 图标URL（持久化，重渲染/新标签页均命中）
  linkStatus: {},  // 链接检测结果：书签ID -> 'ok' | 'dead'
  searchResults: [], // 当前搜索结果（书签数组），供键盘方向键导航
  searchSel: -1,     // 键盘选中的搜索结果下标，-1 表示未选中
  collapsedFolders: new Set(), // 已折叠的文件夹ID（持久化，刷新/重开后保持折叠状态）
  _menu: null,
};

let dragData = null;

const els = {
  content: document.getElementById('content'),
  sidebar: document.getElementById('sidebar'),
  dock: document.getElementById('dock'),
  search: document.getElementById('search'),
  searchClear: document.getElementById('search-clear'),
  engineBtn: document.getElementById('engine-btn'),
  engineIco: document.getElementById('engine-ico'),
  enginePanel: document.getElementById('engine-panel'),
  engineGrid: document.getElementById('engine-grid'),
  settingsToggle: document.getElementById('settings-toggle'),
  aboutToggle: document.getElementById('about-toggle'),
  about: document.getElementById('about'),
  aboutClose: document.getElementById('about-close'),
  qrZoom: document.getElementById('qr-zoom'),
  qrZoomImg: document.getElementById('qr-zoom-img'),
  zenToggle: document.getElementById('zen-toggle'),
  zen: document.getElementById('zen'),
  zenSearch: document.getElementById('zen-search'),
  zenGrid: document.getElementById('zen-grid'),
  settings: document.getElementById('settings'),
  engineList: document.getElementById('engine-list'),
  eName: document.getElementById('e-name'),
  eUrl: document.getElementById('e-url'),
  eAdd: document.getElementById('e-add'),
  sClose: document.getElementById('s-close'),
  sWpUpload: document.getElementById('s-wp-upload'),
  sWpClear: document.getElementById('s-wp-clear'),
  sMask: document.getElementById('s-mask'),
  sMaskVal: document.getElementById('s-mask-val'),
  sLayout: document.getElementById('s-layout'),
  sTheme: document.getElementById('s-theme'),
  sShowSmart: document.getElementById('s-show-smart'),
  sShowDock: document.getElementById('s-show-dock'),
  sShowFreq: document.getElementById('s-show-freq'),
  sShowAbout: document.getElementById('s-show-about'),
  sAutoHide: document.getElementById('s-auto-hide'),
  sNoIcon: document.getElementById('s-noicon'),
  sPrefetch: document.getElementById('s-prefetch'),
  sCheck: document.getElementById('s-check'),
  linkReport: document.getElementById('link-report'),
  linkReportTitle: document.getElementById('link-report-title'),
  linkReportBody: document.getElementById('link-report-body'),
  lrClose: document.getElementById('lr-close'),
  backTop: document.getElementById('back-top'),
  editToggle: document.getElementById('edit-toggle'),
  wpFile: document.getElementById('wp-file'),
  time: document.getElementById('time'),
  date: document.getElementById('date'),
  modal: document.getElementById('modal'),
  modalTitle: document.getElementById('modal-title'),
  mTitle: document.getElementById('m-title'),
  mUrl: document.getElementById('m-url'),
  mUrlField: document.getElementById('m-url-field'),
  mCancel: document.getElementById('m-cancel'),
  mSave: document.getElementById('m-save'),
  toast: document.getElementById('toast'),
  bg: document.querySelector('.bg'),
  wallOverlay: document.getElementById('wall-overlay'),
};

/* ---------- small helpers ---------- */
function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c == null) return;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
}

function colorFor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return `hsl(${h}, 62%, 52%)`;
}

/* 仅允许 http(s) 链接作为可点击/可打开目标，避免 javascript: 等危险 scheme */
function isWebUrl(u) { return /^https?:\/\//i.test(u || ''); }

/* 取站点根地址，用于查 favicon（避免 %s 占位符污染） */
function homeUrl(u) {
  try { return new URL(u).origin + '/'; } catch (_) { return u; }
}

/* favicon 降级链：持久缓存 → Chrome 原生 _favicon → 国内镜像 → 首字母 */
function faviconNode(url, title) {
  const letter = (title || url || '?').trim().charAt(0).toUpperCase() || '?';
  const fallback = el('div', { class: 'fav-letter', text: letter, style: `background:${colorFor(title || url || 'x')}` });
  if (!url || !/^https?:/i.test(url)) return fallback;
  let host = '';
  try { host = new URL(url).hostname; } catch (_) { return fallback; }

  const faviconLocalURL = chrome.runtime.getURL('/_favicon/?pageUrl=' + encodeURIComponent(url) + '&size=64');
  const chain = [];
  if (state.faviconCache[url]) chain.push(state.faviconCache[url]);
  chain.push(faviconLocalURL);
  chain.push('https://api.iowen.cn/favicon/' + host + '.png');

  const img = el('img', { class: 'fav', src: chain[0], alt: '', loading: 'lazy' });
  let stage = 0;
  let checking = false;
  const advance = () => {
    stage++;
    if (stage < chain.length) img.src = chain[stage];
    else img.replaceWith(fallback);
  };
  img.addEventListener('error', advance);
  /* load 后的有效性校验：
     1) _favicon 对未获取图标的站点返回默认地球（加载成功但无意义）
     2) 镜像服务对无真图标站点返回纯色占位图
     两者都应继续走降级链，避免显示绿/黄等色块 */
  img.addEventListener('load', () => {
    if (checking) return;
    const isLocal = chain[stage] === faviconLocalURL;
    const wantGlobeCheck = isLocal && state.noIconStyle === 'letter';
    if (!wantGlobeCheck && !isLocal) {
      // 镜像阶段：检测纯色占位图
      checking = true;
      isBlankImage(img).then((blank) => {
        checking = false;
        if (blank) advance();
      });
      return;
    }
    if (!wantGlobeCheck) return;
    checking = true;
    if (globeChecked[url] === true) { checking = false; advance(); return; }
    if (globeChecked[url] === false) { checking = false; return; }
    isDefaultGlobe(img).then((yes) => {
      checking = false;
      globeChecked[url] = yes;
      if (yes) advance();
    });
  });
  return img;
}

const globeChecked = {}; // url -> true(默认地球)/false(真图标)，仅内存缓存，避免重复 canvas 比对

/* 纯色占位图检测：采样若干像素，若颜色几乎一致则视为「无真图标」的占位图 */
function isBlankImage(imgEl) {
  return new Promise((resolve) => {
    try {
      const w = imgEl.naturalWidth, h = imgEl.naturalHeight;
      if (!w || !h) return resolve(false);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(imgEl, 0, 0, w, h);
      const pts = [[2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3], [w >> 1, h >> 1], [w >> 2, h >> 1], [(3 * w) >> 2, h >> 1], [w >> 1, h >> 2]];
      const seen = [];
      for (const [x, y] of pts) {
        const d = ctx.getImageData(Math.max(0, Math.min(w - 1, x)), Math.max(0, Math.min(h - 1, y)), 1, 1).data;
        seen.push([d[0], d[1], d[2], d[3]]);
      }
      // 与第一个采样点比较，允许轻微抗锯齿差异；全部像素 alpha 过低也算无效
      const [r0, g0, b0, a0] = seen[0];
      if (a0 < 8) return resolve(true);
      const same = seen.every(([r, g, b]) => Math.abs(r - r0) < 10 && Math.abs(g - g0) < 10 && Math.abs(b - b0) < 10);
      resolve(same);
    } catch (_) { resolve(false); }
  });
}

/* 默认地球检测：用一个必然无图标的 URL 从 _favicon 取参考图，canvas 逐像素比对
   （新标签页与 _favicon 同源，canvas 可安全读取像素） */
let globeData = null; // null=未初始化；''=初始化失败（此时不做检测，维持地球显示）
function getGlobeData() {
  if (globeData !== null) return Promise.resolve(globeData);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth || 64;
        c.height = img.naturalHeight || 64;
        c.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0, c.width, c.height);
        globeData = c.toDataURL('image/png');
      } catch (_) { globeData = ''; }
      resolve(globeData);
    };
    img.onerror = () => { globeData = ''; resolve(''); };
    img.src = chrome.runtime.getURL('/_favicon/?pageUrl=' + encodeURIComponent('https://favicon-detect.invalid/') + '&size=64');
  });
}
function isDefaultGlobe(imgEl) {
  return getGlobeData().then((g) => {
    if (!g) return false;
    try {
      const c = document.createElement('canvas');
      c.width = imgEl.naturalWidth || 64;
      c.height = imgEl.naturalHeight || 64;
      c.getContext('2d', { willReadFrequently: true }).drawImage(imgEl, 0, 0, c.width, c.height);
      return c.toDataURL('image/png') === g;
    } catch (_) { return false; }
  });
}

/* ---------- 搜索引擎图标：优先加载真图标，失败/占位/默认地球则降级为名称文字徽标 ---------- */
const engineIconCache = {}; // homeUrl -> 真图标 src | ''（空串 = 已确认无真图标，本次会话不再重试）
function loadEngineFavicon(url) {
  return new Promise((resolve) => {
    if (url in engineIconCache) { resolve(engineIconCache[url] || null); return; }
    const cands = [];
    try { cands.push('https://api.iowen.cn/favicon/' + new URL(url).hostname + '.png'); } catch (_) {}
    try { cands.push(chrome.runtime.getURL('/_favicon/?pageUrl=' + encodeURIComponent(url) + '&size=64')); } catch (_) {}
    let i = 0;
    const next = () => {
      if (i >= cands.length) { engineIconCache[url] = ''; resolve(null); return; }
      const src = cands[i++];
      const img = new Image();
      img.onload = () => {
        isBlankImage(img).then((blank) => {
          if (blank) { next(); return; }
          // _favicon 候选需排除默认地球（未访问站点返回地球占位，对引擎无意义，且不受 noIconStyle 设置影响）
          if (src.indexOf('_favicon') === -1) { engineIconCache[url] = src; resolve(src); return; }
          isDefaultGlobe(img).then((g) => {
            if (g) { next(); return; }
            engineIconCache[url] = src; resolve(src);
          });
        });
      };
      img.onerror = () => next();
      img.src = src;
    };
    next();
  });
}

function engineIconNode(eng) {
  const url = homeUrl(eng.url);
  const name = (eng.name || '?').trim() || '?';
  // 先渲染名称文字徽标（与书签首字磁贴同款配色），图标加载成功后再替换
  const badge = el('span', {
    class: 'engine-badge' + (name.length > 4 ? ' long' : ''),
    text: name,
    style: `background:${colorFor(name)}`,
  });
  loadEngineFavicon(url).then((src) => {
    if (!src || !badge.parentNode) return; // 无真图标或徽标已被重渲染移除
    badge.textContent = '';
    badge.classList.add('has-img');
    const img = new Image();
    img.src = src;
    img.alt = name;
    badge.appendChild(img);
  });
  return badge;
}

let toastTimer = null;
function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.add('hidden'), 2200);
}

/* ---------- data ---------- */
function buildIndex(nodes) {
  for (const n of nodes || []) {
    if (n.id) state.nodeById[n.id] = n;
    if (n.children) buildIndex(n.children);
  }
}

function childrenOf(parentId) {
  const n = state.nodeById[parentId];
  return n ? (n.children || []) : [];
}

async function loadBookmarks() {
  state.tree = await chrome.bookmarks.getTree();
  buildIndex(state.tree[0].children || []);
  render();
  if (state.zenMode) setZenMode(true); // 刷新后若上次在清爽模式，自动恢复
}

function allBookmarks(nodes, out = []) {
  for (const n of nodes || []) {
    if (n.url) out.push(n);
    if (n.children) allBookmarks(n.children, out);
  }
  return out;
}

/* ---------- 拼音首字母搜索（零依赖，数据来自 pinyin-initials.js） ---------- */
let _pinyinMap = null; // 懒构建：码点 -> 首字母
function pinyinInitialOf(ch) {
  const code = ch.charCodeAt(0);
  if (_pinyinMap === null) {
    _pinyinMap = new Map();
    const src = (typeof window !== 'undefined' && window.BD_PINYIN) || {};
    for (const L in src) {
      const s = src[L] || '';
      for (let i = 0; i < s.length; i++) _pinyinMap.set(s.charCodeAt(i), L);
    }
  }
  return _pinyinMap.get(code) || '';
}

// 将标题中的汉字转换为拼音首字母串，例如「智联招聘」-> "ZLZP"，英文/符号忽略
function titlePinyinInitials(title) {
  const t = title || '';
  let out = '';
  for (const ch of t) out += pinyinInitialOf(ch);
  return out;
}

/* ---------- settings persistence ---------- */
let collapseSaveTimer = null;
function setFolderCollapsed(id, collapsed) {
  if (collapsed) state.collapsedFolders.add(id);
  else state.collapsedFolders.delete(id);
  clearTimeout(collapseSaveTimer);
  collapseSaveTimer = setTimeout(
    () => chrome.storage.local.set({ collapsedFolders: [...state.collapsedFolders] }),
    300
  );
}

function saveSettings() {
  chrome.storage.local.set({
    engines: state.engines,
    engineId: state.engineId,
    maskDepth: state.maskDepth,
    layout: state.layout,
    pinned: state.pinned,
    showSmart: state.showSmart,
    showDock: state.showDock,
    showFreqVisited: state.showFreqVisited,
    showAboutBtn: state.showAboutBtn,
    zenMode: state.zenMode,
    autoHideSidebar: state.autoHideSidebar,
    noIconStyle: state.noIconStyle,
    theme: document.body.classList.contains('dark') ? 'dark' : 'light',
  });
}

/* ---------- rendering ---------- */
function render() {
  els.content.innerHTML = '';
  if (!state.tree) return;
  const roots = state.tree[0].children || [];

  els.dock.style.display = state.showDock ? '' : 'none';
  if (els.aboutToggle) els.aboutToggle.style.display = state.showAboutBtn ? '' : 'none';

  if (state.query.trim()) {
    // 搜索时仍渲染侧栏、保留 has-sidebar 布局，内容区左偏移不变 -> 书签位置不跳动
    renderSidebar(roots);
    renderSearch(roots);
  } else {
    renderSidebar(roots);
    if (state.showSmart) renderSmart();
    for (const root of roots) els.content.appendChild(renderSection(root));
  }
  renderDock();
}

function renderSearch(roots) {
  const q = state.query.trim().toLowerCase();
  const qu = state.query.trim().toUpperCase();
  const matches = allBookmarks(roots).filter((b) => {
    const title = (b.title || '').toLowerCase();
    const url = (b.url || '').toLowerCase();
    if (title.includes(q) || url.includes(q)) return true;
    // 拼音首字母匹配：如「智联招聘」-> ZLZP，输入 "ZL" 即可命中
    if (qu && titlePinyinInitials(b.title || '').includes(qu)) return true;
    return false;
  });
  state.searchResults = matches;
  state.searchSel = -1;
  const sec = el('div', { class: 'section' });
  sec.appendChild(
    el('div', { class: 'section-head' }, [
      el('span', { class: 'section-title', text: `搜索 “${state.query.trim()}”` }),
      el('span', { class: 'section-count', text: `${matches.length} 个结果` }),
    ])
  );
  if (!matches.length) {
    sec.appendChild(el('div', { class: 'empty', text: '没有匹配的书签' }));
  } else {
    const grid = el('div', { class: 'grid' });
    matches.forEach((b) => grid.appendChild(renderTile(b)));
    sec.appendChild(grid);
  }
  els.content.appendChild(sec);
}

/* ---------- left sidebar: bookmark directory ---------- */
function renderSidebar(roots) {
  els.sidebar.innerHTML = '';
  let count = 0;
  roots.forEach((r) => {
    els.sidebar.appendChild(sideItem(r, 0)); count++;
    (r.children || []).forEach((c) => {
      if (!c.url) { els.sidebar.appendChild(sideItem(c, 1)); count++; }
    });
  });
  document.body.classList.toggle('has-sidebar', count > 0);
}

function sideItem(folder, depth) {
  return el('div', {
    class: 'side-item' + (depth ? ' sub' : ''),
    text: folder.title || '未命名',
    onclick: () => jumpTo(folder.id),
  });
}

function jumpTo(id) {
  const target = document.getElementById('sec-' + id);
  if (target) {
    target.classList.remove('collapsed');
    setFolderCollapsed(id, false); // 侧栏跳转展开后同样记忆为展开
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ---------- smart sections ---------- */
function relTime(ts) {
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days <= 0) return '今天';
  if (days === 1) return '昨天';
  return days + '天前';
}

function renderSmart() {
  const usage = state.usage || {};
  const nodes = Object.entries(usage)
    .map(([id, info]) => ({ node: state.nodeById[id], info }))
    .filter((x) => x.node && x.node.url);
  if (!nodes.length) return;

  const byCount = nodes.slice().sort((a, b) => b.info.count - a.info.count).slice(0, 8)
    .map((x) => ({ node: x.node, meta: x.info.count + ' 次' }));
  const byLast = nodes.slice().sort((a, b) => b.info.last - a.info.last).slice(0, 8)
    .map((x) => ({ node: x.node, meta: relTime(x.info.last) }));

  if (byCount.length) els.content.appendChild(renderSimpleSection('常用书签', byCount));
  if (byLast.length) els.content.appendChild(renderSimpleSection('最近访问', byLast));
}

function renderSection(folder) {
  const sec = el('div', { class: 'section', id: 'sec-' + folder.id });
  sec.appendChild(
    el('div', { class: 'section-head' }, [
      el('span', { class: 'section-title', text: folder.title || '未命名' }),
      el('span', { class: 'section-count', text: `${countItems(folder)} 项` }),
      el('span', { class: 'section-adds' }, [
        el('button', {
          class: 'section-add', title: '新建书签', html: ADD_BOOKMARK_SVG,
          onclick: (e) => { e.stopPropagation(); openModal({ mode: 'add', type: 'bookmark', parentId: folder.id }); },
        }),
        el('button', {
          class: 'section-add', title: '新建文件夹', html: ADD_FOLDER_SVG,
          onclick: (e) => { e.stopPropagation(); openModal({ mode: 'add', type: 'folder', parentId: folder.id }); },
        }),
      ]),
    ])
  );
  sec.appendChild(renderChildren(folder));
  attachDropTarget(sec, folder.id);
  return sec;
}

function renderSimpleSection(title, items) {
  const sec = el('div', { class: 'section' });
  sec.appendChild(
    el('div', { class: 'section-head' }, [
      el('span', { class: 'section-title', text: title }),
      el('span', { class: 'section-count', text: `${items.length} 项` }),
    ])
  );
  const grid = el('div', { class: 'grid' });
  items.forEach((it) => grid.appendChild(renderTile(it.node, it.meta)));
  sec.appendChild(grid);
  return sec;
}

function countItems(node) {
  let c = (node.children || []).filter((x) => x.url).length;
  for (const ch of node.children || []) if (!ch.url) c += countItems(ch);
  return c;
}

function renderChildren(folder) {
  const grid = el('div', { class: 'grid' });
  (folder.children || []).forEach((child) => {
    if (child.url) grid.appendChild(renderTile(child));
  });
  const wrap = el('div', {}, [grid]);
  (folder.children || []).forEach((child) => {
    if (!child.url) wrap.appendChild(renderFolder(child));
  });
  return wrap;
}

function renderFolder(folder) {
  const caret = el('span', { class: 'folder-caret', html: '&#9660;' });
  // 仅「图标+文字」区域可点击折叠，整行其余部分（计数/按钮/空白）不触发
  const title = el('span', { class: 'folder-title' }, [
    caret,
    el('span', { class: 'folder-name', text: folder.title || '未命名' }),
  ]);
  const head = el('div', { class: 'folder-head' }, [
    title,
    el('span', { class: 'section-count', text: `${countItems(folder)}` }),
    el('span', { class: 'folder-adds' }, [
      el('button', {
        class: 'folder-add', title: '新建书签', html: ADD_BOOKMARK_SVG,
        onclick: (e) => { e.stopPropagation(); openModal({ mode: 'add', type: 'bookmark', parentId: folder.id }); },
      }),
      el('button', {
        class: 'folder-add', title: '新建文件夹', html: ADD_FOLDER_SVG,
        onclick: (e) => { e.stopPropagation(); openModal({ mode: 'add', type: 'folder', parentId: folder.id }); },
      }),
    ]),
    el('div', { class: 'edit-btns' }, [
      el('button', {
        class: 'mini-btn', title: '重命名', html: PENCIL_SVG,
        onclick: (e) => { e.stopPropagation(); openModal({ mode: 'edit', type: 'folder', id: folder.id, title: folder.title }); },
      }),
      el('button', {
        class: 'mini-btn del', title: '删除', html: TRASH_SVG,
        onclick: (e) => { e.stopPropagation(); deleteNode(folder.id, folder.title); },
      }),
    ]),
  ]);
  title.addEventListener('click', () => {
    folderEl.classList.toggle('collapsed');
    // 折叠状态持久化：刷新/重开新标签页后保持
    setFolderCollapsed(folder.id, folderEl.classList.contains('collapsed'));
  });

  const folderEl = el('div', {
    class: 'folder' + (state.collapsedFolders.has(folder.id) ? ' collapsed' : ''),
    id: 'sec-' + folder.id,
  }, [head, renderChildren(folder)]);
  attachDropTarget(folderEl, folder.id);
  return folderEl;
}

function renderTile(bm, meta) {
  const tile = el('a', {
    class: 'tile',
    href: isWebUrl(bm.url) ? bm.url : '#',
    target: '_blank',
    rel: 'noopener',
    title: bm.title || bm.url,
    'data-bmid': bm.id,
  });
  tile.appendChild(faviconNode(bm.url, bm.title));
  tile.appendChild(el('div', { class: 'label', text: bm.title || bm.url }));
  if (meta) tile.appendChild(el('div', { class: 'tile-meta', text: meta }));

  if (state.editMode) {
    tile.addEventListener('click', (e) => e.preventDefault());
    tile.draggable = true;
    attachDrag(tile, bm);
  }

  tile.addEventListener('click', () => recordVisit(bm.id));

  tile.appendChild(
    el('div', { class: 'edit-btns' }, [
      el('button', {
        class: 'mini-btn', title: '固定到底栏', html: PIN_SVG,
        onclick: (e) => { e.preventDefault(); e.stopPropagation(); pinBookmark(bm); },
      }),
      el('button', {
        class: 'mini-btn', title: '编辑', html: PENCIL_SVG,
        onclick: (e) => { e.preventDefault(); e.stopPropagation(); openModal({ mode: 'edit', type: 'bookmark', id: bm.id, title: bm.title, url: bm.url }); },
      }),
      el('button', {
        class: 'mini-btn del', title: '删除', html: TRASH_SVG,
        onclick: (e) => { e.preventDefault(); e.stopPropagation(); deleteNode(bm.id, bm.title); },
      }),
    ])
  );
  // 已检测的链接在磁贴左上角加状态角标（重渲染后保留）
  const ls = state.linkStatus[bm.id];
  if (ls) {
    tile.appendChild(el('span', {
      class: 'link-badge ' + (ls === 'dead' ? 'dead' : 'ok'),
      title: ls === 'dead' ? '链接疑似失效' : '链接可用',
    }));
  }

  return tile;
}

/* ---------- usage tracking ---------- */
let usageSaveTimer = null;
function recordVisit(id) {
  if (state.editMode) return;
  const u = state.usage[id] || { count: 0, last: 0 };
  u.count += 1;
  u.last = Date.now();
  state.usage[id] = u;
  clearTimeout(usageSaveTimer);
  usageSaveTimer = setTimeout(() => chrome.storage.local.set({ usage: state.usage }), 600);
  // usage 仅影响「常用书签/最近访问」与 Dock「经常访问」；二者均未开启时无需整页重渲染
  // （否则每次打开书签都会重建内容区、重置滚动位置）
  if (!state.query.trim() && (state.showSmart || state.showFreqVisited)) render();
}

/* ---------- drag & drop ---------- */
function attachDrag(tile, bm) {
  tile.addEventListener('dragstart', (e) => {
    dragData = { id: bm.id, parent: bm.parentId };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', bm.id);
    tile.classList.add('dragging');
    // 半透明预览：克隆体跟随光标
    const ghost = tile.cloneNode(true);
    ghost.style.position = 'absolute';
    ghost.style.top = '-9999px';
    ghost.style.left = '-9999px';
    ghost.style.opacity = '0.85';
    ghost.style.width = tile.offsetWidth + 'px';
    ghost.classList.remove('dragging');
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 24, 24);
    setTimeout(() => ghost.remove(), 0);
  });
  tile.addEventListener('dragend', () => {
    tile.classList.remove('dragging');
    clearDropMarkers();
    dragData = null;
  });
  tile.addEventListener('dragover', (e) => {
    if (!dragData) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    const r = tile.getBoundingClientRect();
    markDrop(tile, (e.clientY - r.top) < r.height / 2);
  });
  tile.addEventListener('dragleave', () => unmark(tile));
  tile.addEventListener('drop', (e) => {
    if (!dragData) return;
    e.preventDefault();
    e.stopPropagation();
    const r = tile.getBoundingClientRect();
    const before = (e.clientY - r.top) < r.height / 2;
    unmark(tile);
    handleDropOnTile(bm, before);
  });
}

function markDrop(tile, before) {
  clearDropMarkers();
  tile.classList.add(before ? 'drop-before' : 'drop-after');
}
function unmark(tile) { tile.classList.remove('drop-before', 'drop-after'); }
function clearDropMarkers() {
  document.querySelectorAll('.drop-before,.drop-after').forEach((e) => e.classList.remove('drop-before', 'drop-after'));
}

function handleDropOnTile(target, before) {
  if (!dragData) return;
  const parent = target.parentId;
  const sibs = childrenOf(parent).filter((n) => n.url && n.id !== dragData.id);
  let idx = sibs.findIndex((n) => n.id === target.id);
  if (idx === -1) idx = sibs.length;
  const newIndex = before ? idx : idx + 1;
  chrome.bookmarks.move(dragData.id, { parentId: parent, index: newIndex }, () => {
    if (chrome.runtime.lastError) return toast('移动失败');
    loadBookmarks();
  });
}

function moveInto(parentId) {
  if (!dragData) return;
  const sibs = childrenOf(parentId).filter((n) => n.url && n.id !== dragData.id);
  chrome.bookmarks.move(dragData.id, { parentId, index: sibs.length }, () => {
    if (chrome.runtime.lastError) return toast('移动失败');
    loadBookmarks();
  });
}

function attachDropTarget(node, folderId) {
  node.addEventListener('dragover', (e) => {
    if (!dragData) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    node.classList.add('drop-target');
  });
  node.addEventListener('dragleave', () => node.classList.remove('drop-target'));
  node.addEventListener('drop', (e) => {
    if (!dragData) return;
    e.preventDefault();
    e.stopPropagation();
    node.classList.remove('drop-target');
    moveInto(folderId);
  });
}

/* ---------- edit actions ---------- */
function deleteNode(id, name) {
  if (!window.confirm(`确定删除「${name || '该项'}」吗？`)) return;
  chrome.bookmarks.remove(id, () => {
    if (chrome.runtime.lastError) return toast('删除失败：' + chrome.runtime.lastError.message);
    toast('已删除');
    loadBookmarks();
  });
}

function openModal(ctx) {
  state.modal = ctx;
  const isFolder = ctx.type === 'folder';
  const isAdd = ctx.mode === 'add';
  const typeText = isFolder ? '文件夹' : (ctx.type === 'pinned' ? '固定链接' : '书签');
  els.modalTitle.textContent = (isAdd ? '新建' : '编辑') + typeText;
  els.mUrlField.style.display = isFolder ? 'none' : 'block';
  els.mTitle.value = ctx.title || '';
  els.mUrl.value = ctx.url || '';
  els.modal.classList.remove('hidden');
  setTimeout(() => els.mTitle.focus(), 30);
}

function closeModal() {
  els.modal.classList.add('hidden');
  state.modal = null;
}

function saveModal() {
  const ctx = state.modal;
  if (!ctx) return;
  const title = els.mTitle.value.trim() || (ctx.type === 'folder' ? '新建文件夹' : '未命名');
  const url = els.mUrl.value.trim();

  if (ctx.type !== 'folder' && !/^https?:\/\//i.test(url)) {
    return toast('请输入有效的 http(s) 网址');
  }

  if (ctx.type === 'pinned') {
    if (ctx.mode === 'add') {
      if (state.pinned.length >= 10) return toast('底栏最多固定 10 个，请先移除');
      state.pinned.push({ title, url });
    } else {
      state.pinned[ctx.index] = { title, url };
    }
    saveSettings();
    closeModal();
    renderDock();
    return toast(ctx.mode === 'add' ? '已固定' : '已保存');
  }

  if (ctx.mode === 'edit') {
    const changes = ctx.type === 'folder' ? { title } : { title, url };
    chrome.bookmarks.update(ctx.id, changes, () => finish('已保存'));
  } else {
    const create = ctx.type === 'folder'
      ? { parentId: ctx.parentId, title }
      : { parentId: ctx.parentId, title, url };
    chrome.bookmarks.create(create, () => finish('已创建'));
  }

  function finish(msg) {
    if (chrome.runtime.lastError) return toast('操作失败：' + chrome.runtime.lastError.message);
    closeModal();
    toast(msg);
    loadBookmarks();
  }
}

/* ---------- pin to dock ---------- */
function pinBookmark(bm) {
  if (state.pinned.some((p) => p.url === bm.url)) return toast('已在底栏');
  if (state.pinned.length >= 10) return toast('底栏最多固定 10 个，请先移除');
  state.pinned.push({ title: bm.title || bm.url, url: bm.url });
  saveSettings();
  renderDock();
  toast('已固定到底栏');
}

/* ---------- pop menu ---------- */
function makeMenu(anchor, items) {
  closeMenu();
  const rect = anchor.getBoundingClientRect();
  const menu = el('div', { class: 'pop-menu' });
  items.forEach((it) => {
    menu.appendChild(
      el('button', {
        class: 'pop-item',
        text: it.label,
        onclick: (e) => { e.stopPropagation(); closeMenu(); it.onClick(); },
      })
    );
  });
  document.body.appendChild(menu);
  menu.style.top = rect.bottom + 6 + 'px';
  menu.style.left = Math.max(8, rect.right - menu.offsetWidth) + 'px';
  state._menu = menu;
  setTimeout(() => document.addEventListener('click', onDocClick), 0);
}
function onDocClick(e) {
  if (state._menu && !state._menu.contains(e.target)) closeMenu();
}
function closeMenu() {
  if (state._menu) {
    state._menu.remove();
    state._menu = null;
    document.removeEventListener('click', onDocClick);
  }
}

/* ---------- bottom dock ---------- */
function renderDock() {
  els.dock.innerHTML = '';
  const inner = el('div', { class: 'dock-inner' });

  state.pinned.slice(0, 10).forEach((p, i) => {
    const item = el('a', { class: 'dock-item', href: p.url, target: '_blank', rel: 'noopener', title: p.title || p.url });
    item.appendChild(faviconNode(p.url, p.title));
    if (state.editMode) {
      item.addEventListener('click', (e) => e.preventDefault());
      item.appendChild(
        el('div', { class: 'edit-btns' }, [
          el('button', {
            class: 'mini-btn', title: '编辑', html: PENCIL_SVG,
            onclick: (e) => { e.preventDefault(); e.stopPropagation(); openModal({ mode: 'edit', type: 'pinned', index: i, title: p.title, url: p.url }); },
          }),
          el('button', {
            class: 'mini-btn del', title: '移除', html: TRASH_SVG,
            onclick: (e) => { e.preventDefault(); e.stopPropagation(); removePinned(i); },
          }),
        ])
      );
    }
    inner.appendChild(item);
  });

  if (state.editMode && state.pinned.length < 5) {
    inner.appendChild(
      el('button', { class: 'dock-add', text: '+', title: '固定链接', onclick: () => openModal({ mode: 'add', type: 'pinned' }) })
    );
  }

  // 自动位：最常访问的 2 个（不与已固定重复）；受「Dock 栏显示经常访问」开关控制
  if (state.showFreqVisited) {
    const pinnedUrls = new Set(state.pinned.map((p) => p.url));
    const auto = Object.entries(state.usage)
      .map(([id, info]) => ({ node: state.nodeById[id], info }))
      .filter((x) => x.node && x.node.url && x.info.count > 0 && !pinnedUrls.has(x.node.url))
      .sort((a, b) => b.info.count - a.info.count)
      .slice(0, 2);
    auto.forEach((x) => {
      const item = el('a', { class: 'dock-item auto', href: x.node.url, target: '_blank', rel: 'noopener', title: x.node.title || x.node.url });
      item.appendChild(faviconNode(x.node.url, x.node.title));
      inner.appendChild(item);
    });
  }

  els.dock.appendChild(inner);
}

function removePinned(index) {
  if (!window.confirm('确定从底栏移除该项吗？')) return;
  state.pinned.splice(index, 1);
  saveSettings();
  renderDock();
  toast('已移除');
}

/* ---------- zen clean mode（右上角叶子切换） ---------- */
function setZenMode(on) {
  state.zenMode = !!on;
  document.body.classList.toggle('zen-mode', state.zenMode);
  els.zen.classList.toggle('hidden', !state.zenMode);
  if (state.zenMode) {
    // 进清爽模式前收起可能开着的弹层，避免残留在浮层上方
    if (els.settings && !els.settings.classList.contains('hidden')) closeSettings();
    closeMenu();
    renderZen();
    els.zenSearch.value = '';
    setTimeout(() => { try { els.zenSearch.focus(); } catch (_) {} }, 60);
  }
  saveSettings(); // 持久化清爽模式状态，刷新/重开后仍保持
}

function renderZen() {
  els.zenGrid.innerHTML = '';
  const items = [];
  const seen = new Set();
  // 先取固定到 Dock 的（最多 10 个）
  state.pinned.slice(0, 10).forEach((p) => {
    if (p.url && !seen.has(p.url)) { seen.add(p.url); items.push({ title: p.title, url: p.url }); }
  });
  // 不足 10 个用「经常访问」补齐（不与已固定重复）
  if (items.length < 10) {
    Object.entries(state.usage)
      .map(([id, info]) => ({ node: state.nodeById[id], info }))
      .filter((x) => x.node && x.node.url && x.info.count > 0 && !seen.has(x.node.url))
      .sort((a, b) => b.info.count - a.info.count)
      .forEach((x) => {
        if (items.length < 10 && !seen.has(x.node.url)) {
          seen.add(x.node.url);
          items.push({ title: x.node.title, url: x.node.url });
        }
      });
  }
  items.forEach((it) => {
    const a = el('a', { class: 'zen-item', href: it.url, target: '_blank', rel: 'noopener', title: it.title || it.url });
    a.appendChild(faviconNode(it.url, it.title));
    a.appendChild(el('div', { class: 'zen-label', text: it.title || it.url }));
    els.zenGrid.appendChild(a);
  });
}

els.zenToggle.addEventListener('click', () => setZenMode(!state.zenMode));
// 退出清爽模式只认叶子按钮：点空白/Esc 均不退出
// 清爽模式里回车 = 用当前搜索引擎搜索
els.zenSearch.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const q = els.zenSearch.value.trim();
    if (!q) return;
    const eng = state.engines.find((x) => x.id === state.engineId) || state.engines[0];
    if (!eng) return;
    const u = eng.url.includes('%s')
      ? eng.url.replace('%s', encodeURIComponent(q))
      : eng.url + encodeURIComponent(q);
    chrome.tabs.create({ url: u });
  }
});

/* ---------- search & engines ---------- */
let searchTimer = null;
els.search.addEventListener('input', () => {
  state.query = els.search.value;
  els.searchClear.classList.toggle('show', !!state.query);
  clearTimeout(searchTimer);
  searchTimer = setTimeout(render, 120);
});
els.search.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !els.enginePanel.classList.contains('hidden')) {
    closeEnginePanel();
    return;
  }
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    e.preventDefault();
    moveSearchSel(1, e.key);
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    e.preventDefault();
    moveSearchSel(-1, e.key);
  } else if (e.key === 'Enter') {
    // 已用方向键选中某条书签 -> 直接访问该书签
    if (state.searchSel >= 0 && state.searchResults[state.searchSel]) {
      e.preventDefault();
      openBookmark(state.searchResults[state.searchSel]);
      return;
    }
    // 未选中 -> 沿用原行为：用当前搜索引擎做网页搜索
    const q = els.search.value.trim();
    if (!q) return;
    const eng = state.engines.find((x) => x.id === state.engineId) || state.engines[0];
    if (!eng) return;
    const u = eng.url.includes('%s')
      ? eng.url.replace('%s', encodeURIComponent(q))
      : eng.url + encodeURIComponent(q);
    chrome.tabs.create({ url: u });
  }
});

/* 依据磁贴实际排布推断每行列数（用于上下键跨行、左右键同排移动） */
function searchCols(tiles) {
  if (tiles.length < 2) return 1;
  const top0 = tiles[0].offsetTop;
  let n = 1;
  while (n < tiles.length && tiles[n].offsetTop === top0) n++;
  return Math.max(1, n);
}

/* 方向键在搜索结果间移动选中态：上下跨行（按列数），左右同排逐个 */
function moveSearchSel(dir, key) {
  const tiles = els.content.querySelectorAll('.tile');
  if (!tiles.length) return;
  let i = state.searchSel;
  if (i < 0) i = dir > 0 ? -1 : tiles.length; // 未选中时：下/右=首项，上/左=末项
  if (key === 'ArrowUp' || key === 'ArrowDown') i += dir * searchCols(tiles);
  else i += dir;
  if (i < 0) i = 0;
  if (i > tiles.length - 1) i = tiles.length - 1;
  state.searchSel = i;
  tiles.forEach((t, k) => t.classList.toggle('selected', k === i));
  tiles[i].scrollIntoView({ block: 'nearest' });
}

/* 通过键盘选择后访问书签 */
function openBookmark(bm) {
  if (!bm || !isWebUrl(bm.url)) return;
  recordVisit(bm.id);
  chrome.tabs.create({ url: bm.url });
}
els.searchClear.addEventListener('click', () => {
  els.search.value = '';
  state.query = '';
  els.searchClear.classList.remove('show');
  render();
  els.search.focus();
});

function updateEngineBtn() {
  const eng = state.engines.find((x) => x.id === state.engineId) || state.engines[0];
  els.engineIco.innerHTML = '';
  els.engineBtn.title = eng ? eng.name + '（点击切换）' : '搜索';
  // 搜索框图标固定为放大镜（不随引擎 favicon 变化；引擎切换仍在下拉面板中体现）
  els.engineIco.innerHTML =
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">' +
    '<path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"/></svg>';
}

/* 引擎下拉面板：WeTab 风格大图标卡片 */
function renderEngineGrid() {
  els.engineGrid.innerHTML = '';
  state.engines.forEach((eng) => {
    const card = el('button', {
      class: 'engine-card' + (eng.id === state.engineId ? ' active' : ''),
      title: eng.name,
      onclick: () => {
        state.engineId = eng.id;
        saveSettings();
        updateEngineBtn();
        closeEnginePanel();
      },
    });
    card.appendChild(engineIconNode(eng));
    card.appendChild(el('span', { class: 'engine-name', text: eng.name }));
    els.engineGrid.appendChild(card);
  });
  const add = el('button', {
    class: 'engine-card add',
    title: '添加 / 管理搜索引擎',
    onclick: () => { closeEnginePanel(); openSettings(); },
  });
  add.appendChild(el('span', { class: 'add-ico', text: '+' }));
  add.appendChild(el('span', { class: 'engine-name', text: '添加' }));
  els.engineGrid.appendChild(add);
}

function openEnginePanel() {
  renderEngineGrid();
  els.enginePanel.classList.remove('hidden');
  els.engineBtn.classList.add('open');
  els.engineBtn.setAttribute('aria-expanded', 'true');
  setTimeout(() => document.addEventListener('click', onEngineDocClick), 0);
}
function closeEnginePanel() {
  if (els.enginePanel.classList.contains('hidden')) return;
  els.enginePanel.classList.add('hidden');
  els.engineBtn.classList.remove('open');
  els.engineBtn.setAttribute('aria-expanded', 'false');
  document.removeEventListener('click', onEngineDocClick);
}
function onEngineDocClick(e) {
  if (!els.enginePanel.contains(e.target) && !els.engineBtn.contains(e.target)) closeEnginePanel();
}

els.engineBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (els.enginePanel.classList.contains('hidden')) openEnginePanel();
  else closeEnginePanel();
});

/* ---------- wallpaper & mask ---------- */
function applyWallpaper() {
  if (state.wallpaper) {
    els.bg.style.background = `center/cover no-repeat url("${state.wallpaper}")`;
    document.body.classList.add('has-wallpaper');
  } else {
    els.bg.style.background = '';
    document.body.classList.remove('has-wallpaper');
  }
  applyMask();
}
function applyMask() {
  const d = (state.maskDepth ?? 0) / 100;
  els.wallOverlay.style.background =
    `linear-gradient(180deg, rgba(0,0,0,${(d * 0.6).toFixed(2)}), rgba(0,0,0,${(d * 0.3).toFixed(2)})), rgba(10,15,25,${(d * 0.5).toFixed(2)})`;
  const blur = (d * 14).toFixed(1) + 'px';
  els.wallOverlay.style.backdropFilter = `blur(${blur})`;
  els.wallOverlay.style.setProperty('-webkit-backdrop-filter', `blur(${blur})`);
}
function setWallpaperFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const maxW = 1920, maxH = 1200;
      let w = img.width, h = img.height;
      const scale = Math.min(1, maxW / w, maxH / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0, w, h);
      const data = c.toDataURL('image/jpeg', 0.85);
      chrome.storage.local.set({ wallpaper: data }, () => {
        state.wallpaper = data;
        applyWallpaper();
        toast('壁纸已更新');
      });
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}
function clearWallpaper() {
  chrome.storage.local.remove('wallpaper', () => {
    state.wallpaper = null;
    applyWallpaper();
    toast('已恢复默认背景');
  });
}
els.wpFile.addEventListener('change', () => {
  const f = els.wpFile.files && els.wpFile.files[0];
  if (f) setWallpaperFromFile(f);
  els.wpFile.value = '';
});

/* ---------- settings panel ---------- */
function openSettings() {
  closeMenu();
  renderEngineList();
  els.sMask.value = state.maskDepth;
  els.sMaskVal.textContent = state.maskDepth;
  setSeg(els.sLayout, state.layout);
  setSeg(els.sTheme, document.body.classList.contains('dark') ? 'dark' : 'light');
  if (els.sShowSmart) els.sShowSmart.checked = state.showSmart;
  if (els.sShowDock) els.sShowDock.checked = state.showDock;
  if (els.sShowFreq) els.sShowFreq.checked = state.showFreqVisited;
  if (els.sShowAbout) els.sShowAbout.checked = state.showAboutBtn;
  if (els.sAutoHide) els.sAutoHide.checked = state.autoHideSidebar;
  if (els.sNoIcon) setSeg(els.sNoIcon, state.noIconStyle);
  els.settings.classList.remove('hidden');
}
function closeSettings() {
  els.settings.classList.add('hidden');
}
els.settingsToggle.addEventListener('click', openSettings);
els.sClose.addEventListener('click', closeSettings);
els.settings.addEventListener('click', (e) => { if (e.target === els.settings) closeSettings(); });

/* ---------- about / donate panel ---------- */
function hideQrZoom() { if (els.qrZoom) els.qrZoom.classList.add('hidden'); }
els.aboutToggle.addEventListener('click', () => els.about.classList.remove('hidden'));
els.aboutClose.addEventListener('click', () => { els.about.classList.add('hidden'); hideQrZoom(); });
els.about.addEventListener('click', (e) => { if (e.target === els.about) { els.about.classList.add('hidden'); hideQrZoom(); } });

// 微信/支付宝收款码：悬停弹出大图，方便手机扫码
els.about.querySelectorAll('.about-item').forEach((it) => {
  if (!it.className || it.className.split(/\s+/).indexOf('donate') < 0) return;
  const img = it.querySelector('img');
  if (!img) return;
  it.addEventListener('mouseenter', () => {
    if (els.qrZoomImg) els.qrZoomImg.src = img.src;
    els.qrZoom.classList.remove('hidden');
  });
  it.addEventListener('mouseleave', () => els.qrZoom.classList.add('hidden'));
});

els.sWpUpload.addEventListener('click', () => els.wpFile.click());
els.sWpClear.addEventListener('click', clearWallpaper);

let maskSaveTimer = null;
els.sMask.addEventListener('input', () => {
  state.maskDepth = Number(els.sMask.value);
  els.sMaskVal.textContent = state.maskDepth;
  applyMask();
  clearTimeout(maskSaveTimer);
  maskSaveTimer = setTimeout(saveSettings, 300);
});

function setSeg(container, value) {
  container.querySelectorAll('button[data-v]').forEach((b) => {
    b.classList.toggle('active', b.getAttribute('data-v') === value);
  });
}
els.sLayout.addEventListener('click', (e) => {
  const v = e.target && e.target.getAttribute && e.target.getAttribute('data-v');
  if (!v) return;
  state.layout = v;
  document.body.classList.toggle('waterfall', v === 'waterfall');
  setSeg(els.sLayout, v);
  saveSettings();
});
els.sTheme.addEventListener('click', (e) => {
  const v = e.target && e.target.getAttribute && e.target.getAttribute('data-v');
  if (!v) return;
  applyTheme(v === 'dark');
  setSeg(els.sTheme, v);
  saveSettings();
});
els.sNoIcon.addEventListener('click', (e) => {
  const v = e.target && e.target.getAttribute && e.target.getAttribute('data-v');
  if (v !== 'globe' && v !== 'letter') return;
  state.noIconStyle = v;
  setSeg(els.sNoIcon, v);
  saveSettings();
  render(); // 重渲染磁贴以应用新的无图标显示方式
});

/* engines management */
function renderEngineList() {
  els.engineList.innerHTML = '';
  state.engines.forEach((eng) => {
    const row = el('div', { class: 'engine-row' + (eng.id === state.engineId ? ' active' : '') }, [
      engineIconNode(eng),
      el('span', { class: 'engine-name', text: eng.name }),
      el('span', { class: 'engine-url', text: eng.url }),
      el('button', {
        class: 'mini-btn del', title: '删除', html: TRASH_SVG,
        onclick: (e) => { e.stopPropagation(); deleteEngine(eng.id); },
      }),
    ]);
    row.addEventListener('click', () => {
      state.engineId = eng.id;
      saveSettings();
      updateEngineBtn();
      renderEngineList();
    });
    els.engineList.appendChild(row);
  });
}
function deleteEngine(id) {
  if (state.engines.length <= 1) return toast('至少保留一个搜索引擎');
  if (!window.confirm('确定删除该搜索引擎吗？')) return;
  state.engines = state.engines.filter((x) => x.id !== id);
  if (state.engineId === id) state.engineId = state.engines[0].id;
  saveSettings();
  updateEngineBtn();
  renderEngineList();
  toast('已删除');
}
els.eAdd.addEventListener('click', () => {
  const name = els.eName.value.trim();
  const url = els.eUrl.value.trim();
  if (!name || !url) return toast('请填写名称和网址');
  if (!/%s/.test(url)) return toast('网址需包含 %s 占位符');
  state.engines.push({ id: 'e' + Date.now(), name, url });
  els.eName.value = '';
  els.eUrl.value = '';
  saveSettings();
  updateEngineBtn();
  renderEngineList();
  toast('已添加');
});

/* ---------- edit mode toggle (topbar button) ---------- */
function setEditMode(on) {
  state.editMode = on;
  document.body.classList.toggle('edit', on);
  if (els.editToggle) {
    els.editToggle.classList.toggle('active', on);
    els.editToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  render();
}
els.editToggle.addEventListener('click', () => setEditMode(!state.editMode));

/* ---------- show-smart / show-dock switches ---------- */
els.sShowSmart.addEventListener('change', () => {
  state.showSmart = els.sShowSmart.checked;
  saveSettings();
  render();
});
els.sShowDock.addEventListener('change', () => {
  state.showDock = els.sShowDock.checked;
  saveSettings();
  render();
});
els.sShowFreq.addEventListener('change', () => {
  state.showFreqVisited = els.sShowFreq.checked;
  saveSettings();
  renderDock();
});
els.sShowAbout.addEventListener('change', () => {
  state.showAboutBtn = els.sShowAbout.checked;
  saveSettings();
  render();
  toast(state.showAboutBtn ? '已显示关于按钮' : '已隐藏关于按钮');
});

/* ---------- sidebar auto-hide switch ---------- */
function applySidebarAutoHide() {
  document.body.classList.toggle('auto-hide-sidebar', !!state.autoHideSidebar);
}
els.sAutoHide.addEventListener('change', () => {
  state.autoHideSidebar = els.sAutoHide.checked;
  saveSettings();
  applySidebarAutoHide();
});

/* ---------- one-click favicon prefetch ---------- */
els.sPrefetch.addEventListener('click', prefetchAllFavicons);

/* 候选源：国内镜像优先（未访问过的站点 _favicon 只有默认地球图标），
   公共 CDN 兜底，最后回退 Chrome 原生 _favicon */
function faviconURLs(url) {
  const out = [];
  let host = '';
  try { host = new URL(url).hostname; } catch (_) { return out; }
  if (host) {
    out.push('https://api.iowen.cn/favicon/' + host + '.png');
    out.push('https://icons.duckduckgo.com/ip3/' + host + '.ico');
  }
  try {
    out.push(chrome.runtime.getURL('/_favicon/?pageUrl=' + encodeURIComponent(url) + '&size=64'));
  } catch (_) {}
  return out;
}

/* 带超时的图片加载：镜像不可达/网络受限时不触发 onload 也不触发 onerror，
   若不加超时 Promise 永不 settle，整批任务会全部卡死（按钮看起来"不可用"） */
const ICON_TIMEOUT = 6000;
function loadImage(src, cors) {
  return new Promise((resolve) => {
    const img = new Image();
    if (cors) img.crossOrigin = 'anonymous';
    let settled = false;
    const finish = (v) => { if (settled) return; settled = true; clearTimeout(timer); resolve(v); };
    const timer = setTimeout(() => finish(null), ICON_TIMEOUT);
    img.onload = () => finish(img);
    img.onerror = () => finish(null);
    img.src = src;
  });
}

/* 逐级尝试候选源，返回 { src, local }；全部失败返回 null
   local=true 表示来自 Chrome _favicon（需比对是否为默认地球图） */
function loadFavicon(url) {
  const list = faviconURLs(url);
  let i = 0;
  const step = () => {
    if (i >= list.length) return Promise.resolve(null);
    const src = list[i++];
    const isLocal = src.indexOf('/_favicon/') >= 0;
    return loadImage(src, !isLocal).then((img) => {
      if (!img) {
        // 服务端不支持 CORS 时退回普通加载（跳过像素校验）
        return isLocal ? null : loadImage(src, false).then((im) => (im ? { src, local: false } : step()));
      }
      if (isLocal) {
        return isDefaultGlobe(img).then((yes) => (yes ? step() : { src, local: true }));
      }
      // 镜像对无真图标的站点返回纯色占位图，加载成功也需剔除，否则会被缓存并显示色块
      return isBlankImage(img).then((blank) => (blank ? step() : { src, local: false }));
    });
  };
  return step();
}

/* 把取到的图标直接替换到当前页面对应书签磁贴（无需整页重渲染） */
function updateTileFavicon(id, src) {
  const tile = document.querySelector('.tile[data-bmid="' + String(id).replace(/"/g, '\\"') + '"]');
  if (!tile) return;
  const old = tile.querySelector('.fav, .fav-letter');
  if (!old) return;
  const img = document.createElement('img');
  img.className = 'fav';
  img.alt = '';
  img.loading = 'lazy';
  img.src = src;
  old.replaceWith(img);
}

let prefetching = false;
function prefetchAllFavicons() {
  if (prefetching) return toast('正在获取中，请稍候…');
  const bms = allBookmarks(state.tree ? state.tree[0].children : []);
  const valid = bms.filter((b) => /^https?:/i.test(b.url || '') && !state.faviconCache[b.url]);
  if (!valid.length) {
    // 全部已缓存时，提供一次「强制重刷」机会（清掉缓存重取一遍）
    if (Object.keys(state.faviconCache).length && window.confirm('所有图标均已获取过。是否清空图标缓存并重新获取一遍？')) {
      state.faviconCache = {};
      chrome.storage.local.set({ faviconCache: {} });
      setTimeout(prefetchAllFavicons, 50);
    } else {
      toast('所有图标均已获取过，无需重复操作');
    }
    return;
  }
  prefetching = true;
  if (els.sPrefetch) els.sPrefetch.disabled = true;
  let done = 0, ok = 0, fail = 0, cacheDirty = false, purged = 0;
  const total = valid.length;
  toast(`正在获取图标 0/${total}…`);

  let idx = 0;
  const worker = () => {
    if (idx >= valid.length) return;
    const b = valid[idx++];
    loadFavicon(b.url).then((hit) => {
      if (hit) {
        updateTileFavicon(b.id, hit.src);
        ok++;
        // 仅缓存公网镜像的真实图标；_favicon 结果由 Chrome 自身按需加载
        if (!hit.local) {
          state.faviconCache[b.url] = hit.src;
          cacheDirty = true;
        }
      } else fail++;
      done++;
      if (done >= total) {
        // 顺带清理历史缓存中的纯色占位图，避免继续显示色块
        const urls = allBookmarks(state.tree ? state.tree[0].children : []).map((x) => x.url);
        const purge = (list) => Promise.all(list.map((u) => {
          const src = state.faviconCache[u];
          if (!src) return Promise.resolve();
          // 必须带 crossOrigin，否则 canvas 被跨域图污染，getImageData 抛错 → 检测永远失效
          return loadImage(src, true).then((im) => {
            if (!im) return null;
            return isBlankImage(im).then((blank) => {
              if (blank) { delete state.faviconCache[u]; cacheDirty = true; purged++; }
            });
          }).catch(() => null);
        }));
        purge(urls).then(() => {
          const finish = () => {
            prefetching = false;
            if (els.sPrefetch) els.sPrefetch.disabled = false;
            let msg = fail
              ? `图标获取完成：成功 ${ok} 个，未获取 ${fail} 个（多为内网站点，无公开图标）`
              : `图标已全部获取（${ok} 个）`;
            if (purged) msg += `；已清理 ${purged} 个无效占位图标`;
            toast(msg);
            render(); // 重渲染后磁贴直接命中缓存，确保页面上立即可见
          };
          if (cacheDirty) chrome.storage.local.set({ faviconCache: state.faviconCache }, finish);
          else finish();
        });
      } else {
        toast(`正在获取图标 ${done}/${total}…`);
      }
      worker();
    });
  };
  const CONCURRENCY = 8;
  for (let i = 0; i < CONCURRENCY; i++) worker();
}

/* ---------- back to top (bottom-right) ---------- */
/* ---------- back-to-top (bottom-right, always visible) ---------- */
function scrollToTop() {
  // 本页 html/body 设了 height:100% + overflow-x:hidden，实际滚动容器是 body，
  // 因此 window.scrollTo 无效；需同时滚动 scrollingElement 与 body/html 兜底
  const se = document.scrollingElement;
  const nodes = [se, document.body, document.documentElement].filter(Boolean);
  const unique = nodes.filter((n, i) => nodes.indexOf(n) === i);
  unique.forEach((n) => {
    if (typeof n.scrollTo === 'function') {
      try { n.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); } catch (_) { n.scrollTop = 0; n.scrollLeft = 0; }
    }
  });
  // 兜底：部分环境 smooth 不生效时直接归零
  setTimeout(() => {
    unique.forEach((n) => { n.scrollTop = 0; n.scrollLeft = 0; });
  }, 700);
}
els.backTop.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  scrollToTop();
});

/* ---------- one-click link availability check ---------- */
els.sCheck.addEventListener('click', checkAllLinks);
els.lrClose.addEventListener('click', () => els.linkReport.classList.add('hidden'));
els.linkReport.addEventListener('click', (e) => { if (e.target === els.linkReport) els.linkReport.classList.add('hidden'); });

/* 可达性探测：no-cors + 超时。能建立连接即视为可达（含 404 等）；DNS/连接失败/超时判为失效 */
async function checkLink(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    await fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-store', signal: ctrl.signal });
    return true;
  } catch (_) {
    return false;
  } finally {
    clearTimeout(t);
  }
}

/* 更新单书签状态并在磁贴角标实时显示 */
function setLinkBadge(id, status) {
  state.linkStatus[id] = status;
  const tile = document.querySelector('.tile[data-bmid="' + String(id).replace(/"/g, '\\"') + '"]');
  if (!tile) return;
  let badge = tile.querySelector('.link-badge');
  if (!badge) {
    badge = document.createElement('span');
    tile.appendChild(badge);
  }
  badge.className = 'link-badge ' + (status === 'dead' ? 'dead' : 'ok');
  badge.title = status === 'dead' ? '链接疑似失效' : '链接可用';
}

async function checkAllLinks() {
  const bms = allBookmarks(state.tree ? state.tree[0].children : []);
  const valid = bms.filter((b) => /^https?:/i.test(b.url || ''));
  if (!valid.length) return toast('没有可检测的链接');
  state.linkStatus = {};
  render(); // 清除上次角标
  let done = 0, ok = 0, dead = 0;
  const total = valid.length;
  toast(`正在检测链接 0/${total}…`);

  let idx = 0;
  const worker = async () => {
    if (idx >= valid.length) return;
    const b = valid[idx++];
    const alive = await checkLink(b.url);
    setLinkBadge(b.id, alive ? 'ok' : 'dead');
    alive ? ok++ : dead++;
    done++;
    if (done >= total) {
      toast(`检测完成：可达 ${ok} 个，疑似失效 ${dead} 个`);
      if (dead) showLinkReport(valid.filter((x) => state.linkStatus[x.id] === 'dead'));
    } else {
      toast(`正在检测链接 ${done}/${total}…`);
    }
    worker();
  };
  const CONC = 8;
  for (let i = 0; i < CONC; i++) worker();
}

function showLinkReport(deadList) {
  els.linkReportTitle.textContent = `失效链接（${deadList.length}）`;
  els.linkReportBody.innerHTML = '';
  if (!deadList.length) {
    els.linkReportBody.appendChild(el('div', { class: 'report-empty', text: '没有失效链接 🎉' }));
  } else {
    deadList.forEach((b) => {
      els.linkReportBody.appendChild(
        el('div', { class: 'report-item' }, [
          el('a', { class: 'report-title', href: b.url, target: '_blank', rel: 'noopener', text: b.title || b.url }),
          el('div', { class: 'report-url', text: b.url }),
        ])
      );
    });
  }
  els.linkReport.classList.remove('hidden');
}

/* ---------- bookmark modal ---------- */
els.mCancel.addEventListener('click', closeModal);
els.mSave.addEventListener('click', saveModal);
els.modal.addEventListener('click', (e) => { if (e.target === els.modal) closeModal(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!els.modal.classList.contains('hidden')) closeModal();
    if (!els.settings.classList.contains('hidden')) closeSettings();
    if (!els.about.classList.contains('hidden')) { els.about.classList.add('hidden'); hideQrZoom(); }
    closeMenu();
  }
  // Ctrl/Cmd + K 直达搜索框（清爽模式下聚焦清爽搜索框，否则聚焦顶部主搜索框并清空引擎面板）
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault();
    if (state.zenMode) {
      try { els.zenSearch.focus(); els.zenSearch.select(); } catch (_) {}
      return;
    }
    closeEnginePanel();
    closeMenu();
    els.search.focus();
    if (typeof els.search.select === 'function') els.search.select();
  }
});

/* ---------- theme ---------- */
function applyTheme(dark) {
  document.body.classList.toggle('dark', dark);
}

/* ---------- clock ---------- */
const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
function tick() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  els.time.textContent = `${p(d.getHours())}:${p(d.getMinutes())}`;
  els.date.textContent = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${WEEK[d.getDay()]}`;
}
setInterval(tick, 1000);
tick();

/* ---------- boot ---------- */
(async () => {
  const saved = await chrome.storage.local.get([
    'theme', 'wallpaper', 'usage', 'engines', 'engineId', 'maskDepth', 'layout', 'pinned',
    'showSmart', 'showDock', 'showFreqVisited', 'showAboutBtn', 'zenMode', 'autoHideSidebar', 'noIconStyle', 'faviconCache',
    'collapsedFolders',
  ]);
  applyTheme(saved.theme === 'dark');
  state.wallpaper = saved.wallpaper || null;
  state.usage = saved.usage || {};
  if (Array.isArray(saved.engines) && saved.engines.length) state.engines = saved.engines;
  if (saved.engineId && state.engines.some((x) => x.id === saved.engineId)) state.engineId = saved.engineId;
  state.maskDepth = typeof saved.maskDepth === 'number' ? saved.maskDepth : 0;
  state.layout = saved.layout === 'waterfall' ? 'waterfall' : 'classic';
  state.pinned = Array.isArray(saved.pinned) ? saved.pinned : [];
  state.showSmart = saved.showSmart === true;
  state.showDock = saved.showDock !== false; // 默认显示
  state.showFreqVisited = saved.showFreqVisited !== false; // 默认显示 Dock 栏「经常访问」
  state.showAboutBtn = saved.showAboutBtn !== false; // 默认显示左下角「关于 / 打赏」按钮
  state.zenMode = saved.zenMode === true; // 默认不进入清爽模式（刷新后保留上次状态）
  state.autoHideSidebar = saved.autoHideSidebar === true;
  state.noIconStyle = saved.noIconStyle === 'letter' ? 'letter' : 'globe';
  state.faviconCache = (saved.faviconCache && typeof saved.faviconCache === 'object') ? saved.faviconCache : {};
  state.collapsedFolders = new Set(Array.isArray(saved.collapsedFolders) ? saved.collapsedFolders : []);

  document.body.classList.toggle('waterfall', state.layout === 'waterfall');
  applySidebarAutoHide();
  applyWallpaper();
  updateEngineBtn();
  tick();
  loadBookmarks();
})();
