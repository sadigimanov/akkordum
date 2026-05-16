// js/rhythm.js
import { initAuth } from "./auth.js";

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

function renderRhythmPreview(rhythm, container) {
  rhythm.forEach((beat, i) => {
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
    container.appendChild(span);
  });
}

async function init() {
  initAuth();
  initTheme();

  const fromId = new URLSearchParams(window.location.search).get("from");
  if (!fromId) { window.location.href = "index.html"; return; }

  let catalog, sourceSong;
  try {
    catalog = await fetch("songs/catalog.json").then(r => r.json());
    const res = await fetch(`songs/${fromId}.json`);
    sourceSong = await res.json();
  } catch {
    document.getElementById("rhythm-empty").style.display = "block";
    return;
  }

  // Orijinal ritmi göstər
  const previewEl = document.getElementById("rhythm-preview");
  if (sourceSong.rhythm && sourceSong.rhythm.length > 0) {
    renderRhythmPreview(sourceSong.rhythm, previewEl);
  }

  // Eyni ritmlə olan mahnılar
  const songs = catalog.filter(s =>
    s.id !== fromId &&
    s.rhythm &&
    JSON.stringify(s.rhythm) === JSON.stringify(sourceSong.rhythm)
  );

  document.getElementById("rhythm-count").textContent = `${songs.length} mahnı tapıldı`;

  const grid  = document.getElementById("rhythm-grid");
  const empty = document.getElementById("rhythm-empty");

  if (songs.length === 0) {
    empty.style.display = "block";
    return;
  }

  songs.forEach(s => {
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

init();