// js/sidebar-loader.js
document.addEventListener("DOMContentLoaded", function () {
    const sidebarContainer = document.getElementById("sidebar-placeholder");

    if (sidebarContainer) {
        // 1. Fetch the sidebar HTML
        fetch("sidebar.html")
            .then(response => response.text())
            .then(data => {
                sidebarContainer.innerHTML = data;

                // 2. Set the Active class based on current page
                const currentPage = window.location.pathname.split("/").pop();
                const navLinks = document.querySelectorAll(".nav-item");
                navLinks.forEach(link => {
                    if (link.getAttribute("href") === currentPage) {
                        link.classList.add("active");
                    } else {
                        link.classList.remove("active");
                    }
                });

                // 3. Update the Name from LocalStorage
                updateSidebarUser();
            });
    }
});

function updateSidebarUser() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const sidebarNameDisplay = document.getElementById('sidebar-user-name');
    
    if (userData && userData.fullName && sidebarNameDisplay) {
        sidebarNameDisplay.textContent = userData.fullName;
    } else if (sidebarNameDisplay) {
        sidebarNameDisplay.textContent = "Guest User";
    }
}