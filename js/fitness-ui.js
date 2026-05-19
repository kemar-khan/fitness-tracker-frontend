/**
 * FitPulse — Fitness Tracker UI Controller
 * Orchestrates Firebase integration, Real-time updates, and UI rendering.
 */

import { monitorAuth } from '../firebase/auth.js';
import { subscribeToActivities, addActivity, updateActivity, deleteActivity } from '../firebase/fitness-service.js';
import { modalManager } from './modal.js';
import { filterManager } from './filters.js';
import { toast } from './toast.js';

let currentUser = null;
let allActivities = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Guard & Real-time Subscription
    monitorAuth((user) => {
        currentUser = user;
        setupRealtimeSubscription(user.uid);
    });

    // 2. Initialize UI Components
    modalManager.init();
    setupEventListeners();
});

function setupRealtimeSubscription(uid) {
    subscribeToActivities(uid, (data) => {
        allActivities = data;
        renderUI();
    }, (error) => {
        toast.error('Failed to sync activities. Please check your connection.');
    });
}

function setupEventListeners() {
    // Modal Open
    document.getElementById('openAddLogModal')?.addEventListener('click', () => modalManager.open());

    // Modal Close/Cancel
    document.getElementById('closeModal')?.addEventListener('click', () => modalManager.close());
    document.getElementById('cancelBtn')?.addEventListener('click', () => modalManager.close());

    // Form Submission
    document.getElementById('addLogForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('editingId').value;
        
        const activityData = {
            activityName: document.getElementById('activityName').value,
            category: document.getElementById('activityType').value,
            duration: parseInt(document.getElementById('duration').value),
            steps: document.getElementById('steps').value || '--',
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            notes: document.getElementById('notes').value
        };

        try {
            if (editId) {
                await updateActivity(currentUser.uid, editId, activityData);
                toast.success('Activity updated successfully!');
            } else {
                await addActivity(currentUser.uid, activityData);
                toast.success('Activity logged successfully!');
            }
            modalManager.close();
        } catch (error) {
            console.error("Error saving activity:", error);
            toast.error('Failed to save activity.');
        }
    });

    // Filters
    document.getElementById('applyFilters')?.addEventListener('click', renderUI);
}

function renderUI() {
    const filters = filterManager.getFilters();
    const filteredData = filterManager.apply(allActivities, filters);
    
    updateSummaryCards(filteredData);
    renderActivityFeed(filteredData);
}

function updateSummaryCards(data) {
    const totalLogs = data.length;
    const totalDuration = data.reduce((sum, item) => sum + (parseInt(item.duration) || 0), 0);
    const totalSteps = data.reduce((sum, item) => {
        const steps = parseInt(item.steps);
        return isNaN(steps) ? sum : sum + steps;
    }, 0);

    setStatValue('statTotalLogs', totalLogs);
    setStatValue('statTotalDuration', totalDuration, true);
    setStatValue('statTotalSteps', totalSteps.toLocaleString());
}

function setStatValue(id, value, isDuration = false) {
    const el = document.getElementById(id);
    if (!el) return;
    if (isDuration) {
        el.innerHTML = `${value} <small style="font-size: 1rem">min</small>`;
    } else {
        el.textContent = value;
    }
}

function renderActivityFeed(data) {
    const feed = document.getElementById('activityFeed');
    if (!feed) return;

    if (data.length === 0) {
        feed.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-calendar-x"></i>
                <p>No activity logs found. Try adjusting your filters or log a new workout!</p>
            </div>
        `;
        return;
    }

    feed.innerHTML = '';
    data.forEach(activity => {
        const card = document.createElement('div');
        card.className = 'activity-card fade-in';
        card.innerHTML = `
            <div class="activity-icon">
                <i class="bi ${getIcon(activity.category)}"></i>
            </div>
            <div class="activity-body">
                <div class="activity-header">
                    <div class="activity-name">${activity.activityName}</div>
                    <span class="activity-type-badge">${activity.category}</span>
                </div>
                <div class="activity-stats">
                    <div class="stat-item"><i class="bi bi-clock"></i> ${activity.duration} min</div>
                    ${activity.steps !== '--' ? `<div class="stat-item"><i class="bi bi-footprints"></i> ${activity.steps} steps</div>` : ''}
                    <div class="stat-item"><i class="bi bi-calendar3"></i> ${formatDate(activity.date)}</div>
                </div>
                ${activity.notes ? `<div class="activity-notes">${activity.notes}</div>` : ''}
                <div class="activity-footer">
                    <span class="activity-time">${activity.time}</span>
                    <div class="activity-actions">
                        <button class="btn-edit btn-small" data-id="${activity.id}"><i class="bi bi-pencil"></i></button>
                        <button class="btn-delete btn-small danger" data-id="${activity.id}"><i class="bi bi-trash"></i></button>
                    </div>
                </div>
            </div>
        `;

        // Attach event listeners to buttons
        card.querySelector('.btn-edit').addEventListener('click', () => modalManager.open(activity));
        card.querySelector('.btn-delete').addEventListener('click', () => handleDelete(activity.id));

        feed.appendChild(card);
    });
}

async function handleDelete(id) {
    if (confirm('Are you sure you want to delete this activity?')) {
        try {
            await deleteActivity(currentUser.uid, id);
            toast.success('Activity deleted.');
        } catch (error) {
            console.error("Error deleting activity:", error);
            toast.error('Failed to delete activity.');
        }
    }
}

function getIcon(category) {
    switch (category) {
        case 'Workout': return 'bi-lightning-charge';
        case 'Steps': return 'bi-walking';
        default: return 'bi-activity';
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
}
