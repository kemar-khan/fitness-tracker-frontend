'use strict';
import './auth.js';

import { auth } from './firebase-config.js';
import { 
    GoogleAuthProvider, 
    signInWithPopup,
    signInWithEmailAndPassword   // ✅ added
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { ensureUserDocument, setStoredUid } from './firestore-data.js';

document.addEventListener('DOMContentLoaded', function () {

    // 🔹 EMAIL LOGIN
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            loginError.style.display = 'none';

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const result = await signInWithEmailAndPassword(auth, email, password);
                const user = result.user;

                console.log("Email Login Success:", user.email);

                // Save session (same style as Google)
                localStorage.setItem('userData', JSON.stringify({
                    fullName: user.displayName || "FitPulse Member",
                    email: user.email,
                    profilePic: user.photoURL || "",
                    memberSince: new Date().toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })
                }));

                localStorage.setItem('fitpulseAuthSession', 'active');
                setStoredUid(user.uid);

                await ensureUserDocument(user.uid, {
                    fullName: user.displayName || "FitPulse Member",
                    email: user.email,
                    profilePic: user.photoURL || "",
                    memberSince: new Date().toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })
                });

                window.location.href = "dashboard.html";

            } catch (error) {
                console.error("Email Login Error:", error.code, error.message);
                loginError.textContent = error.message;
                loginError.style.display = 'block';
            }
        });
    }

    // 🔹 GOOGLE LOGIN (UNCHANGED)
    const googleLoginBtn = document.getElementById('googleLoginBtn');

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async function () {

            const provider = new GoogleAuthProvider();

            try {
                const result = await signInWithPopup(auth, provider);
                const user = result.user;

                console.log("Google Login Success:", user.displayName);

                localStorage.setItem('userData', JSON.stringify({
                    fullName: user.displayName,
                    email: user.email,
                    profilePic: user.photoURL,
                    memberSince: new Date().toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })
                }));

                localStorage.setItem('fitpulseAuthSession', 'active');
                setStoredUid(user.uid);

                await ensureUserDocument(user.uid, {
                    fullName: user.displayName,
                    email: user.email,
                    profilePic: user.photoURL,
                    memberSince: new Date().toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })
                });

                window.location.href = "dashboard.html";

            } catch (error) {
                console.error("Google Login Error:", error.code, error.message);

                if (error.code === 'auth/popup-closed-by-user') {
                    alert("Login cancelled. Please try again.");
                } else {
                    alert("Error: " + error.message);
                }
            }
        });
    }
});