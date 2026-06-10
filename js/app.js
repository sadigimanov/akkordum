import { initAuth } from "./auth.js";
// app.js
import { renderLyrics } from "./renderer.js";

import { getHistory, getPopularSongs, getFeaturedSongs } from "./firestore-favs.js";
import { auth, onAuthStateChanged } from "./firebase.js";

// ── Yardımçı funksiyalar ─────────────────────────────────────
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// ── Tema ─────────────────────────────────────────────────────
function initTheme() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  const saved = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  btn.textContent = saved === "dark" ? "🌙" : "☀️";

  btn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    btn.textContent = next === "dark" ? "🌙" : "☀️";
  });
}

// Azərbaycan/Türk hərflərini normalize et
function normalize(str) {
  return str
    .replace(/İ/g, "i").replace(/I/g, "i")
    .replace(/Ğ/g, "g").replace(/ğ/g, "g")
    .replace(/Ü/g, "u").replace(/ü/g, "u")
    .replace(/Ş/g, "s").replace(/ş/g, "s")
    .replace(/Ö/g, "o").replace(/ö/g, "o")
    .replace(/Ç/g, "c").replace(/ç/g, "c")
    .replace(/Ə/g, "e").replace(/ə/g, "e")
    .toLowerCase();
}

// ── Axtarış ──────────────────────────────────────────────────
async function initSearch() {
  const input   = document.getElementById("search-input");
  const results = document.getElementById("search-results");
  if (!input || !results) return;

  let catalog = [];
  try {
    catalog = await fetch("songs/catalog.json").then(r => r.json());
  } catch {
    return;
  }

  function search(query) {
    if (!query.trim()) {
      results.classList.add("hidden");
      results.innerHTML = "";
      return;
    }

    const q = normalize(query);
    const byTitle  = catalog.filter(s => normalize(s.title).startsWith(q));
    const byArtist = catalog.filter(s => !normalize(s.title).startsWith(q) && normalize(s.artist).startsWith(q));
    const matched  = [...byTitle, ...byArtist];

    results.innerHTML = "";

    if (matched.length === 0) {
      results.innerHTML = `<li class="search-no-result">Nəticə tapılmadı</li>`;
    } else {
      matched.forEach(s => {
        const li = document.createElement("li");
        li.innerHTML = `
          <a href="song.html?id=${s.id}">
            <span class="res-title">${s.title}</span>
            <span class="res-meta">${s.artist} · ${s.key}${s.capo ? " · Capo " + s.capo : ""}</span>
          </a>`;
        results.appendChild(li);
      });
    }

    results.classList.remove("hidden");
  }

  input.addEventListener("input", e => search(e.target.value));

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const first = results.querySelector("li a");
      if (first) {
        window.location.href = first.href;
      }
    }
  });

  // Xaricdə klik edəndə bağla
  document.addEventListener("click", e => {
    if (!input.contains(e.target) && !results.contains(e.target)) {
      results.classList.add("hidden");
    }
  });
}

// ── Sevimlilər (index səhifəsi) ──────────────────────────────
function getFavorites() {
  try { return JSON.parse(localStorage.getItem("favorites") || "[]"); } catch { return []; }
}

function initFavorites() {
  const section  = document.getElementById("favorites-section");
  const listEl   = document.getElementById("favorites-list");
  if (!section || !listEl) return;

  const favs = getFavorites();
  if (favs.length === 0) return;

  section.classList.remove("hidden");
  favs.forEach(s => {
    const item = document.createElement("a");
    item.href = `song.html?id=${s.id}`;
    item.className = "song-item";
    item.innerHTML = `
      <span class="song-title">${s.title}</span>
      <span class="song-meta">${s.artist} · ${s.key}</span>
    `;
    listEl.appendChild(item);
  });
}

// ── Son Çaldıklarım panel (index səhifəsi) ───────────────────
async function initHistory() {
  const card = document.getElementById("card-history");
  if (!card) return;

  let panel = document.getElementById("history-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "history-panel";
    panel.className = "random-panel hidden";
    panel.innerHTML = `
      <div class="random-panel-header">
        <span>Son Çaldıklarım</span>
        <button class="random-panel-close" id="history-close">✕</button>
      </div>
      <div class="artist-grid" id="history-grid"></div>
      <p class="section-empty" id="history-empty" style="display:none">Hələ heç bir mahnı açmamısınız.</p>
    `;
    document.body.appendChild(panel);

    document.getElementById("history-close").addEventListener("click", () => {
      panel.classList.add("hidden");
    });
    document.addEventListener("click", (e) => {
      if (!panel.contains(e.target) && e.target !== card && !card.contains(e.target)) {
        panel.classList.add("hidden");
      }
    });
  }

  async function renderHistory() {
    const grid  = document.getElementById("history-grid");
    const empty = document.getElementById("history-empty");
    grid.innerHTML = "";

    // Auth hazır olana qədər gözlə
    const user = await new Promise(resolve => {
      const unsub = onAuthStateChanged(auth, u => { unsub(); resolve(u); });
    });

    if (!user) {
      empty.style.display = "none";
      grid.innerHTML = `
        <div class="panel-login-msg">
          <p>Tarixçənizi görmək üçün</p>
          <a href="profile.html">giriş edin →</a>
        </div>`;
      return;
    }

    const history = await getHistory(user);

    if (history.length === 0) {
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    history.forEach(s => {
      const a = document.createElement("a");
      a.href = `song.html?id=${s.id}`;
      a.className = "artist-card";
      a.innerHTML = `
        <span class="artist-card-title">${s.title}</span>
        <span class="artist-card-meta">${s.artist} · ${s.key}</span>
      `;
      grid.appendChild(a);
    });
  }

  card.addEventListener("click", (e) => {
    e.preventDefault();
    if (!panel.classList.contains("hidden")) {
      panel.classList.add("hidden");
      return;
    }
    renderHistory();
    panel.classList.remove("hidden");
  });
}

// ── Rastgele panel (index səhifəsi) ──────────────────────────
async function initRandom() {
  const card = document.getElementById("card-random");
  if (!card) return;

  let catalog = [];
  try {
    catalog = await fetch("songs/catalog.json").then(r => r.json());
  } catch { return; }

  // Panel yarat
  const panel = document.createElement("div");
  panel.id = "random-panel";
  panel.className = "random-panel hidden";
  panel.innerHTML = `
    <div class="random-panel-header">
      <span>Rastgele Mahnılar</span>
      <button class="random-panel-close" id="random-close">✕</button>
    </div>
    <div class="artist-grid" id="random-grid"></div>
    <button class="section-refresh-btn" id="random-refresh" style="margin:0.8rem 0 0.4rem">↻ Yenilə</button>
  `;
  document.body.appendChild(panel);

  function renderRandom() {
    const grid = document.getElementById("random-grid");
    grid.innerHTML = "";
    const shuffled = [...catalog].sort(() => Math.random() - 0.5).slice(0, 10);
    shuffled.forEach(s => {
      const card = document.createElement("a");
      card.href = `song.html?id=${s.id}`;
      card.className = "artist-card";
      card.innerHTML = `
        <span class="artist-card-title">${s.title}</span>
        <span class="artist-card-meta">${s.artist} · ${s.key}</span>
      `;
      grid.appendChild(card);
    });
  }

  card.addEventListener("click", (e) => {
    e.preventDefault();
    if (!panel.classList.contains("hidden")) {
      panel.classList.add("hidden");
      return;
    }
    renderRandom();
    panel.classList.remove("hidden");
  });

  document.getElementById("random-close").addEventListener("click", () => {
    panel.classList.add("hidden");
  });

  document.getElementById("random-refresh").addEventListener("click", renderRandom);

  document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && e.target !== card && !card.contains(e.target)) {
      panel.classList.add("hidden");
    }
  });
}

// ── "Tezliklə" paneli ────────────────────────────────────────
function initSoonCards() {
  const soonIds = ["card-soon-4", "card-soon-5"];

  let panel = document.getElementById("soon-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "soon-panel";
    panel.className = "random-panel hidden";
    panel.innerHTML = `
      <div class="random-panel-header">
        <span>Tezliklə...</span>
        <button class="random-panel-close" id="soon-close">✕</button>
      </div>
      <p class="soon-message">Bu bölmə hazırlanır. Tezliklə əlavə olunacaq! 🎸</p>
    `;
    document.body.appendChild(panel);

    document.getElementById("soon-close").addEventListener("click", () => {
      panel.classList.add("hidden");
    });
    document.addEventListener("click", (e) => {
      const isCard = soonIds.some(id => {
        const el = document.getElementById(id);
        return el && (e.target === el || el.contains(e.target));
      });
      if (!panel.contains(e.target) && !isCard) {
        panel.classList.add("hidden");
      }
    });
  }

  soonIds.forEach(id => {
    const card = document.getElementById(id);
    if (!card) return;
    card.addEventListener("click", (e) => {
      e.preventDefault();
      if (!panel.classList.contains("hidden")) {
        panel.classList.add("hidden");
        return;
      }
      panel.classList.remove("hidden");
    });
  });
}

// ── Əlaqə paneli ─────────────────────────────────────────────
async function initFeedback() {
  const card = document.getElementById("card-feedback");
  if (!card) return;

  const TYPE_DESCS = {
    "song-request": "İstədiyiniz mahnını yazın, ən qısa zamanda əlavə edəcəyik.",
    "suggestion":   "Saytla bağlı təklifinizi bizimlə paylaşın.",
    "complaint":    "Problemi və ya şikayətinizi bildirin.",
  };

  let panel = document.getElementById("feedback-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "feedback-panel";
    panel.className = "random-panel hidden";
    panel.innerHTML = `
      <div class="random-panel-header">
        <span>Bizimlə əlaqə</span>
        <button class="random-panel-close" id="feedback-close">✕</button>
      </div>
      <div class="feedback-tabs">
        <button class="feedback-tab active" data-type="song-request">🎵 Mahnı istəyi</button>
        <button class="feedback-tab" data-type="suggestion">💡 Təklif</button>
        <button class="feedback-tab" data-type="complaint">⚠️ Şikayət</button>
      </div>
      <div class="feedback-type-desc" id="feedback-desc">İstədiyiniz mahnını yazın, ən qısa zamanda əlavə edəcəyik.</div>
      <textarea id="feedback-text" class="feedback-textarea" placeholder="Mesajınızı buraya yazın..." rows="4"></textarea>
      <div class="feedback-form-footer">
        <span class="feedback-char-count" id="feedback-char">0 / 500</span>
        <button class="feedback-submit" id="feedback-submit">Göndər</button>
      </div>
      <div class="feedback-success hidden" id="feedback-success">✅ Mesajınız göndərildi! Təşəkkür edirik.</div>
      <div class="feedback-error hidden" id="feedback-error">❌ Xəta baş verdi. Yenidən cəhd edin.</div>
    `;
    document.body.appendChild(panel);

    // Bağla
    document.getElementById("feedback-close").addEventListener("click", () => panel.classList.add("hidden"));
    document.addEventListener("click", (e) => {
      if (!panel.contains(e.target) && e.target !== card && !card.contains(e.target))
        panel.classList.add("hidden");
    });

    // Tablar
    let activeType = "song-request";
    panel.querySelectorAll(".feedback-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        panel.querySelectorAll(".feedback-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        activeType = tab.dataset.type;
        document.getElementById("feedback-desc").textContent = TYPE_DESCS[activeType];
        document.getElementById("feedback-success").classList.add("hidden");
        document.getElementById("feedback-error").classList.add("hidden");
      });
    });

    // Simvol sayı
    const MAX = 500;
    document.getElementById("feedback-text").addEventListener("input", (e) => {
      const len = e.target.value.length;
      if (len > MAX) e.target.value = e.target.value.slice(0, MAX);
      document.getElementById("feedback-char").textContent = `${Math.min(len, MAX)} / ${MAX}`;
    });

    // Göndər
    document.getElementById("feedback-submit").addEventListener("click", async () => {
      const { auth } = await import("./firebase.js");
      if (!auth.currentUser) {
        document.getElementById("feedback-error").textContent = "⚠️ Göndərmək üçün <a href='profile.html' class='login-link'>giriş</a> etməlisiniz.";
        document.getElementById("feedback-error").classList.remove("hidden");
        return;
      }
      const text = document.getElementById("feedback-text").value.trim();
      if (!text) { document.getElementById("feedback-text").focus(); return; }

      const submitBtn = document.getElementById("feedback-submit");
      submitBtn.disabled = true;
      submitBtn.textContent = "Göndərilir...";
      document.getElementById("feedback-success").classList.add("hidden");
      document.getElementById("feedback-error").classList.add("hidden");

      try {
        const { db, doc, setDoc, auth } = await import("./firebase.js");
        const user = auth.currentUser;
        await setDoc(doc(db, "feedback", Date.now().toString()), {
          type: activeType,
          text,
          uid: user?.uid || null,
          email: user?.email || null,
          createdAt: new Date().toISOString(),
        });
        document.getElementById("feedback-text").value = "";
        document.getElementById("feedback-char").textContent = "0 / 500";
        document.getElementById("feedback-success").classList.remove("hidden");
      } catch (e) {
        console.error(e);
        document.getElementById("feedback-error").classList.remove("hidden");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Göndər";
      }
    });
  }

  card.addEventListener("click", (e) => {
    e.preventDefault();
    if (!panel.classList.contains("hidden")) {
      panel.classList.add("hidden");
      return;
    }
    document.getElementById("feedback-success").classList.add("hidden");
    document.getElementById("feedback-error").classList.add("hidden");
    panel.classList.remove("hidden");
  });
}

// ── Yeni Akorlar paneli ──────────────────────────────────────
async function initNewSongs() {
  const card = document.getElementById("card-soon-3");
  if (!card) return;

  let catalog = [];
  try {
    catalog = await fetch("songs/catalog.json").then(r => r.json());
  } catch { return; }

  let panel = document.getElementById("new-songs-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "new-songs-panel";
    panel.className = "random-panel hidden";
    panel.innerHTML = `
      <div class="random-panel-header">
        <span>Yeni Akorlar</span>
        <button class="random-panel-close" id="new-songs-close">✕</button>
      </div>
      <div class="artist-grid" id="new-songs-grid"></div>
    `;
    document.body.appendChild(panel);

    document.getElementById("new-songs-close").addEventListener("click", () => {
      panel.classList.add("hidden");
    });
    document.addEventListener("click", (e) => {
      if (!panel.contains(e.target) && e.target !== card && !card.contains(e.target)) {
        panel.classList.add("hidden");
      }
    });
  }

  function renderNewSongs() {
    const grid = document.getElementById("new-songs-grid");
    grid.innerHTML = "";

    const sorted = [...catalog]
      .filter(s => s.addedAt)
      .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
      .slice(0, 10);

    if (sorted.length === 0) {
      grid.innerHTML = `<p class="section-empty" style="grid-column:1/-1">Hələ mahnı yoxdur.</p>`;
      return;
    }

    sorted.forEach(s => {
      const a = document.createElement("a");
      a.href = `song.html?id=${s.id}`;
      a.className = "artist-card";
      a.innerHTML = `
        <span class="artist-card-title">${s.title}</span>
        <span class="artist-card-meta">${s.artist} · ${s.key}</span>
      `;
      grid.appendChild(a);
    });
  }

  card.addEventListener("click", (e) => {
    e.preventDefault();
    if (!panel.classList.contains("hidden")) {
      panel.classList.add("hidden");
      return;
    }
    renderNewSongs();
    panel.classList.remove("hidden");
  });
}

// ── Önə Çıxanlar paneli ──────────────────────────────────────
async function initFeatured() {
  const card = document.getElementById("card-soon-2");
  if (!card) return;

  let catalog = [];
  try {
    catalog = await fetch("songs/catalog.json").then(r => r.json());
  } catch { return; }

  let panel = document.getElementById("featured-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "featured-panel";
    panel.className = "random-panel hidden";
    panel.innerHTML = `
      <div class="random-panel-header">
        <span>🔥 Önə Çıxanlar</span>
        <button class="random-panel-close" id="featured-close">✕</button>
      </div>
      <div class="artist-grid" id="featured-grid"></div>
      <p class="section-empty" id="featured-empty" style="display:none">Hələ seçilmiş mahnı yoxdur.</p>
    `;
    document.body.appendChild(panel);

    document.getElementById("featured-close").addEventListener("click", () => {
      panel.classList.add("hidden");
    });
    document.addEventListener("click", (e) => {
      if (!panel.contains(e.target) && e.target !== card && !card.contains(e.target)) {
        panel.classList.add("hidden");
      }
    });
  }

  async function renderFeatured() {
    const grid  = document.getElementById("featured-grid");
    const empty = document.getElementById("featured-empty");
    grid.innerHTML = "<p class='section-empty' style='grid-column:1/-1'>Yüklənir...</p>";

    const ids = await getFeaturedSongs();
    grid.innerHTML = "";

    if (ids.length === 0) {
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    ids.forEach(id => {
      const s = catalog.find(c => c.id === id);
      if (!s) return;
      const a = document.createElement("a");
      a.href = `song.html?id=${s.id}`;
      a.className = "artist-card";
      a.innerHTML = `
        <span class="artist-card-title">${s.title}</span>
        <span class="artist-card-meta">${s.artist} · ${s.key}</span>
      `;
      grid.appendChild(a);
    });
  }

  card.addEventListener("click", (e) => {
    e.preventDefault();
    if (!panel.classList.contains("hidden")) {
      panel.classList.add("hidden");
      return;
    }
    renderFeatured();
    panel.classList.remove("hidden");
  });
}

// ── Populyar Mahnılar paneli ─────────────────────────────────
async function initPopularSongs() {
  const card = document.getElementById("card-soon-1");
  if (!card) return;

  let panel = document.getElementById("popular-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "popular-panel";
    panel.className = "random-panel hidden";
    panel.innerHTML = `
      <div class="random-panel-header">
        <span>⭐ Populyar Mahnılar</span>
        <button class="random-panel-close" id="popular-close">✕</button>
      </div>
      <div class="artist-grid" id="popular-grid"></div>
      <p class="section-empty" id="popular-empty" style="display:none">Hələ məlumat yoxdur.</p>
    `;
    document.body.appendChild(panel);

    document.getElementById("popular-close").addEventListener("click", () => {
      panel.classList.add("hidden");
    });
    document.addEventListener("click", (e) => {
      if (!panel.contains(e.target) && e.target !== card && !card.contains(e.target)) {
        panel.classList.add("hidden");
      }
    });
  }

  async function renderPopular() {
    const grid  = document.getElementById("popular-grid");
    const empty = document.getElementById("popular-empty");
    grid.innerHTML = "<p class='section-empty' style='grid-column:1/-1'>Yüklənir...</p>";

    const songs = await getPopularSongs(10);

    grid.innerHTML = "";
    if (songs.length === 0) {
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    songs.forEach(s => {
      const a = document.createElement("a");
      a.href = `song.html?id=${s.id}`;
      a.className = "artist-card";
      a.innerHTML = `
        <span class="artist-card-title">${s.title}</span>
        <span class="artist-card-meta">${s.artist} · ${s.key} · ❤️ ${s.favoriteCount}</span>
      `;
      grid.appendChild(a);
    });
  }

  card.addEventListener("click", (e) => {
    e.preventDefault();
    if (!panel.classList.contains("hidden")) {
      panel.classList.add("hidden");
      return;
    }
    renderPopular();
    panel.classList.remove("hidden");
  });
}

// ── Index səhifəsi ────────────────────────────────────────────
async function initIndex() {
  const listEl = document.getElementById("song-list");
  if (!listEl) return;

  try {
    const catalog = await fetch("songs/catalog.json").then(r => r.json());
    catalog.forEach(song => {
      const item = document.createElement("a");
      item.href = `song.html?id=${song.id}`;
      item.className = "song-item";
      item.innerHTML = `
        <span class="song-title">${song.title}</span>
        <span class="song-meta">${song.artist} · ${song.key}${song.capo ? " · Capo " + song.capo : ""}</span>
      `;
      listEl.appendChild(item);
    });
  } catch {
    listEl.innerHTML = `<p class="error">Mahnılar yüklənmədi.</p>`;
  }
}

// ── Song səhifəsi ─────────────────────────────────────────────
async function initSong() {
  const lyricsEl = document.getElementById("lyrics");
  if (!lyricsEl) return;

  const id = getParam("id");
  if (!id) {
    lyricsEl.innerHTML = `<p class="error">Mahnı tapılmadı.</p>`;
    return;
  }

  try {
    const song = await fetch(`songs/${id}.json`).then(r => {
      if (!r.ok) throw new Error("Fayl tapılmadı");
      return r.json();
    });

    document.title = `${song.title} — ${song.artist}`;
    const titleEl = document.getElementById("song-title");
    const metaEl  = document.getElementById("song-meta");
    if (titleEl) titleEl.textContent = song.title;
    if (metaEl)  metaEl.textContent  = `${song.artist} · ${song.key}${song.capo ? " · Capo " + song.capo : ""}`;

    renderLyrics(song, "lyrics");
  } catch (err) {
    lyricsEl.innerHTML = `<p class="error">Mahnı yüklənmədi: ${err.message}</p>`;
  }
}

// ── Başlat ────────────────────────────────────────────────────
initAuth();
initTheme();
initSearch();
initFavorites();
initRandom();
initHistory();
initSoonCards();
initNewSongs();
initPopularSongs();
initFeatured();
initFeedback();
initIndex();
initSong();