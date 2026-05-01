// app.js
import { renderLyrics } from "./renderer.js";

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
    const matched = catalog.filter(s =>
      normalize(s.title).includes(q) || normalize(s.artist).includes(q)
    );

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
initTheme();
initSearch();
initFavorites();
initRandom();
initIndex();
initSong();