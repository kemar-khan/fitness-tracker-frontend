/* ═══════════════════════════════════════════════════════════════
   FitPulse — Dashboard Logic
   High-Contrast Lime & Black Edition
   ═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
    const LIME = '#B4D400';
    const LIME_MUTED = 'rgba(180, 212, 0, 0.1)';
    const BLACK = '#000000';
    const TEXT_MUTED = '#888888';

    let activityChart, stepsChart;

    // Chart.js Global Settings
    Chart.defaults.font.family = "'DM Sans', sans-serif";
    Chart.defaults.color = TEXT_MUTED;
    Chart.defaults.borderColor = '#1a1a1a';

    function initCharts() {
        // 1. Weekly Activity Duration
        const activityCtx = document.getElementById('activityChart').getContext('2d');
        activityChart = new Chart(activityCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Minutes',
                    data: [45, 30, 60, 0, 45, 90, 20],
                    backgroundColor: LIME,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { 
                        backgroundColor: '#121212',
                        borderColor: '#1a1a1a',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        titleColor: LIME,
                        bodyColor: '#fff'
                    }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#1a1a1a' } },
                    x: { grid: { display: false } }
                }
            }
        });

        // 2. Steps Trend
        const stepsCtx = document.getElementById('stepsChart').getContext('2d');
        stepsChart = new Chart(stepsCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Steps',
                    data: [8000, 7500, 10200, 6000, 8800, 12000, 9500],
                    borderColor: LIME,
                    backgroundColor: LIME_MUTED,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: LIME,
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { 
                        backgroundColor: '#121212',
                        borderColor: '#1a1a1a',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        titleColor: LIME,
                        bodyColor: '#fff'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#1a1a1a' },
                        ticks: { callback: value => value >= 1000 ? (value / 1000) + 'k' : value }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    function updateDashboard() {
        const logs = JSON.parse(localStorage.getItem('fitnessLogs')) || [];
        const meals = JSON.parse(localStorage.getItem('trackedMeals')) || [];

        // 1. Update Summaries
        const totalDuration = logs.reduce((sum, log) => sum + (parseInt(log.duration) || 0), 0);
        const totalSteps = logs.reduce((sum, log) => sum + (parseInt(log.steps) || 0), 0);
        const workoutsCount = logs.length;
        const avgDuration = workoutsCount > 0 ? Math.round(totalDuration / workoutsCount) : 0;

        setStat('summaryWorkouts', workoutsCount);
        setStat('summaryDuration', totalDuration);
        setStat('summaryCalories', (totalSteps / 1000).toFixed(1));
        setStat('summaryAvg', avgDuration);

        // 2. Render Activity Feed
        renderActivityFeed(logs);

        // 3. Render Meals Feed
        renderMealsFeed(meals);
    }

    function setStat(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    function renderActivityFeed(logs) {
        const feed = document.getElementById('logsFeed');
        if (!feed) return;

        if (logs.length === 0) {
            feed.innerHTML = '<div class="item-card"><div class="item-body"><p class="item-desc">No activities tracked yet.</p></div></div>';
            return;
        }

        feed.innerHTML = logs.slice(0, 4).map(log => `
            <div class="item-card">
                <div class="item-icon">
                    <i class="bi ${log.type === 'Steps' ? 'bi-walking' : 'bi-lightning-charge'}"></i>
                </div>
                <div class="item-body">
                    <div class="item-title">${log.activityName}</div>
                    <div class="item-meta">${log.date} • ${log.type}</div>
                </div>
                <div class="item-value">${log.duration}m</div>
            </div>
        `).join('');
    }

    function renderMealsFeed(meals) {
        const feed = document.getElementById('mealsFeed');
        if (!feed) return;

        if (meals.length === 0) {
            feed.innerHTML = '<div class="item-card"><div class="item-body"><p class="item-desc">No meals tracked yet.</p></div></div>';
            return;
        }

        feed.innerHTML = meals.slice(0, 4).map(meal => {
            const time = new Date(meal.trackedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `
                <div class="item-card">
                    <div class="item-icon">
                        <i class="bi bi-egg-fried"></i>
                    </div>
                    <div class="item-body">
                        <div class="item-title">${meal.name}</div>
                        <div class="item-meta">${time} • Nutrition</div>
                    </div>
                    <div class="item-value">${meal.calories}</div>
                </div>
            `;
        }).join('');
    }

    // Initialize
    initCharts();
    updateDashboard();

    // Re-render when data changes (broadcast from other pages)
    window.addEventListener('storage', updateDashboard);
    window.addEventListener('logsUpdated', updateDashboard);
});
