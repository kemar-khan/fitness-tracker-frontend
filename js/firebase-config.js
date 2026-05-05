// 1. You MUST have these two lines at the very top:
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. Your config object
const firebaseConfig = {
    apiKey: "AIzaSyAT7Wlkcx3SRMOTgx4m1z0hFxkawJTvkL0",
    authDomain: "fitpulse-3e566.firebaseapp.com",
    projectId: "fitpulse-3e566",
    storageBucket: "fitpulse-3e566.firebasestorage.app",
    messagingSenderId: "370979279481",
    appId: "1:370979279481:web:29df4caff97af51e0dbaa8",
    measurementId: "G-WF5044VT99"
};

// 3. Initialize Firebase
const app = initializeApp(firebaseConfig);

// 4. THIS is where your error was happening. 
// It works now because of the import on line 2!
export const auth = getAuth(app);
export const db = getFirestore(app);