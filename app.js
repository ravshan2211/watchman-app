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
  p.className = 'pill ' + kind;
  p.textContent = text;
  document.querySelectorAll('[data-cmd]').forEach((b) => { b.disabled = !(state.authed && state.deviceOnline); });
}

function updateConnPill() {
  if (!state.authed) setConn('wait', 'Ulanmoqda…');
  else if (!state.deviceOnline) setConn('bad', 'Mashina oflayn');
  else setConn('ok', 'Mashina onlayn');
}

function yes(v) { return typeof v === 'string' ? /ochiq|yoqilgan|toldirilgan/i.test(v) : !!v; }

function renderStatus() {
  const s = state.status;
  const guardOn = s.quriqlash !== undefined ? /yoqilgan/i.test(s.quriqlash) : null;
  $('guardText').textContent = guardOn === null ? '—' : guardOn ? "Qo'riqlashda" : "Qo'riqlash o'chiq";

  const engineOn = s.mator !== undefined ? /toldirilgan/i.test(s.mator) : s.accOn === true;
  const badge = $('engineBadge');
  badge.className = 'badge ' + (engineOn ? 'on' : 'off');
  badge.textContent = engineOn ? 'Dvigatel ishlayapti' : s.accOn === 'ACC_HIGH' ? 'Kontakt yoniq' : "Dvigatel o'chiq";

  const doorsOpen = s.doorsOpen !== undefined ? s.doorsOpen : s.avtoulov !== undefined ? yes(s.avtoulov) : null;
  setVal('doorsVal', doorsOpen === null ? '—' : doorsOpen ? 'Ochiq' : 'Yopiq', doorsOpen);
  const trunkOpen = s.bagajHolati !== undefined ? /ochiq/i.test(s.bagajHolati) : null;
  setVal('trunkVal', trunkOpen === null ? '—' : trunkOpen ? 'Ochiq' : 'Yopiq', trunkOpen);
  setVal('gearVal', s.gear || '—');
  setVal('batVal', s.akbQuvvati ? s.akbQuvvati + ' V' : '—', s.akbQuvvati && parseFloat(s.akbQuvvati) < 11.8);
  setVal('tempVal', typeof s.coolantC === 'number' ? s.coolantC + ' °C' : '—', typeof s.coolantC === 'number' && s.coolantC >= 105);
  const lamp = s.turnSignal && s.turnSignal !== "o'chiq" ? s.turnSignal : s.hazardOn ? 'avariya' : "o'chiq";
  setVal('lampVal', s.turnSignal !== undefined || s.hazardOn !== undefined ? lamp : '—', lamp === 'avariya');

  const line = $('autostartLine');
  if (typeof s.autoStartRemainingSec === 'number' && s.autoStartRemainingSec > 0) {
    const m = Math.floor(s.autoStartRemainingSec / 60);
    const sec = String(s.autoStartRemainingSec % 60).padStart(2, '0');
    line.textContent = `Avtozapusk: ${m}:${sec} dan keyin o'chadi`;
    line.hidden = false;
  } else {
    line.hidden = true;
  }
  $('updatedLine').textContent = state.statusAt ? 'Yangilangan: ' + fmtTime(state.statusAt) : '';
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

function renderHistory(events) {
  const ul = $('historyList');
  ul.textContent = '';
  if (!events || !events.length) {
    const li = document.createElement('li'); li.className = 'muted'; li.textContent = "Tarix bo'sh"; ul.appendChild(li);
    return;
  }
  for (const e of events) {
    const li = document.createElement('li');
    const t = document.createElement('span'); t.textContent = e.event;
    const tm = document.createElement('span'); tm.className = 't'; tm.textContent = fmtTime(e.ts);
    li.append(t, tm);
    ul.appendChild(li);
  }
}

// ---------------- WebSocket ----------------
function send(obj) {
  if (state.ws && state.ws.readyState === WebSocket.OPEN) {
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
      // Qurilma buyruqlarni faqat ID tasdiqlangandan keyin bajaradi.
      send({ type: 'cmd', cmd: 'VerifyMasterPassword', password: state.creds.id });
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
      if (msg.online) send({ type: 'cmd', cmd: 'RequestStatus' });
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
      break;
    case 'alert':
    case 'notice':
      if (msg.reason) {
        state.alerts.unshift({ type: msg.type, reason: msg.reason, ts: Date.now() });
        state.alerts = state.alerts.slice(0, 20);
        renderAlerts();
        toast(msg.reason, msg.type === 'alert');
      }
      break;
    case 'history':
      renderHistory(msg.events);
      break;
    case 'master_password_result':
      if (!msg.ok) toast("Mashina ID ni tasdiqlamadi - buyruqlar bajarilmaydi. ID ni tekshiring.", true);
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
  clearCreds();
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
    toast('Yuborildi: ' + btn.textContent.replace(/\s+/g, ' ').trim());
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

// ---------------- Tablar ----------------
document.querySelectorAll('.tabbtn').forEach((b) => {
  b.addEventListener('click', () => {
    const tab = b.dataset.tab;
    document.querySelectorAll('.tabbtn').forEach((x) => {
      const on = x === b;
      x.classList.toggle('active', on);
      x.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('.tab').forEach((t) => { t.hidden = t.id !== 'tab-' + tab; });
    if (tab === 'history') send({ type: 'cmd', cmd: 'GetHistory' });
    if (tab === 'settings') refreshPushUi();
  });
});
$('historyRefresh').addEventListener('click', () => send({ type: 'cmd', cmd: 'GetHistory' }));

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

// iOS fonda WebSocket'ni uzadi - ilovaga qaytganda darhol qayta ulanamiz.
document.addEventListener('visibilitychange', () => {
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
