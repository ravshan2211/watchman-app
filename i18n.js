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
  cmdNoReply: ["Mashina bilan aloqa sekin - buyruq bekor qilindi. Qayta ulanguncha kuting, keyin bir marta bosing", 'Связь с машиной медленная - команда отменена. Дождитесь переподключения и нажмите один раз', 'Car connection is slow - command cancelled. Wait for reconnect, then press once'],
  cmdStale: ["Buyruq kechikib yetdi - bajarilmadi. Qayta bosing", 'Команда пришла с опозданием - не выполнена. Нажмите снова', 'Command arrived late - not executed. Press again'],
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
  secAkb: ['AKB', 'АКБ', 'BATTERY'],
  akbAutoCharge: ['Avtomatik zaryadlash', 'Автоподзарядка', 'Auto charging'],
  akbVLabel: ['Kuchlanish (V, 10.0 - 13.0)', 'Напряжение (В, 10.0 - 13.0)', 'Voltage (V, 10.0 - 13.0)'],
  akbSecLabel: ['Necha soniyadan keyin (5 - 3600)', 'Через сколько секунд (5 - 3600)', 'After how many seconds (5 - 3600)'],
  akbMinLabel: ['Necha daqiqa ishlaydi (1 - 60)', 'Сколько минут работает (1 - 60)', 'How many minutes it runs (1 - 60)'],
  akbVErr: ['Kuchlanish: 10.0 dan 13.0 V gacha kiriting', 'Напряжение: введите от 10.0 до 13.0 В', 'Voltage: enter 10.0 to 13.0 V'],
  akbSecErr: ['Soniya: 5 dan 3600 gacha butun son', 'Секунды: целое число от 5 до 3600', 'Seconds: a whole number from 5 to 3600'],
  akbMinErr: ['Daqiqa: 1 dan 60 gacha butun son', 'Минуты: целое число от 1 до 60', 'Minutes: a whole number from 1 to 60'],
  knopka: ['Tugma', 'Кнопка', 'BUTTON'],
  seatButton: ['Tugma', 'Кнопка', 'BUTTON'],
  seat1: ["O'rindiq 1", 'Сиденье 1', 'SEATS 1'],
  seat2: ["O'rindiq 2", 'Сиденье 2', 'SEATS 2'],
  seat3: ["O'rindiq 3", 'Сиденье 3', 'SEATS 3'],
  seat4: ["O'rindiq 4", 'Сиденье 4', 'SEATS 4'],

  countTo: ['{0}°C', '{0}°C', '{0}°C'],
  sirenIsOn: ['Sirena yoqiq', 'Сирена включена', 'Siren on'],
  sirenIsOff: ["Sirena o'chiq", 'Сирена выключена', 'Siren off'],
  lockCap: ['QULF', 'ЗАМОК', 'LOCK'],
  lockClosed: ['YOPIQ', 'ЗАКРЫТ', 'CLOSED'],
  lockOpen: ['OCHIQ', 'ОТКРЫТ', 'OPEN'],
  sirenTurnedOn: ['Sirena yoqildi', 'Сирена включена', 'Siren turned on'],
  sirenTurnedOff: ["Sirena o'chirildi - ovoz chiqmaydi", 'Сирена выключена — звука не будет', 'Siren turned off - no sound'],

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

// Service worker (push bildirishnomalar) localStorage'ni o'qiy olmaydi - til keshda ham saqlanadi.
const PREFS_CACHE = 'watchman-prefs';
function shareLangWithSw() {
  try { caches.open(PREFS_CACHE).then((c) => c.put('./lang', new Response(currentLang))).catch(() => {}); } catch { /* e'tiborsiz */ }
}

function setLang(lang) {
  if (!LANGS.includes(lang)) return;
  currentLang = lang;
  try { localStorage.setItem(LANG_KEY, lang); } catch { /* e'tiborsiz */ }
  shareLangWithSw();
  applyI18n();
}

// ---------------- Mashina va server xabarlari (komandalar tarixi, ogohlantirishlar, push) ----------------
// Firmware va server o'zbekcha matn yuboradi - ilova uni tanlangan tilga o'giradi.
// Noma'lum matn o'zgarmasdan ko'rsatiladi. Kalitlar kichik harfda solishtiriladi.
const EVENT_EXACT = {
  'yopish tugmasi bosildi': ['Нажата кнопка «Закрыть»', 'Lock button pressed'],
  'ochish tugmasi bosildi': ['Нажата кнопка «Открыть»', 'Unlock button pressed'],
  'zavod tugmasi bosildi': ['Нажата кнопка запуска', 'Engine start button pressed'],
  'eshik ochildi': ['Дверь открыта', 'Door opened'],
  'eshik yopildi': ['Дверь закрыта', 'Door closed'],
  'dvigatel ishga tushdi': ['Двигатель запущен', 'Engine started'],
  "dvigatel o'chdi": ['Двигатель заглушен', 'Engine stopped'],
  'bagaj ochildi': ['Багажник открыт', 'Trunk opened'],
  'kapot ochildi': ['Капот открыт', 'Hood opened'],
  "qo'riqlashda dvigatel o't oldi": ['Двигатель запущен во время охраны', 'Engine started while armed'],
  "qo'riqlashda kontakt yoqildi": ['Зажигание включено во время охраны', 'Ignition turned on while armed'],
  "ruxsatsiz - avtozapusk vaqtida pedal bosildi, dvigatel o'chirildi": ['Несанкционированно: во время автозапуска нажата педаль, двигатель заглушен', 'Unauthorized: a pedal was pressed during remote start, engine stopped'],
  "avtozapusk tugadi - dvigatel o'chirildi": ['Автозапуск завершён — двигатель заглушен', 'Remote start finished - engine stopped'],
  "dvigatelni o'chirib bo'lmadi - start/stop tugmasi ulanishini tekshiring": ['Не удалось заглушить двигатель — проверьте подключение кнопки Start/Stop', 'Could not stop the engine - check the Start/Stop button wiring'],
  "dvigatelni o'chirib bo'lmadi: uzatma p/n da emas": ['Не удалось заглушить двигатель: передача не в P/N', 'Could not stop the engine: gear is not in P/N'],
  "ruxsatsiz kirish - avtozapusk vaqtida eshik/bagaj ochildi, dvigatel o'chirildi": ['Несанкционированный доступ: во время автозапуска открыта дверь/багажник, двигатель заглушен', 'Unauthorized entry: a door/trunk was opened during remote start, engine stopped'],
  'bagaj ochiq holda qulflandi': ['Закрыто с открытым багажником', 'Locked with the trunk open'],
  'eshik ochiq holda qulflandi': ['Закрыто с открытой дверью', 'Locked with a door open'],
  "dvigatel o'chib qoldi": ['Двигатель заглох', 'The engine stalled'],
  'avtomatik qulflandi - eshik ochilmadi': ['Автоматически закрыто — дверь не открывали', 'Locked automatically - no door was opened'],
  "dvigatel o't oldi": ['Двигатель завёлся', 'Engine started'],
  "dvigatel qo'lda o't oldirilgan - faqat qo'lda o'chiriladi": ['Двигатель запущен вручную — заглушить можно только вручную', 'The engine was started manually - it can only be stopped manually'],
  "egasi qaytdi - dvigatel o'chirildi": ['Владелец вернулся — двигатель заглушен', 'Owner returned - engine stopped'],
  "egasi qaytdi - taymer bekor qilindi, dvigatelni qo'lda o'chiring": ['Владелец вернулся — таймер отменён, заглушите двигатель вручную', 'Owner returned - timer cancelled, stop the engine manually'],
  "egasi qaytdi - zavod relelari o'chirildi": ['Владелец вернулся — реле запуска отключены', 'Owner returned - start relays turned off'],
  "internet yo'qolgan edi - modem qayta yoqildi, aloqa tiklandi": ['Интернет пропадал — модем перезапущен, связь восстановлена', 'Internet was lost - modem restarted, connection restored'],
  "mashina kalit bilan ochildi - qo'riqlash o'chirildi": ['Машина открыта ключом — охрана отключена', 'Car unlocked with the key - alarm disarmed'],
  "mashina qulflanmadi (eshik yoki bagaj ochiq bo'lishi mumkin)": ['Машина не закрылась (возможно, открыта дверь или багажник)', 'Car did not lock (a door or the trunk may be open)'],
  'mashina ochilmadi': ['Машина не открылась', 'Car did not unlock'],
  "wifi tarmog'i muvaffaqiyatli o'zgartirildi": ['Сеть WiFi успешно изменена', 'WiFi network changed successfully'],
  "gaz datchigidan signal kelmadi - bu mashinada gaz yo'q deb hisoblandi": ['Нет сигнала от датчика газа — считается, что газа в этой машине нет', 'No signal from the gas sensor - this car is treated as having no gas'],
  'watchman: ogohlantirish': ['WATCHMAN: тревога', 'WATCHMAN: alert'],
  'yangi xabar': ['Новое сообщение', 'New message'],
};
// Sabablar (":" dan keyingi qism).
const EVENT_REASONS = {
  'eshik ochiq': ['дверь открыта', 'door open'],
  'bagaj ochiq': ['багажник открыт', 'trunk open'],
  'kapot ochiq': ['капот открыт', 'hood open'],
  'harorat yuqori': ['высокая температура', 'temperature too high'],
  'uzatma p/n da emas': ['передача не в P/N', 'gear is not in P/N'],
  'dvigatel allaqachon ishlayapti': ['двигатель уже работает', 'the engine is already running'],
  "o't olmadi": ['не завёлся', 'did not start'],
  'eshik/bagaj ochildi': ['открыта дверь/багажник', 'a door/trunk was opened'],
  'kapot ochildi': ['открыт капот', 'the hood was opened'],
  'gaz pedali bosildi': ['нажата педаль газа', 'the gas pedal was pressed'],
  "noma'lum": ['неизвестно', 'unknown'],
};
// {1}, {2} ... - topilgan qism; {r1}, {r2} ... - sabab sifatida tarjima qilinadi.
const EVENT_PATTERNS = [
  [/^AUX(\d) tugmasi bosildi$/i, ['Нажата кнопка AUX{1}', 'AUX{1} button pressed']],
  [/^Asosiy Wi-Fi topilmadi - zaxira (.+) tarmog'iga ulandi$/i, ['Основная сеть Wi-Fi не найдена — подключено к резервной {1}', 'Main Wi-Fi not found - connected to the backup network {1}']],
  [/^Akkumulyator kuchsiz: ([\d.]+) V$/i, ['Аккумулятор разряжен: {1} В', 'Battery low: {1} V']],
  [/^AKB kuchsiz \(([\d.]+) V\) - zaryadlash uchun avtozapusk \((\d+) daqiqa\)$/i, ['АКБ разряжен ({1} В) — автозапуск для подзарядки ({2} мин)', 'Battery low ({1} V) - remote start to charge ({2} min)']],
  [/^Avtozapusk o'chirildi: (\d+) daqiqa o'tdi, harorat ma'lumoti kelmadi$/i, ['Автозапуск выключен: прошло {1} мин, данных о температуре нет', 'Remote start stopped: {1} minutes passed, no temperature data']],
  [/^Avtozapusk o'chirildi: (\d+) daqiqada (\d+) °C ga yetmadi \(hozir (-?\d+) °C\)$/i, ['Автозапуск выключен: за {1} мин не достиг {2} °C (сейчас {3} °C)', 'Remote start stopped: did not reach {2} °C in {1} minutes (now {3} °C)']],
  [/^Avtozapusk to'xtatildi: (.+)$/i, ['Автозапуск остановлен: {r1}', 'Remote start stopped: {r1}']],
  [/^Dvigatel (-?\d+) °C ga qizidi - avtozapusk o'chirildi$/i, ['Двигатель прогрелся до {1} °C — автозапуск выключен', 'Engine warmed up to {1} °C - remote start stopped']],
  [/^Dvigatel o't olmadi \((\d+) urinish\): (.+)$/i, ['Двигатель не завёлся ({1} попытки): {r2}', 'Engine did not start ({1} attempts): {r2}']],
  [/^Dvigatel qizib ketdi: (-?\d+) °C - to'xtab, dvigatelni tekshiring!$/i, ['Двигатель перегрелся: {1} °C — остановитесь и проверьте двигатель!', 'Engine overheated: {1} °C - stop and check the engine!']],
  [/^Dvigatel qizib ketdi: (-?\d+) °C - zavod o'chirildi$/i, ['Двигатель перегрелся: {1} °C — автозапуск выключен', 'Engine overheated: {1} °C - remote start stopped']],
  [/^Zavod bo'lmadi - (\d+) urinishda ham o't olmadi$/i, ['Запуск не удался — не завёлся за {1} попытки', 'Start failed - did not start after {1} attempts']],
];

function trEvent(text, lang = currentLang) {
  if (!text || lang === 'uz') return text;
  const li = LANGS.indexOf(lang) - 1;  // EVENT_* jadvallarida faqat ru va en
  if (li < 0) return text;
  const raw = String(text).trim();
  const exact = EVENT_EXACT[raw.toLowerCase()];
  if (exact) return exact[li];
  for (const [re, out] of EVENT_PATTERNS) {
    const m = raw.match(re);
    if (!m) continue;
    return out[li].replace(/\{(r?)(\d)\}/g, (_, r, i) => {
      const v = m[Number(i)] || '';
      if (!r) return v;
      const tr = EVENT_REASONS[v.trim().toLowerCase()];
      return tr ? tr[li] : v;
    });
  }
  return text;
}
