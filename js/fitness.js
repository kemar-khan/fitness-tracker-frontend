/* ═══════════════════════════════════════════════════════════════
   FitPulse — Fitness Tracker Logic
   High-Contrast Lime & Black Edition
   ═══════════════════════════════════════════════════════════════ */

'use strict';
import './auth.js';
import { getStoredUid, loadFitnessLogs, saveFitnessLogs } from './firestore-data.js';

document.addEventListener('DOMContentLoaded', async function () {
    const uid = getStoredUid();
    const activityFeed = document.getElementById('activityFeed');
    const addLogForm = document.getElementById('addLogForm');
    const activityTypeSelect = document.getElementById('activityType');
    const stepsField = document.getElementById('stepsField');
    
    // Modal Elements
    const addLogModal = document.getElementById('addLogModal');
    const openAddLogModal = document.getElementById('openAddLogModal');
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');

    // Initial dummy data
    const dummyLogs = [
        { id: 1, date: '2024-03-12', time: '18:30', name: 'Evening Run', type: 'Workout', duration: 45, steps: 8240, notes: 'Feeling strong. Pushed the last 1km.' },
        { id: 2, date: '2024-03-10', time: '10:00', name: 'Strength Training', type: 'Workout', duration: 60, steps: 1200, notes: 'New PR on bench press!' },
        { id: 3, date: '2024-03-09', time: '07:15', name: 'Morning Walk', type: 'Steps', duration: 30, steps: 4500, notes: 'Crisp morning air.' }
    ];

    let logs = JSON.parse(localStorage.getItem('fitnessLogs')) || dummyLogs;

    try {
        const cloudLogs = await loadFitnessLogs(uid);
        if (cloudLogs.length > 0) {
            logs = cloudLogs;
            localStorage.setItem('fitnessLogs', JSON.stringify(logs));
        }
    } catch (error) {
        console.error('Unable to load fitness logs from Firestore:', error);
    }

    function persistLogs() {
        localStorage.setItem('fitnessLogs', JSON.stringify(logs));
        saveFitnessLogs(uid, logs).catch((error) => {
            console.error('Unable to save fitness logs to Firestore:', error);
        });
    }

    // ── MODAL CONTROL ──────────────────────────────────────────
    if (openAddLogModal) {
        openAddLogModal.addEventListener('click', () => {
            document.getElementById('modalTitle').textContent = 'Log Activity';
            addLogForm.reset();
            document.getElementById('editingId').value = '';
            addLogModal.style.display = 'flex';
        });
    }

    const close = () => { addLogModal.style.display = 'none'; };
    if (closeModal) closeModal.addEventListener('click', close);
    if (cancelBtn) cancelBtn.addEventListener('click', close);

    if (activityTypeSelect) {
        activityTypeSelect.addEventListener('change', function () {
            stepsField.style.display = this.value === 'Steps' ? 'block' : 'none';
        });
    }

    // ── RENDERING ──────────────────────────────────────────────
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
            card.innerHTML = `
                <div class="activity-icon">
                    <i class="bi ${getIcon(log.type)}"></i>
                </div>
                <div class="activity-body">
                    <div class="activity-header">
                        <div class="activity-name">${log.name}</div>
                        <span class="activity-type-badge">${log.type}</span>
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
                            <button class="btn-small" onclick="window.editLog(${log.id})"><i class="bi bi-pencil"></i></button>
                            <button class="btn-small danger" onclick="window.deleteLog(${log.id})"><i class="bi bi-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
            activityFeed.appendChild(card);
        });

        // Update overall stats based on ALL logs (or filtered?) - usually dashboard/summary shows all or week
        const totalDuration = logs.reduce((sum, l) => sum + (parseInt(l.duration) || 0), 0);
        const totalSteps = logs.reduce((sum, l) => sum + (parseInt(l.steps) || 0), 0);
        updateStats(logs.length, totalDuration, totalSteps);
    }

    function applyFilters(data) {
        const from = document.getElementById('filterFrom').value;
        const to = document.getElementById('filterTo').value;
        const type = document.getElementById('filterType').value;

        return data.filter(log => {
            const dateMatch = (!from || log.date >= from) && (!to || log.date <= to);
            const typeMatch = (type === 'All' || log.type === type);
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
        if (el) {
            if (id === 'statTotalDuration') el.innerHTML = `${val} <small style="font-size: 1rem">min</small>`;
            else el.textContent = val;
        }
    }

    function getIcon(type) {
        if (type === 'Workout') return 'bi-lightning-charge';
        if (type === 'Steps') return 'bi-walking';
        return 'bi-activity';
    }

    function formatDate(dateStr) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateStr).toLocaleDateString(undefined, options);
    }

    // ── FORM SUBMISSION ────────────────────────────────────────
    if (addLogForm) {
        addLogForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const editId = document.getElementById('editingId').value;

            const logData = {
                id: editId ? parseInt(editId) : Date.now(),
                name: document.getElementById('activityName').value,
                type: document.getElementById('activityType').value,
                duration: parseInt(document.getElementById('duration').value),
                steps: document.getElementById('steps').value || '--',
                date: document.getElementById('date').value,
                time: document.getElementById('time').value,
                notes: document.getElementById('notes').value
            };

            if (editId) {
                logs = logs.map(l => l.id === logData.id ? logData : l);
            } else {
                logs.unshift(logData);
            }

            persistLogs();
            renderLogs();
            close();
            window.dispatchEvent(new Event('logsUpdated'));
        });
    }

    // ── GLOBAL ACTIONS ──────────────────────────────────────────
    window.editLog = function (id) {
        const log = logs.find(l => l.id === id);
        if (!log) return;

        document.getElementById('modalTitle').textContent = 'Edit Activity';
        document.getElementById('activityName').value = log.name;
        document.getElementById('activityType').value = log.type;
        document.getElementById('duration').value = log.duration;
        document.getElementById('steps').value = log.steps === '--' ? '' : log.steps;
        document.getElementById('date').value = log.date;
        document.getElementById('time').value = log.time;
        document.getElementById('notes').value = log.notes || '';
        document.getElementById('editingId').value = log.id;

        stepsField.style.display = log.type === 'Steps' ? 'block' : 'none';
        addLogModal.style.display = 'flex';
    };

    window.deleteLog = function (id) {
        if (confirm('Delete this activity log?')) {
            logs = logs.filter(l => l.id !== id);
            persistLogs();
            renderLogs();
            window.dispatchEvent(new Event('logsUpdated'));
        }
    };

    // Initial render
    renderLogs();
});