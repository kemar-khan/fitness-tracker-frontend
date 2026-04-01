document.addEventListener("DOMContentLoaded", function () {
    // --- Global Navbar Sync ---
    const navUserName = document.getElementById('navUserName');
    if (navUserName) {
        const userData = JSON.parse(localStorage.getItem('userData')) || { fullName: "Jane Doe" };
        navUserName.textContent = userData.fullName;
    }

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            if (email === "" || password === "") {
                alert("Please fill in all fields.");
            } else {
                // Initialize default user data on login if not exists
                if (!localStorage.getItem('userData')) {
                    localStorage.setItem('userData', JSON.stringify({
                        fullName: "Jane Doe",
                        email: email,
                        memberSince: "March 2024"
                    }));
                }
                alert("Login successful!");
                window.location.href = "dashboard.html";
            }
        });
    }
});