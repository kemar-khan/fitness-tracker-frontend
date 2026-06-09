import { db, auth } from './firebase-config.js';
import { collection, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

document.addEventListener("DOMContentLoaded", function () {
    const placeholder = document.getElementById("sidebar-placeholder");
    if (!placeholder) return;

    fetch("sidebar.html")
        .then(r => r.text())
        .then(html => {
            placeholder.innerHTML = html;

            // Highlight active page
            const currentPage = window.location.pathname.split("/").pop();
            document.querySelectorAll(".nav-item").forEach(function (link) {
                link.classList.toggle("active", link.getAttribute("href") === currentPage);
            });

            // Show user name — populated by login.js on sign-in
            const nameEl = document.getElementById('sidebar-user-name');
            if (nameEl) {
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                nameEl.textContent = userData.fullName || userData.displayName || 'FitPulse Member';
            }
            
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    listenToUnreadAlerts(user.uid);
                }
            });

            document.dispatchEvent(new CustomEvent('sidebarLoaded'));
        });
});

function listenToUnreadAlerts(uid) {
    const alertsRef = query(collection(db, "users", uid, "notifications"), where("unread", "==", true));
    
    onSnapshot(alertsRef, (snapshot) => {
        const unreadCount = snapshot.docs.length;
        const badge = document.getElementById('alerts-badge');
        
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? "inline-flex" : "none";
        }
    });
}
