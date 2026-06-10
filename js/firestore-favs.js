// js/firestore-favs.js
import { db, doc, getDoc, setDoc, updateDoc, increment } from "./firebase.js";

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
        // Populyarlıq sayğacını artır
        const songRef = doc(db, "songs", song.id);
        const songSnap = await getDoc(songRef);
        if (songSnap.exists()) {
          await updateDoc(songRef, { favoriteCount: increment(1) });
        } else {
          await setDoc(songRef, { favoriteCount: 1, title: song.title, artist: song.artist, key: song.key });
        }
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
    // Populyarlıq sayğacını azalt
    const songRef = doc(db, "songs", songId);
    const songSnap = await getDoc(songRef);
    if (songSnap.exists()) {
      const current = songSnap.data().favoriteCount || 0;
      await updateDoc(songRef, { favoriteCount: Math.max(0, current - 1) });
    }
  } catch (e) { console.error("removeFavorite xətası:", e); }
}

export async function isFavorite(user, songId) {
  const favs = await getFavorites(user);
  return favs.some(f => f.id === songId);
}

// ── Ritm ──────────────────────────────────────────────────────
export async function getUserRhythm(user, songId) {
  if (!user) return null;
  try {
    const ref  = doc(db, "users", user.uid, "rhythms", songId);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data().rhythm : null;
  } catch (e) { console.error("getUserRhythm xətası:", e); return null; }
}

export async function saveUserRhythm(user, songId, rhythm) {
  if (!user) return;
  try {
    const ref = doc(db, "users", user.uid, "rhythms", songId);
    await setDoc(ref, { rhythm });
  } catch (e) { console.error("saveUserRhythm xətası:", e); }
}

// ── Tarixçə ───────────────────────────────────────────────────
const HISTORY_MAX = 10;

export async function addToHistory(user, song) {
  const entry = { id: song.id, title: song.title, artist: song.artist, key: song.key };

  if (!user) {
    // localStorage fallback
    let h = JSON.parse(localStorage.getItem("history") || "[]");
    h = h.filter(s => s.id !== entry.id);
    h.unshift(entry);
    localStorage.setItem("history", JSON.stringify(h.slice(0, HISTORY_MAX)));
    return;
  }

  try {
    const ref  = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    let history = snap.exists() ? (snap.data().history || []) : [];
    history = history.filter(s => s.id !== entry.id);
    history.unshift(entry);
    await updateDoc(ref, { history: history.slice(0, HISTORY_MAX) });
  } catch (e) {
    // doc yoxdursa yarat
    try {
      await setDoc(doc(db, "users", user.uid), { history: [entry] }, { merge: true });
    } catch (e2) { console.error("addToHistory xətası:", e2); }
  }
}

export async function getHistory(user) {
  if (!user) {
    try { return JSON.parse(localStorage.getItem("history") || "[]"); } catch { return []; }
  }
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    return snap.exists() ? (snap.data().history || []) : [];
  } catch { return []; }
}

// ── Populyar mahnılar ──────────────────────────────────────────
export async function getPopularSongs(limit = 10) {
  try {
    const { collection, getDocs, query, orderBy, limit: fsLimit } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
    );
    const q = query(
      collection(db, "songs"),
      orderBy("favoriteCount", "desc"),
      fsLimit(limit)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("getPopularSongs xətası:", e);
    return [];
  }
}

// ── Önə Çıxanlar ──────────────────────────────────────────────
export async function getFeaturedSongs() {
  try {
    const ref  = doc(db, "featured", "config");
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];
    return snap.data().songs || [];
  } catch (e) {
    console.error("getFeaturedSongs xətası:", e);
    return [];
  }
}