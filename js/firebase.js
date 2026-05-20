// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCBUBycbWSIC2DHx-e8EuiQQYneYp-mfD0",
  authDomain: "akkordlarim-35c64.firebaseapp.com",
  projectId: "akkordlarim-35c64",
  storageBucket: "akkordlarim-35c64.firebasestorage.app",
  messagingSenderId: "406624151690",
  appId: "1:406624151690:web:865737c41fef2648c1a573"
};

const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();

const db = getFirestore(app);
export { auth, provider, db, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove };