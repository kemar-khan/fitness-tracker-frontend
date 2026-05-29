//  FitPulse — profile.js
//  For profile.html + profile-settings.html

import './auth.js';
import { getStoredUid, loadUserProfile, saveUserProfile } from './firestore-data.js';

document.addEventListener('DOMContentLoaded', async function () {
    const isProfilePage  = !!document.getElementById('postsContainer');  // profile.html
    const isSettingsPage = !!document.getElementById('profileSection');  // profile-settings.html

    const uid = getStoredUid();

    // Load existing user data or set defaults
    let userData = JSON.parse(localStorage.getItem('userData')) || {
        fullName: "Jane Doe",
        email: "jane.doe@example.com",
        age: 25,
        height: 170,
        weight: 65,
        memberSince: "March 2024"
    };

    // ── Populate hero ──
    const nameEl = document.getElementById('displayFullName');
    const emailEl = document.getElementById('displayEmail');
    if (nameEl) nameEl.textContent = userData.fullName;
    if (emailEl) emailEl.textContent = userData.email;
    
    // ── Settings Dropdown Toggle ─────────
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsDropdown = document.getElementById('settingsDropdown');
 
    if (settingsBtn && settingsDropdown) {
        settingsBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            settingsDropdown.classList.toggle('open');
        });
 
        document.addEventListener('click', function () {
            settingsDropdown.classList.remove('open');
        });
 
        // Prevent clicks inside the dropdown from closing it
        settingsDropdown.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    }

    // ── Logout ────────────────────────────────────────
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            window.location.href = 'index.html';
        });
    }

    // ── Close modals on overlay click ──────────────────
    document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                overlay.classList.remove('open');
                document.body.style.overflow = '';
            }
        });
    });

    // ════════════════════════════════════════════════════
    //  PROFILE PAGE — profile.html
    // ════════════════════════════════════════════════════
    if (isProfilePage) {

        // ── Render Posts ───────────────────────────────
        renderPosts();

        // ── FAB Toggle ────────────────────────────────
        const fabBtn = document.getElementById('fabBtn');
        const fabMenu = document.getElementById('fabMenu');
        const fabIcon = document.getElementById('fabIcon');

        if (fabBtn) {
            fabBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                const isOpen = fabMenu.classList.toggle('open');
                fabIcon.className = isOpen ? 'bi bi-x-lg' : 'bi bi-plus-lg';
            });
        }

        // Close FAB menu when clicking outside
        document.addEventListener('click', function () {
            if (fabMenu && fabMenu.classList.contains('open')) {
                fabMenu.classList.remove('open');
                if (fabIcon) fabIcon.className = 'bi bi-plus-lg';
            }
        });

        // ── Image Upload Preview ───────────────────────────
        const uploadZone = document.getElementById('uploadZone');
        const imageInput = document.getElementById('imageInput');
        const imagePreview = document.getElementById('imagePreview');
        const uploadPlaceholder = document.getElementById('uploadPlaceholder');

        if (uploadZone) {
            uploadZone.addEventListener('click', function () {
                imageInput.click();
            });

            // Drag & drop
            uploadZone.addEventListener('dragover', function (e) {
                e.preventDefault();
                uploadZone.classList.add('drag-over');
            });
            uploadZone.addEventListener('dragleave', function () {
                uploadZone.classList.remove('drag-over');
            });
            uploadZone.addEventListener('drop', function (e) {
                e.preventDefault();
                uploadZone.classList.remove('drag-over');
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    previewImage(file);
                }
            });
        }

        if (imageInput) {
            imageInput.addEventListener('change', function () {
                const file = imageInput.files[0];
                if (file) previewImage(file);
            });
        }
    } 

    // ════════════════════════════════════════════════════
    //  SETTINGS PAGE — profile-settings.html
    // ════════════════════════════════════════════════════
    if (isSettingsPage) {

        // updateHero
        function updateHero() {
            const nameEl = document.getElementById('displayFullName');
            const emailEl = document.getElementById('displayEmail');
            const sidebarEl = document.getElementById('sidebarName');
            if (nameEl) nameEl.textContent = userData.fullName;
            if (emailEl) emailEl.textContent = userData.email;
            if (sidebarEl) sidebarEl.textContent = userData.fullName;
        }

        // Populate form fields
        function populateForm() {
            const fn = document.getElementById('fullName');
            const age = document.getElementById('age');
            const height = document.getElementById('height');
            const weight = document.getElementById('weight');
            if (fn) fn.value = userData.fullName;
            if (age) age.value = userData.age || '';
            if (height) height.value = userData.height || '';
            if (weight) weight.value = userData.weight || '';
        }

        populateForm();

        // ── Privacy toggle states ─────────────────
        const privacySettings = JSON.parse(localStorage.getItem('privacySettings')) || {
            profileVisibility: false,
            dataSharing: false,
            locationTracking: false,
            googleHealth: false
        };

        function loadPrivacyToggles() {
            const keys = ['profileVisibility', 'dataSharing', 'locationTracking', 'googleHealth'];
            keys.forEach(function (key) {
                const el = document.getElementById(key);
                if (el) el.checked = !!privacySettings[key];
            });
        }
        loadPrivacyToggles();

        // ── Show Section ──────────────────────────────
        function showSection(sectionId) {
            document.querySelectorAll('.settings-group').forEach(function (s) {
                s.classList.remove('active');
            });
            const target = document.getElementById(sectionId);
            if (target) {
                target.classList.add('active');
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            // Close the dropdown
            if (settingsDropdown) settingsDropdown.classList.remove('open');
        }

        // Expose for inline onclick fallback
        window.showSection = showSection;

        // ── Wire dropdown links via data-section ───────
        document.querySelectorAll('#settingsDropdown a[data-section]').forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                showSection(link.dataset.section);
            });
        });

        // ── Handle ?section= param from profile.html ──
        const params = new URLSearchParams(window.location.search);
        const sectionParam = params.get('section');
        if (sectionParam) {
            showSection(sectionParam);
        } else {
            showSection('profileSection');
        }

        // ── Accordion ─────────────────────────────────
        window.toggleAccordion = function (btn) {
            const body = btn.nextElementSibling;
            const isOpen = body.classList.contains('open');

            // Close all accordions in same section
            const section = btn.closest('.settings-group');
            section.querySelectorAll('.accordion-body').forEach(function (b) { b.classList.remove('open'); });
            section.querySelectorAll('.accordion-trigger').forEach(function (b) { b.classList.remove('open'); });

            if (!isOpen) {
                body.classList.add('open');
                btn.classList.add('open');
            }
        };

        // ── Star Rating ────────────────────────────────
        let selectedRating = 0;
        const stars = document.querySelectorAll('#starRating i');

        stars.forEach(function (star) {
            star.addEventListener('mouseenter', function () {
                const val = +star.dataset.value;
                stars.forEach(function (s) {
                    s.classList.toggle('hover', +s.dataset.value <= val);
                });
            });
            star.addEventListener('mouseleave', function () {
                stars.forEach(function (s) { s.classList.remove('hover'); });
            });
            star.addEventListener('click', function () {
                selectedRating = +star.dataset.value;
                stars.forEach(function (s) {
                    s.classList.toggle('active', +s.dataset.value <= selectedRating);
                });
            });
        });

        // ── Submit Feedback ────────────────────────────
        const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');
        if (submitFeedbackBtn) {
            submitFeedbackBtn.addEventListener('click', function () {
                const text = document.getElementById('feedbackText').value.trim();
                if (!selectedRating && !text) {
                    showToast('Please add a rating or a message before submitting.', 'error');
                    return;
                }
                // In production this would POST to a backend
                document.getElementById('feedbackText').value = '';
                selectedRating = 0;
                stars.forEach(function (s) { s.classList.remove('active', 'hover'); });
                showToast('Thanks for your feedback!');
            });
        }

        // ── Profile Form ───────────────────────────────
        const profileDetailsForm = document.getElementById('profileDetailsForm');
        if (profileDetailsForm) {
            profileDetailsForm.addEventListener('submit', function (e) {
                e.preventDefault();
                userData.fullName = document.getElementById('fullName').value.trim();
                userData.age = document.getElementById('age').value;
                userData.height = document.getElementById('height').value;
                userData.weight = document.getElementById('weight').value;
                localStorage.setItem('userData', JSON.stringify(userData));
                updateHero();
                showToast('Profile updated successfully!');
            });
        }

        // ── Privacy Settings Save ──────────────────────
        const savePrivacyBtn = document.getElementById('savePrivacyBtn');
        if (savePrivacyBtn) {
            savePrivacyBtn.addEventListener('click', function () {
                privacySettings.profileVisibility = document.getElementById('profileVisibility').checked;
                privacySettings.dataSharing = document.getElementById('dataSharing').checked;
                privacySettings.locationTracking = document.getElementById('locationTracking').checked;
                privacySettings.googleHealth = document.getElementById('googleHealth').checked;
                localStorage.setItem('privacySettings', JSON.stringify(privacySettings));
                showToast('Privacy settings saved!');
            });
        }

        // ── Change Password ────────────────────────────
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const currentPass = document.getElementById('currentPassword').value;
                const newPass = document.getElementById('newPassword').value;
                const confirmPass = document.getElementById('confirmNewPassword').value;

                if (!currentPass) {
                    showToast('Please enter your current password.', 'error');
                    return;
                }
                if (newPass.length < 6) {
                    showToast('New password must be at least 6 characters.', 'error');
                    return;
                }
                if (newPass !== confirmPass) {
                    showToast('New passwords do not match!', 'error');
                    return;
                }
                // Prototype: no real auth check
                showToast('Password updated successfully!');
                changePasswordForm.reset();
            });
        }

        // ── Deactivate Account ─────────────────────────
        const deactivateBtn = document.getElementById('deactivateBtn');
        if (deactivateBtn) {
            deactivateBtn.addEventListener('click', function () {
                openModal('deactivateModalOverlay');
            });
        }

        const confirmDeactivateBtn = document.getElementById('confirmDeactivateBtn');
        if (confirmDeactivateBtn) {
            confirmDeactivateBtn.addEventListener('click', function () {
                // Prototype: store deactivated flag and redirect
                localStorage.setItem('accountDeactivated', 'true');
                closeModal('deactivateModalOverlay');
                showToast('Account deactivated. Redirecting...', 'warn');
                setTimeout(function () {
                    window.location.href = 'index.html';
                }, 2000);
            });
        }

        // ── Delete Account ─────────────────────────────
        const deleteAccountBtn = document.getElementById('deleteAccountBtn');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', function () {
                document.getElementById('deleteConfirmInput').value = '';
                openModal('deleteModalOverlay');
            });
        }

        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', function () {
                const val = document.getElementById('deleteConfirmInput').value.trim();
                if (val !== 'DELETE') {
                    showToast('Please type DELETE to confirm.', 'error');
                    return;
                }
                localStorage.clear();
                closeModal('deleteModalOverlay');
                showToast('Account deleted. Redirecting...', 'warn');
                setTimeout(function () {
                    window.location.href = 'index.html';
                }, 2000);
            });
        }
    }
});

// ── Image Preview Helper ───────────────────────────
function previewImage(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const preview = document.getElementById('imagePreview');
        const placeholder = document.getElementById('uploadPlaceholder');
        preview.src = e.target.result;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// ── Posts Storage Helpers ─────────────────────────
function getPosts() {
    return JSON.parse(localStorage.getItem('fitpulsePosts')) || [
        {
            id: 'default1',
            imageUrl: 'https://media.tenor.com/DJIzIsfhL4wAAAAe/skaddale-running-away.png',
            caption: 'Just completed a 5km run today! Feeling amazing 💪',
            date: 'April 28, 2026'
        }
    ];
}

function savePosts(posts) {
    localStorage.setItem('fitpulsePosts', JSON.stringify(posts));
}

// ── Render All Posts ──────────────────────────────
function renderPosts() {
    const container = document.getElementById('postsContainer');
    const emptyMsg = document.getElementById('emptyPostsMsg');
    const posts = getPosts();

    if (!container) return;
    container.innerHTML = '';

    if (posts.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }
    if (emptyMsg) emptyMsg.style.display = 'none';

    posts.forEach(function (post) {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.dataset.id = post.id;

        card.innerHTML = `
            ${post.imageUrl ? `<img src="${post.imageUrl}" class="post-image" alt="Post image" />` : ''}
            <div class="post-content">
                <div class="post-card-header">
                    <div>
                        <p class="post-text">${escapeHtml(post.caption)}</p>
                        <span class="post-date">${post.date}</span>
                    </div>
                    <div class="post-actions-menu">
                        <button class="post-menu-btn" onclick="togglePostMenu(event, '${post.id}')">
                            <i class="bi bi-three-dots-vertical"></i>
                        </button>
                        <div class="post-menu-dropdown" id="menu-${post.id}">
                            <button onclick="openEditModal('${post.id}')"><i class="bi bi-pencil"></i> Edit Post</button>
                            <button onclick="openDeleteModal('${post.id}')" class="danger"><i class="bi bi-trash3"></i> Delete Post</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// ── Escape HTML to prevent XSS ────────────────────
function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}
 
// ── Post Menu Toggle ──────────────────────────────
function togglePostMenu(e, postId) {
    e.stopPropagation();
    // Close all other open menus
    document.querySelectorAll('.post-menu-dropdown.open').forEach(function (m) {
        if (m.id !== 'menu-' + postId) m.classList.remove('open');
    });
    document.getElementById('menu-' + postId).classList.toggle('open');
}

// Close post menus on outside click
document.addEventListener('click', function () {
    document.querySelectorAll('.post-menu-dropdown.open').forEach(function (m) {
        m.classList.remove('open');
    });
});

// ── Add Post Modal ────────────────────────────────
function openPostModal() {
    // Reset form
    document.getElementById('postCaption').value = '';
    document.getElementById('imageInput').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('uploadPlaceholder').style.display = 'flex';

    document.getElementById('postModalOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';

    // Close FAB menu
    const fabMenu = document.getElementById('fabMenu');
    const fabIcon = document.getElementById('fabIcon');
    if (fabMenu) fabMenu.classList.remove('open');
    if (fabIcon) fabIcon.className = 'bi bi-plus-lg';
}

function closePostModal() {
    document.getElementById('postModalOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

function submitPost() {
    const caption = document.getElementById('postCaption').value.trim();
    const imagePreview = document.getElementById('imagePreview');

    if (!caption && imagePreview.style.display === 'none') {
        showToast('Please add a caption or an image before posting.', 'error');
        return;
    }

    const posts = getPosts();
    const newPost = {
        id: 'post_' + Date.now(),
        imageUrl: imagePreview.style.display !== 'none' ? imagePreview.src : null,
        caption: caption || '',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    };

    posts.unshift(newPost); // newest first
    savePosts(posts);
    renderPosts();
    closePostModal();
    showToast('Post shared!');
}

// ── Edit Post Modal ───────────────────────────────
let currentEditId = null;

function openEditModal(postId) {
    currentEditId = postId;
    const posts = getPosts();
    const post = posts.find(function (p) { return p.id === postId; });
    if (!post) return;
    document.getElementById('editCaption').value = post.caption;
    document.getElementById('editModalOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    document.getElementById('editModalOverlay').classList.remove('open');
    document.body.style.overflow = '';
    currentEditId = null;
}

function saveEdit() {
    const newCaption = document.getElementById('editCaption').value.trim();
    if (!newCaption) {
        showToast('Caption cannot be empty.', 'error');
        return;
    }
    const posts = getPosts();
    const idx = posts.findIndex(function (p) { return p.id === currentEditId; });
    if (idx !== -1) {
        posts[idx].caption = newCaption;
        savePosts(posts);
        renderPosts();
    }
    closeEditModal();
    showToast('Post updated!');
}

// ── Delete Post Modal ─────────────────────────────
let currentDeleteId = null;

function openDeleteModal(postId) {
    currentDeleteId = postId;
    document.getElementById('deletePostOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
    document.getElementById('deletePostOverlay').classList.remove('open');
    document.body.style.overflow = '';
    currentDeleteId = null;
}

function confirmDeletePost() {
    let posts = getPosts();
    posts = posts.filter(function (p) { return p.id !== currentDeleteId; });
    savePosts(posts);
    renderPosts();
    closeDeleteModal();
    showToast('Post deleted.');
}

// ── Modal Helpers (global) ─────────────────────────
function openModal(id) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// ── Toast Notification ────────────────────────────
function showToast(message, type) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = 'toast show' + (type === 'error' ? ' error' : type === 'warn' ? ' warn' : '');
    clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(function () {
        toast.classList.remove('show');
    }, 3000);
}

// // --- Show Related Settings Section ---
// function showSection(sectionId) {
//     document.querySelectorAll(".settings-group").forEach(section => {
//         section.classList.remove("active");
//     });

//     document.getElementById(sectionId).classList.add("active");
//     }
//     document.querySelectorAll(".dropdown a").forEach(link => {
//     link.addEventListener("click", () => {
//         document.querySelector(".dropdown").style.display = "none";
//     });
// });

//     // --- Tab A: Handle Profile Details Submission ---
//     const profileDetailsForm = document.getElementById('profileDetailsForm');
//     if (profileDetailsForm) {
//         profileDetailsForm.addEventListener('submit', function (e) {
//             e.preventDefault();

//             // Collect new data
//             userData.fullName = document.getElementById('fullName').value;
//             userData.age = document.getElementById('age').value;
//             userData.height = document.getElementById('height').value;
//             userData.weight = document.getElementById('weight').value;

//             // Save to localStorage
//             localStorage.setItem('userData', JSON.stringify(userData));

//             // Update header and notify user
//             updateUI();
//             alert('Profile details updated successfully!');
//         });
//     }

//     // --- Tab B: Handle Change Password Submission ---
//     const changePasswordForm = document.getElementById('changePasswordForm');
//     if (changePasswordForm) {
//         changePasswordForm.addEventListener('submit', function (e) {
//             e.preventDefault();

//             const currentPass = document.getElementById('currentPassword').value;
//             const newPass = document.getElementById('newPassword').value;
//             const confirmNewPass = document.getElementById('confirmNewPassword').value;

//             // Simple validation
//             if (newPass.length < 6) {
//                 alert('New password must be at least 6 characters long.');
//                 return;
//             }

//             if (newPass !== confirmNewPass) {
//                 alert('New passwords do not match!');
//                 return;
//             }

//             // Prototype action - in a real app, you'd send this to a backend
//             alert('Password updated successfully! (Prototype: No actual verification of current password)');
//             changePasswordForm.reset();
//         });
//     }

//     // --- Tab C: Handle Account Deletion ---
//     const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
//     if (confirmDeleteBtn) {
//         confirmDeleteBtn.addEventListener('click', function () {
//             // Delete all data associated with the user
//             localStorage.clear();

//             // Redirect to login page
//             alert('Your account and data have been deleted. Redirecting to home...');
//             window.location.href = 'index.html';
//         });
//     }

//     // --- Logout Handle ---
//     const logoutBtn = document.getElementById('logoutBtn');
//     if (logoutBtn) {
//         logoutBtn.addEventListener('click', function() {
//             // Optional: clear session/auth tokens here
//             window.location.href = 'index.html';
//         });
//     }
// });
