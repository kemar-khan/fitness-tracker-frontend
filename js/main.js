document.addEventListener("DOMContentLoaded", function () {
    // --- Global Navbar Sync ---
    const navUserName = document.getElementById('navUserName');
    if (navUserName) {
        const userData = JSON.parse(localStorage.getItem('userData')) || { fullName: "Jane Doe" };
        navUserName.textContent = userData.fullName;
    }

    // Login logic moved to js/login.js
});