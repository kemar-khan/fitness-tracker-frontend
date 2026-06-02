//  FitPulse — profile.js
//  For profile.html + profile-settings.html

import { getAuth, onAuthStateChanged, signOut, deleteUser, GoogleAuthProvider, reauthenticateWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ensureUserDocument, getStoredUid, loadUserProfile, saveUserProfile, loadPrivacySettings, savePrivacySettings, deleteUserDocument, submitFeedback, loadGoals, saveGoals, getWeightLogs, logWeight } from './firestore-data.js';

document.addEventListener('DOMContentLoaded', async function () {
    const isProfilePage  = !!document.getElementById('postsContainer');  // profile.html
    const isSettingsPage = !!document.getElementById('profileSection');  // profile-settings.html


    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
        if (!user) return;
        const uid = user.uid;
        const email = user.email;
        await ensureUserDocument(uid, { email });
        let userData = await loadUserProfile(uid);
        if (!userData.email) userData.email = email;

        // ══════════════════════════════════════════════════════════════════════════
        //  ELEMENTS SHARED ACROSS BOTH PAGES PROFILE.HTML & PROFILE-SETTINGS.HTML
        // ══════════════════════════════════════════════════════════════════════════

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
        //  ELEMENTS IN PROFILE PAGE — profile.html
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

            // Goals Section ════════════════════════════════════════════════════
            let goalsData = await loadGoals(uid) || {
                dailyCalories: 0,
                dailySteps: 0,
                dailyWater: 0,
                weeklyWorkouts: 0
            };

            function renderGoals() {
                const cal = document.getElementById('goalCalories');
                const steps = document.getElementById('goalSteps');
                const water = document.getElementById('goalWater');
                const workouts = document.getElementById('goalWorkouts');
                if (cal) cal.textContent = `${goalsData.dailyCalories} kcal/day`;
                if (steps) steps.textContent = `${goalsData.dailySteps.toLocaleString()} steps/day`;
                if (water) water.textContent = `${goalsData.dailyWater} ml/day`;
                if (workouts) workouts.textContent = `${goalsData.weeklyWorkouts} workouts/week`;
            }
            renderGoals();

            const editGoalsBtn = document.querySelector('.edit-goals-btn');
            if (editGoalsBtn) {
                editGoalsBtn.addEventListener('click', function() {
                    document.getElementById('inputCalories').value = goalsData.dailyCalories || '';
                    document.getElementById('inputSteps').value = goalsData.dailySteps || '';
                    document.getElementById('inputWater').value = goalsData.dailyWater || '';
                    document.getElementById('inputWorkouts').value = goalsData.weeklyWorkouts || '';
                    openModal('editGoalsOverlay');
                });
            }

            saveGoalsBtn.addEventListener('click', async function () {
                goalsData.dailyCalories = +document.getElementById('inputCalories').value;
                goalsData.dailySteps = +document.getElementById('inputSteps').value;
                goalsData.dailyWater = +document.getElementById('inputWater').value;
                goalsData.weeklyWorkouts = +document.getElementById('inputWorkouts').value;

                await saveGoals(uid, goalsData);
                renderGoals();
                closeModal('editGoalsOverlay');
                showToast('Goals updated successfully!');
            });

            // Weight Section ════════════════════════════════════════════════════
            // load latest weight log and display
            const weightLogs = await getWeightLogs(uid);
            let latestLog = weightLogs && weightLogs.length > 0 
            ? weightLogs[weightLogs.length - 1] 
            : null;

            function calculateBMI(weight, heightCm) {
                if (!weight || !heightCm) return null;
                const heightM = heightCm / 100;
                return (weight / (heightM * heightM)).toFixed(1);
            }

            function getBMICategory(bmi) {
                if (bmi < 18.5) return 'Underweight';
                if (bmi < 25) return 'Normal weight';
                if (bmi < 30) return 'Overweight';
                return 'Obese';
            }

            function renderWeightBMI() {
                const weight = latestLog?.weight || userData.weight || 0;
                const height = userData.height || 0;
                const bmi = calculateBMI(weight, height);

                const currentWeightEl = document.getElementById('currentWeight');
                const currentBMIEl = document.getElementById('currentBMI');

                if (currentWeightEl) currentWeightEl.textContent = weight ? `${weight} kg` : '-- kg';
                if (currentBMIEl) currentBMIEl.textContent = bmi ? `${bmi} (${getBMICategory(bmi)})` : '--';
            }
            renderWeightBMI();

            // prepopulate modal with existing values
            const logWeightModal = document.getElementById('logWeightModal');
            if (logWeightModal) {
                logWeightModal.addEventListener('click', function() {}); // dummy to prevent bubbling
            }

            // open modal — prepopulate fields
            const fabLogWeight = document.querySelector('.fab-menu-item:nth-child(2)');
            if (fabLogWeight) {
                fabLogWeight.addEventListener('click', function() {
                    document.getElementById('inputWeight').value = latestLog?.weight || userData.weight || '';
                    document.getElementById('inputHeight').value = userData.height || '';
                    updateBMIPreview();
                    openModal('logWeightModal');
                });
            }

            // live BMI preview as user types
            function updateBMIPreview() {
                const w = +document.getElementById('inputWeight').value;
                const h = +document.getElementById('inputHeight').value;
                const bmi = calculateBMI(w, h);
                const bmiPreview = document.getElementById('bmiPreview');
                const bmiCategory = document.getElementById('bmiCategory');
                if (bmi) {
                    bmiPreview.textContent = bmi;
                    bmiCategory.textContent = getBMICategory(bmi);
                } else {
                    bmiPreview.textContent = '--';
                    bmiCategory.textContent = 'Enter weight and height';
                }
            }

            document.getElementById('inputWeight').addEventListener('input', updateBMIPreview);
            document.getElementById('inputHeight').addEventListener('input', updateBMIPreview);

            // save weight log
            const saveWeightBtn = document.getElementById('saveWeightBtn');
            if (saveWeightBtn) {
                saveWeightBtn.addEventListener('click', async function() {
                    const weight = +document.getElementById('inputWeight').value;
                    const height = +document.getElementById('inputHeight').value;

                    if (!weight) { showToast('Please enter your weight!', 'error'); return; }
                    if (!height) { showToast('Please enter your height!', 'error'); return; }

                    // log weight by date!!
                    await logWeight(uid, weight);

                    // save height to profile too!!
                    userData.height = height;
                    await saveUserProfile(uid, userData);

                    // update display
                    latestLog = { weight, date: new Date().toISOString().split('T')[0] };
                    renderWeightBMI();

                    closeModal('logWeightModal');
                    showToast('Weight logged successfully!');
                });
            }
        } 

        // ════════════════════════════════════════════════════
        //  ELEMENTS IN SETTINGS PAGE — profile-settings.html
        // ════════════════════════════════════════════════════
        if (isSettingsPage) {

            // Hero Section ════════════════════════════════════════════════════
            function updateHero() {
                const nameEl = document.getElementById('displayFullName');
                const emailEl = document.getElementById('displayEmail');
                const sidebarEl = document.getElementById('sidebarName');
                if (nameEl) nameEl.textContent = userData.fullName;
                if (emailEl) emailEl.textContent = userData.email;
                if (sidebarEl) sidebarEl.textContent = userData.fullName;
            }

            // Showing Chosen Section ════════════════════════════════════════════════════
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
            window.showSection = showSection;

            document.querySelectorAll('#settingsDropdown a[data-section]').forEach(function (link) {
                link.addEventListener('click', function (e) {
                    e.preventDefault();
                    showSection(link.dataset.section);
                });
            });

            const params = new URLSearchParams(window.location.search);
            const sectionParam = params.get('section');
            if (sectionParam) {
                showSection(sectionParam);
            } else {
                showSection('profileSection');
            }

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

            // Personal Information Section ═════════════════════════════════════════════════
            function populateForm() {
                const fn = document.getElementById('fullName');
                const email = document.getElementById('email');
                const age = document.getElementById('age');
                const height = document.getElementById('height');
                const weight = document.getElementById('weight');
                if (fn) fn.value = userData.fullName;
                if (email) email.value = userData.email;
                if (age) age.value = userData.age || '';
                if (height) height.value = userData.height || '';
                if (weight) weight.value = userData.weight || '';
            }
            populateForm();

            const profileDetailsForm = document.getElementById('profileDetailsForm');

            profileDetailsForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                userData.fullName = document.getElementById('fullName').value.trim();
                userData.age = document.getElementById('age').value;
                userData.height = document.getElementById('height').value;
                userData.weight = document.getElementById('weight').value;
                await saveUserProfile(uid, userData);
                updateHero();
                showToast('Profile updated successfully!');
            });

            // Privacy Settings Section ════════════════════════════════════════════════════
            let privacySettings = await loadPrivacySettings(uid) || {
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

            const savePrivacyBtn = document.getElementById('savePrivacyBtn');
            if (savePrivacyBtn) {
                savePrivacyBtn.addEventListener('click', async function () {
                    privacySettings.profileVisibility = document.getElementById('profileVisibility').checked;
                    privacySettings.dataSharing = document.getElementById('dataSharing').checked;
                    privacySettings.locationTracking = document.getElementById('locationTracking').checked;
                    privacySettings.googleHealth = document.getElementById('googleHealth').checked;
                    await savePrivacySettings(uid, privacySettings);
                    showToast('Privacy settings saved!');
                });
            }

            // Password & Security Section ═══════════════════════════════════════════════════
            const changePasswordForm = document.getElementById('changePasswordForm');
            if (changePasswordForm) {

                const googleAuthMsg = document.getElementById('googleAuthMsg');
                const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com');
                    
                // Check if user is signed in with Google
                if (isGoogleUser) {
                    // The form is hidden, a message is shown instead
                    changePasswordForm.style.display = 'none';
                    if (googleAuthMsg) googleAuthMsg.style.display = 'block';
                } else {
                    // For email/password users
                    changePasswordForm.addEventListener('submit', async function (e) {
                        e.preventDefault();
                        const currentPass = document.getElementById('currentPassword').value;
                        const newPass = document.getElementById('newPassword').value;
                        const confirmPass = document.getElementById('confirmNewPassword').value;

                        if (!currentPass) { showToast('Please enter your current password.', 'error'); return; }
                        if (newPass.length < 6) { showToast('New password must be at least 6 characters.', 'error'); return; }
                        if (newPass !== confirmPass) { showToast('New passwords do not match!', 'error'); return; }

                        // TODO: Merge with Yana's branch email auth
                        try {
                            const credential = EmailAuthProvider.credential(user.email, currentPass);
                            await reauthenticateWithCredential(user, credential);
                            await updatePassword(user, newPass);
                            showToast('Password updated successfully!');
                            changePasswordForm.reset();
                        } catch (err) {
                            if (err.code === 'auth/wrong-password') {
                                showToast('Current password is incorrect!', 'error');
                            } else {
                                showToast('Something went wrong. Try again!', 'error');
                            }
                        }
                    });
                }
            }

            // Deactivate Account ═══════════════════════════════════════════════════════════
            const deactivateBtn = document.getElementById('deactivateBtn');
            if (deactivateBtn) {
                deactivateBtn.addEventListener('click', function () {
                    openModal('deactivateModalOverlay');
                });
            }

            const confirmDeactivateBtn = document.getElementById('confirmDeactivateBtn');
            if (confirmDeactivateBtn) {
                confirmDeactivateBtn.addEventListener('click', async function () {

                    await saveUserProfile(uid, { ...userData, isDeactivated: true });
                    closeModal('deactivateModalOverlay');
                    showToast('Account deactivated. Redirecting...', 'warn');
                    await signOut(auth);
                    setTimeout(async function () {
                        window.location.href = 'index.html';
                    }, 2000);
                });
            }

            // Delete Account ═══════════════════════════════════════════════════════════════
            const deleteAccountBtn = document.getElementById('deleteAccountBtn');
            if (deleteAccountBtn) {
                deleteAccountBtn.addEventListener('click', function () {
                    document.getElementById('deleteConfirmInput').value = '';
                    openModal('deleteModalOverlay');
                });
            }

            const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
            console.log('confirmDeleteBtn found:', confirmDeleteBtn); // check if button is found!!

            if (confirmDeleteBtn) {
                confirmDeleteBtn.addEventListener('click', async function () {
                    console.log('delete button clicked!!'); // check if click fires!!
                    const val = document.getElementById('deleteConfirmInput').value.trim();
                    console.log('val typed:', val); // check what value is read!!
                    
                    if (val !== 'DELETE') {
                        showToast('Please type DELETE to confirm.', 'error');
                        return;
                    }

                    try {
                        console.log('attempting delete...');
                        
                        // reauthenticate with google first!!
                        const provider = new GoogleAuthProvider();
                        await reauthenticateWithPopup(user, provider);
                        
                        await deleteUserDocument(uid);
                        console.log('firestore deleted!!');
                        await deleteUser(user);
                        console.log('auth deleted!!');
                        
                        closeModal('deleteModalOverlay');
                        showToast('Account deleted. Redirecting...', 'warn');
                        setTimeout(async function () {
                            window.location.href = 'index.html';
                        }, 2000);
                    } catch (err) {
                        console.log('error!!', err);
                        if (err.code === 'auth/requires-recent-login') {
                            showToast('Please sign in again before deleting your account.', 'error');
                        } else if (err.code === 'auth/popup-closed-by-user') {
                            showToast('Reauthentication cancelled.', 'error');
                        } else {
                            showToast('Something went wrong. Try again!', 'error');
                        }
                    }
                });
            }

            // Report a Problem/ Feedback Section ═══════════════════════════════════════════
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

            const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');

            submitFeedbackBtn.addEventListener('click', async function () {
                const text = document.getElementById('feedbackText').value.trim();
                if (!selectedRating && !text) {
                    showToast('Please add a rating or a message before submitting.', 'error');
                    return;
                }

                await submitFeedback(uid, { rating: selectedRating, text });

                document.getElementById('feedbackText').value = '';
                selectedRating = 0;
                stars.forEach(function (s) { s.classList.remove('active', 'hover'); });
                showToast('Thanks for your feedback!');
            });            
        }
    });
});

// BAWAH NI BELUM MASUK FIREBASE
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

window.openModal = openModal;
window.closeModal = closeModal;

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
