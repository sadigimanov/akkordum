// js/chord-diagram.js
import CHORDS_DB from "./chords-db.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 100, H = 120;
const STRINGS = 6, FRETS = 4;
const TOP = 28, LEFT = 16, RIGHT = W - 16;
const STR_GAP = (RIGHT - LEFT) / (STRINGS - 1);
const FRET_GAP = (H - TOP - 16) / FRETS;
const R = 7;

function el(tag, attrs = {}) {
  const e = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  return e;
}

// frets[0] = 6-cı sim (ən qalın, sol), frets[5] = 1-ci sim (ən incə, sağ)
// x(i): soldan sağa — 6-cı simdən 1-ci simə
function strX(i) {
  return LEFT + i * STR_GAP;
}

function createDiagram(chordName, chordData) {
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H });

  const title = el("text", { x: W / 2, y: 13, "text-anchor": "middle",
    "font-size": 13, "font-weight": "bold", fill: "var(--chord-text)" });
  title.textContent = chordName;
  svg.appendChild(title);

  const { frets, fingers, barre, baseFret = 1 } = chordData;
  const minFret = Math.min(...frets.filter(f => f > 0));
  const maxFret = Math.max(...frets);
  const offset  = baseFret > 1 ? baseFret - 1 : (maxFret > FRETS ? minFret - 1 : 0);

  // Pərdə nömrəsi
  if (offset > 0) {
    const fr = el("text", { x: RIGHT + 6, y: TOP + FRET_GAP * 0.6,
      "font-size": 9, fill: "var(--chord-muted)" });
    fr.textContent = `${offset + 1}fr`;
    svg.appendChild(fr);
  }

  // Nut
  if (offset === 0) {
    svg.appendChild(el("rect", { x: LEFT, y: TOP - 3, width: RIGHT - LEFT,
      height: 4, rx: 2, fill: "var(--chord-text)" }));
  }

  // Pərdə xətləri
  for (let f = 0; f <= FRETS; f++) {
    const y = TOP + f * FRET_GAP;
    svg.appendChild(el("line", { x1: LEFT, y1: y, x2: RIGHT, y2: y,
      stroke: "var(--chord-grid)", "stroke-width": 1 }));
  }

  // Sim xətləri
  for (let s = 0; s < STRINGS; s++) {
    const x = strX(s);
    svg.appendChild(el("line", { x1: x, y1: TOP, x2: x, y2: TOP + FRETS * FRET_GAP,
      stroke: "var(--chord-grid)", "stroke-width": 1 }));
  }

  // Barre — frets[i] indeksi ilə uyğun x hesabla
  if (barre) {
    // barre.from və barre.to sim nömrəsi (6=ən qalın, 1=ən incə)
    const bx1 = strX(STRINGS - barre.from); // sol
    const bx2 = strX(STRINGS - barre.to);   // sağ
    const by  = TOP + (barre.fret - offset - 0.5) * FRET_GAP;
    svg.appendChild(el("rect", {
      x: Math.min(bx1, bx2), y: by - R,
      width: Math.abs(bx2 - bx1) + 1, height: R * 2, rx: R,
      fill: "var(--chord-dot)"
    }));
  }

  // frets[0]=6-cı sim(sol) ... frets[5]=1-ci sim(sağ)
  frets.forEach((fret, i) => {
    const x = strX(i); // i=0 sol, i=5 sağ

    if (fret === -1) {
      const t = el("text", { x, y: TOP - 6, "text-anchor": "middle",
        "font-size": 10, fill: "var(--chord-muted)" });
      t.textContent = "×";
      svg.appendChild(t);
    } else if (fret === 0) {
      svg.appendChild(el("circle", { cx: x, cy: TOP - 7, r: 4,
        fill: "none", stroke: "var(--chord-dot)", "stroke-width": 1.5 }));
    } else {
      const isBarre = barre && fret === barre.fret &&
        i >= (STRINGS - barre.from) && i <= (STRINGS - barre.to);
      if (!isBarre) {
        const cy = TOP + (fret - offset - 0.5) * FRET_GAP;
        svg.appendChild(el("circle", { cx: x, cy, r: R, fill: "var(--chord-dot)" }));
        if (fingers && fingers[i]) {
          const ft = el("text", { x, y: cy + 4, "text-anchor": "middle",
            "font-size": 8, fill: "var(--chord-finger-text)", "font-weight": "bold" });
          ft.textContent = fingers[i];
          svg.appendChild(ft);
        }
      }
    }
  });

  return svg;
}

// Akkord adından data tap
function getChordData(name, overrides) {
  return overrides[name] || CHORDS_DB[name] || null;
}

// Unikal akkordları topla
function getUniqueChords(sections) {
  const seen = new Set();
  const names = [];
  sections.forEach(s => {
    if (!s || !s.chords) return;
    s.chords.forEach(c => {
      if (!seen.has(c.name)) { seen.add(c.name); names.push(c.name); }
    });
  });
  return names;
}

// Popup paneli aç/bağla
let activeChord = null;

export function initChordClick(sections, overrides = {}) {
  // Popup yarad
  let popup = document.getElementById("chord-popup");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "chord-popup";
    popup.className = "chord-popup hidden";
    document.body.appendChild(popup);
  }

  // Kənar klik — bağla
  document.addEventListener("click", (e) => {
    if (!popup.contains(e.target) && !e.target.classList.contains("chord-tag")) {
      popup.classList.add("hidden");
      activeChord = null;
    }
  });

  // Hər .chord-tag elementinə klik handler
  const lyricsEl = document.getElementById("lyrics");
  if (!lyricsEl) return;

  lyricsEl.addEventListener("click", (e) => {
    const tag = e.target.closest(".chord-tag");
    if (!tag) return;
    e.stopPropagation();

    const chordName = tag.textContent.trim();
    const data = getChordData(chordName, overrides);

    if (!data) {
      popup.classList.add("hidden");
      return;
    }

    // Eyni akkorda təkrar klik — bağla
    if (activeChord === chordName && !popup.classList.contains("hidden")) {
      popup.classList.add("hidden");
      activeChord = null;
      return;
    }

    activeChord = chordName;

    // Bütün mahnıdakı unikal akkordları göstər
    const names = getUniqueChords(sections);
    popup.innerHTML = "";

    names.forEach(name => {
      const d = getChordData(name, overrides);
      if (!d) return;
      const wrap = document.createElement("div");
      wrap.className = "chord-diagram-wrap" + (name === chordName ? " active" : "");
      wrap.appendChild(createDiagram(name, d));
      popup.appendChild(wrap);
    });

    popup.classList.remove("hidden");
  });
}

// Köhnə panel funksiyası — artıq istifadə edilmir amma saxlayırıq
export function renderChordDiagrams() {}