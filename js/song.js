// js/song.js
import { renderLyrics } from "./renderer.js";
import { initChordClick } from "./chord-diagram.js";

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function transposeChordName(chordName, semitones) {
  if (semitones === 0) return chordName;
  const match = chordName.match(/^([A-G]#?)(.*)$/);
  if (!match) return chordName;
  const idx = NOTES.indexOf(match[1]);
  if (idx === -1) return chordName;
  return NOTES[((idx + semitones) % 12 + 12) % 12] + match[2];
}

function transposeSong(sections, semitones) {
  return sections.map(section => {
    if (section === null) return null;
    return {
      ...section,
      chords: section.chords
        ? section.chords.map(c => ({ ...c, name: transposeChordName(c.name, semitones) }))
        : []
    };
  });
}

function getOriginalRoot(key) {
  return key.match(/^([A-G]#?)/)?.[1] || key;
}

function renderKeyRow(activeNote, onNoteClick) {
  const row = document.getElementById("key-row");
  row.innerHTML = "";
  NOTES.forEach(note => {
    const span = document.createElement("span");
    span.className = "key-note" + (note === activeNote ? " active" : "");
    span.textContent = note;
    span.addEventListener("click", () => onNoteClick(note));
    row.appendChild(span);
  });
}

// Azərbaycan/Türk hərflərini normalize et ki axtarış düzgün işləsin
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

function initTheme() {
  const btn = document.getElementById("theme-toggle");
  const saved = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  btn.textContent = saved === "dark" ? "🌙" : "☀️";
  btn.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    btn.textContent = next === "dark" ? "🌙" : "☀️";
  });
}

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
        li.innerHTML = `<a href="song.html?id=${s.id}">
          <span class="res-title">${s.title}</span>
          <span class="res-meta">${s.artist} · ${s.key}</span>
        </a>`;
        results.appendChild(li);
      });
    }
    results.classList.remove("hidden");
  }

  input.addEventListener("input", e => search(e.target.value));
  document.addEventListener("click", e => {
    if (!input.contains(e.target) && !results.contains(e.target))
      results.classList.add("hidden");
  });
}

async function init() {
  initTheme();
  initSearch();

  const id = new URLSearchParams(window.location.search).get("id");
  const lyricsEl = document.getElementById("lyrics");
  if (!id) { lyricsEl.innerHTML = `<p class="error">Mahnı tapılmadı.</p>`; return; }

  let song;
  try {
    const res = await fetch(`songs/${id}.json`);
    if (!res.ok) throw new Error("Fayl tapılmadı");
    song = await res.json();
  } catch (err) {
    lyricsEl.innerHTML = `<p class="error">Mahnı yüklənmədi: ${err.message}</p>`;
    return;
  }

  document.title = `${song.title} — ${song.artist}`;
  document.getElementById("song-title").textContent  = song.title;
  document.getElementById("song-artist").textContent = song.artist;
  document.getElementById("song-key").textContent    = song.key;
  document.getElementById("song-capo").textContent   = song.capo ?? 0;


  // ── Ritm ──────────────────────────────────────────────────
  if (song.rhythm && song.rhythm.length > 0) {
    const rhythmSection  = document.getElementById("rhythm-section");
    const rhythmDisplay  = document.getElementById("rhythm-display");
    rhythmSection.classList.remove("hidden");

    song.rhythm.forEach((beat, i) => {
      const span = document.createElement("span");
      span.className = "rhythm-beat";

      if (beat === "↓") {
        span.classList.add("beat-down");
        span.innerHTML = `<span class="beat-arrow">↓</span><span class="beat-num">${i + 1}</span>`;
      } else if (beat === "↑") {
        span.classList.add("beat-up");
        span.innerHTML = `<span class="beat-arrow">↑</span><span class="beat-num">&nbsp;</span>`;
      } else if (beat === "-") {
        span.classList.add("beat-mute");
        span.innerHTML = `<span class="beat-arrow">✕</span><span class="beat-num">&nbsp;</span>`;
      }

      rhythmDisplay.appendChild(span);
    });
  }

  const originalRoot = getOriginalRoot(song.key);
  const originalIdx  = NOTES.indexOf(originalRoot);
  let semitones = 0;

  function update() {
    const transposed = transposeSong(song.sections, semitones);
    lyricsEl.innerHTML = "";
    renderLyrics({ ...song, sections: transposed }, "lyrics");
    initChordClick(transposed, song.chords_override || {});
    const activeNote = NOTES[((originalIdx + semitones) % 12 + 12) % 12];
    renderKeyRow(activeNote, (clickedNote) => {
      semitones = ((NOTES.indexOf(clickedNote) - originalIdx) % 12 + 12) % 12;
      update();
    });
  }

  // Orijinal tona klik — sıfırla
  const origKeyEl = document.getElementById("song-key");
  if (origKeyEl) {
    origKeyEl.style.cursor = "pointer";
    origKeyEl.addEventListener("click", () => { semitones = 0; update(); });
  }

  // Asan tona klik
  const easyKeyEl = document.getElementById("song-easy-key");
  if (easyKeyEl) {
    easyKeyEl.style.cursor = "pointer";
    easyKeyEl.addEventListener("click", () => {
      const clickedIdx = NOTES.indexOf(easyKeyEl.textContent.trim());
      if (clickedIdx !== -1) {
        semitones = ((clickedIdx - originalIdx) % 12 + 12) % 12;
        update();
      }
    });
  }

  document.getElementById("btn-up").addEventListener("click", () => {
    semitones = (semitones + 1) % 12;
    update();
  });
  document.getElementById("btn-down").addEventListener("click", () => {
    semitones = ((semitones - 1) % 12 + 12) % 12;
    update();
  });

  // ── Sevimli düyməsi ────────────────────────────────────────
  const favBtn = document.getElementById("btn-favorite");
  if (favBtn) {
    function getFavorites() {
      try { return JSON.parse(localStorage.getItem("favorites") || "[]"); } catch { return []; }
    }
    function saveFavorites(favs) {
      localStorage.setItem("favorites", JSON.stringify(favs));
    }
    function isFavorite() {
      return getFavorites().some(f => f.id === song.id);
    }
    function updateFavBtn() {
      if (isFavorite()) {
        favBtn.textContent = "❤️ Sevimlilərə əlavədir";
        favBtn.classList.add("fav-active");
      } else {
        favBtn.textContent = "🤍 Sevimlilərə əlavə et";
        favBtn.classList.remove("fav-active");
      }
    }
    favBtn.addEventListener("click", () => {
      let favs = getFavorites();
      if (isFavorite()) {
        favs = favs.filter(f => f.id !== song.id);
      } else {
        favs.push({ id: song.id, title: song.title, artist: song.artist, key: song.key });
      }
      saveFavorites(favs);
      updateFavBtn();
    });
    updateFavBtn();
  }


  update();
}

init();