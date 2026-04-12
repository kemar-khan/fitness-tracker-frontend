/* ═══════════════════════════════════════════════════════════════
   FitPulse — Login Logic
   High-Contrast Lime & Black Edition
   ═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            if (email === "" || password === "") {
                alert("Please fill in all fields.");
                return;
            }

            // Initialize default user data on login if not exists
            if (!localStorage.getItem('userData')) {
                localStorage.setItem('userData', JSON.stringify({
                    fullName: "Jordan Lee",
                    email: email,
                    memberSince: "March 2024"
                }));
            }
            
            // Redirect to dashboard
            window.location.href = "dashboard.html";
        });
    }
});
