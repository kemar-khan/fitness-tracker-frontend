'use strict';
import './auth.js';

// 1. Import Google Auth functions
import { auth } from './firebase-config.js';
import { GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ensureUserDocument, setStoredUid } from './firestore-data.js';

document.addEventListener('DOMContentLoaded', function () {
    const googleLoginBtn = document.getElementById('googleLoginBtn');

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async function () {
            
            // 2. Initialize the Google Provider
            const provider = new GoogleAuthProvider();

            try {
                // 3. Open the Google Sign-In Popup
                const result = await signInWithPopup(auth, provider);
                const user = result.user;

                console.log("Google Login Success:", user.displayName);

                // 4. Save user info to localStorage (using Google data)
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
                
                // 5. Redirect to dashboard
                window.location.href = "dashboard.html";

            } catch (error) {
                console.error("Google Login Error:", error.code, error.message);
                
                // Handle common errors (like the user closing the popup)
                if (error.code === 'auth/popup-closed-by-user') {
                    alert("Login cancelled. Please try again.");
                } else {
                    alert("Error: " + error.message);
                }
            }
        });
    }
});