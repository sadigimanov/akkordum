// js/auth.js
import { auth, provider, signInWithPopup, signOut, onAuthStateChanged, signInWithRedirect, getRedirectResult }
  from "./firebase.js";

function updateNavbar(user) {
  // nav-brand: giriş edilibsə profil şəkli, yoxsa 🎸
  const navBrand = document.getElementById("nav-brand");
  if (navBrand) {
    if (user && user.photoURL) {
      navBrand.innerHTML = `<img src="${user.photoURL}" class="nav-profile-photo" alt="profil" />`;
    } else {
      navBrand.textContent = "🎸";
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

  // Redirect nəticəsini yoxla — giriş tamamlandısa auth state yenilənəcək
  getRedirectResult(auth)
    .then(result => {
      if (result?.user) updateNavbar(result.user);
    })
    .catch(e => console.error("Redirect xətası:", e));

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

  onAuthStateChanged(auth, updateNavbar);
}

export function getCurrentUser() {
  return new Promise(resolve => {
    const unsub = onAuthStateChanged(auth, user => { unsub(); resolve(user); });
  });
}