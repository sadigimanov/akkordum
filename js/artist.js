// js/artist.js

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

async function init() {
  initTheme();

  const artist = new URLSearchParams(window.location.search).get("artist");
  if (!artist) { window.location.href = "index.html"; return; }

  document.getElementById("artist-name").textContent = artist;
  document.title = `${artist} — Akorlarim`;

  let catalog;
  try {
    catalog = await fetch("songs/catalog.json").then(r => r.json());
  } catch {
    document.getElementById("artist-empty").style.display = "block";
    return;
  }

  const songs = catalog.filter(s => s.artist === artist);

  const countEl = document.getElementById("artist-count");
  countEl.textContent = `${songs.length} mahnı`;

  const grid  = document.getElementById("artist-grid");
  const empty = document.getElementById("artist-empty");

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
      <span class="artist-card-meta">${s.key}${s.capo ? " · Capo " + s.capo : ""}</span>
    `;
    grid.appendChild(card);
  });
}

init();