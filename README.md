# 🎸 Akkordum.az

Azərbaycan dilində gitar akkord və mahnı sözlərini bir yerdə tapa biləcəyiniz veb tətbiq.

---

## 📌 Haqqında

**Akkordum.az** — gitaristlər üçün hazırlanmış, istifadəsi sadə bir akkord və mahnı sözləri platformasıdır. İstifadəçilər mahnıları axtara, akkordları öyrənə, öz sevimlilərini saxlaya və mahnılara şəxsi ritm əlavə edə bilərlər.

---

## ✨ Xüsusiyyətlər

- 🔍 **Axtarış** — Mahnı adı və ya ifaçıya görə sürətli axtarış
- 🎵 **Akkord görünüşü** — Mahnı sözlərinin üstündə akkordlar, düzgün mövqedə
- 🔄 **Transpoz** — Akorları istənilən tona köçür, kapodastr avtomatik hesablanır
- 🎸 **Akkord diaqramları** — Hər akkorda klik edəndə gitar diaqramı açılır
- ❤️ **Sevimlilər** — Google hesabı ilə giriş edib sevimli mahnıları saxla
- 🥁 **Ritm** — Mahnının orijinal ritmini gör, öz ritmini əlavə et
- 🌙 **Tema** — Qaranlıq / işıqlı tema dəstəyi
- 👤 **Google ilə giriş** — Firebase Authentication ilə təhlükəsiz giriş

---

## 🗂️ Layihə strukturu

```
akkordum/
├── index.html          # Ana səhifə
├── song.html           # Mahnı səhifəsi
├── artist.html         # İfaçı səhifəsi
├── favorites.html      # Sevimlilər
├── akkordlar.html      # Bütün akkordlar
├── profile.html        # Profil / giriş
├── rhythm.html         # Eyni ritmlə olan mahnılar
├── style.css           # Bütün stillər
├── songs/
│   ├── catalog.json    # Mahnı kataloqu (yüngül)
│   └── *.json          # Hər mahnının tam datası
└── js/
    ├── app.js              # Ana səhifə məntiqi
    ├── song.js             # Mahnı səhifəsi məntiqi
    ├── artist.js           # İfaçı səhifəsi
    ├── favorites.js        # Sevimlilər
    ├── akkordlar.js        # Akkordlar səhifəsi
    ├── profile.js          # Profil səhifəsi
    ├── rhythm.js           # Ritm səhifəsi
    ├── auth.js             # Firebase autentifikasiya
    ├── firebase.js         # Firebase konfiqurasiyası
    ├── firestore-favs.js   # Firestore əməliyyatları
    ├── renderer.js         # Mahnı sözlərini render edir
    ├── chord-diagram.js    # Akkord diaqramları (SVG)
    └── chords-db.js        # Akkord veritabanı
```

---

## 🎵 Mahnı data formatı

Hər mahnı `songs/` qovluğunda ayrı `.json` faylında saxlanılır:

```json
{
  "id": "mahni-adi",
  "title": "Mahnı Adı",
  "artist": "İfaçı",
  "key": "Am",
  "capo": 0,
  "chords": ["Am", "Dm", "Em", "G", "F"],
  "rhythm": ["↓", "↑", "↓", "↑", "↓", "↑", "↓", "↑"],
  "sections": [
    {
      "label": "Kıta 1",
      "chords": [
        { "name": "Am", "offset": 0 },
        { "name": "G",  "offset": 12 }
      ],
      "line": "Mahnı sözləri burda"
    },
    null
  ]
}
```

`sections` massivindəki `null` dəyərlər bənd aralarını bildirir.  
`offset` — akkordun neçənci simvolun üstündə yerləşdiyini göstərir.

`catalog.json` isə yalnız siyahı üçün lazım olan yüngül məlumatları saxlayır:

```json
[
  {
    "id": "mahni-adi",
    "title": "Mahnı Adı",
    "artist": "İfaçı",
    "key": "Am",
    "capo": 0,
    "chords": ["Am", "Dm", "Em", "G", "F"],
    "rhythm": ["↓", "↑", "↓", "↑"]
  }
]
```

---

## 🚀 Qurulum

### Tələblər

- Müasir brauzer (Chrome, Firefox, Safari, Edge)
- Lokal server (məsələn VS Code **Live Server** extension-u)
- [Firebase](https://console.firebase.google.com) hesabı

### Addımlar

**1. Repo-nu klonla:**
```bash
git clone https://github.com/sənin-adın/akkordum.git
cd akkordum
```

**2. Firebase qur:**
- [Firebase Console](https://console.firebase.google.com)-da yeni layihə yarat
- **Authentication** → **Google** giriş metodunu aktiv et
- **Firestore Database** yarat (test modunda)
- **Authorized domains**-ə `localhost` və `127.0.0.1` əlavə et

**3. Firebase konfiqurasiyasını yenilə:**

`js/firebase.js` faylını aç və öz məlumatlarınla əvəz et:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

**4. Lokal server ilə aç:**

VS Code-da **Live Server** extension-u qur, `index.html`-i sağ klikləyib "Open with Live Server" seç.

Və ya terminal ilə:
```bash
npx serve .
```

---

## 🛠️ Yeni mahnı əlavə etmək

**1.** `songs/` qovluğunda yeni `.json` faylı yarat (məsələn `yeni-mahni.json`)

**2.** `songs/catalog.json`-a bir sətir əlavə et:
```json
{
  "id": "yeni-mahni",
  "title": "Yeni Mahnı",
  "artist": "İfaçı adı",
  "key": "Gm",
  "capo": 0,
  "chords": ["Gm", "Cm", "D"]
}
```

Başqa heç nə lazım deyil — sayt avtomatik tanıyır.

---

## 🔧 İstifadə olunan texnologiyalar

| Texnologiya | Məqsəd |
|---|---|
| Vanilla JS (ES Modules) | Frontend məntiqi |
| Firebase Authentication | Google ilə giriş |
| Cloud Firestore | İstifadəçi datası (sevimlilər, ritmlər) |
| SVG | Akkord diaqramları |
| CSS Variables | Tema sistemi |
| Google Fonts | DM Sans, JetBrains Mono |

---

## 📄 Lisenziya

Bu layihə musiqi təhsili məqsədi ilə hazırlanmışdır. Mahnı sözləri və akkordların hüquqları müvafiq sahiblərinə məxsusdur.
