// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA57aIDXrzpjyyT-JhzlhnESIWgsE8nveg",
  authDomain: "eco-auditor.firebaseapp.com",
  projectId: "eco-auditor",
  storageBucket: "eco-auditor.firebasestorage.app",
  messagingSenderId: "7220841017",
  appId: "1:7220841017:web:bd06faf92d9fd215395be8",
  measurementId: "G-NRSCDQQDYK"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

const isCustomConfigured = true;

export { app, db, auth, isCustomConfigured };
