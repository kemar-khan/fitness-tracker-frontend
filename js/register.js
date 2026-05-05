/* ═══════════════════════════════════════════════════════════════
   FitPulse — Register Logic
   Email/Password + Google (Firebase Auth)
   ═══════════════════════════════════════════════════════════════ */

'use strict';

import { auth } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { ensureUserDocument, setStoredUid } from './firestore-data.js';

document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('registerForm');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordError = document.getElementById('passwordError');
    const registerError = document.getElementById('registerError');
    const googleRegisterBtn = document.getElementById('googleRegisterBtn');

    function setError(message) {
        if (!registerError) return;
        registerError.textContent = message;
        registerError.style.display = message ? 'block' : 'none';
    }

    async function persistUserSession(user, fullName) {
        const profileData = {
            fullName: fullName || user.displayName || 'FitPulse Member',
            email: user.email || '',
            profilePic: user.photoURL || '',
            memberSince: new Date().toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })
        };

        localStorage.setItem('userData', JSON.stringify(profileData));
        localStorage.setItem('fitpulseAuthSession', 'active');
        setStoredUid(user.uid);

        await ensureUserDocument(user.uid, profileData);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            setError('');

            const fullName = fullNameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            passwordError.style.display = 'none';
            confirmPasswordInput.style.borderColor = '';

            if (password !== confirmPassword) {
                passwordError.style.display = 'block';
                confirmPasswordInput.style.borderColor = '#ff4444';
                return;
            }

            try {
                const credential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(credential.user, { displayName: fullName });
                await persistUserSession(credential.user, fullName);
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error('Registration Error:', error.code, error.message);
                setError(error.message || 'Unable to register right now. Please try again.');
            }
        });
    }

    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function () {
            if (!this.value) {
                this.style.borderColor = '';
                passwordError.style.display = 'none';
                return;
            }

            if (this.value === passwordInput.value) {
                passwordError.style.display = 'none';
                this.style.borderColor = 'var(--lime)';
            } else {
                this.style.borderColor = '#ff4444';
            }
        });
    }

    if (googleRegisterBtn) {
        googleRegisterBtn.addEventListener('click', async function () {
            setError('');
            const provider = new GoogleAuthProvider();

            try {
                const result = await signInWithPopup(auth, provider);
                await persistUserSession(result.user, result.user.displayName);
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error('Google Register Error:', error.code, error.message);
                if (error.code === 'auth/popup-closed-by-user') {
                    setError('Google sign-up was cancelled.');
                    return;
                }
                setError(error.message || 'Unable to continue with Google. Please try again.');
            }
        });
    }
});
