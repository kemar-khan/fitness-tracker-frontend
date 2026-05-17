'use strict';

import { db, auth } from './firebase-config.js';

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    doc,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', async function () {
    const uid = await new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                resolve(user.uid);
            } else {
                window.location.href = "index.html";
            }
        });
    });

    const activityFeed = document.getElementById('activityFeed');
    const addLogForm = document.getElementById('addLogForm');
    const activityTypeSelect = document.getElementById('activityType');
    const stepsField = document.getElementById('stepsField');

    const addLogModal = document.getElementById('addLogModal');
    const openAddLogModal = document.getElementById('openAddLogModal');
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');

    let logs = [];

    function listenToActivities() {
        const ref = collection(db, "users", uid, "activities");

        onSnapshot(ref, (snapshot) => {
            logs = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            }));

            renderLogs();
        });
    }

    async function createNotification(uid, type, title, message) {
        if (!uid) return;

        await addDoc(collection(db, "users", uid, "notifications"), {
            type,
            title,
            message,
            time: "Just now",
            unread: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }

    async function getActivitiesFromFirestore(uid) {
        const snapshot = await getDocs(collection(db, "users", uid, "activities"));

        return snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        }));
    }

    function calculateWorkoutStreak(logs) {
        const workoutDates = [...new Set(
            logs
                .filter(log => {
                    const type = log.type || log.category;
                    return type && type.toLowerCase() === 'workout' && log.date;
                })
                .map(log => log.date)
        )].sort((a, b) => b.localeCompare(a));

        if (workoutDates.length === 0) return 0;

        let streak = 1;
        let latestDate = workoutDates[0];

        for (let i = 1; i < workoutDates.length; i++) {
            const [year, month, day] = latestDate.split('-').map(Number);
            const expectedDate = new Date(Date.UTC(year, month - 1, day));
            expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);

            const expectedDateString = expectedDate.toISOString().split('T')[0];

            if (workoutDates.includes(expectedDateString)) {
                streak++;
                latestDate = expectedDateString;
            } else {
                break;
            }
        }

        return streak;
    }

    if (openAddLogModal) {
        openAddLogModal.addEventListener('click', () => {
            document.getElementById('modalTitle').textContent = 'Log Activity';
            addLogForm.reset();
            document.getElementById('editingId').value = '';
            addLogModal.style.display = 'flex';
        });
    }

    const close = () => {
        addLogModal.style.display = 'none';
    };

    if (closeModal) closeModal.addEventListener('click', close);
    if (cancelBtn) cancelBtn.addEventListener('click', close);

    if (activityTypeSelect) {
        activityTypeSelect.addEventListener('change', function () {
            stepsField.style.display = this.value === 'Steps' ? 'block' : 'none';
        });
    }

    function renderLogs() {
        if (!activityFeed) return;

        activityFeed.innerHTML = '';

        const filteredLogs = applyFilters(logs);

        if (filteredLogs.length === 0) {
            activityFeed.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-calendar-x"></i>
                    <p>No activity logs found for these filters.</p>
                </div>
            `;
            updateStats(0, 0, 0);
            return;
        }

        filteredLogs.forEach(log => {
            const card = document.createElement('div');
            card.className = 'activity-card';

            const logName = log.activityName || log.name || 'Activity';
            const logType = log.category || log.type || 'Workout';

            card.innerHTML = `
                <div class="activity-icon">
                    <i class="bi ${getIcon(logType)}"></i>
                </div>
                <div class="activity-body">
                    <div class="activity-header">
                        <div class="activity-name">${logName}</div>
                        <span class="activity-type-badge">${logType}</span>
                    </div>
                    <div class="activity-stats">
                        <div class="stat-item"><i class="bi bi-clock"></i> ${log.duration} min</div>
                        ${log.steps !== '--' ? `<div class="stat-item"><i class="bi bi-footprints"></i> ${log.steps} steps</div>` : ''}
                        <div class="stat-item"><i class="bi bi-calendar3"></i> ${formatDate(log.date)}</div>
                    </div>
                    ${log.notes ? `<div class="activity-notes">${log.notes}</div>` : ''}
                    <div class="activity-footer">
                        <span class="activity-time">${log.time}</span>
                        <div class="activity-actions">
                            <button class="btn-small" onclick="window.editLog('${log.id}')"><i class="bi bi-pencil"></i></button>
                            <button class="btn-small danger" onclick="window.deleteLog('${log.id}')"><i class="bi bi-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;

            activityFeed.appendChild(card);
        });

        const totalDuration = logs.reduce((sum, l) => sum + (parseInt(l.duration) || 0), 0);
        const totalSteps = logs.reduce((sum, l) => sum + (parseInt(l.steps) || 0), 0);

        updateStats(logs.length, totalDuration, totalSteps);
    }

    function applyFilters(data) {
        const from = document.getElementById('filterFrom')?.value || '';
        const to = document.getElementById('filterTo')?.value || '';
        const type = document.getElementById('filterType')?.value || 'All';

        return data.filter(log => {
            const logType = log.category || log.type;
            const dateMatch = (!from || log.date >= from) && (!to || log.date <= to);
            const typeMatch = (type === 'All' || logType === type);
            return dateMatch && typeMatch;
        });
    }

    document.getElementById('applyFilters')?.addEventListener('click', renderLogs);

    function updateStats(count, duration, steps) {
        setStat('statTotalLogs', count);
        setStat('statTotalDuration', duration);
        setStat('statTotalSteps', steps.toLocaleString());
    }

    function setStat(id, val) {
        const el = document.getElementById(id);

        if (!el) return;

        if (id === 'statTotalDuration') {
            el.innerHTML = `${val} <small style="font-size: 1rem">min</small>`;
        } else {
            el.textContent = val;
        }
    }

    function getIcon(type) {
        if (type === 'Workout') return 'bi-lightning-charge';
        if (type === 'Steps') return 'bi-walking';
        return 'bi-activity';
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateStr).toLocaleDateString(undefined, options);
    }

    if (addLogForm) {
        addLogForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const editId = document.getElementById('editingId').value;

            const logData = {
                activityName: document.getElementById('activityName').value,
                name: document.getElementById('activityName').value,
                category: document.getElementById('activityType').value,
                type: document.getElementById('activityType').value,
                duration: parseInt(document.getElementById('duration').value),
                steps: document.getElementById('steps').value || '--',
                date: document.getElementById('date').value,
                time: document.getElementById('time').value,
                notes: document.getElementById('notes').value,
                updatedAt: serverTimestamp()
            };

            if (editId) {
                await updateDoc(
                    doc(db, "users", uid, "activities", editId),
                    logData
                );
            } else {
                await addDoc(
                    collection(db, "users", uid, "activities"),
                    {
                        ...logData,
                        createdAt: serverTimestamp()
                    }
                );

                if ((logData.category || logData.type)?.toLowerCase() === 'workout') {
                    await createNotification(
                        uid,
                        'workout',
                        'Workout Logged',
                        `${logData.activityName} has been added successfully.`
                    );

                    const latestLogs = await getActivitiesFromFirestore(uid);
                    const streak = calculateWorkoutStreak(latestLogs);

                    console.log("Workout streak:", streak);

                    if (streak >= 3) {
                        await createNotification(
                            uid,
                            'achievement',
                            `${streak}-Day Workout Streak!`,
                            `You have stayed active for ${streak} consecutive days. Keep it up!`
                        );
                    }
                }
            }

            close();
            window.dispatchEvent(new Event('logsUpdated'));
        });
    }

    window.editLog = function (id) {
        const log = logs.find(l => l.id === id);
        if (!log) return;

        document.getElementById('modalTitle').textContent = 'Edit Activity';
        document.getElementById('activityName').value = log.activityName || log.name || '';
        document.getElementById('activityType').value = log.category || log.type || 'Workout';
        document.getElementById('duration').value = log.duration || '';
        document.getElementById('steps').value = log.steps === '--' ? '' : log.steps;
        document.getElementById('date').value = log.date || '';
        document.getElementById('time').value = log.time || '';
        document.getElementById('notes').value = log.notes || '';
        document.getElementById('editingId').value = log.id;

        stepsField.style.display = (log.category || log.type) === 'Steps' ? 'block' : 'none';
        addLogModal.style.display = 'flex';
    };

    window.deleteLog = async function (id) {
        if (confirm('Delete this activity log?')) {
            await deleteDoc(
                doc(db, "users", uid, "activities", id)
            );

            window.dispatchEvent(new Event('logsUpdated'));
        }
    };

    listenToActivities();
});