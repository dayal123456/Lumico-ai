
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDjgz01sW23uYIYCZgOuOvfSUP3tuibJH8",
  authDomain: "lumico-e6023.firebaseapp.com",
  databaseURL: "https://lumico-e6023-default-rtdb.firebaseio.com",
  projectId: "lumico-e6023",
  storageBucket: "lumico-e6023.firebasestorage.app",
  messagingSenderId: "12464354370",
  appId: "1:12464354370:web:2c46ea3cd349a2936629db"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
