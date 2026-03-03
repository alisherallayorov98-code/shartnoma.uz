# Shartnoma.uz — Avtomatik Shartnoma Generator

## 🚀 Ishga tushirish

### 1. Loyihani yuklab olish
```bash
git clone https://github.com/sizning-username/shartnoma-uz.git
cd shartnoma-uz
npm install
```

### 2. Firebase sozlash
1. [Firebase Console](https://console.firebase.google.com) ga kiring
2. Yangi loyiha yarating
3. Authentication → Email/Password ni yoqing
4. Firestore Database yarating (production mode)
5. `src/firebase.js` faylga o'z config'ingizni kiriting

### 3. Firestore Security Rules
Firebase Console → Firestore → Rules ga quyidagini kiriting:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /contracts/{contractId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }
    match /counterparties/{cpId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }
  }
}
```

### 4. Ishga tushirish
```bash
npm start
```

### 5. Build qilish
```bash
npm run build
```

---

## 📁 Loyiha strukturasi

```
src/
├── pages/
│   ├── LandingPage.jsx      # Marketing sahifasi
│   ├── LoginPage.jsx        # Kirish
│   ├── RegisterPage.jsx     # Ro'yxatdan o'tish (2 bosqich)
│   ├── Dashboard.jsx        # Bosh sahifa
│   ├── CreateContract.jsx   # Shartnoma yaratish (5 bosqich)
│   ├── BilingualContract.jsx # Xalqaro 2 tilli shartnoma
│   ├── Archive.jsx          # Arxiv va qidiruv
│   ├── OtherPages.jsx       # Drafts, Counterparties, Settings
│   └── AdminPanel.jsx       # Admin panel
├── components/
│   └── Sidebar.jsx          # Yon panel (barcha sahifalarda)
├── context/
│   └── AuthContext.js       # Firebase Auth + user management
├── utils/
│   └── contractGenerator.js # PDF va Word yaratish
├── firebase.js              # Firebase config
├── App.js                   # Routing
└── index.css                # Global stillar
```

---

## 🔑 Admin foydalanuvchi yaratish
Firebase Console → Firestore → users → {userId} → `isAdmin: true` qo'shing

---

## 💰 To'lov integratsiyasi (Payme/Click)
`src/pages/OtherPages.jsx` → Settings → payments tab da Payme/Click API ulang.

---

## 📦 Asosiy paketlar
- `react-router-dom` — routing
- `firebase` — backend, auth, database
- `jspdf` — PDF yaratish
- `docx` — Word yaratish
- `recharts` — grafiklar
- `react-hot-toast` — bildirishnomalar

---

## 🌐 Deploy (Firebase Hosting)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```
