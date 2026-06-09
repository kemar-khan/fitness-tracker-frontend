'use strict';

import { db, auth } from './firebase-config.js';
import { loadGoals } from './firestore-data.js';

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    setDoc,
    deleteDoc,
    updateDoc,
    doc,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { ACTIVITY_TYPES, MET_VALUES, ACTIVITY_ICONS, ACTIVITY_EMOJIS, LEGACY_TYPE_MAP, STEPS_PLACEHOLDERS } from './activity-config.js';
import { toast } from './toast.js';

document.addEventListener('DOMContentLoaded', async function () {
    const uid = await new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                resolve(user.uid);
            } else {
                window.location.href = "login.html";
            }
        });
    });

    const activityFeed = document.getElementById('activityFeed');
    const addLogForm = document.getElementById('addLogForm');
    const activityTypeSelect = document.getElementById('activityType');
    const stepsInput = document.getElementById('steps');
    const durationInput = document.getElementById('duration');
    const caloriesBurnedInput = document.getElementById('caloriesBurned');

    const addLogModal = document.getElementById('addLogModal');
    const openAddLogModal = document.getElementById('openAddLogModal');
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');

    let logs = [];
    let goalsData = await loadGoals(uid) || {
    dailySteps: 0,
    weeklyWorkouts: 0
};
let stepsGoalNotified = false;

    function getUserWeight() {
        const userData = JSON.parse(localStorage.getItem('userData')) || {};
        return parseFloat(userData.weight) || 70; // default 70 kg if not set
    }

    function calculateCalories(activityType, durationMin) {
        const met = MET_VALUES[activityType] || 4;
        const weight = getUserWeight();
        const hours = durationMin / 60;
        return Math.round(met * weight * hours);
    }

    function updateCaloriesEstimate() {
        const type = activityTypeSelect?.value || 'Workout';
        const dur = parseInt(durationInput?.value) || 0;
        if (dur > 0 && caloriesBurnedInput) {
            caloriesBurnedInput.value = calculateCalories(type, dur);
        }
    }

    // Update the steps input placeholder to match the selected activity type.
    function updateStepsPlaceholder() {
        if (!stepsInput) return;
        const type = activityTypeSelect?.value || 'Workout';
        stepsInput.placeholder = STEPS_PLACEHOLDERS[type] || STEPS_PLACEHOLDERS._default;
    }

    // Populate both the form's category select and the filter select from ACTIVITY_TYPES.
    // Centralising this here means adding a new activity type only requires editing activity-config.js.
    function populateActivityDropdowns() {
        if (activityTypeSelect) {
            activityTypeSelect.innerHTML = ACTIVITY_TYPES.map(type =>
                `<option value="${type}">${type}</option>`
            ).join('');
        }

        const filterTypeEl = document.getElementById('filterType');
        if (filterTypeEl) {
            filterTypeEl.innerHTML =
                `<option value="All">All Activities</option>` +
                ACTIVITY_TYPES.map(type =>
                    `<option value="${type}">${type}</option>`
                ).join('');
        }

        // Set the initial placeholder to match whichever type is selected first
        updateStepsPlaceholder();
    }

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
    async function createDailyStepsGoalNotification(totalSteps) {
    const today = new Date().toISOString().split('T')[0];
    const achievementId = `dailySteps_${today}`;

    const achievementRef = doc(db, "users", uid, "goalAchievements", achievementId);
    const achievementSnap = await getDoc(achievementRef);

    if (achievementSnap.exists()) {
        return;
    }

    await createNotification(
        uid,
        "achievement",
        "Daily Steps Goal Achieved",
        `You have reached your daily steps goal of ${goalsData.dailySteps.toLocaleString()} steps.`
    );
    
    if (typeof toast !== 'undefined') {
        toast.success(`You've reached your daily steps goal!`);
    }

    await setDoc(achievementRef, {
        type: "dailySteps",
        date: today,
        goal: goalsData.dailySteps,
        actual: totalSteps,
        createdAt: serverTimestamp()
    });
}
    async function getActivitiesFromFirestore(uid) {
        const snapshot = await getDocs(collection(db, "users", uid, "activities"));

        return snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        }));
    }
    function isWorkoutActivity(type) {
    if (!type) return false;

    const normalizedType = type.toLowerCase();

    return normalizedType !== 'steps' && normalizedType !== 'other';
}

    function calculateWorkoutStreak(logs) {
        const workoutDates = [...new Set(
            logs
                .filter(log => {
                    const type = log.type || log.category;
                    return isWorkoutActivity(type) && log.date;
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
            updateStepsPlaceholder(); // reset placeholder after form.reset() clears the select
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
            updateStepsPlaceholder();
            updateCaloriesEstimate();
        });
    }

    durationInput?.addEventListener('input', updateCaloriesEstimate);

    function renderLogs() {
        if (!activityFeed) return;

        activityFeed.innerHTML = '';

        const filteredLogs = applyFilters(logs).sort((a, b) => {
            if (b.date !== a.date) return b.date.localeCompare(a.date);
            return (b.time || '').localeCompare(a.time || '');
        });

        if (filteredLogs.length === 0) {
            activityFeed.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-calendar-x"></i>
                    <p>No activity logs found for these filters.</p>
                </div>
            `;
            updateStats(0, 0, 0, 0);
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
                        <span class="activity-type-badge">${ACTIVITY_EMOJIS[logType] ? ACTIVITY_EMOJIS[logType] + ' ' : ''}${logType}</span>
                    </div>
                    <div class="activity-stats">
                        <div class="stat-item"><i class="bi bi-clock"></i> ${log.duration} min</div>
                        ${log.steps && log.steps !== '--' ? `<div class="stat-item"><i class="bi bi-footprints"></i> ${log.steps} steps</div>` : ''}
                        ${log.caloriesBurned ? `<div class="stat-item">🔥 ${log.caloriesBurned} kcal</div>` : ''}
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
        const today = new Date().toISOString().split('T')[0];

const totalSteps = logs
    .filter(l => l.date === today)
    .reduce((sum, l) => sum + (parseInt(l.steps) || 0), 0);

if (goalsData.dailySteps > 0 && totalSteps >= goalsData.dailySteps) {
    createDailyStepsGoalNotification(totalSteps);
}
        const totalCalories = logs.reduce((sum, l) => sum + (parseInt(l.caloriesBurned) || 0), 0);

        // Cache total for dashboard to read
        localStorage.setItem('fitpulseTotalCaloriesBurned', totalCalories);

        updateStats(logs.length, totalDuration, totalSteps, totalCalories);
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

    function updateStats(count, duration, steps, calories = 0) {
        setStat('statTotalLogs', count);
        setStat('statTotalDuration', duration);
        setStat('statTotalSteps', steps.toLocaleString());
        setStat('statTotalCalories', calories);
    }

    function setStat(id, val) {
        const el = document.getElementById(id);

        if (!el) return;

        if (id === 'statTotalDuration') {
            el.innerHTML = `${val} <small style="font-size: 1rem">min</small>`;
        } else if (id === 'statTotalCalories') {
            el.innerHTML = `${Number(val).toLocaleString()} <small style="font-size: 1rem">kcal</small>`;
        } else {
            el.textContent = val;
        }
    }

    function getIcon(type) {
        return ACTIVITY_ICONS[type] || 'bi-activity';
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
                steps: parseInt(document.getElementById('steps').value) || 0,
                caloriesBurned: parseInt(document.getElementById('caloriesBurned').value) || 0,
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

               if (isWorkoutActivity(logData.category || logData.type)) {
                    await createNotification(
                        uid,
                        'workout',
                        'Workout Logged',
                        `${logData.activityName} has been added successfully.`
                    );
                    
                    if (typeof toast !== 'undefined') {
                        toast.success(`${logData.activityName} added successfully!`);
                    }

                    const latestLogs = await getActivitiesFromFirestore(uid);
                    const streak = calculateWorkoutStreak(latestLogs);

                    console.log("Workout streak:", streak);

                    if (streak >= 7) {
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

        const rawType = log.category || log.type || 'Workout';
        // Map legacy types to their modern equivalent so the dropdown always resolves
        const actType = LEGACY_TYPE_MAP[rawType] || rawType;

        document.getElementById('modalTitle').textContent = 'Edit Activity';
        document.getElementById('activityName').value = log.activityName || log.name || '';
        document.getElementById('activityType').value = actType;
        document.getElementById('duration').value = log.duration || '';
        // Show positive step counts; leave blank for 0 / '--' / missing values
        const savedSteps = parseInt(log.steps);
        document.getElementById('steps').value = savedSteps > 0 ? savedSteps : '';
        document.getElementById('date').value = log.date || '';
        document.getElementById('time').value = log.time || '';
        document.getElementById('notes').value = log.notes || '';
        document.getElementById('caloriesBurned').value = log.caloriesBurned || 0;
        document.getElementById('editingId').value = log.id;

        updateStepsPlaceholder(); // reflect the loaded activity type in the placeholder
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

    populateActivityDropdowns();
    listenToActivities();
});