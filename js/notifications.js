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

const INITIAL_REMINDERS = [
    { id: 'r1', title: 'Morning Workout', category: 'workout', time: '06:30', frequency: 'weekdays', active: true },
    { id: 'r2', title: 'Drink Water', category: 'hydration', time: '10:00', frequency: 'daily', active: true },
    { id: 'r3', title: 'Sleep Routine', category: 'sleep', time: '22:00', frequency: 'daily', active: false }
];

/* ── STATE ────────────────────────────────────────────────────── */
let notifications = [...INITIAL_NOTIFICATIONS];
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
    listenToReminders();
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
window.toggleRead = (id) => {
    notifications = notifications.map(n => n.id === id ? { ...n, unread: !n.unread } : n);
    renderNotifications();
};

window.deleteNotification = (id) => {
    notifications = notifications.filter(n => n.id !== id);
    renderNotifications();
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
        time: document.getElementById('remTime').value,
        frequency: document.getElementById('remFrequency').value,
        active: true,
        updatedAt: serverTimestamp()
    };

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