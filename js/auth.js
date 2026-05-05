// js/auth.js
import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes for testing

// --- HELPERS ---

function updateSessionTimestamp() {
    localStorage.setItem('lastActivity', Date.now().toString());
}

async function logoutUser() {
    console.log("Logging out...");
    localStorage.clear(); 
    await signOut(auth);
    window.location.href = "index.html"; 
}

// --- SESSION CHECK ---

function checkSession() {
    const path = window.location.pathname;
    // Improved detection: treats "/", "/index.html", and empty strings as Login Page
    const isLoginPage = path === "/" || path.endsWith("index.html") || path === "";

    if (isLoginPage) return; // Stop if on login page

    const lastActivity = localStorage.getItem('lastActivity');
    if (!lastActivity) return;

    const elapsed = Date.now() - parseInt(lastActivity);
    
    if (elapsed > SESSION_TIMEOUT_MS) {
        alert("Session expired due to inactivity.");
        logoutUser();
    }
}

// --- INITIALIZE ---

// 1. Check immediately and every 5s
checkSession();
setInterval(checkSession, 5000);

// 2. Listen for activity
['mousedown', 'keydown', 'scroll', 'click'].forEach(event => {
    window.addEventListener(event, updateSessionTimestamp);
});

// 3. Auth Guard (The Bouncer)
onAuthStateChanged(auth, (user) => {
    const path = window.location.pathname;
    const isLoginPage = path === "/" || path.endsWith("index.html") || path === "";

    if (user) {
        if (isLoginPage) window.location.href = "dashboard.html";
    } else {
        if (!isLoginPage) window.location.href = "index.html";
    }
});

// --- UI EVENTS ---

document.addEventListener('click', (e) => {
    // This uses "Event Delegation" so it finds the logoutBtn 
    // even if it was loaded by sidebar-loader.js
    if (e.target.id === 'logoutBtn' || e.target.closest('#logoutBtn')) {
        e.preventDefault();
        logoutUser();
    }
});

// Login Form (if on index.html)
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('emailInput').value;
            const pass = document.getElementById('passInput').value;
            try {
                await signInWithEmailAndPassword(auth, email, pass);
                updateSessionTimestamp();
                window.location.href = "dashboard.html";
            } catch (err) {
                alert("Login Failed: " + err.message);
            }
        });
    }
});