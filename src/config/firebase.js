
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDPugr6mBFo9H-CSyPCGmlATqfaZTDp5DI",
  authDomain: "cinemavod-ce87c.firebaseapp.com",
  projectId: "cinemavod-ce87c",
  storageBucket: "cinemavod-ce87c.firebasestorage.app",
  messagingSenderId: "417270663255",
  appId: "1:417270663255:web:927db5611111c27f9ffb12",
  measurementId: "G-GMJ8SBSEM2"
};

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
export const ts   = serverTimestamp; 
