(() => {
    'use strict';

    const SESSION_KEY = 'fitpulseAuthSession';
    const USER_KEY = 'userData';
    const PUBLIC_PAGES = new Set(['index.html', 'register.html', '404.html']);

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const hasSession = localStorage.getItem(SESSION_KEY) === 'active';
    const hasUserData = !!localStorage.getItem(USER_KEY);
    const isPublicPage = PUBLIC_PAGES.has(currentPage);
    const isAuthenticated = hasSession && hasUserData;

    if (!isPublicPage && !isAuthenticated) {
        window.location.replace('index.html');
    }
})();
