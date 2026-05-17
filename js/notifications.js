/* ═══════════════════════════════════════════════════════════════
   FitPulse — Simplified Notifications & Reminders Logic
   ═══════════════════════════════════════════════════════════════ */

'use strict';

import './auth.js';
import './auth.js';
import { auth, db } from './firebase-config.js';

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ── INITIAL DATA ────────────────────────────────────────────── */
const INITIAL_NOTIFICATIONS = [
    { id: 'n1', type: 'workout', title: 'Leg Day Tomorrow', message: 'Ready to crush your leg day? Session starts at 7:00 AM.', time: '2 min ago', unread: true },
    { id: 'n2', type: 'achievement', title: '5-Day Streak!', message: 'You have been consistent for 5 days. Keep it up!', time: '1 hr ago', unread: true },
    { id: 'n3', type: 'hydration', title: 'Water Goal', message: 'You have reached 80% of your daily water goal.', time: '3 hrs ago', unread: false },
    { id: 'n4', type: 'nutrition', title: 'Meal Logged', message: 'Dinner logged: 650 kcal. Balance is perfect.', time: 'Yesterday', unread: false }
];



/* ── STATE ────────────────────────────────────────────────────── */
let notifications = [];
let reminders = [];
let activeView = 'notifications';
let currentUserId = null;

/* ── DOM ELEMENTS ─────────────────────────────────────────────── */
const notifFeed = document.getElementById('notifFeed');
const remindersList = document.getElementById('remindersList');
const notifEmpty = document.getElementById('notifEmpty');
const remindersEmpty = document.getElementById('remindersEmpty');
const switchBtns = document.querySelectorAll('.switch-btn');
const sectionViews = document.querySelectorAll('.section-view');
const addReminderBtn = document.getElementById('addReminderBtn');
const reminderModal = document.getElementById('reminderModal');
const reminderForm = document.getElementById('reminderForm');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUserId = user.uid;
    listenToNotifications();
    listenToReminders();


    checkDueReminders();
});

/* ── VIEW SWITCHING ───────────────────────────────────────────── */
switchBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        activeView = view;

        // Update Buttons
        switchBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update Sections
        sectionViews.forEach(v => v.classList.remove('active'));
        document.getElementById(`${view}View`).classList.add('active');

        // Show/Hide Add Button
        addReminderBtn.style.display = view === 'reminders' ? 'flex' : 'none';

        render();
    });
});

/* ── RENDERING ────────────────────────────────────────────────── */
function render() {
    if (activeView === 'notifications') {
        renderNotifications();
    } else {
        renderReminders();
    }
}

function renderNotifications() {
    notifFeed.innerHTML = '';
    if (notifications.length === 0) {
        notifEmpty.style.display = 'block';
        return;
    }
    notifEmpty.style.display = 'none';

    notifications.forEach(n => {
        const card = document.createElement('div');
        card.className = `item-card ${n.unread ? 'unread-card' : ''}`;
        card.innerHTML = `
            <div class="item-icon">
                <i class="bi ${getIcon(n.type)}"></i>
            </div>
            <div class="item-body">
                <div class="item-title">${n.title}</div>
                <p class="item-desc">${n.message}</p>
                <div class="item-meta">
                    <span>${n.time}</span>
                    <span>•</span>
                    <span>${n.type}</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-small" onclick="toggleRead('${n.id}')" title="Mark as ${n.unread ? 'read' : 'unread'}">
                    <i class="bi ${n.unread ? 'bi-check' : 'bi-envelope'}"></i>
                </button>
                <button class="btn-small danger" onclick="deleteNotification('${n.id}')" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        notifFeed.appendChild(card);
    });
}

function renderReminders() {
    remindersList.innerHTML = '';
    if (reminders.length === 0) {
        remindersEmpty.style.display = 'block';
        return;
    }
    remindersEmpty.style.display = 'none';

    reminders.forEach(r => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div class="item-icon">
                <i class="bi ${getIcon(r.category)}"></i>
            </div>
            <div class="item-body">
                <div class="item-title">${r.title}</div>
                <div class="item-meta" style="color: var(--text-muted)">
                    <span><i class="bi bi-calendar"></i> ${r.date || 'No date'}</span>
                    <span>•</span>
                    <span><i class="bi bi-clock"></i> ${r.time}</span>
                    <span>•</span>
                    <span>${r.frequency}</span>
                </div>
            </div>
            <div class="item-actions">
                <label class="toggle-switch">
                    <input type="checkbox" ${r.active ? 'checked' : ''} onchange="toggleReminder('${r.id}')">
                    <span class="toggle-slider"></span>
                </label>
                <button class="btn-small" onclick="editReminder('${r.id}')" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn-small danger" onclick="deleteReminder('${r.id}')" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        remindersList.appendChild(card);
    });
}
function listenToNotifications() {
    const ref = collection(db, "users", currentUserId, "notifications");

    onSnapshot(ref, (snapshot) => {
        notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Sort newest first
        notifications.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
            return dateB - dateA;
        });

        // Update unread count badge
        updateNotificationCount();

        if (activeView === 'notifications') {
            renderNotifications();
        }
    });
}
function updateNotificationCount() {
    const count = notifications.filter(n => n.unread).length;
    const notifCount = document.getElementById("notifCount");

    if (notifCount) {
        notifCount.textContent = count;
        notifCount.style.display = count > 0 ? "inline-flex" : "none";
    }
}
async function checkDueReminders() {

    if (!currentUserId) return;

    const now = new Date();

    // Current date → YYYY-MM-DD
    const today = now.toLocaleDateString('en-CA');

    // Current time → HH:MM
    const currentTime = now.toTimeString().slice(0, 5);

    for (const reminder of reminders) {

        // Skip inactive reminders
        if (!reminder.active) continue;

        // Skip already triggered reminders
        if (reminder.triggered) continue;

        // Check date + time
        if (
            reminder.date === today &&
            reminder.time === currentTime
        ) {


            await addDoc(
                collection(db, "users", currentUserId, "notifications"),
                {
                    type: reminder.category,
                    title: "Reminder Due",
                    message: `Time for ${reminder.title}.`,
                    time: "Just now",
                    unread: true,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                }
            );


            await updateDoc(
                doc(db, "users", currentUserId, "reminders", reminder.id),
                {
                    triggered: true,
                    updatedAt: serverTimestamp()
                }
            );
        }
    }
}
setInterval(() => {
    checkDueReminders();
}, 60000);
function listenToReminders() {
    const ref = collection(db, "users", currentUserId, "reminders");

    onSnapshot(ref, (snapshot) => {
        reminders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        if (activeView === 'reminders') {
            renderReminders();
        }

        // Check due reminders after reminders are loaded
        checkDueReminders();
    });
}

function getIcon(type) {
    const icons = {
        workout: 'bi-lightning-charge',
        nutrition: 'bi-egg-fried',
        hydration: 'bi-droplet',
        achievement: 'bi-trophy',
        progress: 'bi-graph-up-arrow',
        sleep: 'bi-moon-stars'
    };
    return icons[type] || 'bi-bell';
}

/* ── ACTIONS ──────────────────────────────────────────────────── */
window.toggleRead = async (id) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification || !currentUserId) return;

    await updateDoc(
        doc(db, "users", currentUserId, "notifications", id),
        {
            unread: !notification.unread,
            updatedAt: serverTimestamp()
        }
    );
};;

window.deleteNotification = async (id) => {
    if (!currentUserId) return;

    await deleteDoc(
        doc(db, "users", currentUserId, "notifications", id)
    );
};

window.toggleReminder = async (id) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder || !currentUserId) return;

    await updateDoc(
        doc(db, "users", currentUserId, "reminders", id),
        {
            active: !reminder.active,
            updatedAt: serverTimestamp()
        }
    );
};

window.deleteReminder = async (id) => {
    if (!currentUserId) return;

    await deleteDoc(
        doc(db, "users", currentUserId, "reminders", id)
    );
};

/* ── MODAL LOGIC ──────────────────────────────────────────────── */
addReminderBtn.addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'Create Reminder';
    reminderForm.reset();
    document.getElementById('editingId').value = '';
    reminderModal.style.display = 'flex';
});

window.editReminder = (id) => {
    const r = reminders.find(rem => rem.id === id);
    if (!r) return;

    document.getElementById('modalTitle').textContent = 'Edit Reminder';
    document.getElementById('remTitle').value = r.title;
    document.getElementById('remCategory').value = r.category;
    document.getElementById('remDate').value = r.date || '';
    document.getElementById('remTime').value = r.time;
    document.getElementById('remFrequency').value = r.frequency;
    document.getElementById('editingId').value = r.id;

    reminderModal.style.display = 'flex';
};

const close = () => reminderModal.style.display = 'none';
closeModal.addEventListener('click', close);
cancelBtn.addEventListener('click', close);

reminderForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUserId) return;

    const id = document.getElementById('editingId').value;

    const data = {
        title: document.getElementById('remTitle').value,
        category: document.getElementById('remCategory').value,
        date: document.getElementById('remDate').value,
        time: document.getElementById('remTime').value,
        frequency: document.getElementById('remFrequency').value,
        active: true,
        triggered: false,
        updatedAt: serverTimestamp()
    };
    await addDoc(
        collection(db, "users", currentUserId, "notifications"),
        {
            type: data.category,
            title: "New Reminder Created",
            message: `${data.title} is scheduled on ${data.date} at ${data.time}.`,
            time: "Just now",
            unread: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }
    );

    if (id) {
        await updateDoc(
            doc(db, "users", currentUserId, "reminders", id),
            data
        );
    } else {
        await addDoc(
            collection(db, "users", currentUserId, "reminders"),
            {
                ...data,
                createdAt: serverTimestamp()
            }
        );
    }

    close();
});

/* ── INIT ─────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    renderNotifications();
});