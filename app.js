// WATCHMAN veb-ilovasi (iPhone uchun, Android ilova bilan bir xil server protokoli).
// Server: wss://magiline-server.onrender.com/ws  (sinov uchun: ?server=ws://127.0.0.1:18123/ws)
'use strict';

const SERVER_URL = new URLSearchParams(location.search).get('server') || 'wss://magiline-server.onrender.com/ws';
const STORE_KEY = 'watchman.creds';
const DEVICE_ID_KEY = 'watchman.deviceId';

// Kirishni butunlay to'xtatadigan xatolar (qayta urinish foydasiz - login oynasiga qaytamiz).
const FATAL_AUTH = {
  invalid_credentials: "Login yoki parol noto'g'ri.",
  invalid_master_password: "ID noto'g'ri.",
  too_many_attempts: "Ko'p marta xato kiritildi. 1 daqiqadan keyin qayta urinib ko'ring.",
  bad_auth_message: "Login, parol va ID ni to'liq kiriting.",
  device_removed: "Bu telefon hisobdan o'chirilgan. Hisob egasi ID ni o'zgartirgach qayta kirish mumkin.",
};

const $ = (id) => document.getElementById(id);
const state = {
  creds: null,
  ws: null,
  authed: false,
  deviceOnline: false,
  reconnectDelay: 2000,
  reconnectTimer: null,
  pushPublicKey: null,
  status: {},
  statusAt: 0,
  alerts: [],
  location: null,
  locPendingTimer: null,
  manualClose: false,
};

// ---------------- Saqlash ----------------
function loadCreds() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch { return null; }
}
function saveCreds(c) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(c)); } catch { /* xotira yopiq - sessiya davomida ishlaydi */ }
}
function clearCreds() {
  try { localStorage.removeItem(STORE_KEY); } catch { /* e'tiborsiz */ }
}
function deviceId() {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'web-' + (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'web-anon';
  }
}

function deviceName() {
  const ua = navigator.userAgent;
  const kind = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'iPad'
    : /iPhone/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : 'Kompyuter';
  return kind + ' (veb-ilova)';
}

// ---------------- Ko'rinish ----------------
function showView(name) {
  $('loginView').hidden = name !== 'login';
  $('mainView').hidden = name !== 'main';
}

let toastTimer = null;
function toast(text, isAlert) {
  const t = $('toast');
  t.textContent = text;
  t.className = 'toast' + (isAlert ? ' alert' : '');
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, isAlert ? 6000 : 2500);
}

function setConn(kind, text) {
  const p = $('connPill');
  p.className = 'conn ' + kind;
  p.setAttribute('aria-label', text);
  p.title = text;
  document.querySelectorAll('[data-cmd]').forEach((b) => { b.disabled = !(state.authed && state.deviceOnline); });
  $('locRefresh').disabled = !(state.authed && state.deviceOnline) || !!state.locPendingTimer;
}

function updateConnPill() {
  if (!state.authed) setConn('wait', 'Ulanmoqda…');
  else if (!state.deviceOnline) setConn('bad', 'Mashina oflayn');
  else setConn('ok', 'Mashina onlayn');
}

function yes(v) { return typeof v === 'string' ? /ochiq|yoqilgan|toldirilgan/i.test(v) : !!v; }

// Android'dagi kabi: eshik/bagaj/kapot holatiga qarab mashina rasmi.
const CAR_IMAGES = {
  '000': 'ic_car', '100': 'ic_car_ochiq', '010': 'ic_car_bagaj_ochiq', '001': 'ic_car_kapot_ochiq',
  '110': 'ic_car_eshik_bagaj_ochiq', '101': 'ic_car_eshik_kapot_ochiq', '011': 'ic_car_bagaj_kapot_ochiq',
  '111': 'ic_car_hammasi_ochiq',
};

function renderStatus() {
  const s = state.status;
  const guardOn = s.quriqlash !== undefined ? /yoqilgan/i.test(s.quriqlash) : null;
  const badge = $('lockBadge');
  badge.hidden = guardOn === null;
  if (guardOn !== null) {
    const src = guardOn ? 'img/ic_lock.svg' : 'img/ic_lock_ochiq.svg';
    if (badge.getAttribute('src') !== src) badge.setAttribute('src', src);
    badge.alt = guardOn ? "Qo'riqlashda" : "Qo'riqlash o'chiq";
  }

  const engineOn = s.mator !== undefined ? /toldirilgan/i.test(s.mator) : s.accOn === true;
  $('smoke').hidden = !engineOn;
  $('engineBtn').classList.toggle('running', engineOn);

  const doorsOpen = s.doorsOpen !== undefined ? !!s.doorsOpen : s.avtoulov !== undefined ? yes(s.avtoulov) : false;
  const trunkOpen = s.bagajHolati !== undefined && /ochiq/i.test(s.bagajHolati);
  const hoodOpen = s.kapotHolati !== undefined && /ochiq/i.test(s.kapotHolati);
  const key = (doorsOpen ? '1' : '0') + (trunkOpen ? '1' : '0') + (hoodOpen ? '1' : '0');
  const carSrc = 'img/' + CAR_IMAGES[key] + '.png';
  if ($('carImg').getAttribute('src') !== carSrc) $('carImg').setAttribute('src', carSrc);
  const open = [doorsOpen && 'Eshik ochiq', trunkOpen && 'Bagaj ochiq', hoodOpen && 'Kapot ochiq'].filter(Boolean);
  $('openWarn').textContent = open.join(', ');
  $('openWarn').hidden = !open.length;

  setVal('tempVal', typeof s.coolantC === 'number' ? s.coolantC + '°C' : '-', typeof s.coolantC === 'number' && s.coolantC >= 105);
  setVal('gearVal', s.gear || '-');
  setVal('batVal', s.akbQuvvati ? s.akbQuvvati + 'V' : '-', s.akbQuvvati && parseFloat(s.akbQuvvati) < 11.8);
  setVal('accVal', s.accOn === 'ACC_HIGH' ? 'HIGH' : s.accOn === undefined && s.mator === undefined ? '-' : engineOn ? 'ON' : 'OFF');

  const cd = $('countdown');
  if (engineOn && typeof s.autoStartRemainingSec === 'number' && s.autoStartRemainingSec > 0) {
    const m = Math.floor(s.autoStartRemainingSec / 60);
    const sec = String(s.autoStartRemainingSec % 60).padStart(2, '0');
    cd.textContent = m + ':' + sec;
    cd.hidden = false;
  } else {
    cd.hidden = true;
  }
}

function setVal(id, text, isAlert) {
  const el = $(id);
  el.textContent = text;
  el.classList.toggle('alert', !!isAlert);
}

function fmtTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const hm = d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return hm;
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' }) + ' ' + hm;
}

function fmtHistTime(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return p(d.getDate()) + '.' + p(d.getMonth() + 1) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
}

function renderAlerts() {
  const ul = $('alertList');
  ul.textContent = '';
  if (!state.alerts.length) {
    const li = document.createElement('li'); li.className = 'muted'; li.textContent = "Hozircha yo'q"; ul.appendChild(li);
    return;
  }
  for (const a of state.alerts.slice(0, 5)) {
    const li = document.createElement('li');
    if (a.type === 'alert') li.className = 'alert-item';
    const t = document.createElement('span'); t.textContent = a.reason;
    const tm = document.createElement('span'); tm.className = 't'; tm.textContent = fmtTime(a.ts);
    li.append(t, tm);
    ul.appendChild(li);
  }
}

// ---------------- Joylashuv ----------------
const LOC_ERRORS = {
  not_found: "Atrofdagi Wi-Fi tarmoqlar bazada topilmadi - bu joyda aniqlab bo'lmadi.",
  few_networks: "Mashina atrofida Wi-Fi tarmoq topilmadi.",
  too_soon: "Biroz kuting va qayta urinib ko'ring.",
  timeout: "Mashinadan javob kelmadi.",
};

function renderLocation() {
  const loc = state.location;
  if (!loc) {
    $('locText').textContent = 'Hali aniqlanmagan';
    $('locMapWrap').hidden = true;
    $('locLinks').hidden = true;
    return;
  }
  const acc = loc.accuracy ? `±${loc.accuracy} m aniqlik` : '';
  $('locText').textContent = [fmtTime(loc.ts) + ' da aniqlangan', acc].filter(Boolean).join(' · ');
  const lat = loc.lat.toFixed(6);
  const lon = loc.lon.toFixed(6);
  // Ko'rinadigan maydon aniqlikka qarab (kamida ~300 m).
  const radiusM = Math.max((loc.accuracy || 0) * 3, 300);
  const dLat = radiusM / 111000;
  const dLon = dLat / Math.max(Math.cos((loc.lat * Math.PI) / 180), 0.2);
  const bbox = [loc.lon - dLon, loc.lat - dLat, loc.lon + dLon, loc.lat + dLat].map((v) => v.toFixed(5)).join(',');
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
  if ($('locMap').getAttribute('src') !== src) $('locMap').setAttribute('src', src);
  $('locGoogle').href = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  $('locYandex').href = `https://yandex.uz/maps/?pt=${lon},${lat}&z=17&l=map`;
  $('locMapWrap').hidden = false;
  $('locLinks').hidden = false;
}

function setLocPending(on) {
  clearTimeout(state.locPendingTimer);
  state.locPendingTimer = on ? setTimeout(() => {
    state.locPendingTimer = null;
    showLocError('timeout');
  }, 30000) : null;
  if (on) {
    $('locError').textContent = "Aniqlanmoqda… (10–20 soniya)";
    $('locError').hidden = false;
  }
  updateConnPill();
}

function showLocError(reason) {
  setLocPending(false);
  $('locError').textContent = LOC_ERRORS[reason] || "Joyni aniqlab bo'lmadi.";
  $('locError').hidden = false;
}

$('locRefresh').addEventListener('click', () => {
  if (send({ type: 'cmd', cmd: 'RequestLocation' })) setLocPending(true);
  else toast("Server bilan aloqa yo'q", true);
});

function renderHistory(events) {
  const ul = $('historyList');
  ul.textContent = '';
  if (!events || !events.length) {
    const li = document.createElement('li'); li.className = 'muted'; li.textContent = "Tarix bo'sh"; ul.appendChild(li);
    return;
  }
  for (const e of events) {
    const li = document.createElement('li');
    const tm = document.createElement('span'); tm.className = 't'; tm.textContent = fmtHistTime(e.ts);
    const t = document.createElement('span'); t.textContent = e.event;
    li.append(tm, t);
    ul.appendChild(li);
  }
}

// ---------------- WebSocket ----------------
// Faqat server kirishni tasdiqlagach (auth_ok). Aks holda ulanish ochilgan
// zahoti (auth hali yuborilmay turib) ketgan buyruqni server "noto'g'ri kirish
// xabari" deb rad etadi va ilova hisobdan chiqib ketadi.
function send(obj) {
  if (state.authed && state.ws && state.ws.readyState === WebSocket.OPEN) {
    state.ws.send(JSON.stringify(obj));
    return true;
  }
  return false;
}

function connect() {
  clearTimeout(state.reconnectTimer);
  if (!state.creds) return;
  if (state.ws && (state.ws.readyState === WebSocket.OPEN || state.ws.readyState === WebSocket.CONNECTING)) return;
  state.manualClose = false;
  state.authed = false;
  updateConnPill();

  let ws;
  try { ws = new WebSocket(SERVER_URL); } catch { scheduleReconnect(); return; }
  state.ws = ws;

  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: 'auth',
      role: 'app',
      login: state.creds.login,
      password: state.creds.password,
      masterPassword: state.creds.id,
      deviceId: deviceId(),
      deviceName: deviceName(),
    }));
  };

  ws.onmessage = (e) => {
    let msg;
    try { msg = JSON.parse(e.data); } catch { return; }
    handleMessage(msg);
  };

  ws.onclose = () => {
    if (state.ws !== ws) return;  // eski ulanishning kech kelgan hodisasi
    state.ws = null;
    state.authed = false;
    updateConnPill();
    if (!state.manualClose) scheduleReconnect();
  };
  ws.onerror = () => { /* onclose keyin keladi */ };
}

function scheduleReconnect() {
  clearTimeout(state.reconnectTimer);
  if (!state.creds) return;
  state.reconnectTimer = setTimeout(connect, state.reconnectDelay);
  state.reconnectDelay = Math.min(state.reconnectDelay * 2, 30000);
}

function handleMessage(msg) {
  switch (msg.type) {
    case 'auth_ok':
      state.authed = true;
      state.reconnectDelay = 2000;
      // ID ni server kirishda tekshiradi - qurilmaga alohida tasdiq kerak emas.
      send({ type: 'cmd', cmd: 'RequestStatus' });
      updateConnPill();
      break;
    case 'auth_error': {
      const fatal = FATAL_AUTH[msg.reason];
      if (fatal) {
        state.manualClose = true;
        if (state.ws) state.ws.close();
        logoutLocal(fatal);
      }
      break;
    }
    case 'device_status':
      state.deviceOnline = !!msg.online;
      updateConnPill();
      if (msg.online) {
        send({ type: 'cmd', cmd: 'RequestStatus' });
      }
      break;
    case 'push_config':
      state.pushPublicKey = msg.publicKey;
      refreshPushUi(undefined, true);  // mavjud obunani serverga bir marta eslatamiz
      break;
    case 'status':
      state.deviceOnline = true;
      Object.assign(state.status, msg);
      state.statusAt = Date.now();
      updateConnPill();
      renderStatus();
      if (!$('page-general').hidden) renderWifiNow();
      break;
    case 'alert':
    case 'notice':
      if (msg.reason) {
        state.alerts.unshift({ type: msg.type, reason: msg.reason, ts: Date.now() });
        state.alerts = state.alerts.slice(0, 20);
        renderAlerts();
        if (msg.type === 'alert' && document.visibilityState === 'visible') startRing(msg.reason);
        else toast(msg.reason, msg.type === 'alert');
      }
      break;
    case 'history':
      renderHistory(msg.events);
      break;
    case 'location':
      if (Number.isFinite(msg.lat) && Number.isFinite(msg.lon)) {
        state.location = { lat: msg.lat, lon: msg.lon, accuracy: msg.accuracy, ts: msg.ts || Date.now() };
        if (state.locPendingTimer) setLocPending(false);
        $('locError').hidden = true;
        renderLocation();
      }
      break;
    case 'location_error':
      // Faqat o'zimiz so'raganda ko'rsatamiz - avtomatik (qulflanganda va h.k.)
      // skanerlash xatosi eski ma'lum joyni ko'rsatib turishga xalaqit bermasin.
      if (state.locPendingTimer) showLocError(msg.reason);
      break;
    case 'devices':
      renderDevices(msg.items);
      break;
    case 'device_remove_result':
      onDeviceRemoveResult(msg);
      break;
    case 'master_password_result':
      onMasterPasswordResult(msg);
      break;
    case 'push_subscribe_result':
      refreshPushUi(msg.ok ? 'Yoqilgan' : "Serverda saqlanmadi");
      break;
    default:
      break;
  }
}

// ---------------- Kirish / chiqish ----------------
function enterMain() {
  showView('main');
  $('loginShown').textContent = state.creds.login;
  updateConnPill();
  renderStatus();
  renderAlerts();
  showInstallHint();
  registerSw();
}

function logoutLocal(errorText) {
  clearTimeout(state.reconnectTimer);
  state.creds = null;
  state.status = {};
  state.alerts = [];
  state.location = null;
  setLocPending(false);
  $('locError').hidden = true;
  renderLocation();
  clearCreds();
  closeAllPages();
  showView('login');
  const err = $('loginError');
  err.textContent = errorText || '';
  err.hidden = !errorText;
  $('loginBtn').disabled = false;
}

$('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const login = $('loginInput').value.trim();
  const password = $('passwordInput').value;
  const id = $('idInput').value;
  if (!login || !password || !id) {
    $('loginError').textContent = "Login, parol va ID ni to'liq kiriting.";
    $('loginError').hidden = false;
    return;
  }
  $('loginError').hidden = true;
  $('loginBtn').disabled = true;
  state.creds = { login, password, id };
  saveCreds(state.creds);
  state.reconnectDelay = 2000;
  if (state.ws) { state.manualClose = true; state.ws.close(); state.ws = null; }
  enterMain();
  connect();
});

$('logoutBtn').addEventListener('click', async () => {
  const ok = await askConfirm('Hisobdan chiqish? Bu telefonga ogohlantirishlar kelmay qoladi.');
  if (!ok) return;
  let endpoint = null;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    const sub = await reg?.pushManager?.getSubscription();
    if (sub) { endpoint = sub.endpoint; await sub.unsubscribe(); }
  } catch { /* e'tiborsiz */ }
  send({ type: 'logout', pushEndpoint: endpoint });
  state.manualClose = true;
  if (state.ws) state.ws.close();
  logoutLocal();
});

// ---------------- Buyruqlar ----------------
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-cmd]');
  if (!btn || btn.disabled) return;
  const cmd = btn.dataset.cmd;
  if (btn.dataset.confirm && !(await askConfirm(btn.dataset.confirm))) return;
  if (send({ type: 'cmd', cmd })) {
    toast('Yuborildi: ' + (btn.getAttribute('aria-label') || btn.textContent).replace(/\s+/g, ' ').trim());
    if (navigator.vibrate) navigator.vibrate(30);
  } else {
    toast("Server bilan aloqa yo'q", true);
  }
});

function askConfirm(text) {
  return new Promise((resolve) => {
    $('confirmText').textContent = text;
    $('confirmBox').hidden = false;
    const done = (v) => {
      $('confirmBox').hidden = true;
      $('confirmYes').onclick = null;
      $('confirmNo').onclick = null;
      resolve(v);
    };
    $('confirmYes').onclick = () => done(true);
    $('confirmNo').onclick = () => done(false);
  });
}

// ---------------- Sahifalar (Android: ☰ -> Sozlamalar -> ...) ----------------
const pageStack = [];
function openPage(name) {
  const el = $('page-' + name);
  if (!el) return;
  pageStack.forEach((p) => { $('page-' + p).hidden = true; });
  pageStack.push(name);
  el.hidden = false;
  el.scrollTop = 0;
  if (name === 'history') send({ type: 'cmd', cmd: 'GetHistory' });
  if (name === 'push') refreshPushUi();
  if (name === 'timer') fillTimerForm();
  if (name === 'general') renderWifiNow();
}
function closePage() {
  const cur = pageStack.pop();
  if (cur) $('page-' + cur).hidden = true;
  const prev = pageStack[pageStack.length - 1];
  if (prev) $('page-' + prev).hidden = false;
}
function closeAllPages() {
  while (pageStack.length) closePage();
}
$('menuBtn').addEventListener('click', () => openPage('menu'));
document.querySelectorAll('[data-page]').forEach((b) => b.addEventListener('click', () => openPage(b.dataset.page)));
document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', closePage));
$('historyRefresh').addEventListener('click', () => send({ type: 'cmd', cmd: 'GetHistory' }));

// Tungi rejim (Android'dagi "Световой режим") - shu telefonda eslab qolinadi.
const THEME_KEY = 'watchman.theme';
function applyTheme(dark) {
  $('mainView').classList.toggle('dark', dark);
  $('darkToggle').checked = dark;
  document.querySelector('meta[name="theme-color"]').setAttribute('content', dark ? '#000000' : '#141414');
}
$('darkToggle').addEventListener('change', (e) => {
  applyTheme(e.target.checked);
  try { localStorage.setItem(THEME_KEY, e.target.checked ? 'dark' : 'light'); } catch { /* e'tiborsiz */ }
});
try { applyTheme(localStorage.getItem(THEME_KEY) === 'dark'); } catch { applyTheme(false); }

// ---------------- AUX ikonkalari (Android: Sozlamalar -> AUX -> "Funksiyani tanlang") ----------------
// Tugma har doim o'z buyrug'ini (Aux 1/2/3) yuboradi - tanlov faqat ikonka va nomni o'zgartiradi.
const AUX_FUNCS = [
  { key: 'Aux 1', label: 'AUX 1', cls: 'ico-aux1' },
  { key: 'Aux 2', label: 'AUX 2', cls: 'ico-aux2' },
  { key: 'Aux 3', label: 'AUX 3', cls: 'ico-aux3' },
  { key: 'Signal', label: 'Signal', cls: 'ico-signal' },
  { key: 'Chiroqlar', label: 'Chiroqlar', cls: 'ico-fara' },
  { key: 'Lyuk', label: 'Lyuk', cls: 'ico-telefon' },
  { key: 'Yon oyna', label: 'Yon oyna', cls: 'ico-bakavoy' },
];
const AUX_KEY = 'watchman.auxIcons';
function loadAuxChoice() {
  const def = { 1: 'Aux 1', 2: 'Aux 2', 3: 'Aux 3' };
  try { return Object.assign(def, JSON.parse(localStorage.getItem(AUX_KEY) || '{}')); } catch { return def; }
}
function applyAuxIcons() {
  const choice = loadAuxChoice();
  document.querySelectorAll('[data-aux-slot]').forEach((el) => {
    const fn = AUX_FUNCS.find((x) => x.key === choice[el.dataset.auxSlot]) || AUX_FUNCS[0];
    el.className = 'mask ' + fn.cls;
    const btn = el.closest('[data-cmd]');
    if (btn) btn.setAttribute('aria-label', fn.label + ' (AUX ' + el.dataset.auxSlot + ')');
  });
}
let auxPickSlot = null;
document.querySelectorAll('[data-aux-pick]').forEach((b) => b.addEventListener('click', () => {
  auxPickSlot = b.dataset.auxPick;
  const current = loadAuxChoice()[auxPickSlot];
  const list = $('auxPickerList');
  list.textContent = '';
  for (const fn of AUX_FUNCS) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'pick-item';
    item.setAttribute('aria-pressed', fn.key === current ? 'true' : 'false');
    const r = document.createElement('span'); r.className = 'round small';
    const m = document.createElement('span'); m.className = 'mask ' + fn.cls;
    r.appendChild(m);
    item.append(r, document.createTextNode(fn.label));
    item.addEventListener('click', () => {
      const choice = loadAuxChoice();
      choice[auxPickSlot] = fn.key;
      try { localStorage.setItem(AUX_KEY, JSON.stringify(choice)); } catch { /* e'tiborsiz */ }
      applyAuxIcons();
      $('auxPicker').hidden = true;
    });
    list.appendChild(item);
  }
  $('auxPickerTitle').textContent = 'AUX ' + auxPickSlot + ': funksiyani tanlang';
  $('auxPicker').hidden = false;
}));
$('auxPickerClose').addEventListener('click', () => { $('auxPicker').hidden = true; });
applyAuxIcons();

// ---------------- Taymer (Android TimerSettingsFragment, buyruq SetTimers) ----------------
function fillTimerForm() {
  const s = state.status;
  const sec = (ms) => (typeof ms === 'number' ? String(Math.round(ms / 100) / 10) : '');
  $('tAux1').value = sec(s.tAux1Ms);
  $('tAux2').value = sec(s.tAux2Ms);
  $('tAux3').value = sec(s.tAux3Ms);
  $('tLock').value = sec(s.tLockMs);
  $('tAuto').value = typeof s.tAutoStartMin === 'number' ? String(s.tAutoStartMin) : '';
  $('timerError').hidden = true;
}
$('timerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const err = (t) => { $('timerError').textContent = t; $('timerError').hidden = false; };
  const secToMs = (id, name) => {
    const v = parseFloat($(id).value.replace(',', '.'));
    if (!(v >= 0.1 && v <= 30)) { err(name + ': 0.1 dan 30 soniyagacha kiriting'); return null; }
    return Math.round(v * 1000);
  };
  const aux1Ms = secToMs('tAux1', 'AUX 1'); if (aux1Ms === null) return;
  const aux2Ms = secToMs('tAux2', 'AUX 2'); if (aux2Ms === null) return;
  const aux3Ms = secToMs('tAux3', 'AUX 3'); if (aux3Ms === null) return;
  const lockMs = secToMs('tLock', 'Yopish'); if (lockMs === null) return;
  const autoStartMin = parseInt($('tAuto').value, 10);
  if (!(autoStartMin === 0 || (autoStartMin >= 5 && autoStartMin <= 30))) { err("Avtozapusk: 0 yoki 5 dan 30 daqiqagacha"); return; }
  $('timerError').hidden = true;
  if (send({ type: 'cmd', cmd: 'SetTimers', aux1Ms, aux2Ms, aux3Ms, lockMs, autoStartMin })) toast('Saqlandi');
  else toast("Server bilan aloqa yo'q", true);
});

// ---------------- Sozlamalar: WiFi (buyruq SetWifi) ----------------
function renderWifiNow() {
  const s = state.status;
  if (!s.wifiSsid) {
    $('wifiNow').textContent = "Hozir ulangan: noma'lum (qurilma hali ma'lumot yubormagan)";
    return;
  }
  let text = 'Hozir ulangan: ' + s.wifiSsid;
  if (typeof s.wifiRssi === 'number') {
    const q = s.wifiRssi >= -60 ? "a'lo" : s.wifiRssi >= -70 ? 'yaxshi' : s.wifiRssi >= -80 ? "o'rtacha" : 'zaif';
    text += '\n(signal: ' + q + ', ' + s.wifiRssi + ' dBm)';
  }
  $('wifiNow').textContent = text;
}
$('wifiForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const ssid = $('wifiSsid').value.trim();
  if (!ssid) { toast("Tarmoq nomi bo'sh - o'zgartirilmadi"); return; }
  if (!(await askConfirm('ESP32 "' + ssid + '" tarmog\'iga ulanadi. Parol noto\'g\'ri bo\'lsa, eski tarmoqqa qaytadi. Davom etilsinmi?'))) return;
  if (send({ type: 'cmd', cmd: 'SetWifi', wifiSsid: ssid, wifiPassword: $('wifiPass').value })) {
    toast('Yuborildi - qurilma yangi tarmoqqa ulanmoqda');
    $('wifiPass').value = '';
  } else {
    toast("Server bilan aloqa yo'q", true);
  }
});

// ---------------- Sozlamalar: ID ni o'zgartirish (buyruq SetMasterPassword) ----------------
let pendingNewId = null;
let idTimer = null;
$('idForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const err = (t) => { $('idError').textContent = t; $('idError').hidden = false; };
  const oldId = $('idOld').value, newId = $('idNew').value, newId2 = $('idNew2').value;
  if (!oldId || !newId) { err('Eski va yangi ID ni kiriting'); return; }
  if (newId !== newId2) { err('ID lar mos kelmadi'); return; }
  $('idError').hidden = true;
  if (!send({ type: 'cmd', cmd: 'SetMasterPassword', oldPassword: oldId, newPassword: newId })) {
    toast("Server bilan aloqa yo'q", true);
    return;
  }
  pendingNewId = newId;
  clearTimeout(idTimer);
  idTimer = setTimeout(() => {
    if (pendingNewId === null) return;
    pendingNewId = null;
    err('Javob kelmadi. Biroz kutib, qayta urinib ko\'ring.');
  }, 15000);
});
function onMasterPasswordResult(msg) {
  if (pendingNewId === null) return;  // bu telefon so'ramagan (yoki allaqachon javob olingan)
  clearTimeout(idTimer);
  if (msg.ok) {
    // Keyingi ulanishda yangi ID bilan kiriladi - aks holda server rad etardi.
    state.creds.id = pendingNewId;
    saveCreds(state.creds);
    ['idOld', 'idNew', 'idNew2'].forEach((id) => { $(id).value = ''; });
    toast("ID o'zgartirildi");
  } else {
    $('idError').textContent = msg.reason === 'demo' ? "Demo hisobda ID ni o'zgartirib bo'lmaydi" : "Eski ID noto'g'ri";
    $('idError').hidden = false;
  }
  pendingNewId = null;
}

// ---------------- Sozlamalar: Qurilmalar (devices_list / device_remove) ----------------
let devRemoveTarget = null;
$('devicesBtn').addEventListener('click', () => {
  if (!send({ type: 'devices_list' })) { toast("Server bilan aloqa yo'q", true); return; }
  $('devicesList').innerHTML = '<li class="muted">Yuklanmoqda…</li>';
  $('devRemoveForm').hidden = true;
  $('devicesBox').hidden = false;
});
$('devicesClose').addEventListener('click', () => { $('devicesBox').hidden = true; });
$('devRemoveCancel').addEventListener('click', () => { $('devRemoveForm').hidden = true; devRemoveTarget = null; });

function renderDevices(items) {
  const ul = $('devicesList');
  ul.textContent = '';
  items = Array.isArray(items) ? items : [];
  const online = items.filter((d) => d.online).length;
  $('devicesTitle').textContent = 'Ulangan qurilmalar: ' + items.length + ' (onlayn: ' + online + ')';
  if (!items.length) {
    const li = document.createElement('li'); li.className = 'muted'; li.textContent = "Ro'yxat bo'sh"; ul.appendChild(li);
    return;
  }
  for (const d of items) {
    const li = document.createElement('li');
    const info = document.createElement('div');
    const name = document.createElement('div'); name.className = 'dev-name';
    name.textContent = (d.name || 'Noma\'lum telefon') + (d.current ? ' (shu telefon)' : '');
    const sub = document.createElement('div'); sub.className = 'dev-sub';
    if (d.online) { sub.textContent = 'onlayn'; sub.classList.add('on'); }
    else sub.textContent = d.lastSeen ? 'oxirgi: ' + fmtTime(d.lastSeen) : 'oflayn';
    info.append(name, sub);
    li.appendChild(info);
    if (!d.current) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'btn small-danger'; b.textContent = "O'chirish";
      b.addEventListener('click', () => {
        devRemoveTarget = d.deviceId;
        $('devRemoveText').textContent = '"' + (d.name || 'Telefon') + '" hisobdan o\'chirilsinmi? Tasdiqlash uchun ID ni kiriting.';
        $('devRemoveId').value = '';
        $('devRemoveError').hidden = true;
        $('devRemoveForm').hidden = false;
        $('devRemoveId').focus();
      });
      li.appendChild(b);
    }
    ul.appendChild(li);
  }
}
$('devRemoveForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = $('devRemoveId').value;
  if (!devRemoveTarget || !id) { $('devRemoveError').textContent = 'ID ni kiriting'; $('devRemoveError').hidden = false; return; }
  if (!send({ type: 'device_remove', deviceId: devRemoveTarget, masterPassword: id })) toast("Server bilan aloqa yo'q", true);
});
const DEV_REMOVE_ERRORS = {
  wrong_id: "ID noto'g'ri",
  self: "Shu telefonni o'chirib bo'lmaydi",
  too_many_attempts: "Ko'p marta xato kiritildi - 1 daqiqadan keyin urinib ko'ring",
  not_found: 'Qurilma topilmadi',
};
function onDeviceRemoveResult(msg) {
  if (msg.ok) {
    toast("Qurilma o'chirildi");
    $('devRemoveForm').hidden = true;
    devRemoveTarget = null;
  } else {
    $('devRemoveError').textContent = DEV_REMOVE_ERRORS[msg.reason] || "O'chirib bo'lmadi";
    $('devRemoveError').hidden = false;
  }
}

// ---------------- O'rnatish va push ----------------
function isIos() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }
function isStandalone() { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }

function showInstallHint() {
  $('installHint').hidden = !(isIos() && !isStandalone());
}

let swReg = null;
async function registerSw() {
  if (!('serviceWorker' in navigator) || swReg) return swReg;
  try { swReg = await navigator.serviceWorker.register('sw.js'); } catch { swReg = null; }
  refreshPushUi();
  return swReg;
}

function urlB64ToUint8Array(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

// resend=true faqat ulanish paytida (push_config) - aks holda
// push_subscribe -> push_subscribe_result -> refreshPushUi aylanib qolardi.
async function refreshPushUi(note, resend = false) {
  const st = $('pushStatus');
  const btn = $('pushBtn');
  btn.hidden = true;
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    st.textContent = isIos() && !isStandalone()
      ? "Avval ilovani ekranga qo'shing (Ulashish → \"Ekranga qo'shish\"), keyin shu yerdan yoqing. iOS 16.4 yoki yangisi kerak."
      : "Bu brauzer push-bildirishnomalarni qo'llamaydi.";
    return;
  }
  if (!state.pushPublicKey) {
    st.textContent = 'Server bildirishnomalarni hali qo\'llamaydi yoki ulanish kutilmoqda.';
    return;
  }
  if (Notification.permission === 'denied') {
    st.textContent = "Bildirishnomalar taqiqlangan. iPhone Sozlamalar → Bildirishnomalar → WATCHMAN dan ruxsat bering.";
    return;
  }
  const reg = swReg || await registerSw();
  const sub = reg ? await reg.pushManager.getSubscription() : null;
  if (sub && Notification.permission === 'granted') {
    st.textContent = note || 'Yoqilgan - ogohlantirishlar ilova yopiq bo\'lsa ham keladi.';
    if (resend) send({ type: 'push_subscribe', subscription: sub.toJSON() });
    return;
  }
  st.textContent = "O'chiq. Ogohlantirishlar faqat ilova ochiq bo'lganda ko'rinadi.";
  btn.hidden = false;
}

$('pushBtn').addEventListener('click', async () => {
  // iOS ruxsat so'rovini faqat foydalanuvchi bosganda ko'rsatadi.
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { refreshPushUi(); return; }
    const reg = swReg || await registerSw();
    if (!reg) { toast("Bildirishnomani yoqib bo'lmadi", true); return; }
    await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(state.pushPublicKey),
    });
    send({ type: 'push_subscribe', subscription: sub.toJSON() });
    $('pushStatus').textContent = 'Saqlanmoqda…';
  } catch (err) {
    toast("Bildirishnomani yoqib bo'lmadi: " + (err && err.message ? err.message : err), true);
    refreshPushUi();
  }
});

// ---------------- Qo'ng'iroq signali (faqat ilova ochiq bo'lganda) ----------------
// iOS veb-push ovozini o'zgartirib bo'lmaydi, shuning uchun signal ilova ichida
// Web Audio bilan hosil qilinadi. iOS ovozni faqat foydalanuvchi bir marta
// ekranga tekkandan keyin ruxsat beradi - birinchi tegishda "ochib" qo'yamiz.
const RING_MAX_MS = 60000;
let audioCtx = null;
let ringTimer = null;
let ringStopTimer = null;

function unlockAudio() {
  try {
    // Safari 17+: ovozsiz (silent) rejimda ham chalishi uchun.
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // iOS uchun: gesture ichida qisqa jim tovush chalib kontekstni faollashtiramiz.
    const b = audioCtx.createBuffer(1, 1, 22050);
    const s = audioCtx.createBufferSource();
    s.buffer = b; s.connect(audioCtx.destination); s.start(0);
  } catch { /* ovoz yo'q - faqat oyna ko'rsatiladi */ }
}
['pointerdown', 'touchend', 'keydown'].forEach((ev) => document.addEventListener(ev, unlockAudio, { passive: true }));

// Bitta "jiring": 440+480 Hz (klassik telefon qo'ng'irog'i), 0.4s ovoz, 0.2s pauza, 0.4s ovoz.
function ringBurst() {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime + 0.02;
  const gain = audioCtx.createGain();
  gain.gain.value = 0;
  gain.connect(audioCtx.destination);
  for (const f of [440, 480]) {
    const o = audioCtx.createOscillator();
    o.type = 'square';
    o.frequency.value = f;
    o.connect(gain);
    o.start(t0);
    o.stop(t0 + 1.05);
  }
  for (const [on, off] of [[0, 0.4], [0.6, 1.0]]) {
    gain.gain.setValueAtTime(0, t0 + on);
    gain.gain.linearRampToValueAtTime(0.35, t0 + on + 0.01);
    gain.gain.setValueAtTime(0.35, t0 + off - 0.01);
    gain.gain.linearRampToValueAtTime(0, t0 + off);
  }
}

function startRing(reason) {
  $('ringText').textContent = reason;
  $('ringBox').hidden = false;
  if (ringTimer) return;  // allaqachon chalmoqda - faqat matn yangilanadi
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  ringBurst();
  if (navigator.vibrate) navigator.vibrate([400, 200, 400]);
  ringTimer = setInterval(() => {
    ringBurst();
    if (navigator.vibrate) navigator.vibrate([400, 200, 400]);
  }, 2500);
  ringStopTimer = setTimeout(() => stopRing(false), RING_MAX_MS);
}

function stopRing(hideBox = true) {
  clearInterval(ringTimer);
  clearTimeout(ringStopTimer);
  ringTimer = null;
  if (hideBox) $('ringBox').hidden = true;
}
$('ringStop').addEventListener('click', () => stopRing());
$('ringTest').addEventListener('click', () => startRing('Sinov: signal shunday chaladi'));

// iOS fonda WebSocket'ni uzadi - ilovaga qaytganda darhol qayta ulanamiz.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') stopRing(false);
  if (document.visibilityState === 'visible' && state.creds) {
    state.reconnectDelay = 2000;
    if (!state.ws) connect();
    else send({ type: 'cmd', cmd: 'RequestStatus' });
  }
});
window.addEventListener('online', () => { if (state.creds && !state.ws) connect(); });

// ---------------- Boshlash ----------------
state.creds = loadCreds();
if (state.creds) {
  enterMain();
  connect();
} else {
  showView('login');
}
