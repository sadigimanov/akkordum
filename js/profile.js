// js/profile.js
import { auth, provider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged }
  from "./firebase.js";

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
  initTheme();

  const viewGuest = document.getElementById("view-guest");
  const viewUser  = document.getElementById("view-user");

  const loginBtn  = document.getElementById("btn-login");
  const logoutBtn = document.getElementById("btn-logout");

  if (loginBtn) {
    getRedirectResult(auth)
      .then(result => { if (result?.user) init(); })
      .catch(e => console.error("Redirect xətası:", e));
    loginBtn.addEventListener("click", async () => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      try {
        if (isMobile) {
          await signInWithRedirect(auth, provider);
        } else {
          await signInWithPopup(auth, provider);
        }
      } catch (e) { console.error("Giriş xətası:", e); }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
    });
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      viewGuest.style.display = "none";
      viewUser.style.display  = "flex";

      document.getElementById("profile-photo").src  = user.photoURL || "";
      document.getElementById("profile-name").textContent  = user.displayName || "İstifadəçi";
      document.getElementById("profile-email").textContent = user.email || "";
      document.getElementById("stat-favs").textContent     = getFavCount();
    } else {
      viewGuest.style.display = "flex";
      viewUser.style.display  = "none";
    }
  });
}

init();