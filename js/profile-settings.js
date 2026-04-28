document.addEventListener('DOMContentLoaded', function () {
    // Load existing user data or set defaults
    let userData = JSON.parse(localStorage.getItem('userData')) || {
        fullName: "Jane Doe",
        email: "jane.doe@example.com",
        age: 25,
        height: 170,
        weight: 65,
        memberSince: "March 2024"
    };

    // Update UI elements from storage
    function updateUI() {
        // Display header
        document.getElementById('displayFullName').textContent = userData.fullName;
        document.getElementById('displayEmail').textContent = userData.email;

        // Fill form fields
        document.getElementById('fullName').value = userData.fullName;
        document.getElementById('email').value = userData.email;
        document.getElementById('age').value = userData.age || '';
        document.getElementById('height').value = userData.height || '';
        document.getElementById('weight').value = userData.weight || '';
    }

    updateUI();

    // --- Tab A: Handle Profile Details Submission ---
    const profileDetailsForm = document.getElementById('profileDetailsForm');
    if (profileDetailsForm) {
        profileDetailsForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Collect new data
            userData.fullName = document.getElementById('fullName').value;
            userData.age = document.getElementById('age').value;
            userData.height = document.getElementById('height').value;
            userData.weight = document.getElementById('weight').value;

            // Save to localStorage
            localStorage.setItem('userData', JSON.stringify(userData));

            // Update header and notify user
            updateUI();
            alert('Profile details updated successfully!');
        });
    }

    // --- Tab B: Handle Change Password Submission ---
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const currentPass = document.getElementById('currentPassword').value;
            const newPass = document.getElementById('newPassword').value;
            const confirmNewPass = document.getElementById('confirmNewPassword').value;

            // Simple validation
            if (newPass.length < 6) {
                alert('New password must be at least 6 characters long.');
                return;
            }

            if (newPass !== confirmNewPass) {
                alert('New passwords do not match!');
                return;
            }

            // Prototype action - in a real app, you'd send this to a backend
            alert('Password updated successfully! (Prototype: No actual verification of current password)');
            changePasswordForm.reset();
        });
    }

    // --- Tab C: Handle Account Deletion ---
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function () {
            // Delete all data associated with the user
            localStorage.clear();

            // Redirect to login page
            alert('Your account and data have been deleted. Redirecting to home...');
            window.location.href = 'index.html';
        });
    }

    // --- Logout Handle ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Optional: clear session/auth tokens here
            window.location.href = 'index.html';
        });
    }
});
