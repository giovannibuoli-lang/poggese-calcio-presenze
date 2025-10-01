import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Le tue credenziali Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDFii0LAiOtRgKasw9gQgjrvt5oX5ubaKA",
  authDomain: "convocazioni-calcio.firebaseapp.com",
  projectId: "convocazioni-calcio",
  storageBucket: "convocazioni-calcio.firebasestorage.app",
  messagingSenderId: "83977277271",
  appId: "1:83977277271:web:ca00692e01b5312f2d3812"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Inizializza i servizi
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
