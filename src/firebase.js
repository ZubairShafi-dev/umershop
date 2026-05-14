import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAqrnDCXvYoSTbhrADxvzjh2UQH--hVfic",
  authDomain: "usmanmobileshop-142bb.firebaseapp.com",
  projectId: "usmanmobileshop-142bb",
  storageBucket: "usmanmobileshop-142bb.firebasestorage.app",
  messagingSenderId: "152510541269",
  appId: "1:152510541269:web:ee6eb078ec3c2b942c215c",
  measurementId: "G-KB30C2QJD0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable Offline Persistence for speed
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistence failed: Browser not supported');
    }
  });
}
