// ─── Internationalization (i18n) ─────────────────────────────
// Qo'llab-quvvatlanadigan tillar: uz (O'zbek Lotin), oz (O'zbek Kirill), ru (Русский)

export type Lang = 'uz' | 'oz' | 'ru'

export const LANG_LABELS: Record<Lang, string> = {
  uz: "O'zbek",
  oz: 'Ўзбек',
  ru: 'Русский',
}

export const t = {
  // ── Nav ─────────────────────────────────────────────────────
  nav: {
    overview:       { uz: "Umumiy ko'rinish",  oz: 'Умумий кўриниш',    ru: 'Обзор' },
    contracts:      { uz: 'Shartnomalar',       oz: 'Шартномалар',       ru: 'Договоры' },
    specifications: { uz: 'Spesifikatsiyalar',  oz: 'Спесификациялар',   ru: 'Спецификации' },
    shablonlar:     { uz: 'Shablonlar',         oz: 'Шаблонлар',         ru: 'Шаблоны' },
    counterparties: { uz: 'Kontragentlar',      oz: 'Контрагентлар',     ru: 'Контрагенты' },
    profile:        { uz: 'Profil',             oz: 'Профил',            ru: 'Профиль' },
    logout:         { uz: 'Chiqish',            oz: 'Чиқиш',             ru: 'Выйти' },
  },

  // ── Umumiy tugmalar ─────────────────────────────────────────
  btn: {
    save:        { uz: 'Saqlash',       oz: 'Сақлаш',      ru: 'Сохранить' },
    cancel:      { uz: 'Bekor qilish',  oz: 'Бекор қилиш', ru: 'Отмена' },
    close:       { uz: 'Yopish',        oz: 'Ёпиш',        ru: 'Закрыть' },
    add:         { uz: "Qo'shish",      oz: 'Қўшиш',       ru: 'Добавить' },
    edit:        { uz: 'Tahrirlash',    oz: 'Таҳрирлаш',   ru: 'Редактировать' },
    delete:      { uz: "O'chirish",     oz: 'Ўчириш',      ru: 'Удалить' },
    view:        { uz: "Ko'rish",       oz: 'Кўриш',       ru: 'Просмотр' },
    copy:        { uz: 'Nusxa',         oz: 'Нусха',        ru: 'Копия' },
    create:      { uz: 'Yaratish',      oz: 'Яратиш',       ru: 'Создать' },
    upload:      { uz: 'Yuklash',       oz: 'Юклаш',        ru: 'Загрузить' },
    loading:     { uz: 'Yuklanmoqda…',  oz: 'Юкланмоқда…',  ru: 'Загрузка…' },
    saving:      { uz: 'Saqlanmoqda…', oz: 'Сақланмоқда…', ru: 'Сохранение…' },
    search:      { uz: 'Qidirish',      oz: 'Қидириш',      ru: 'Поиск' },
    filter:      { uz: 'Filter',        oz: 'Фильтр',        ru: 'Фильтр' },
    download:    { uz: 'Yuklab olish',  oz: 'Юклаб олиш',   ru: 'Скачать' },
    confirm:     { uz: 'Tasdiqlash',    oz: 'Тасдиқлаш',    ru: 'Подтвердить' },
    apply:       { uz: 'Qo\'llash',     oz: 'Қўллаш',        ru: 'Применить' },
    next:        { uz: 'Keyingi',       oz: 'Кейинги',       ru: 'Далее' },
    prev:        { uz: 'Oldingi',       oz: 'Олдинги',       ru: 'Назад' },
  },

  // ── Statuslar ────────────────────────────────────────────────
  status: {
    all:       { uz: 'Barchasi',    oz: 'Барчаси',    ru: 'Все' },
    active:    { uz: 'Faol',        oz: 'Фаол',       ru: 'Активный' },
    draft:     { uz: 'Qoralama',    oz: 'Қоралама',   ru: 'Черновик' },
    completed: { uz: 'Bajarildi',   oz: 'Бажарилди',  ru: 'Выполнен' },
    cancelled: { uz: 'Bekor',       oz: 'Бекор',      ru: 'Отменён' },
    done:      { uz: '✓ Bajarildi', oz: '✓ Бажарилди',ru: '✓ Выполнен' },
    cancel:    { uz: '✕ Bekor',     oz: '✕ Бекор',    ru: '✕ Отменить' },
  },

  // ── Shartnomalar sahifasi ────────────────────────────────────
  contracts: {
    title:       { uz: 'Shartnomalar',          oz: 'Шартномалар',          ru: 'Договоры' },
    new:         { uz: '+ Yangi shartnoma',      oz: '+ Янги шартнома',      ru: '+ Новый договор' },
    search:      { uz: 'Raqam, tashkilot…',      oz: 'Рақам, ташкилот…',     ru: 'Номер, организация…' },
    empty:       { uz: 'Shartnomalar topilmadi', oz: 'Шартномалар топилмади',ru: 'Договоры не найдены' },
    number:      { uz: 'Raqam',                  oz: 'Рақам',                ru: 'Номер' },
    date:        { uz: 'Sana',                   oz: 'Сана',                 ru: 'Дата' },
    type:        { uz: 'Tur',                    oz: 'Тур',                  ru: 'Тип' },
    amount:      { uz: 'Summa',                  oz: 'Сумма',                ru: 'Сумма' },
    org:         { uz: 'Tashkilot',              oz: 'Ташкилот',             ru: 'Организация' },
    counterparty:{ uz: 'Kontragent',             oz: 'Контрагент',           ru: 'Контрагент' },
    status:      { uz: 'Holat',                  oz: 'Ҳолат',                ru: 'Статус' },
    actions:     { uz: 'Amallar',                oz: 'Амаллар',              ru: 'Действия' },
    deleteConfirm:{ uz: 'Shartnomani o\'chirishni tasdiqlaysizmi?', oz: 'Шартномани ўчиришни тасдиқлайсизми?', ru: 'Вы уверены, что хотите удалить договор?' },
    total:       { uz: 'Jami faol shartnomalar summa:', oz: 'Жами фаол шартномалар сумма:', ru: 'Итого по активным договорам:' },
  },

  // ── Shartnoma modal ──────────────────────────────────────────
  modal: {
    newContract:  { uz: 'Yangi shartnoma',      oz: 'Янги шартнома',      ru: 'Новый договор' },
    editContract: { uz: 'Shartnomani tahrirlash',oz: 'Шартномани таҳрирлаш',ru: 'Редактирование договора' },
    step1:        { uz: '1. Ma\'lumotlar',       oz: '1. Маълумотлар',      ru: '1. Данные' },
    step2:        { uz: '2. Qo\'shimcha',        oz: '2. Қўшимча',          ru: '2. Дополнительно' },
    step3:        { uz: '3. Bo\'limlar',         oz: '3. Бўлимлар',         ru: '3. Разделы' },
    step4:        { uz: '4. Spesifikatsiya',     oz: '4. Спесификация',     ru: '4. Спецификация' },
    contractNum:  { uz: 'Shartnoma raqami',     oz: 'Шартнома рақами',     ru: 'Номер договора' },
    contractDate: { uz: 'Sana',                  oz: 'Сана',                ru: 'Дата' },
    contractType: { uz: 'Shartnoma turi',        oz: 'Шартнома тури',       ru: 'Тип договора' },
    selectOrg:    { uz: 'Tashkilotni tanlang',   oz: 'Ташкилотни танланг',  ru: 'Выберите организацию' },
    selectCp:     { uz: 'Kontragentni tanlang',  oz: 'Контрагентни танланг',ru: 'Выберите контрагента' },
    amount:       { uz: 'Summa (so\'m)',          oz: 'Сумма (сўм)',         ru: 'Сумма (сум)' },
    city:         { uz: 'Shahar',                oz: 'Шаҳар',               ru: 'Город' },
    useTemplate:  { uz: 'Shablon orqali',        oz: 'Шаблон орқали',       ru: 'По шаблону' },
    manual:       { uz: 'Qo\'lda',               oz: 'Қўлда',               ru: 'Вручную' },
    template:     { uz: 'Shablon tanlang',       oz: 'Шаблон танланг',      ru: 'Выберите шаблон' },
    qqs:          { uz: 'QQS qo\'shilsinmi?',    oz: 'ҚҚС қўшилсинми?',    ru: 'Добавить НДС?' },
    qqsRate:      { uz: 'QQS foizi',             oz: 'ҚҚС фоизи',           ru: 'Ставка НДС' },
    productName:  { uz: 'Mahsulot nomi',         oz: 'Маҳсулот номи',       ru: 'Наименование товара' },
    goToSections: { uz: 'Bo\'limlarga o\'tish →', oz: 'Бўлимларга ўтиш →',  ru: 'К разделам →' },
    addSection:   { uz: '+ Bo\'lim qo\'shish',   oz: '+ Бўлим қўшиш',      ru: '+ Добавить раздел' },
    addItem:      { uz: '+ Band qo\'shish',      oz: '+ Банд қўшиш',        ru: '+ Добавить пункт' },
  },

  // ── Tashkilotlar ─────────────────────────────────────────────
  orgs: {
    title:       { uz: 'Tashkilotlar',            oz: 'Ташкилотлар',            ru: 'Организации' },
    new:         { uz: '+ Tashkilot qo\'shish',   oz: '+ Ташкилот қўшиш',      ru: '+ Добавить организацию' },
    name:        { uz: 'Nomi',                    oz: 'Номи',                   ru: 'Название' },
    inn:         { uz: 'INN',                     oz: 'ИНН',                    ru: 'ИНН' },
    director:    { uz: 'Rahbar',                  oz: 'Раҳбар',                 ru: 'Руководитель' },
    address:     { uz: 'Manzil',                  oz: 'Манзил',                 ru: 'Адрес' },
    bank:        { uz: 'Bank nomi',               oz: 'Банк номи',              ru: 'Название банка' },
    account:     { uz: 'Hisob raqam',             oz: 'Ҳисоб рақам',            ru: 'Расчётный счёт' },
    mfo:         { uz: 'MFO',                     oz: 'МФО',                    ru: 'МФО' },
    empty:       { uz: 'Tashkilot qo\'shilmagan', oz: 'Ташкилот қўшилмаган',   ru: 'Организации не добавлены' },
    active:      { uz: 'Asosiy',                  oz: 'Асосий',                 ru: 'Основная' },
    setActive:   { uz: 'Asosiy qilish',           oz: 'Асосий қилиш',           ru: 'Сделать основной' },
    stamp:       { uz: 'Muhr',                    oz: 'Муҳр',                   ru: 'Печать' },
    signature:   { uz: 'Imzo',                    oz: 'Имзо',                   ru: 'Подпись' },
  },

  // ── Kontragentlar ────────────────────────────────────────────
  cp: {
    title:  { uz: 'Kontragentlar',           oz: 'Контрагентлар',          ru: 'Контрагенты' },
    new:    { uz: '+ Kontragent qo\'shish',  oz: '+ Контрагент қўшиш',     ru: '+ Добавить контрагента' },
    search: { uz: 'Qidirish…',               oz: 'Қидириш…',               ru: 'Поиск…' },
    empty:  { uz: 'Kontragent topilmadi',    oz: 'Контрагент топилмади',   ru: 'Контрагентов не найдено' },
    name:   { uz: 'Nomi',                    oz: 'Номи',                   ru: 'Название' },
    delete: { uz: 'Kontragentni o\'chirishni tasdiqlaysizmi?', oz: 'Контрагентни ўчиришни тасдиқлайсизми?', ru: 'Вы уверены, что хотите удалить контрагента?' },
  },

  // ── Profil ───────────────────────────────────────────────────
  profile: {
    title:       { uz: 'Profil',               oz: 'Профил',             ru: 'Профиль' },
    account:     { uz: 'Hisob',                oz: 'Ҳисоб',              ru: 'Аккаунт' },
    company:     { uz: 'Tashkilot',            oz: 'Ташкилот',           ru: 'Организация' },
    fullName:    { uz: 'To\'liq ism',          oz: 'Тўлиқ исм',          ru: 'Полное имя' },
    phone:       { uz: 'Telefon',              oz: 'Телефон',            ru: 'Телефон' },
    position:    { uz: 'Lavozim',              oz: 'Лавозим',            ru: 'Должность' },
    logout:      { uz: 'Tizimdan chiqish',     oz: 'Тизимдан чиқиш',    ru: 'Выход из системы' },
    logoutDesc:  { uz: 'Hisobingizdan chiqish',oz: 'Ҳисобингиздан чиқиш',ru: 'Выйти из аккаунта' },
    saved:       { uz: 'Saqlandi ✓',           oz: 'Сақланди ✓',         ru: 'Сохранено ✓' },
    language:    { uz: 'Til',                  oz: 'Тил',                ru: 'Язык' },
  },

  // ── Umumiy ko'rinish (Overview) ──────────────────────────────
  overview: {
    activeContracts:  { uz: 'Faol shartnomalar',      oz: 'Фаол шартномалар',      ru: 'Активные договоры' },
    totalAmount:      { uz: 'Umumiy summa',            oz: 'Умумий сумма',           ru: 'Общая сумма' },
    counterparties:   { uz: 'Kontragentlar',           oz: 'Контрагентлар',          ru: 'Контрагентов' },
    organizations:    { uz: 'Tashkilotlar',            oz: 'Ташкилотлар',            ru: 'Организаций' },
    recentContracts:  { uz: 'So\'nggi shartnomalar',   oz: 'Сўнгги шартномалар',     ru: 'Последние договоры' },
    noContracts:      { uz: 'Shartnomalar yo\'q',      oz: 'Шартномалар йўқ',        ru: 'Нет договоров' },
    quota:            { uz: 'Kvota',                   oz: 'Квота',                  ru: 'Квота' },
    used:             { uz: 'ishlatildi',              oz: 'ишлатилди',              ru: 'использовано' },
    of:               { uz: 'dan',                     oz: 'дан',                    ru: 'из' },
  },

  // ── Spesifikatsiya sahifasi ──────────────────────────────────
  spec: {
    title:     { uz: 'Spesifikatsiyalar',      oz: 'Спесификациялар',      ru: 'Спецификации' },
    new:       { uz: '+ Yangi spesifikatsiya', oz: '+ Янги спесификация',  ru: '+ Новая спецификация' },
    name:      { uz: 'Nomi',                   oz: 'Номи',                  ru: 'Название' },
    product:   { uz: 'Mahsulot nomi',          oz: 'Маҳсулот номи',         ru: 'Наименование товара' },
    unit:      { uz: 'Birlik',                 oz: 'Бирлик',                ru: 'Единица' },
    qty:       { uz: 'Miqdor',                 oz: 'Миқдор',                ru: 'Кол-во' },
    price:     { uz: 'Narx',                   oz: 'Нарх',                  ru: 'Цена' },
    qqs:       { uz: 'QQS',                    oz: 'ҚҚС',                   ru: 'НДС' },
    total:     { uz: 'Jami',                   oz: 'Жами',                  ru: 'Итого' },
    empty:     { uz: 'Spesifikatsiyalar yo\'q',oz: 'Спесификациялар йўқ',  ru: 'Спецификаций нет' },
    addRow:    { uz: '+ Qator qo\'shish',      oz: '+ Қатор қўшиш',        ru: '+ Добавить строку' },
  },

  // ── Xabarlar ─────────────────────────────────────────────────
  msg: {
    selectOrg:   { uz: 'Tashkilotni tanlang!',             oz: 'Ташкилотни танланг!',             ru: 'Выберите организацию!' },
    deleteOk:    { uz: 'O\'chirildi',                       oz: 'Ўчирилди',                        ru: 'Удалено' },
    saveOk:      { uz: 'Saqlandi',                          oz: 'Сақланди',                        ru: 'Сохранено' },
    error:       { uz: 'Xatolik yuz berdi',                oz: 'Хатолик юз берди',                ru: 'Произошла ошибка' },
    limitReached:{ uz: 'Limit to\'ldi. Tarifni yangilang.',oz: 'Лимит тўлди. Тарифни янгиланг.', ru: 'Лимит исчерпан. Обновите тариф.' },
    noOrgs:      { uz: 'Avval tashkilot qo\'shing',        oz: 'Аввал ташкилот қўшинг',          ru: 'Сначала добавьте организацию' },
    loading:          { uz: 'Yuklanmoqda…',                          oz: 'Юкланмоқда…',                        ru: 'Загрузка…' },
    tplNameRequired:  { uz: 'Shablon nomi kiriting!',                oz: 'Шаблон номи киритинг!',               ru: 'Введите название шаблона!' },
    tplContentReq:    { uz: 'Shablon matni kiriting!',               oz: 'Шаблон матни киритинг!',              ru: 'Введите текст шаблона!' },
    deleteTplConfirm: { uz: "Shablonni o'chirishni tasdiqlaysizmi?", oz: 'Шаблонни ўчиришни тасдиқлайсизми?',  ru: 'Удалить этот шаблон?' },
    deleteCpConfirm:  { uz: "Kontragentni o'chirishni tasdiqlaysizmi?", oz: 'Контрагентни ўчиришни тасдиқлайсизми?', ru: 'Удалить контрагента?' },
    deleteSpecConfirm:{ uz: "Spesifikatsiyani o'chirishni tasdiqlaysizmi?", oz: 'Спесификацияни ўчиришни тасдиқлайсизми?', ru: 'Удалить спецификацию?' },
    addItem:          { uz: "Kamida 1 ta mahsulot/xizmat qo'shing!", oz: 'Камида 1 та маҳсулот/хизмат қўшинг!', ru: 'Добавьте хотя бы 1 товар/услугу!' },
    uploadError:      { uz: 'Yuklash xatosi',                        oz: 'Юклаш хатоси',                        ru: 'Ошибка загрузки' },
    errorPrefix:      { uz: 'Xato',                                  oz: 'Хато',                                ru: 'Ошибка' },
    profileSaved:     { uz: 'Profil saqlandi ✓',                     oz: 'Профил сақланди ✓',                   ru: 'Профиль сохранён ✓' },
    saved:            { uz: 'Saqlandi ✓',                            oz: 'Сақланди ✓',                          ru: 'Сохранено ✓' },
    pwdChanged:       { uz: "Parol muvaffaqiyatli o'zgartirildi ✓",  oz: 'Парол муваффақиятли ўзгартирилди ✓',  ru: 'Пароль успешно изменён ✓' },
    pwdMismatch:      { uz: 'Parollar mos kelmaydi',                 oz: 'Паролlar мос келмайди',               ru: 'Пароли не совпадают' },
    pwdShort:         { uz: "Parol kamida 8 belgi bo'lishi kerak",   oz: 'Парол камида 8 белги бўлиши керак',   ru: 'Пароль должен быть не менее 8 символов' },
    innInvalid:       { uz: "INN 9 raqamdan iborat bo'lishi kerak",  oz: 'ИНН 9 рақамдан иборат бўлиши керак',  ru: 'ИНН должен состоять из 9 цифр' },
    mfoInvalid:       { uz: "MFO 5 raqamdan iborat bo'lishi kerak",  oz: 'МФО 5 рақамдан иборат бўлиши керак',  ru: 'МФО должен состоять из 5 цифр' },
    accountInvalid:   { uz: "Hisob raqam 20 raqamdan iborat bo'lishi kerak", oz: 'Ҳисоб рақам 20 рақамдан иборат бўлиши керак', ru: 'Расчётный счёт должен состоять из 20 цифр' },
    nameRequired:     { uz: "Nomi kiritilmagan",                      oz: 'Номи киритилмаган',                   ru: 'Название не введено' },
  },

  // ── PDF/Word hujjat ──────────────────────────────────────────
  doc: {
    specTitle:    { uz: 'SPESIFIKATSIYA (1-ILOVA)',  oz: 'СПЕСИФИКАЦИЯ (1-ИЛОВА)',   ru: 'СПЕЦИФИКАЦИЯ (Приложение 1)' },
    rekvTitle:    { uz: 'TOMONLARNING REKVIZITLARI VA IMZOLARI', oz: 'ТОМОНЛАРНИНГ РЕКВИЗИТЛАРИ ВА ИМЗОЛАРИ', ru: 'РЕКВИЗИТЫ И ПОДПИСИ СТОРОН' },
    sotuvchi:     { uz: 'SOTUVCHI',                  oz: 'СОТУВЧИ',                  ru: 'ПРОДАВЕЦ' },
    xaridor:      { uz: 'XARIDOR',                   oz: 'ХАРИДОР',                  ru: 'ПОКУПАТЕЛЬ' },
    ijrochi:      { uz: 'IJROCHI',                   oz: 'ИЖРОЧИ',                   ru: 'ИСПОЛНИТЕЛЬ' },
    buyurtmachi:  { uz: 'BUYURTMACHI',               oz: 'БУЮРТМАЧИ',                ru: 'ЗАКАЗЧИК' },
    ijaraberuvchi:{ uz: 'IJARA BERUVCHI',            oz: 'ИЖАРА БЕРУВЧИ',            ru: 'АРЕНДОДАТЕЛЬ' },
    ijaraoluvchi: { uz: 'IJARA OLUVCHI',             oz: 'ИЖАРА ОЛУВЧИ',             ru: 'АРЕНДАТОР' },
    pudratchi:    { uz: 'PUDRATCHI',                 oz: 'ПУДРАТЧИ',                 ru: 'ПОДРЯДЧИК' },
    qarzberuvchi: { uz: 'QARZ BERUVCHI',             oz: 'ҚАРЗ БЕРУВЧИ',             ru: 'ЗАЙМОДАВЕЦ' },
    qarzoluvchi:  { uz: 'QARZ OLUVCHI',              oz: 'ҚАРЗ ОЛУВЧИ',              ru: 'ЗАЁМЩИК' },
    nomi:         { uz: 'Nomi:',                     oz: 'Номи:',                    ru: 'Название:' },
    manzil:       { uz: 'Manzil:',                   oz: 'Манзил:',                  ru: 'Адрес:' },
    hr:           { uz: 'H/r:',                      oz: 'Ҳ/р:',                     ru: 'Р/с:' },
    bank:         { uz: 'Bank:',                     oz: 'Банк:',                    ru: 'Банк:' },
    mfo:          { uz: 'MFO:',                      oz: 'МФО:',                     ru: 'МФО:' },
    inn:          { uz: 'INN:',                      oz: 'ИНН:',                     ru: 'ИНН:' },
    rahbar:       { uz: 'Rahbar:',                   oz: 'Раҳбар:',                  ru: 'Руководитель:' },
    mo:           { uz: 'M.O.',                      oz: 'М.О.',                     ru: 'М.П.' },
    footer:       { uz: 'Shartnoma.uz — Online shartnoma generatori', oz: 'Shartnoma.uz — Онлайн шартнома генератори', ru: 'Shartnoma.uz — Онлайн генератор договоров' },
    shahri:       { uz: 'shahri',                    oz: 'шаҳри',                    ru: 'г.' },
    soliqsizJami: { uz: "Soliqsiz jami:",            oz: "Солиқсиз жами:",           ru: "Без НДС итого:" },
    qqsJami:      { uz: "QQS jami:",                 oz: "ҚҚС жами:",                ru: "НДС итого:" },
    qqsBilan:     { uz: "QQS bilan jami:",           oz: "ҚҚС билан жами:",          ru: "Итого с НДС:" },
    jami:         { uz: "Jami:",                     oz: "Жами:",                    ru: "Итого:" },
    sozBilan:     { uz: "So'z bilan:",               oz: "Сўз билан:",               ru: "Прописью:" },
    som:           { uz: "so'm",                     oz: "so'm",                     ru: 'сум' },
    qqssiz:        { uz: 'QQSsiz',                   oz: 'ҚҚСсиз',                  ru: 'Без НДС' },
    qqsCol:        { uz: 'QQS%',                     oz: 'ҚҚС%',                    ru: 'НДС%' },
    qqsSum:        { uz: 'QQS summa',                oz: 'ҚҚС суммаси',              ru: 'НДС сумма' },
    productService:{ uz: 'Mahsulot/xizmat nomi',     oz: 'Маҳсулот/хизмат номи',    ru: 'Наименование товара/услуги' },
    intro: {

      oldi_sotdi: {
        uz: (o: string, od: string, c: string, cd: string) =>
          `"${o}", keyingi o'rinlarda "Sotuvchi" sifatida, Direktor ${od} vakilligi asosida bir tomondan va "${c}", keyingi o'rinlarda "Xaridor" sifatida, Direktor ${cd} vakilligi asosida ikkinchi tomondan ushbu shartnomani tuzdilar:`,
        oz: (o: string, od: string, c: string, cd: string) =>
          `"${o}", кейинги ўринларда "Сотувчи" сифатида, Директор ${od} вакиллиги асосида бир томондан ва "${c}", кейинги ўринларда "Харидор" сифатида, Директор ${cd} вакиллиги асосида иккинчи томондан ушбу шартномани тузишди:`,
        ru: (o: string, od: string, c: string, cd: string) =>
          `"${o}", именуемое в дальнейшем "Продавец", в лице Директора ${od}, с одной стороны, и "${c}", именуемое в дальнейшем "Покупатель", в лице Директора ${cd}, с другой стороны, заключили настоящий договор:`,
      },
      xizmat: {
        uz: (o: string, od: string, c: string, cd: string) =>
          `"${o}", keyingi o'rinlarda "Buyurtmachi" sifatida, Direktor ${od} vakilligi asosida bir tomondan va "${c}", keyingi o'rinlarda "Ijrochi" sifatida, Direktor ${cd} vakilligi asosida ikkinchi tomondan ushbu shartnomani tuzdilar:`,
        oz: (o: string, od: string, c: string, cd: string) =>
          `"${o}", кейинги ўринларда "Буюртмачи" сифатида, Директор ${od} вакиллиги асосида бир томондан ва "${c}", кейинги ўринларда "Ижрочи" сифатида, Директор ${cd} вакиллиги асосида иккинчи томондан ушбу шартномани тузишди:`,
        ru: (o: string, od: string, c: string, cd: string) =>
          `"${o}", именуемое в дальнейшем "Заказчик", в лице Директора ${od}, с одной стороны, и "${c}", именуемое в дальнейшем "Исполнитель", в лице Директора ${cd}, с другой стороны, заключили настоящий договор:`,
      },
      ijara: {
        uz: (o: string, od: string, c: string, cd: string) =>
          `"${o}", keyingi o'rinlarda "Ijara beruvchi" sifatida, Direktor ${od} vakilligi asosida bir tomondan va "${c}", keyingi o'rinlarda "Ijara oluvchi" sifatida, Direktor ${cd} vakilligi asosida ikkinchi tomondan ushbu shartnomani tuzdilar:`,
        oz: (o: string, od: string, c: string, cd: string) =>
          `"${o}", кейинги ўринларда "Ижара берувчи" сифатида, Директор ${od} вакиллиги асосида бир томондан ва "${c}", кейинги ўринларда "Ижара олувчи" сифатида, Директор ${cd} вакиллиги асосида иккинчи томондан ушбу шартномани тузишди:`,
        ru: (o: string, od: string, c: string, cd: string) =>
          `"${o}", именуемое в дальнейшем "Арендодатель", в лице Директора ${od}, с одной стороны, и "${c}", именуемое в дальнейшем "Арендатор", в лице Директора ${cd}, с другой стороны, заключили настоящий договор:`,
      },
      pudrat: {
        uz: (o: string, od: string, c: string, cd: string) =>
          `"${o}", keyingi o'rinlarda "Buyurtmachi" sifatida, Direktor ${od} vakilligi asosida bir tomondan va "${c}", keyingi o'rinlarda "Pudratchi" sifatida, Direktor ${cd} vakilligi asosida ikkinchi tomondan ushbu shartnomani tuzdilar:`,
        oz: (o: string, od: string, c: string, cd: string) =>
          `"${o}", кейинги ўринларда "Буюртмачи" сифатида, Директор ${od} вакиллиги асосида бир томондан ва "${c}", кейинги ўринларда "Пудратчи" сифатида, Директор ${cd} вакиллиги асосида иккинчи томондан ушбу шартномани тузишди:`,
        ru: (o: string, od: string, c: string, cd: string) =>
          `"${o}", именуемое в дальнейшем "Заказчик", в лице Директора ${od}, с одной стороны, и "${c}", именуемое в дальнейшем "Подрядчик", в лице Директора ${cd}, с другой стороны, заключили настоящий договор:`,
      },
      qarz: {
        uz: (o: string, od: string, c: string, cd: string) =>
          `"${o}", keyingi o'rinlarda "Qarz beruvchi" sifatida, Direktor ${od} vakilligi asosida bir tomondan va "${c}", keyingi o'rinlarda "Qarz oluvchi" sifatida, Direktor ${cd} vakilligi asosida ikkinchi tomondan ushbu shartnomani tuzdilar:`,
        oz: (o: string, od: string, c: string, cd: string) =>
          `"${o}", кейинги ўринларда "Қарз берувчи" сифатида, Директор ${od} вакиллиги асосида бир томондан ва "${c}", кейинги ўринларда "Қарз олувчи" сифатида, Директор ${cd} вакиллиги асосида иккинчи томондан ушбу шартномани тузишди:`,
        ru: (o: string, od: string, c: string, cd: string) =>
          `"${o}", именуемое в дальнейшем "Займодавец", в лице Директора ${od}, с одной стороны, и "${c}", именуемое в дальнейшем "Заёмщик", в лице Директора ${cd}, с другой стороны, заключили настоящий договор:`,
      },
    },
  },

  // ── Tashkilotlar tab ─────────────────────────────────────────
  orgTab: {
    active:       { uz: 'Faol',                    oz: 'Фаол',                    ru: 'Активная' },
    bankAccounts: { uz: 'Bank hisob raqamlari',     oz: 'Банк ҳисоб рақамлари',    ru: 'Банковские счета' },
    addAccount:   { uz: '+ Qo\'shish',              oz: '+ Қўшиш',                 ru: '+ Добавить' },
    noAccount:    { uz: 'Hisob raqam qo\'shilmagan',oz: 'Ҳисоб рақам қўшилмаган', ru: 'Счета не добавлены' },
    primary:      { uz: 'Asosiy',                   oz: 'Асосий',                  ru: 'Основной' },
    stampSign:    { uz: 'Imzo va Muhr',             oz: 'Имзо ва Муҳр',            ru: 'Подпись и Печать' },
    signImg:      { uz: 'Imzo rasmi',               oz: 'Имзо расми',              ru: 'Изображение подписи' },
    stampImg:     { uz: 'Muhr rasmi',               oz: 'Муҳр расми',              ru: 'Изображение печати' },
    change:       { uz: 'O\'zgartirish',            oz: 'Ўзгартириш',              ru: 'Изменить' },
    upload:       { uz: '📤 Yuklash',               oz: '📤 Юклаш',                ru: '📤 Загрузить' },
  },

  // ── Kontragentlar tab ─────────────────────────────────────────
  cpTab: {
    searchPlaceholder: { uz: 'Tashkilot nomi yoki STR (INN)...', oz: 'Ташкилот номи ёки ИНН...', ru: 'Название или ИНН...' },
    noFound:      { uz: 'Kontragent topilmadi',     oz: 'Контрагент топилмади',    ru: 'Контрагенты не найдены' },
    noAdded:      { uz: 'Kontragent qo\'shilmagan', oz: 'Контрагент қўшилмаган',   ru: 'Контрагентов не добавлено' },
    addBtn:       { uz: '+ Qo\'shish',              oz: '+ Қўшиш',                 ru: '+ Добавить' },
    colName:      { uz: 'Tashkilot nomi',           oz: 'Ташкилот номи',           ru: 'Название' },
    colInn:       { uz: 'STR / INN',                oz: 'СТР / ИНН',               ru: 'ИНН' },
    colDirector:  { uz: 'Rahbar',                   oz: 'Раҳбар',                  ru: 'Руководитель' },
    colBank:      { uz: 'Bank',                     oz: 'Банк',                    ru: 'Банк' },
    colMfo:       { uz: 'MFO',                      oz: 'МФО',                     ru: 'МФО' },
    colContracts: { uz: 'Shartnomalar',             oz: 'Шартномалар',             ru: 'Договоры' },
    total:        { uz: 'Jami',                     oz: 'Жами',                    ru: 'Всего' },
    contacts:     { uz: 'ta kontragent',            oz: 'та контрагент',           ru: 'контрагентов' },
    basicInfo:    { uz: 'Asosiy ma\'lumotlar',      oz: 'Асосий маълумотлар',      ru: 'Основные данные' },
    bankDetails:  { uz: 'Bank rekvizitlari',        oz: 'Банк реквизитлари',       ru: 'Банковские реквизиты' },
    contracts:    { uz: 'Shartnomalar',             oz: 'Шартномалар',             ru: 'Договоры' },
  },

  // ── Overview tab ─────────────────────────────────────────────
  overviewTab: {
    totalContracts:  { uz: 'Jami shartnoma',           oz: 'Жами шартнома',           ru: 'Всего договоров' },
    activeSum:       { uz: 'Faol shartnomalar summasi', oz: 'Фаол шартномалар суммаси',ru: 'Сумма активных договоров' },
    quota:           { uz: 'Oylik kvota',               oz: 'Ойлик квота',             ru: 'Месячная квота' },
    upgrade:         { uz: '⚡ Tarifni yaxshilash',    oz: '⚡ Тарифни яхшилаш',      ru: '⚡ Улучшить тариф' },
    recent:          { uz: 'So\'nggi shartnomalar',     oz: 'Сўнгги шартномалар',      ru: 'Последние договоры' },
    viewAll:         { uz: 'Hammasini ko\'rish →',      oz: 'Ҳаммасини кўриш →',       ru: 'Смотреть все →' },
    noContracts:     { uz: 'Hali shartnoma yo\'q',      oz: 'Ҳали шартнома йўқ',       ru: 'Договоров пока нет' },
    createContract:  { uz: 'Shartnoma yaratish',        oz: 'Шартнома яратиш',         ru: 'Создать договор' },
    addOrg:          { uz: 'Tashkilot qo\'shish',       oz: 'Ташкилот қўшиш',          ru: 'Добавить организацию' },
    addCp:           { uz: 'Kontragent qo\'shish',      oz: 'Контрагент қўшиш',        ru: 'Добавить контрагента' },
    som:             { uz: 'so\'m',                     oz: 'сўм',                     ru: 'сум' },
    plan:            { uz: 'Tarif',                     oz: 'Тариф',                   ru: 'Тариф' },
  },

  // ── Spec tab ─────────────────────────────────────────────────
  specTab: {
    count:     { uz: 'ta spesifikatsiya',           oz: 'та спесификация',         ru: 'спецификаций' },
    newBtn:    { uz: '+ Yangi spesifikatsiya',       oz: '+ Янги спесификация',     ru: '+ Новая спецификация' },
    empty:     { uz: 'Spesifikatsiya yo\'q',         oz: 'Спесификация йўқ',        ru: 'Спецификаций нет' },
    createNew: { uz: 'Yangi spesifikatsiya yarating',oz: 'Янги спесификация яратинг',ru: 'Создайте новую спецификацию' },
    colNum:    { uz: 'Spec raqami',                  oz: 'Спес рақами',             ru: '№ спецификации' },
    colContract:{ uz: 'Shartnoma',                   oz: 'Шартнома',                ru: 'Договор' },
    colCp:     { uz: 'Kontragent',                   oz: 'Контрагент',              ru: 'Контрагент' },
    colItems:  { uz: 'Pozitsiyalar',                 oz: 'Позициялар',              ru: 'Позиции' },
    colTotal:  { uz: 'Jami summa',                   oz: 'Жами сумма',              ru: 'Итоговая сумма' },
    colDate:   { uz: 'Sana',                         oz: 'Сана',                    ru: 'Дата' },
    colActions:{ uz: 'Amallar',                      oz: 'Амаллар',                 ru: 'Действия' },
    edit:      { uz: 'Tahrirlash',                   oz: 'Таҳрирлаш',               ru: 'Редактировать' },
    items:     { uz: 'ta',                           oz: 'та',                      ru: 'шт.' },
  },

  // ── Templates tab ────────────────────────────────────────────
  tplTab: {
    all:       { uz: 'Barchasi',    oz: 'Барчаси',    ru: 'Все' },
    count:     { uz: 'ta shablon',  oz: 'та шаблон',  ru: 'шаблонов' },
    addBtn:    { uz: '+ Shablon qo\'shish', oz: '+ Шаблон қўшиш', ru: '+ Добавить шаблон' },
    myTpls:    { uz: 'Mening shablonlarim', oz: 'Менинг шаблонларим', ru: 'Мои шаблоны' },
    view:      { uz: 'Ko\'rish',    oz: 'Кўриш',      ru: 'Просмотр' },
    createFrom:{ uz: 'Shartnoma yaratish', oz: 'Шартнома яратиш', ru: 'Создать договор' },
    custom:    { uz: '(sizniki)',   oz: '(сизники)',   ru: '(ваш)' },
  },

  // ── Profil tab ────────────────────────────────────────────────
  profileTab: {
    accountTab:  { uz: '👤 Akkaunt',                oz: '👤 Аккаунт',              ru: '👤 Аккаунт' },
    companyTab:  { uz: '🏢 Korxona ma\'lumotlari',  oz: '🏢 Корхона маълумотлари', ru: '🏢 Данные организации' },
    personalInfo:{ uz: 'Shaxsiy ma\'lumotlar',      oz: 'Шахсий маълумотлар',      ru: 'Личные данные' },
    fullName:    { uz: 'To\'liq ism',               oz: 'Тўлиқ исм',               ru: 'Полное имя' },
    position:    { uz: 'Lavozim',                   oz: 'Лавозим',                 ru: 'Должность' },
    phone:       { uz: 'Telefon raqam',             oz: 'Телефон рақам',           ru: 'Номер телефона' },
    security:    { uz: 'Xavfsizlik',                oz: 'Хавфсизлик',              ru: 'Безопасность' },
    newPass:     { uz: 'Yangi parol',               oz: 'Янги парол',              ru: 'Новый пароль' },
    confirmPass: { uz: 'Parolni tasdiqlang',        oz: 'Паролни тасдиқланг',      ru: 'Подтвердите пароль' },
    passMismatch:{ uz: '⚠ Parollar mos kelmayapti',oz: '⚠ Паролlar мос келмаяпти',ru: '⚠ Пароли не совпадают' },
    changePass:  { uz: 'Parolni o\'zgartirish',     oz: 'Паролни ўзгартириш',      ru: 'Изменить пароль' },
    logoutTitle: { uz: 'Hisobdan chiqish',          oz: 'Ҳисобдан чиқиш',          ru: 'Выход из аккаунта' },
    logoutBtn:   { uz: '⎋ Chiqish',                 oz: '⎋ Чиқиш',                 ru: '⎋ Выйти' },
    mainInfo:    { uz: 'Asosiy rekvizitlar',        oz: 'Асосий реквизитлар',      ru: 'Основные реквизиты' },
    bankInfo:    { uz: 'Bank rekvizitlari',         oz: 'Банк реквизитлари',       ru: 'Банковские реквизиты' },
    taxAddress:  { uz: 'Soliq va manzil',           oz: 'Солиқ ва манзил',         ru: 'Налоги и адрес' },
    sender:      { uz: 'Tovar jo\'natuvchi',        oz: 'Товар жўнатувчи',         ru: 'Грузоотправитель' },
    saveChanges: { uz: '💾 O\'zgarishlarni saqlash',oz: '💾 Ўзгаришlarni сақлаш',  ru: '💾 Сохранить изменения' },
    noOrg:       { uz: 'Avval tashkilot qo\'shing', oz: 'Аввал ташкилот қўшинг',   ru: 'Сначала добавьте организацию' },
    orgsLink:    { uz: 'Tashkilotlar →',            oz: 'Ташкилотлар →',           ru: 'Организации →' },
  },

  // ── Bank account modal ───────────────────────────────────────
  bankModal: {
    title:     { uz: 'Bank hisob raqami qo\'shish', oz: 'Банк ҳисоб рақами қўшиш', ru: 'Добавить банковский счёт' },
    bankName:  { uz: 'Bank nomi *',                  oz: 'Банк номи *',              ru: 'Название банка *' },
    account:   { uz: 'Hisob raqami *',               oz: 'Ҳисоб рақами *',           ru: 'Расчётный счёт *' },
    mfo:       { uz: 'MFO',                           oz: 'МФО',                      ru: 'МФО' },
    setDefault:{ uz: 'Asosiy hisob raqam sifatida belgilash', oz: 'Асосий ҳисоб рақам сифатида белгилаш', ru: 'Отметить как основной счёт' },
  },

  // ── View contract modal ──────────────────────────────────────
  viewModal: {
    edit:  { uz: '✎ Tahrirlash', oz: '✎ Таҳрирлаш', ru: '✎ Редактировать' },
    copy:  { uz: '📋 Nusxa',     oz: '📋 Нусха',     ru: '📋 Копия' },
  },

  // ── Contract modal ───────────────────────────────────────────
  contractModal: {
    newTitle:    { uz: 'Yangi shartnoma',             oz: 'Янги шартнома',             ru: 'Новый договор' },
    editTitle:   { uz: 'Shartnomani tahrirlash',      oz: 'Шартномани таҳрирлаш',      ru: 'Редактирование договора' },
    parties:     { uz: 'Tomonlar',                    oz: 'Томонлар',                  ru: 'Стороны' },
    customer:    { uz: 'Buyurtmachi *',               oz: 'Буюртмачи *',               ru: 'Заказчик *' },
    selectOrg:   { uz: '— Tashkilot tanlang —',       oz: '— Ташкилот танланг —',      ru: '— Выберите организацию —' },
    addOrgWarn:  { uz: '⚠ Avval tashkilot qo\'shing', oz: '⚠ Аввал ташкилот қўшинг',   ru: '⚠ Сначала добавьте организацию' },
    cpLabel:     { uz: 'Kontragent (2-tomon) *',      oz: 'Контрагент (2-томон) *',    ru: 'Контрагент (2-я сторона) *' },
    addNew:      { uz: '+ Yangi qo\'shish',            oz: '+ Янги қўшиш',              ru: '+ Добавить новый' },
    cpSearch:    { uz: 'Nomi yoki INN bilan qidirish…',oz: 'Номи ёки ИНН билан қидириш…',ru: 'Поиск по названию или ИНН…' },
    cpNotFound:  { uz: 'Kontragent topilmadi —',      oz: 'Контрагент топилмади —',    ru: 'Контрагент не найден —' },
    addNewLink:  { uz: 'yangi qo\'shish',             oz: 'янги қўшиш',                ru: 'добавить новый' },
    newCpTitle:  { uz: 'Yangi kontragent qo\'shish',  oz: 'Янги контрагент қўшиш',     ru: 'Добавить нового контрагента' },
    newCpDesc:   { uz: 'To\'liq ma\'lumot kiritilsa shartnoma to\'liq bo\'ladi', oz: 'Тўлиқ маълумот киритилса шартнома тўлиқ бўлади', ru: 'Полные данные обеспечат полноту договора' },
    basicInfo:   { uz: 'Asosiy ma\'lumotlar',         oz: 'Асосий маълумотлар',        ru: 'Основные данные' },
    bankDetails: { uz: 'Bank rekvizitlari',           oz: 'Банк реквизитлари',         ru: 'Банковские реквизиты' },
    saveSelect:  { uz: 'Saqlash va tanlash',          oz: 'Сақлаш ва танлаш',          ru: 'Сохранить и выбрать' },
    structure:   { uz: 'Shartnoma tuzilmasi',         oz: 'Шартнома тузилмаси',        ru: 'Структура договора' },
    viaTemplate: { uz: 'Shablon orqali',              oz: 'Шаблон орқали',             ru: 'По шаблону' },
    viaTemplateDesc: { uz: 'Tanlangan turga mos bo\'limlar avtomatik to\'ldiriladi', oz: 'Танланган турга мос бўлимлар автоматик тўлдирилади', ru: 'Разделы заполнятся автоматически по типу' },
    manual:      { uz: 'O\'zim yozaman',              oz: 'Ўзим ёзаман',               ru: 'Напишу сам' },
    manualDesc:  { uz: 'Bo\'sh tuzilma ochiladi',     oz: 'Бўш тузилма очилади',       ru: 'Откроется пустая структура' },
    selectTpl:   { uz: 'Shablon tanlang:',            oz: 'Шаблон танланг:',           ru: 'Выберите шаблон:' },
    noTpl:       { uz: 'Bu tur uchun shablon topilmadi', oz: 'Бу тур учун шаблон топилмади', ru: 'Шаблон для этого типа не найден' },
    tplApplied:  { uz: 'Shablon qo\'llanildi',        oz: 'Шаблон қўлланилди',         ru: 'Шаблон применён' },
    manualMode:  { uz: 'Qo\'lda to\'ldirilmoqda',     oz: 'Қўлда тўлдирилмоқда',       ru: 'Заполняется вручную' },
    reload:      { uz: '↺ Qayta yuklash',             oz: '↺ Қайта юклаш',             ru: '↺ Перезагрузить' },
    secTitle:    { uz: 'Bo\'lim sarlavhasi…',          oz: 'Бўлим сарлавҳаси…',         ru: 'Заголовок раздела…' },
    delSection:  { uz: 'Bo\'limni o\'chirish',         oz: 'Бўлимни ўчириш',            ru: 'Удалить раздел' },
    clauseText:  { uz: 'Band matni…',                 oz: 'Банд матни…',               ru: 'Текст пункта…' },
    delClause:   { uz: 'Bandni o\'chirish',            oz: 'Бандни ўчириш',             ru: 'Удалить пункт' },
    addClause:   { uz: '+ Band qo\'shish',            oz: '+ Банд қўшиш',              ru: '+ Добавить пункт' },
    addSection:  { uz: '+ Bo\'lim qo\'shish',          oz: '+ Бўлим қўшиш',             ru: '+ Добавить раздел' },
    toSpec:      { uz: 'Spesifikatsiya →',            oz: 'Спесификация →',            ru: 'Спецификация →' },
    specList:    { uz: 'Mahsulot/xizmatlar ro\'yxati', oz: 'Маҳсулот/хизматлар рўйхати',ru: 'Список товаров/услуг' },
    specAppend:  { uz: 'PDFga 1-ilova sifatida qo\'shiladi', oz: 'PDFga 1-илова сифатида қўшилади', ru: 'Будет добавлено как Приложение 1 к PDF' },
    forAll:      { uz: 'Barcha uchun:',               oz: 'Барча учун:',               ru: 'Для всех:' },
    addProduct:  { uz: '+ Mahsulot/xizmat qo\'shish', oz: '+ Маҳсулот/хизмат қўшиш',  ru: '+ Добавить товар/услугу' },
    specOptional:{ uz: 'Ixtiyoriy — qo\'shmasangiz PDFda jadval bo\'lmaydi', oz: 'Ихтиёрий — қўшмасангиз PDFда жадвал бўлмайди', ru: 'Необязательно — без этого в PDF не будет таблицы' },
    back:        { uz: '← Orqaga',                   oz: '← Орқага',                  ru: '← Назад' },
    saveContract:{ uz: '💾 Shartnomani saqlash',      oz: '💾 Шартномани сақлаш',       ru: '💾 Сохранить договор' },
    extraFields: { uz: 'Shartnomaga xos ma\'lumotlar', oz: 'Шартномага хос маълумотлар',ru: 'Специфичные данные договора' },
    extraDesc:   { uz: 'Ushbu maydonlar blanklarni avtomatik to\'ldiradi', oz: 'Ушбу майдонлар бланкларни автоматик тўлдиради', ru: 'Эти поля автоматически заполнят шаблон' },
    goToSections:{ uz: 'Bo\'limlarga o\'tish →',       oz: 'Бўлимларга ўтиш →',         ru: 'Перейти к разделам →' },
    loadAndEdit: { uz: 'Shablonni yuklash va tahrirlash →', oz: 'Шаблонni юклаш ва таҳрирлаш →', ru: 'Загрузить шаблон и редактировать →' },
    openEmpty:   { uz: 'Bo\'sh tuzilmani ochish →',   oz: 'Бўш тузилмани очиш →',      ru: 'Открыть пустую структуру →' },
  },

  // ── Login sahifasi ───────────────────────────────────────────
  login: {
    title:      { uz: 'Kirish',                        oz: 'Кириш',                       ru: 'Войти' },
    subtitle:   { uz: 'Hisobingizga kiring',           oz: 'Ҳисобингизга киринг',         ru: 'Войдите в аккаунт' },
    googleBtn:  { uz: 'Google orqali kirish',          oz: 'Google орқали кириш',         ru: 'Войти через Google' },
    or:         { uz: 'yoki',                          oz: 'ёки',                         ru: 'или' },
    password:   { uz: 'Parol',                         oz: 'Парол',                       ru: 'Пароль' },
    submit:     { uz: 'Kirish',                        oz: 'Кириш',                       ru: 'Войти' },
    error:      { uz: 'Email yoki parol noto\'g\'ri',  oz: 'Email ёки парол нотўғри',     ru: 'Неверный email или пароль' },
    noAccount:  { uz: 'Hisob yo\'qmi?',               oz: 'Ҳисоб йўқми?',               ru: 'Нет аккаунта?' },
    signupLink: { uz: 'Ro\'yxatdan o\'tish',           oz: 'Рўйхатдан ўтиш',             ru: 'Зарегистрироваться' },
  },

  // ── Signup sahifasi ──────────────────────────────────────────
  signup: {
    title:       { uz: 'Ro\'yxatdan o\'tish',          oz: 'Рўйхатдан ўтиш',             ru: 'Регистрация' },
    subtitle:    { uz: 'Bepul hisob oching',           oz: 'Бепул ҳисоб очинг',          ru: 'Создайте бесплатный аккаунт' },
    googleBtn:   { uz: 'Google orqali ro\'yxatdan o\'tish', oz: 'Google орқали рўйхатдан ўтиш', ru: 'Зарегистрироваться через Google' },
    or:          { uz: 'yoki',                         oz: 'ёки',                         ru: 'или' },
    password:    { uz: 'Parol',                        oz: 'Парол',                       ru: 'Пароль' },
    passwordHint:{ uz: 'Kamida 8 belgi',               oz: 'Камида 8 белги',              ru: 'Минимум 8 символов' },
    confirmPw:   { uz: 'Parolni tasdiqlang',           oz: 'Паролни тасдиқланг',          ru: 'Подтвердите пароль' },
    mismatch:    { uz: 'Parollar mos kelmadi',         oz: 'Паролlar мос келмади',        ru: 'Пароли не совпадают' },
    shortPass:   { uz: 'Parol kamida 8 belgi bo\'lishi kerak', oz: 'Парол камида 8 белги бўлиши керак', ru: 'Пароль должен быть не менее 8 символов' },
    submit:      { uz: 'Ro\'yxatdan o\'tish',          oz: 'Рўйхатдан ўтиш',             ru: 'Зарегистрироваться' },
    hasAccount:  { uz: 'Hisob bormi?',                oz: 'Ҳисоб борми?',               ru: 'Уже есть аккаунт?' },
    loginLink:   { uz: 'Kirish',                       oz: 'Кириш',                       ru: 'Войти' },
    verifyTitle: { uz: 'Emailni tasdiqlang',           oz: 'Электрон поч. тасдиқланг',   ru: 'Подтвердите email' },
    verifyText:  { uz: 'manziliga tasdiqlash xati yuborildi. Emailingizni tekshiring.', oz: 'манзилига тасдиқлаш хати юборилди. Электрон почтангизни текширинг.', ru: 'было отправлено письмо для подтверждения. Проверьте почту.' },
    goLogin:     { uz: 'Kirishga o\'tish →',           oz: 'Киришга ўтиш →',             ru: 'Перейти ко входу →' },
  },
} as const

// Yordamchi funksiya — til bo'yicha matn olish
export function tr<T extends Record<Lang, string>>(obj: T, lang: Lang): string {
  return obj[lang] ?? obj['uz']
}
