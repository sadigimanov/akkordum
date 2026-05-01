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



  // Catalog yüklə və bölmələri doldur
  try {
    const catalog = await fetch("songs/catalog.json").then(r => r.json());
    const catalogEntry = catalog.find(s => s.id === song.id);
    if (catalogEntry?.chords) song.chords = catalogEntry.chords;
    await initSections(song, catalog);
  } catch {}

  // ── Alt bölmələr ───────────────────────────────────────────
  async function initSections(song, catalog) {
    function songLink(s) {
      const a = document.createElement("a");
      a.href = `song.html?id=${s.id}`;
      a.innerHTML = `<span>${s.title}</span><span class="s-meta">${s.artist} · ${s.key}</span>`;
      return a;
    }

    function fillList(listId, items, emptyMsg = "Tezliklə...") {
      const el = document.getElementById(listId);
      if (!el) return;
      el.innerHTML = "";
      if (!items || items.length === 0) {
        const p = document.createElement("p");
        p.className = "section-empty";
        p.textContent = emptyMsg;
        el.appendChild(p);
        return;
      }
      items.forEach(s => el.appendChild(songLink(s)));
    }

    // Cari mahnı xaric
    const others = catalog.filter(s => s.id !== song.id);

    // Rastgele — bölməyə klik edəndə açılır, yenilə düyməsi var
    const sectionRandom  = document.getElementById("section-random");
    const listRandom     = document.getElementById("list-random");
    const headerRandom   = sectionRandom?.querySelector(".section-header");
    let   randomOpen     = false;

    function getRandomSongs() {
      return [...others].sort(() => Math.random() - 0.5).slice(0, 5);
    }

    function renderRandom() {
      listRandom.innerHTML = "";
      if (others.length === 0) {
        const p = document.createElement("p");
        p.className = "section-empty";
        p.textContent = "Başqa mahnı yoxdur.";
        listRandom.appendChild(p);
        return;
      }
      getRandomSongs().forEach(s => listRandom.appendChild(songLink(s)));

      // Yenilə düyməsi
      const btn = document.createElement("button");
      btn.className = "section-refresh-btn";
      btn.textContent = "↻ Yenilə";
      btn.addEventListener("click", (e) => { e.stopPropagation(); renderRandom(); });
      listRandom.appendChild(btn);
    }

    if (headerRandom) {
      headerRandom.style.cursor = "pointer";
      headerRandom.addEventListener("click", () => {
        randomOpen = !randomOpen;
        if (randomOpen) {
          renderRandom();
          listRandom.classList.remove("section-list-hidden");
        } else {
          listRandom.classList.add("section-list-hidden");
        }
      });
    }
    listRandom.classList.add("section-list-hidden");

    // Müəllif akorları
    const labelArtist = document.getElementById("label-artist");
    if (labelArtist) labelArtist.textContent = `${song.artist} akorları`;
    const byArtist = others.filter(s => s.artist === song.artist).slice(0, 5);
    fillList("list-artist", byArtist, "Bu müəllifin başqa mahnısı yoxdur.");

    const sectionArtist = document.getElementById("section-artist");
    if (sectionArtist) {
      sectionArtist.style.cursor = "pointer";
      sectionArtist.addEventListener("click", () => {
        window.location.href = `artist.html?artist=${encodeURIComponent(song.artist)}`;
      });
    }

    // Sevimlilər
    const favs = (() => { try { return JSON.parse(localStorage.getItem("favorites") || "[]"); } catch { return []; } })();
    const favSongs = favs.filter(f => f.id !== song.id).slice(0, 5);
    fillList("list-favorites", favSongs, "Hələ sevimli mahnı yoxdur.");

    // Eyni ritm
    if (song.rhythm) {
      const sameRhythm = others.filter(s => {
        return s.rhythm && JSON.stringify(s.rhythm) === JSON.stringify(song.rhythm);
      }).slice(0, 5);
      fillList("list-rhythm", sameRhythm, "Eyni ritmlə başqa mahnı tapılmadı.");
    } else {
      fillList("list-rhythm", [], "Bu mahnının ritmi əlavə edilməyib.");
    }

    // Eyni akorlar
    const sectionChords  = document.getElementById("section-chords");
    const listChords     = document.getElementById("list-chords");
    const headerChords   = sectionChords?.querySelector(".section-header");
    let   chordsOpen     = false;

    if (sectionChords) {
      if (song.chords && song.chords.length > 0) {
        const songChords = new Set(song.chords);
        const sameChords = others
          .filter(s => s.chords && s.chords.some(c => songChords.has(c)))
          .sort((a, b) => {
            const aMatch = a.chords.filter(c => songChords.has(c)).length;
            const bMatch = b.chords.filter(c => songChords.has(c)).length;
            return bMatch - aMatch;
          })
          .slice(0, 10);

        if (headerChords) {
          headerChords.style.cursor = "pointer";
          headerChords.addEventListener("click", () => {
            chordsOpen = !chordsOpen;
            if (chordsOpen) {
              listChords.innerHTML = "";
              if (sameChords.length === 0) {
                const p = document.createElement("p");
                p.className = "section-empty";
                p.textContent = "Uyğun mahnı tapılmadı.";
                listChords.appendChild(p);
              } else {
                const grid = document.createElement("div");
                grid.className = "artist-grid";
                sameChords.forEach(s => {
                  const matchCount = s.chords.filter(c => songChords.has(c)).length;
                  const card = document.createElement("a");
                  card.href = `song.html?id=${s.id}`;
                  card.className = "artist-card";
                  card.innerHTML = `
                    <span class="artist-card-title">${s.title}</span>
                    <span class="artist-card-meta">${s.artist} · ${matchCount}/${s.chords.length} akkord</span>
                  `;
                  grid.appendChild(card);
                });
                listChords.appendChild(grid);
              }
              listChords.classList.remove("section-list-hidden");
            } else {
              listChords.classList.add("section-list-hidden");
            }
          });
        }
        listChords.classList.add("section-list-hidden");
      } else {
        fillList("list-chords", [], "Bu mahnının akorları əlavə edilməyib.");
      }
    }
  }


  update();
}

init();