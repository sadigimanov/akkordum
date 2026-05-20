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

function showUser(user) {
  const viewGuest = document.getElementById("view-guest");
  const viewUser  = document.getElementById("view-user");
  if (!viewGuest || !viewUser) return;

  viewGuest.style.display = "none";
  viewUser.style.display  = "flex";
  document.getElementById("profile-photo").src         = user.photoURL || "";
  document.getElementById("profile-name").textContent  = user.displayName || "İstifadəçi";
  document.getElementById("profile-email").textContent = user.email || "";
}

function showGuest() {
  const viewGuest = document.getElementById("view-guest");
  const viewUser  = document.getElementById("view-user");
  if (!viewGuest || !viewUser) return;
  viewGuest.style.display = "flex";
  viewUser.style.display  = "none";
}

function init() {
  initTheme();

  const loginBtn  = document.getElementById("btn-login");
  const logoutBtn = document.getElementById("btn-logout");

  // Redirect-dən qayıdış — yalnız bir dəfə yoxla
  getRedirectResult(auth)
    .then(result => {
      if (result?.user) showUser(result.user);
    })
    .catch(e => console.error("Redirect xətası:", e));

  // Auth vəziyyəti
  onAuthStateChanged(auth, (user) => {
    if (user) showUser(user);
    else showGuest();
  });

  if (loginBtn) {
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
    logoutBtn.addEventListener("click", () => signOut(auth));
  }
}

init();