import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/**
 * Monitors authentication state and executes a callback with the user object.
 * Redirects to login.html if the user is not logged in.
 */
export function monitorAuth(callback) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            callback(user);
        } else {
            console.warn("User unauthenticated. Redirecting...");
            window.location.href = "login.html";
        }
    });
}

/**
 * Gets the current logged-in user's UID or redirects if not found.
 */
export function requireAuth() {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                resolve(user.uid);
            } else {
                window.location.href = "login.html";
            }
        });
    });
}
