import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { loadUserProfile } from './firestore-data.js';

document.addEventListener("DOMContentLoaded", function () {
    const placeholder = document.getElementById("sidebar-placeholder");
    if (!placeholder) return;

    fetch("sidebar.html")
        .then(r => r.text())
        .then(html => {
            placeholder.innerHTML = html;

            // Highlight active page
            const currentPage = window.location.pathname.split("/").pop();
            document.querySelectorAll(".nav-item").forEach(link => {
                link.classList.toggle("active", link.getAttribute("href") === currentPage);
            });

            // Load user name from Firestore
            onAuthStateChanged(auth, async (user) => {
                const nameEl = document.getElementById('sidebar-user-name');
                if (!nameEl) return;
                if (!user) { nameEl.textContent = 'Guest User'; return; }
                try {
                    const profile = await loadUserProfile(user.uid);
                    nameEl.textContent = (profile && profile.fullName) ? profile.fullName : (user.displayName || 'FitPulse Member');
                } catch (_) {
                    nameEl.textContent = user.displayName || 'FitPulse Member';
                }
            });

            document.dispatchEvent(new CustomEvent('sidebarLoaded'));
        });
});
