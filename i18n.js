// Sozlamalar bo'limi tarjimalari: o'zbek / rus / ingliz (AQSh).
// HTML: data-i18n="kalit" (matn), data-i18n-aria="kalit" (aria-label). JS: t('kalit', ...qiymatlar).
// Tanlangan til localStorage'da ('watchman.lang') saqlanadi, standart - o'zbek.
'use strict';

const LANG_KEY = 'watchman.lang';
const LANGS = ['uz', 'ru', 'en'];
const LOCALES = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };

const I18N = {
  back: ['Orqaga', 'Назад', 'Back'],
  settings: ['Sozlamalar', 'Настройки', 'Settings'],
  darkMode: ['Tungi rejim', 'Ночной режим', 'Dark mode'],
  timer: ['Taymer', 'Таймер', 'Timer'],
  autostart: ['Avtozapusk', 'Автозапуск', 'Remote start'],
  history: ['Komandalar', 'Команды', 'Commands'],
  location: ['Joylashuv', 'Местоположение', 'Location'],
  push: ['Bildirishnomalar', 'Уведомления', 'Notifications'],
  language: ['Til', 'Язык', 'Language'],
  logout: ['Chiqish', 'Выйти', 'Log out'],
  privacy: ['Maxfiylik siyosati', 'Политика конфиденциальности', 'Privacy policy'],
  save: ['Saqlash', 'Сохранить', 'Save'],
  saved: ['Saqlandi', 'Сохранено', 'Saved'],
  noServer: ["Server bilan aloqa yo'q", 'Нет связи с сервером', 'No connection to the server'],
  refresh: ['Yangilash', 'Обновить', 'Refresh'],
  loading: ['Yuklanmoqda…', 'Загрузка…', 'Loading…'],
  close: ['Yopish', 'Закрыть', 'Close'],
  cancel: ['Bekor qilish', 'Отмена', 'Cancel'],
  yes: ['Ha', 'Да', 'Yes'],
  noFw: ["Mashinadagi dastur hali bu funksiyani qo'llamaydi - u yangilangach ishlaydi.",
    'Прошивка в машине ещё не поддерживает эту функцию — заработает после обновления.',
    'The car firmware does not support this yet - it will work after the update.'],
  noPin: ['Bu rele hali ulanmagan - usta uni ESP32 ga ulab, pinini belgilashi kerak.',
    'Это реле ещё не подключено — мастер должен подключить его к ESP32 и указать пин.',
    'This relay is not connected yet - the installer must wire it to the ESP32 and set its pin.'],

  // Komandalar
  lastAlerts: ['Oxirgi ogohlantirishlar', 'Последние оповещения', 'Recent alerts'],
  noneYet: ["Hozircha yo'q", 'Пока нет', 'None yet'],
  historyEmpty: ["Tarix bo'sh", 'История пуста', 'History is empty'],

  // Joylashuv
  locNone: ['Hali aniqlanmagan', 'Ещё не определено', 'Not located yet'],
  locAt: ['{0} da aniqlangan', 'Определено: {0}', 'Located at {0}'],
  locAcc: ['±{0} m aniqlik', 'точность ±{0} м', '±{0} m accuracy'],
  locPending: ['Aniqlanmoqda… (10–20 soniya)', 'Определяется… (10–20 секунд)', 'Locating… (10–20 seconds)'],
  locNotFound: ["Atrofdagi Wi-Fi tarmoqlar bazada topilmadi - bu joyda aniqlab bo'lmadi.",
    'Окружающие Wi-Fi сети не найдены в базе — здесь определить не удалось.',
    'Nearby Wi-Fi networks are not in the database - the location could not be found here.'],
  locFew: ['Mashina atrofida Wi-Fi tarmoq topilmadi.', 'Рядом с машиной не найдено Wi-Fi сетей.', 'No Wi-Fi networks were found around the car.'],
  locTooSoon: ["Biroz kuting va qayta urinib ko'ring.", 'Подождите немного и попробуйте снова.', 'Wait a moment and try again.'],
  locTimeout: ['Mashinadan javob kelmadi.', 'Машина не ответила.', 'The car did not respond.'],
  locFail: ["Joyni aniqlab bo'lmadi.", 'Не удалось определить местоположение.', 'Could not determine the location.'],
  locGoogle: ['Google xarita', 'Google Карты', 'Google Maps'],
  locYandex: ['Yandex xarita', 'Яндекс Карты', 'Yandex Maps'],

  // Taymer
  timerAux1: ['AUX 1 vaqti (soniya, 0.1 - 30)', 'Время AUX 1 (секунды, 0.1 - 30)', 'AUX 1 time (seconds, 0.1 - 30)'],
  timerAux2: ['AUX 2 vaqti (soniya, 0.1 - 30)', 'Время AUX 2 (секунды, 0.1 - 30)', 'AUX 2 time (seconds, 0.1 - 30)'],
  timerAux3: ['AUX 3 vaqti (soniya, 0.1 - 30)', 'Время AUX 3 (секунды, 0.1 - 30)', 'AUX 3 time (seconds, 0.1 - 30)'],
  timerLock: ['Yopish (Lock) vaqti (soniya, 0.1 - 30)', 'Время закрытия (Lock) (секунды, 0.1 - 30)', 'Lock time (seconds, 0.1 - 30)'],
  timerAuto: ["Avtozapusk oralig'i (daqiqa, 5 - 30, 0 = o'chirilgan)", 'Длительность автозапуска (минуты, 5 - 30, 0 = выкл.)', 'Remote start duration (minutes, 5 - 30, 0 = off)'],
  lockWord: ['Yopish', 'Закрытие', 'Lock'],
  errSeconds: ['{0}: 0.1 dan 30 soniyagacha kiriting', '{0}: введите от 0.1 до 30 секунд', '{0}: enter 0.1 to 30 seconds'],
  errAutoMin: ['Avtozapusk: 0 yoki 5 dan 30 daqiqagacha', 'Автозапуск: 0 или от 5 до 30 минут', 'Remote start: 0 or 5 to 30 minutes'],

  // Avtozapusk bo'limlari (inglizchada asl nomlari qoladi)
  secTemp: ['Harorat', 'Температура', 'TEMP'],
  secCool: ['Sovutish', 'Охлаждение', 'COOL'],
  secHeat: ['Isitish', 'Обогрев', 'HEAT'],
  secSeats: ["O'rindiq", 'Сиденья', 'SEATS'],
  knopka: ['Tugma', 'Кнопка', 'BUTTON'],
  seatButton: ['Tugma', 'Кнопка', 'BUTTON'],
  seat1: ["O'rindiq 1", 'Сиденье 1', 'SEATS 1'],
  seat2: ["O'rindiq 2", 'Сиденье 2', 'SEATS 2'],
  seat3: ["O'rindiq 3", 'Сиденье 3', 'SEATS 3'],
  seat4: ["O'rindiq 4", 'Сиденье 4', 'SEATS 4'],

  // Avtozapusk -> TEMP
  tempByTemp: ["Harorat bo'yicha o'chirish", 'Выключение по температуре', 'Stop by temperature'],
  tempLabel: ['Harorat (°C, 60 - 99)', 'Температура (°C, 60 - 99)', 'Temperature (°C, 60 - 99)'],
  tempErr: ['Haroratni 60 dan 99 gacha kiriting', 'Введите температуру от 60 до 99', 'Enter a temperature from 60 to 99'],

  // Sozlamalar (umumiy)
  devices: ['Qurilmalar', 'Устройства', 'Devices'],
  devicesHint: ["Shu hisobga ulangan telefonlar. Ortiqchasini ID bilan o'chirish mumkin.",
    'Телефоны, подключённые к этому аккаунту. Лишние можно удалить с помощью ID.',
    'Phones connected to this account. Extra ones can be removed with the ID.'],
  wifiUnknown: ["Hozir ulangan: noma'lum (qurilma hali ma'lumot yubormagan)", 'Сейчас подключено: неизвестно (устройство ещё не прислало данные)', 'Connected now: unknown (the device has not reported yet)'],
  wifiNow: ['Hozir ulangan: {0}', 'Сейчас подключено: {0}', 'Connected now: {0}'],
  wifiSignal: ['(signal: {0}, {1} dBm)', '(сигнал: {0}, {1} дБм)', '(signal: {0}, {1} dBm)'],
  sigExcellent: ["a'lo", 'отличный', 'excellent'],
  sigGood: ['yaxshi', 'хороший', 'good'],
  sigFair: ["o'rtacha", 'средний', 'fair'],
  sigWeak: ['zaif', 'слабый', 'weak'],
  wifiSsidLabel: ["Tarmoq nomi (SSID) - o'zgartirmoqchi bo'lmasangiz bo'sh qoldiring", 'Имя сети (SSID) — оставьте пустым, если не меняете', 'Network name (SSID) - leave empty to keep the current one'],
  wifiPassLabel: ['WiFi paroli', 'Пароль WiFi', 'WiFi password'],
  wifiEmpty: ["Tarmoq nomi bo'sh - o'zgartirilmadi", 'Имя сети пустое — не изменено', 'Network name is empty - not changed'],
  wifiSent: ['Yuborildi - qurilma yangi tarmoqqa ulanmoqda', 'Отправлено — устройство подключается к новой сети', 'Sent - the device is connecting to the new network'],
  idTitle: ["ID ni o'zgartirish", 'Смена ID', 'Change ID'],
  idOld: ['Eski ID', 'Старый ID', 'Current ID'],
  idNew: ['Yangi ID', 'Новый ID', 'New ID'],
  idNew2: ['Yangi ID ni tasdiqlang', 'Подтвердите новый ID', 'Confirm the new ID'],
  idErrEmpty: ['Eski va yangi ID ni kiriting', 'Введите старый и новый ID', 'Enter the current and the new ID'],
  idErrMatch: ['ID lar mos kelmadi', 'ID не совпадают', 'The IDs do not match'],
  idNoReply: ["Javob kelmadi. Biroz kutib, qayta urinib ko'ring.", 'Ответа нет. Подождите и попробуйте снова.', 'No response. Wait a moment and try again.'],
  idChanged: ["ID o'zgartirildi", 'ID изменён', 'ID changed'],
  idDemo: ["Demo hisobda ID ni o'zgartirib bo'lmaydi", 'В демо-аккаунте ID изменить нельзя', 'The ID cannot be changed on the demo account'],
  idOffline: ["Mashina oflayn - ID o'zgartirilmadi. Mashina internetga ulanganda qayta urinib ko'ring", 'Машина офлайн — ID не изменён. Попробуйте снова, когда машина будет в сети', 'The car is offline - the ID was not changed. Try again when the car is online'],
  idTimeout: ["Mashina javob bermadi - ID o'zgartirilmadi. Qayta urinib ko'ring", 'Машина не ответила — ID не изменён. Попробуйте снова', 'The car did not respond - the ID was not changed. Try again'],
  idRejected: ["Mashina ID ni qabul qilmadi - ID o'zgartirilmadi", 'Машина не приняла ID — ID не изменён', 'The car did not accept the ID - the ID was not changed'],
  idBusy: ["ID o'zgartirilmoqda, biroz kuting", 'ID меняется, подождите', 'The ID is being changed, please wait'],
  idWrongOld: ["Eski ID noto'g'ri", 'Старый ID неверный', 'The current ID is wrong'],

  // Qurilmalar oynasi
  devTitle: ['Ulangan qurilmalar', 'Подключённые устройства', 'Connected devices'],
  devTitleN: ['Ulangan qurilmalar: {0} (onlayn: {1})', 'Подключённые устройства: {0} (онлайн: {1})', 'Connected devices: {0} (online: {1})'],
  devEmpty: ["Ro'yxat bo'sh", 'Список пуст', 'The list is empty'],
  devUnknown: ["Noma'lum telefon", 'Неизвестный телефон', 'Unknown phone'],
  devThis: [' (shu telefon)', ' (этот телефон)', ' (this phone)'],
  devOnline: ['onlayn', 'онлайн', 'online'],
  devOffline: ['oflayn', 'офлайн', 'offline'],
  devLast: ['oxirgi: {0}', 'последний раз: {0}', 'last seen: {0}'],
  devRemove: ["O'chirish", 'Удалить', 'Remove'],
  devPhone: ['Telefon', 'Телефон', 'Phone'],
  devAsk: ['"{0}" hisobdan o\'chirilsinmi? Tasdiqlash uchun ID ni kiriting.', 'Удалить «{0}» из аккаунта? Для подтверждения введите ID.', 'Remove "{0}" from the account? Enter the ID to confirm.'],
  devEnterId: ['ID ni kiriting', 'Введите ID', 'Enter the ID'],
  devRemoved: ["Qurilma o'chirildi", 'Устройство удалено', 'Device removed'],
  devFailed: ["O'chirib bo'lmadi", 'Не удалось удалить', 'Could not remove'],
  devWrongId: ["ID noto'g'ri", 'Неверный ID', 'Wrong ID'],
  devSelf: ["Shu telefonni o'chirib bo'lmaydi", 'Этот телефон удалить нельзя', 'This phone cannot be removed'],
  devTooMany: ["Ko'p marta xato kiritildi - 1 daqiqadan keyin urinib ko'ring", 'Слишком много ошибок — попробуйте через 1 минуту', 'Too many attempts - try again in 1 minute'],
  devNotFound: ['Qurilma topilmadi', 'Устройство не найдено', 'Device not found'],

  // Bildirishnomalar va signal
  pushEnable: ['Bildirishnomalarni yoqish', 'Включить уведомления', 'Enable notifications'],
  pushAddHome: ["Avval ilovani ekranga qo'shing (Ulashish → \"Ekranga qo'shish\"), keyin shu yerdan yoqing. iOS 16.4 yoki yangisi kerak.",
    'Сначала добавьте приложение на экран (Поделиться → «На экран „Домой“»), затем включите здесь. Нужна iOS 16.4 или новее.',
    'First add the app to your Home Screen (Share → "Add to Home Screen"), then enable it here. iOS 16.4 or later is required.'],
  pushUnsupported: ["Bu brauzer push-bildirishnomalarni qo'llamaydi.", 'Этот браузер не поддерживает push-уведомления.', 'This browser does not support push notifications.'],
  pushNoServer: ["Server bildirishnomalarni hali qo'llamaydi yoki ulanish kutilmoqda.", 'Сервер пока не поддерживает уведомления или ожидается подключение.', 'The server does not support notifications yet, or the connection is pending.'],
  pushDenied: ['Bildirishnomalar taqiqlangan. iPhone Sozlamalar → Bildirishnomalar → WATCHMAN dan ruxsat bering.', 'Уведомления запрещены. Разрешите их: Настройки iPhone → Уведомления → WATCHMAN.', 'Notifications are blocked. Allow them in iPhone Settings → Notifications → WATCHMAN.'],
  pushOn: ["Yoqilgan - ogohlantirishlar ilova yopiq bo'lsa ham keladi.", 'Включено — оповещения приходят, даже когда приложение закрыто.', 'On - alerts arrive even when the app is closed.'],
  pushOff: ["O'chiq. Ogohlantirishlar faqat ilova ochiq bo'lganda ko'rinadi.", 'Выключено. Оповещения видны, только когда приложение открыто.', 'Off. Alerts are shown only while the app is open.'],
  pushOnShort: ['Yoqilgan', 'Включено', 'On'],
  pushNotSaved: ['Serverda saqlanmadi', 'Не сохранено на сервере', 'Not saved on the server'],
  pushSaving: ['Saqlanmoqda…', 'Сохранение…', 'Saving…'],
  pushFailed: ["Bildirishnomani yoqib bo'lmadi", 'Не удалось включить уведомления', 'Could not enable notifications'],
  ringSound: ['Signal ovozi', 'Звук сигнала', 'Alarm sound'],
  ringHint: ["Ilova ochiq turganda ogohlantirish kelsa, telefon qo'ng'irog'idek jiringlaydi (1 daqiqagacha yoki \"To'xtatish\" bosilguncha).",
    'Если оповещение приходит при открытом приложении, телефон звонит как при вызове (до 1 минуты или пока не нажмёте «Остановить»).',
    'If an alert arrives while the app is open, the phone rings like a call (up to 1 minute or until you press "Stop").'],
  ringTest: ['Signalni sinash', 'Проверить сигнал', 'Test the alarm'],
  ringTestText: ['Sinov: signal shunday chaladi', 'Проверка: так звучит сигнал', 'Test: this is how the alarm sounds'],
  ringTitle: ['Ogohlantirish!', 'Тревога!', 'Alert!'],
  ringStop: ["To'xtatish", 'Остановить', 'Stop'],

  // Boshqa oynalar
  auxPick: ['Funksiyani tanlang', 'Выберите функцию', 'Choose a function'],
  auxPickN: ['AUX {0}: funksiyani tanlang', 'AUX {0}: выберите функцию', 'AUX {0}: choose a function'],
  logoutAsk: ['Hisobdan chiqish? Bu telefonga ogohlantirishlar kelmay qoladi.', 'Выйти из аккаунта? На этот телефон перестанут приходить оповещения.', 'Log out? This phone will stop receiving alerts.'],
};

function loadLang() {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (LANGS.includes(v)) return v;
  } catch { /* e'tiborsiz */ }
  return 'uz';
}
let currentLang = loadLang();

function t(key, ...args) {
  const row = I18N[key];
  let s = row ? row[LANGS.indexOf(currentLang)] : key;
  args.forEach((a, i) => { s = s.split('{' + i + '}').join(String(a)); });
  return s;
}

function locale() {
  return LOCALES[currentLang];
}

// Ichida boshqa element bo'lsa (masalan "›" belgisi) faqat birinchi matn qismi almashadi.
function applyI18n(root = document) {
  document.documentElement.lang = currentLang;
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const text = t(el.dataset.i18n);
    if (!el.children.length) { el.textContent = text; return; }
    const node = [...el.childNodes].find((n) => n.nodeType === 3 && n.nodeValue.trim());
    if (node) node.nodeValue = text + ' ';
  });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
}

function setLang(lang) {
  if (!LANGS.includes(lang)) return;
  currentLang = lang;
  try { localStorage.setItem(LANG_KEY, lang); } catch { /* e'tiborsiz */ }
  applyI18n();
}
