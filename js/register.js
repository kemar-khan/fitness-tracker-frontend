/* ═══════════════════════════════════════════════════════════════
   FitPulse — Register Logic
   High-Contrast Lime & Black Edition
   ═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordError = document.getElementById('passwordError');

    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            // Reset error state
            passwordError.style.display = 'none';
            confirmPasswordInput.style.borderColor = '';

            if (password !== confirmPassword) {
                // Show validation error
                passwordError.style.display = 'block';
                confirmPasswordInput.style.borderColor = '#ff4444';
                return;
            }

            // Simulate successful registration
            console.log('Registration successful, redirecting to login...');
            
            // For now, redirect to dashboard as a success state
            window.location.href = 'dashboard.html';
        });
    }

    // Live validation feedback
    confirmPasswordInput.addEventListener('input', function() {
        if (this.value === passwordInput.value) {
            passwordError.style.display = 'none';
            this.style.borderColor = 'var(--lime)';
        } else {
            this.style.borderColor = '#ff4444';
        }
    });
});
