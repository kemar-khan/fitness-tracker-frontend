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

            document.dispatchEvent(new CustomEvent('sidebarLoaded'));
        });
});
