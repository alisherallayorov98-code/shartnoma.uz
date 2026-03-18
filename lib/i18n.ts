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
    loading:     { uz: 'Yuklanmoqda…',                     oz: 'Юкланмоқда…',                    ru: 'Загрузка…' },
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
} as const

// Yordamchi funksiya — til bo'yicha matn olish
export function tr<T extends Record<Lang, string>>(obj: T, lang: Lang): string {
  return obj[lang] ?? obj['uz']
}
