document.addEventListener("DOMContentLoaded", function () {
    const placeholder = document.getElementById("sidebar-placeholder");

    if (placeholder) {
        fetch("sidebar.html")
            .then(response => response.text())
            .then(data => {
                placeholder.innerHTML = data;

                // 1. Highlight the current active page in the sidebar
                const currentPage = window.location.pathname.split("/").pop();
                const navLinks = document.querySelectorAll(".nav-item");
                navLinks.forEach(link => {
                    if (link.getAttribute("href") === currentPage) {
                        link.classList.add("active");
                    } else {
                        link.classList.remove("active");
                    }
                });

                // 2. Set the name from localStorage immediately after loading
                updateSidebarName();
                document.dispatchEvent(new CustomEvent('sidebarLoaded'));
            });
    }
});

// Function to update the sidebar name from localStorage
function updateSidebarName() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const sidebarNameEl = document.getElementById('sidebar-user-name');
    if (userData && userData.fullName && sidebarNameEl) {
        sidebarNameEl.textContent = userData.fullName;
    }
}