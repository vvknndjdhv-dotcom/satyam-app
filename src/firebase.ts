 import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAIA--UIa2-raE4PsP2lxjPoG7lW0GWs_I",
  authDomain: "satyam-app-43f7a.firebaseapp.com",
  projectId: "satyam-app-43f7a",
  storageBucket: "satyam-app-43f7a.firebasestorage.app",
  messagingSenderId: "772506593026",
  appId: "1:772506593026:web:c0410e548753d5f6cac41b"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);