// js/auth.js
import { auth } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Example function to Register a user
async function registerUser(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("User registered:", userCredential.user);
        window.location.href = "dashboard.html"; // Redirect after success
    } catch (error) {
        console.error("Error signing up:", error.message);
        alert(error.message);
    }
}

// Example function to Login a user
async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("User logged in:", userCredential.user);
        window.location.href = "dashboard.html"; // Redirect after success
    } catch (error) {
        console.error("Error logging in:", error.message);
        alert(error.message);
    }
}

// Attach these to your HTML buttons
// Assuming your button has id="loginBtn"
document.getElementById('loginBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('emailInput').value;
    const pass = document.getElementById('passInput').value;
    loginUser(email, pass);
});