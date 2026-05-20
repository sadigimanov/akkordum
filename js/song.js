import { initAuth } from "./auth.js";
import { auth, onAuthStateChanged } from "./firebase.js";
import { getFavorites, addFavorite, removeFavorite, isFavorite, getUserRhythm, saveUserRhythm, addToHistory } from "./firestore-favs.js";
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
      normalize(s.title).startsWith(q) || normalize(s.artist).startsWith(q)
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

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const first = results.querySelector("li a");
      if (first) window.location.href = first.href;
    }
  });
  document.addEventListener("click", e => {
    if (!input.contains(e.target) && !results.contains(e.target))
      results.classList.add("hidden");
  });
}

async function init() {
  initAuth();
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

  // Tarixçəyə əlavə et (auth hazır olduqda)
  const unsubHistory = onAuthStateChanged(auth, (user) => {
    unsubHistory();
    addToHistory(user, song);
  });
  document.getElementById("song-artist").textContent = song.artist;
  document.getElementById("song-key").textContent    = song.key;
  document.getElementById("song-capo").textContent   = song.capo ?? 0;


  // ── Ritm ──────────────────────────────────────────────────
  const rhythmSection = document.getElementById("rhythm-section");
  const rhythmDisplay = document.getElementById("rhythm-display");

  function renderRhythmRow(beats, label, labelColor) {
    const wrap = document.createElement("div");
    wrap.className = "rhythm-row-wrap";

    const lbl = document.createElement("div");
    lbl.className = "rhythm-row-label";
    lbl.textContent = label;
    lbl.style.color = labelColor || "var(--text-muted)";
    wrap.appendChild(lbl);

    const row = document.createElement("div");
    row.className = "rhythm-display";
    const BEAT_LABELS = { "↓": "Aşağı", "↑": "Yuxarı", "-": "Susma" };
    beats.forEach((beat, i) => {
      const span = document.createElement("span");
      span.className = "rhythm-beat";
      span.title = BEAT_LABELS[beat] || beat;
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
      row.appendChild(span);
    });
    wrap.appendChild(row);
    return wrap;
  }

  function renderRhythmEditor(existingRhythm, onSave) {
    const editor = document.getElementById("rhythm-editor");
    if (!editor) return;
    editor.innerHTML = "";

    let beats = existingRhythm ? [...existingRhythm] : [];

    function refreshEditor() {
      editor.innerHTML = "";

      // Mövcud vuruşlar
      const beatsRow = document.createElement("div");
      beatsRow.className = "rhythm-editor-beats";
      beats.forEach((b, i) => {
        const btn = document.createElement("button");
        btn.className = "rhythm-beat-btn";
        btn.textContent = b;
        btn.title = "Sil";
        btn.addEventListener("click", () => { beats.splice(i, 1); refreshEditor(); });
        beatsRow.appendChild(btn);
      });
      editor.appendChild(beatsRow);

      // Əlavə et düymələri
      const addRow = document.createElement("div");
      addRow.className = "rhythm-add-row";
      const BEAT_TITLES = { "↓": "Aşağı", "↑": "Yuxarı", "-": "Susma" };
      [["↓", "beat-down"], ["↑", "beat-up"], ["-", "beat-mute"]].forEach(([sym, cls]) => {
        const btn = document.createElement("button");
        btn.className = `rhythm-add-btn ${cls}`;
        btn.textContent = sym;
        btn.title = BEAT_TITLES[sym];
        btn.addEventListener("click", () => { beats.push(sym); refreshEditor(); });
        addRow.appendChild(btn);
      });

      // Sıfırla + Bitdi
      const actions = document.createElement("div");
      actions.className = "rhythm-actions";

      const resetBtn = document.createElement("button");
      resetBtn.className = "rhythm-reset-btn";
      resetBtn.textContent = "Sıfırla";
      resetBtn.addEventListener("click", () => { beats = []; refreshEditor(); });

      const saveBtn = document.createElement("button");
      saveBtn.className = "rhythm-save-btn";
      saveBtn.textContent = "✓ Bitdi";
      saveBtn.addEventListener("click", () => { onSave(beats); });

      actions.appendChild(resetBtn);
      actions.appendChild(saveBtn);
      addRow.appendChild(actions);
      editor.appendChild(addRow);
    }

    refreshEditor();
  }

  const editorEl = document.getElementById("rhythm-editor");

  async function renderRhythms() {
    if (!rhythmSection || !rhythmDisplay) return;
    rhythmSection.classList.remove("hidden");
    rhythmDisplay.innerHTML = "";

    // Düymə song-info-row-dadır
    const addBtn = document.getElementById("rhythm-add-btn");

    // Köhnə listener-i sil, yenisini qoy
    if (addBtn) {
      addBtn.textContent = "＋ Ritm əlavə et";
      editorEl.classList.add("hidden");
      addBtn.onclick = () => {
        if (!auth.currentUser) {
          let warning = document.getElementById("rhythm-login-warning");
          if (!warning) {
            warning = document.createElement("p");
            warning.id = "rhythm-login-warning";
            warning.className = "rhythm-login-warning";
            warning.innerHTML = `Ritm əlavə etmək üçün <a href="profile.html">giriş et</a>.`;
            editorEl.parentNode.insertBefore(warning, editorEl);
          }
          return;
        }
        const warning = document.getElementById("rhythm-login-warning");
        if (warning) warning.remove();

        const isOpen = !editorEl.classList.contains("hidden");
        editorEl.classList.toggle("hidden");
        addBtn.textContent = isOpen ? "＋ Ritm əlavə et" : "✕ Bağla";
        if (!isOpen) {
          getUserRhythm(auth.currentUser, song.id).then(existing => {
            renderRhythmEditor(existing, async (beats) => {
              await saveUserRhythm(auth.currentUser, song.id, beats);
              editorEl.classList.add("hidden");
              addBtn.textContent = "＋ Ritm əlavə et";
              await renderRhythms();
            });
          });
        }
      };
    }

    // 1. Orijinal ritm
    if (song.rhythm && song.rhythm.length > 0) {
      const origRow = renderRhythmRow(song.rhythm, "Orijinal", "var(--text-muted)");
      rhythmDisplay.appendChild(origRow);
    }

    // 2. Redaktor
    rhythmDisplay.appendChild(editorEl);

    // 3. İstifadəçi ritmi — orijinalın altında
    const user = auth.currentUser;
    const userRhythm = await getUserRhythm(user, song.id);
    if (userRhythm && userRhythm.length > 0) {
      rhythmDisplay.appendChild(renderRhythmRow(userRhythm, "Mənim ritmim", "var(--accent)"));
    }
  }

  // Auth hazır olandan sonra ritmi yüklə
  onAuthStateChanged(auth, () => renderRhythms());

  const originalRoot = getOriginalRoot(song.key);
  const originalIdx  = NOTES.indexOf(originalRoot);
  let semitones = 0;

  function update() {
    const transposed = transposeSong(song.sections, semitones);
    lyricsEl.innerHTML = "";
    renderLyrics({ ...song, sections: transposed }, "lyrics");
    initChordClick(transposed, song.chords_override || {});
    applyFontSize();
    const activeNote = NOTES[((originalIdx + semitones) % 12 + 12) % 12];
    renderKeyRow(activeNote, (clickedNote) => {
      semitones = ((NOTES.indexOf(clickedNote) - originalIdx) % 12 + 12) % 12;
      update();
    });

    // Kapo hesabla: orijinal key-dən semitones aşağı getsək kapo o qədər olur
    // semitones > 0: yuxarı transpoz — kapo lazım deyil (0)
    // semitones < 0 mümkün deyil (həmişə 0-11 arası)
    // Ən rahat: 12 - semitones (semitones > 0 olduqda gitarist kapo ilə orijinal akorları çala bilər)
    const capoEl = document.getElementById("song-capo");
    if (capoEl) {
      const capo = semitones === 0 ? (song.capo ?? 0) : (12 - semitones) % 12;
      capoEl.textContent = capo;
    }
  }

  // Orijinal tona klik — sıfırla
  const origKeyEl = document.getElementById("song-key-text");
  if (origKeyEl) {
    origKeyEl.style.cursor = "pointer";
    origKeyEl.addEventListener("click", () => { semitones = 0; update(); });
  }

  // Asan tona klik
  const easyKeyEl = document.getElementById("song-easy-text");
  if (easyKeyEl) {
    easyKeyEl.style.cursor = "pointer";
    easyKeyEl.addEventListener("click", () => {
      const strong = easyKeyEl.querySelector("strong");
      if (!strong) return;
      const clickedIdx = NOTES.indexOf(strong.textContent.trim());
      if (clickedIdx !== -1) {
        semitones = ((clickedIdx - originalIdx) % 12 + 12) % 12;
        update();
      }
    });
  }

  // +A / -A — mətn ölçüsünü böyüdüb kiçildir
  const FONT_MIN = 11, FONT_MAX = 18, FONT_STEP = 1;
  let fontSize = window.innerWidth <= 600 ? 12 : 15;

  function applyFontSize() {
    if (!lyricsEl) return;
    lyricsEl.style.fontSize = fontSize + "px";
    // chord-row hündürlüyü font-a uyğun dəyişsin
    const chWidth = fontSize * 0.598;
    lyricsEl.querySelectorAll(".chord-tag").forEach(tag => {
      const offset = parseFloat(tag.dataset.offset || 0);
      tag.style.left = (offset * chWidth) + "px";
      tag.style.fontSize = Math.max(11, fontSize - 2) + "px";
    });
    lyricsEl.querySelectorAll(".lyric-row").forEach(row => {
      row.style.fontSize = fontSize + "px";
    });
    lyricsEl.querySelectorAll(".section-label").forEach(row => {
      row.style.fontSize = fontSize + "px";
    });
  }

  document.getElementById("btn-up").addEventListener("click", () => {
    if (fontSize < FONT_MAX) { fontSize += FONT_STEP; applyFontSize(); }
  });
  document.getElementById("btn-down").addEventListener("click", () => {
    if (fontSize > FONT_MIN) { fontSize -= FONT_STEP; applyFontSize(); }
  });

  // ── Sevimli düyməsi ────────────────────────────────────────
  const favBtn = document.getElementById("btn-favorite");
  if (favBtn) {
    // auth.currentUser-i hər dəfə birbaşa oxu — sabit saxlama
    async function updateFavBtn() {
      const fav = await isFavorite(auth.currentUser, song.id);
      if (fav) {
        favBtn.textContent = "Sevimlilərə əlavədir❤️";
        favBtn.classList.add("fav-active");
      } else {
        favBtn.textContent = "Sevimlilərə əlavə et🤍";
        favBtn.classList.remove("fav-active");
      }
    }
    favBtn.addEventListener("click", async () => {
      const user = auth.currentUser;
      const fav = await isFavorite(user, song.id);
      if (fav) {
        await removeFavorite(user, song.id);
      } else {
        await addFavorite(user, { id: song.id, title: song.title, artist: song.artist, key: song.key });
      }
      updateFavBtn();
    });

    // Auth hazır olana qədər gözlə, sonra düyməni yenilə
    onAuthStateChanged(auth, () => updateFavBtn());
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

    // Müəllif akorları — klik ilə artist.html-ə
    const labelArtist = document.getElementById("label-artist");
    if (labelArtist) labelArtist.textContent = `${song.artist} akorları`;
    const sectionArtist = document.getElementById("section-artist");
    if (sectionArtist) {
      sectionArtist.style.cursor = "pointer";
      sectionArtist.addEventListener("click", () => {
        window.location.href = `artist.html?artist=${encodeURIComponent(song.artist)}`;
      });
    }

    // Eyni ritm — klik ilə rhythm.html-ə
    const sectionRhythmNav = document.getElementById("section-rhythm");
    if (sectionRhythmNav) {
      if (song.rhythm && song.rhythm.length > 0) {
        sectionRhythmNav.style.cursor = "pointer";
        sectionRhythmNav.addEventListener("click", () => {
          window.location.href = `rhythm.html?from=${song.id}`;
        });
      } else {
        const p = document.createElement("p");
        p.className = "section-empty";
        p.textContent = "Bu mahnının ritmi əlavə edilməyib.";
        sectionRhythmNav.appendChild(p);
      }
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