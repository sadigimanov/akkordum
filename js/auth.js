// js/auth.js
import { auth, provider, signInWithPopup, signOut, onAuthStateChanged }
  from "./firebase.js";

function updateNavbar(user) {
  // nav-profile: giriş edilibsə profil şəkli, yoxsa 🎸
  const navProfile
   = document.getElementById("nav-profile");
  if (navProfile) {
    if (user && user.photoURL) {
      navProfile.innerHTML = `<img src="${user.photoURL}" class="nav-profile-photo" alt="profil" />`;
    } else {
      navProfile.textContent = "🎸";
    }
  }

  // Köhnə login/user-menu elementləri varsa onları da idarə et
  const loginBtn  = document.getElementById("btn-login");
  const userMenu  = document.getElementById("user-menu");
  const userPhoto = document.getElementById("user-photo");
  const userName  = document.getElementById("user-name");
  if (loginBtn)  loginBtn.style.display  = "none";
  if (userMenu)  userMenu.style.display  = user ? "flex" : "none";
  if (userPhoto && user) userPhoto.src   = user.photoURL || "";
  if (userName  && user) userName.textContent = user.displayName?.split(" ")[0] || "İstifadəçi";
}

export function initAuth() {
  const loginBtn  = document.getElementById("btn-login");
  const logoutBtn = document.getElementById("btn-logout");

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      try { await signInWithPopup(auth, provider); }
      catch (e) { console.error("Giriş xətası:", e); }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => signOut(auth));
  }

  onAuthStateChanged(auth, updateNavbar);
}

export function getCurrentUser() {
  return new Promise(resolve => {
    const unsub = onAuthStateChanged(auth, user => { unsub(); resolve(user); });
  });
}