import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// 🛡️ CONTROL DE SEGURIDAD PARA COMPILACIÓN (BUILD)
// Si no hay API Key (como pasa en el renderizado de servidor en Vercel), 
// creamos un objeto vacío temporal para que Next.js compile sin colapsar.
const isConfigValid = !!firebaseConfig.apiKey;

const app = !getApps().length 
  ? initializeApp(isConfigValid ? firebaseConfig : { apiKey: "placeholder-build" }) 
  : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };