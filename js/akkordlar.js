// js/akkordlar.js
import { initAuth } from "./auth.js";
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

function strX(i) { return LEFT + i * STR_GAP; }

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

  if (offset > 0) {
    const fr = el("text", { x: RIGHT + 6, y: TOP + FRET_GAP * 0.6,
      "font-size": 9, fill: "var(--chord-muted)" });
    fr.textContent = `${offset + 1}fr`;
    svg.appendChild(fr);
  }

  if (offset === 0) {
    svg.appendChild(el("rect", { x: LEFT, y: TOP - 3, width: RIGHT - LEFT,
      height: 4, rx: 2, fill: "var(--chord-text)" }));
  }

  for (let f = 0; f <= FRETS; f++) {
    const y = TOP + f * FRET_GAP;
    svg.appendChild(el("line", { x1: LEFT, y1: y, x2: RIGHT, y2: y,
      stroke: "var(--chord-grid)", "stroke-width": 1 }));
  }

  for (let s = 0; s < STRINGS; s++) {
    const x = strX(s);
    svg.appendChild(el("line", { x1: x, y1: TOP, x2: x, y2: TOP + FRETS * FRET_GAP,
      stroke: "var(--chord-grid)", "stroke-width": 1 }));
  }

  if (barre) {
    const bx1 = strX(STRINGS - barre.from);
    const bx2 = strX(STRINGS - barre.to);
    const by  = TOP + (barre.fret - offset - 0.5) * FRET_GAP;
    svg.appendChild(el("rect", {
      x: Math.min(bx1, bx2), y: by - R,
      width: Math.abs(bx2 - bx1) + 1, height: R * 2, rx: R,
      fill: "var(--chord-dot)"
    }));
  }

  frets.forEach((fret, i) => {
    const x = strX(i);
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


// Akkord adlarının Azərbaycan izahı
const CHORD_NAMES = {
  // C
  "C": "Do major", "Cm": "Do minor", "C7": "Do dominant 7", "Cm7": "Do minor 7",
  "Cmaj7": "Do major 7", "Csus2": "Do sus2", "Csus4": "Do sus4",
  // C#
  "C#": "Do diyez major", "C#m": "Do diyez minor", "C#7": "Do diyez 7",
  "C#m7": "Do diyez minor 7", "Db": "Re bemol major",
  // D
  "D": "Re major", "Dm": "Re minor", "D7": "Re dominant 7", "Dm7": "Re minor 7",
  "Dmaj7": "Re major 7", "Dsus2": "Re sus2", "Dsus4": "Re sus4",
  // D#
  "D#": "Re diyez major", "D#m": "Re diyez minor", "Eb": "Mi bemol major", "Ebm": "Mi bemol minor",
  // E
  "E": "Mi major", "Em": "Mi minor", "E7": "Mi dominant 7", "Em7": "Mi minor 7",
  "Emaj7": "Mi major 7", "Esus4": "Mi sus4",
  // F
  "F": "Fa major", "Fm": "Fa minor", "F7": "Fa dominant 7", "Fm7": "Fa minor 7",
  "Fmaj7": "Fa major 7", "Fsus2": "Fa sus2",
  // F#
  "F#": "Fa diyez major", "F#m": "Fa diyez minor", "F#7": "Fa diyez 7",
  "F#m7": "Fa diyez minor 7", "Gb": "Sol bemol major",
  // G
  "G": "Sol major", "Gm": "Sol minor", "G7": "Sol dominant 7", "Gm7": "Sol minor 7",
  "Gmaj7": "Sol major 7", "Gsus4": "Sol sus4", "Gsus2": "Sol sus2",
  // G#
  "G#": "Sol diyez major", "G#m": "Sol diyez minor", "Ab": "La bemol major", "Abm": "La bemol minor",
  // A
  "A": "La major", "Am": "La minor", "A7": "La dominant 7", "Am7": "La minor 7",
  "Amaj7": "La major 7", "Asus2": "La sus2", "Asus4": "La sus4",
  // A#
  "A#": "La diyez major", "A#m": "La diyez minor", "Bb": "Si bemol major",
  "Bbm": "Si bemol minor", "Bb7": "Si bemol 7",
  // B
  "B": "Si major", "Bm": "Si minor", "B7": "Si dominant 7", "Bm7": "Si minor 7",
  "Bmaj7": "Si major 7",
};

// Akkord növləri üçün filtr qrupları
const GROUPS = [
  { label: "Hamısı", filter: () => true },
  { label: "Major",  filter: (name) => /^[A-G](#|b)?$/.test(name) },
  { label: "Minor",  filter: (name) => /m$/.test(name) && !name.includes("maj") && !name.includes("m7") },
  { label: "7",      filter: (name) => name.endsWith("7") && !name.includes("maj") && !name.includes("m7") },
  { label: "m7",     filter: (name) => name.endsWith("m7") },
  { label: "maj7",   filter: (name) => name.includes("maj7") },
  { label: "sus",    filter: (name) => name.includes("sus") },
  { label: "Bareli", filter: (name, data) => !!data.barre },
];

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

function init() {
  initAuth();
  initTheme();

  const grid    = document.getElementById("akkord-grid");
  const filters = document.getElementById("akkord-filters");
  const entries = Object.entries(CHORDS_DB);

  // Filtr düymələri
  let activeGroup = 0;

  function renderGrid(groupIdx) {
    grid.innerHTML = "";
    const { filter } = GROUPS[groupIdx];
    entries
      .filter(([name, data]) => filter(name, data))
      .forEach(([name, data]) => {
        const wrap = document.createElement("div");
        wrap.className = "akkord-card";
        wrap.title = CHORD_NAMES[name] || name;
        wrap.appendChild(createDiagram(name, data));
        wrap.style.cursor = "pointer";
        wrap.addEventListener("click", () => openModal(name, data));
        grid.appendChild(wrap);
      });
  }


  // Modal yarat
  const modal = document.createElement("div");
  modal.className = "akkord-modal hidden";
  modal.innerHTML = `
    <div class="akkord-modal-backdrop"></div>
    <div class="akkord-modal-content">
      <button class="akkord-modal-close">✕</button>
      <div class="akkord-modal-diagram" id="modal-diagram"></div>
      <div class="akkord-modal-name" id="modal-name"></div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector(".akkord-modal-backdrop").addEventListener("click", () => {
    modal.classList.add("hidden");
  });
  modal.querySelector(".akkord-modal-close").addEventListener("click", () => {
    modal.classList.add("hidden");
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") modal.classList.add("hidden");
  });

  function openModal(name, data) {
    const diagramEl = document.getElementById("modal-diagram");
    const nameEl    = document.getElementById("modal-name");
    diagramEl.innerHTML = "";
    const SIZE = 240;
    const svg = createDiagram(name, data);
    svg.setAttribute("width", SIZE);
    svg.setAttribute("height", SIZE * 1.2);
    svg.setAttribute("viewBox", `-10 0 ${W + 20} ${H}`);
    diagramEl.appendChild(svg);
    nameEl.textContent = name;
    modal.classList.remove("hidden");
  }

  GROUPS.forEach((g, i) => {
    const btn = document.createElement("button");
    btn.className = "akkord-filter-btn" + (i === 0 ? " active" : "");
    btn.textContent = g.label;
    btn.addEventListener("click", () => {
      filters.querySelectorAll(".akkord-filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeGroup = i;
      renderGrid(i);
    });
    filters.appendChild(btn);
  });

  renderGrid(0);
}

init();