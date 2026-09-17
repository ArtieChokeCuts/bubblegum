// Firebase configuration for Bubblegum Death Wish
export const firebaseConfig = {
  apiKey: "AIzaSyAFE-0_4CVLua6_BwF2dy15KzwfTWpCICU",
  authDomain: "bubblegum-death-wish-7bd31.firebaseapp.com",
  projectId: "bubblegum-death-wish-7bd31",
  storageBucket: "bubblegum-death-wish-7bd31.firebasestorage.app",
  messagingSenderId: "395689943897",
  appId: "1:395689943897:web:804acdc4f9194f45cfe248",
  measurementId: "G-ZJNY1PQ3L8"
};

export const ADMIN_EMAIL = "artiechokecuts@gmail.com";

let app = null;
let db = null;
let auth = null;

export function isFirebaseConfigured() {
  return (
    Boolean(firebaseConfig) &&
    Boolean(firebaseConfig.apiKey) &&
    firebaseConfig.apiKey !== "YOUR_API_KEY"
  );
}

export async function getFirebaseServices() {
  if (!isFirebaseConfigured()) {
    return { app: null, db: null, auth: null };
  }

  if (!app) {
    try {
      const { initializeApp } = await import(
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"
      );
      const { getFirestore } = await import(
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
      );
      const { getAuth } = await import(
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
      );

      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);
    } catch (err) {
      console.warn("Firebase failed to initialize or was blocked:", err);
      return { app: null, db: null, auth: null };
    }
  }

  return { app, db, auth };
}
