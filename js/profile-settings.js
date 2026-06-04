'use strict';
import { getAuth, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { loadUserProfile, saveUserProfile, deleteUserDocument } from './firestore-data.js';

document.addEventListener('DOMContentLoaded', function () {
    const auth = getAuth();

    onAuthStateChanged(auth, async (user) => {
        if (!user) { window.location.href = 'index.html'; return; }
        const uid = user.uid;

        let profile = await loadUserProfile(uid) || {};
        if (!profile.email) profile.email = user.email;

        function updateUI() {
            const nameEl  = document.getElementById('displayFullName');
            const emailEl = document.getElementById('displayEmail');
            if (nameEl)  nameEl.textContent  = profile.fullName || '';
            if (emailEl) emailEl.textContent = profile.email    || '';

            const fields = { fullName: profile.fullName, email: profile.email, age: profile.age, height: profile.height, weight: profile.weight };
            Object.entries(fields).forEach(([id, val]) => {
                const el = document.getElementById(id);
                if (el) el.value = val || '';
            });
        }
        updateUI();

        // ── Profile Details ──────────────────────────────────
        const profileDetailsForm = document.getElementById('profileDetailsForm');
        if (profileDetailsForm) {
            profileDetailsForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                profile.fullName = document.getElementById('fullName')?.value || profile.fullName;
                profile.age      = document.getElementById('age')?.value      || profile.age;
                profile.height   = document.getElementById('height')?.value   || profile.height;
                profile.weight   = document.getElementById('weight')?.value   || profile.weight;
                await saveUserProfile(uid, profile);
                // keep localStorage in sync so sidebar shows updated name immediately
                const stored = JSON.parse(localStorage.getItem('userData') || '{}');
                localStorage.setItem('userData', JSON.stringify({ ...stored, ...profile }));
                updateUI();
                alert('Profile updated successfully!');
            });
        }

        // ── Change Password ───────────────────────────────────
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                const currentPass = document.getElementById('currentPassword')?.value;
                const newPass     = document.getElementById('newPassword')?.value;
                const confirmPass = document.getElementById('confirmNewPassword')?.value;

                if (!newPass || newPass.length < 6) {
                    alert('New password must be at least 6 characters.'); return;
                }
                if (newPass !== confirmPass) {
                    alert('New passwords do not match!'); return;
                }
                try {
                    const credential = EmailAuthProvider.credential(user.email, currentPass);
                    await reauthenticateWithCredential(user, credential);
                    await updatePassword(user, newPass);
                    alert('Password updated successfully!');
                    changePasswordForm.reset();
                } catch (err) {
                    if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                        alert('Current password is incorrect.');
                    } else if (err.code === 'auth/requires-recent-login') {
                        alert('Please log out and log back in before changing your password.');
                    } else {
                        alert('Failed to update password: ' + err.message);
                    }
                }
            });
        }

        // ── Delete Account ────────────────────────────────────
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', async function () {
                if (!confirm('Are you sure? This will permanently delete your account and all data.')) return;
                try {
                    await deleteUserDocument(uid);
                    await deleteUser(user);
                    localStorage.clear();
                    alert('Your account has been deleted.');
                    window.location.href = 'index.html';
                } catch (err) {
                    if (err.code === 'auth/requires-recent-login') {
                        alert('Please log out and log back in before deleting your account.');
                    } else {
                        alert('Failed to delete account: ' + err.message);
                    }
                }
            });
        }

        // ── Logout ────────────────────────────────────────────
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function () {
                auth.signOut().then(() => { localStorage.clear(); window.location.href = 'index.html'; });
            });
        }

        // ── Settings dropdown (shared UI) ────────────────────
        const settingsBtn      = document.getElementById('settingsBtn');
        const settingsDropdown = document.getElementById('settingsDropdown');
        if (settingsBtn && settingsDropdown) {
            settingsBtn.addEventListener('click', e => { e.stopPropagation(); settingsDropdown.classList.toggle('open'); });
            document.addEventListener('click', () => settingsDropdown.classList.remove('open'));
            settingsDropdown.addEventListener('click', e => e.stopPropagation());
        }

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', e => {
                if (e.target === overlay) { overlay.classList.remove('open'); document.body.style.overflow = ''; }
            });
        });
    });
});
