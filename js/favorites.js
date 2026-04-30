// js/favorites.js

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

function getFavorites() {
  try { return JSON.parse(localStorage.getItem("favorites") || "[]"); } catch { return []; }
}

function saveFavorites(favs) {
  localStorage.setItem("favorites", JSON.stringify(favs));
}

function init() {
  initTheme();

  const listEl  = document.getElementById("favorites-list");
  const emptyEl = document.getElementById("favorites-empty");

  function render() {
    const favs = getFavorites();
    listEl.innerHTML = "";

    if (favs.length === 0) {
      emptyEl.style.display = "block";
      return;
    }

    emptyEl.style.display = "none";

    favs.forEach(s => {
      const item = document.createElement("div");
      item.className = "fav-item";
      item.innerHTML = `
        <a href="song.html?id=${s.id}" class="fav-item-link">
          <span class="song-title">${s.title}</span>
          <span class="song-meta">${s.artist} · ${s.key}</span>
        </a>
        <button class="fav-remove-btn" data-id="${s.id}" title="Sil">✕</button>
      `;
      listEl.appendChild(item);
    });

    listEl.querySelectorAll(".fav-remove-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        saveFavorites(getFavorites().filter(f => f.id !== btn.dataset.id));
        render();
      });
    });
  }

  render();
}

init();