/**
 * UI Toast Notifications module for FitPulse
 * Handles premium toast notifications
 */

export const toast = {
    show(message, type = 'success') {
        const container = document.getElementById('notification-container');
        if (!container) {
            console.warn('Notification container not found');
            return;
        }

        const toastEl = document.createElement('div');
        toastEl.className = `toast toast-${type}`;
        
        const icon = type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill';
        
        toastEl.innerHTML = `
            <i class="bi ${icon}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toastEl);

        // Animation in
        setTimeout(() => toastEl.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toastEl.classList.remove('show');
            setTimeout(() => toastEl.remove(), 300);
        }, 3000);
    },

    success(message) {
        this.show(message, 'success');
    },

    error(message) {
        this.show(message, 'error');
    }
};
