// js/firestore-favs.js
import { db, doc, getDoc, setDoc, updateDoc } from "./firebase.js";

function userRef(uid) {
  return doc(db, "users", uid);
}

// user parametri birbaşa ötürülür — auth gözləməyə ehtiyac yoxdur
export async function getFavorites(user) {
  if (!user) {
    try { return JSON.parse(localStorage.getItem("favorites") || "[]"); } catch { return []; }
  }
  try {
    const snap = await getDoc(userRef(user.uid));
    return snap.exists() ? (snap.data().favorites || []) : [];
  } catch (e) {
    console.error("getFavorites xətası:", e);
    return [];
  }
}

export async function addFavorite(user, song) {
  if (!user) {
    const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
    if (!favs.some(f => f.id === song.id)) favs.push(song);
    localStorage.setItem("favorites", JSON.stringify(favs));
    return;
  }
  try {
    const ref  = userRef(user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { favorites: [song] });
    } else {
      const existing = snap.data().favorites || [];
      if (!existing.some(f => f.id === song.id)) {
        await updateDoc(ref, { favorites: [...existing, song] });
      }
    }
  } catch (e) { console.error("addFavorite xətası:", e); }
}

export async function removeFavorite(user, songId) {
  if (!user) {
    const favs = JSON.parse(localStorage.getItem("favorites") || "[]")
      .filter(f => f.id !== songId);
    localStorage.setItem("favorites", JSON.stringify(favs));
    return;
  }
  try {
    const ref  = userRef(user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const updated = (snap.data().favorites || []).filter(f => f.id !== songId);
    await updateDoc(ref, { favorites: updated });
  } catch (e) { console.error("removeFavorite xətası:", e); }
}

export async function isFavorite(user, songId) {
  const favs = await getFavorites(user);
  return favs.some(f => f.id === songId);
}