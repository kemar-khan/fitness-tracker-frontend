document.addEventListener('DOMContentLoaded', function () {
    // Colors
    const stravaOrange = '#FC4C02';
    const stravaOrangeLight = 'rgba(252, 76, 2, 0.2)';
    const stravaBlack = '#000000';

    // Chart instances to allow updates
    let activityChart, stepsChart;

    // Chart.js Global Config
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#888';

    function initCharts() {
        // 1. Weekly Activity Duration (Bar Chart)
        const activityCtx = document.getElementById('activityChart').getContext('2d');
        activityChart = new Chart(activityCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Duration (min)',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: stravaOrange,
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: stravaBlack, padding: 12, cornerRadius: 8 }
                },
                scales: {
                    y: { beginAtZero: true, grid: { drawBorder: false, color: '#eee' } },
                    x: { grid: { display: false } }
                }
            }
        });

        // 2. Steps Trend (Line Chart)
        const stepsCtx = document.getElementById('stepsChart').getContext('2d');
        stepsChart = new Chart(stepsCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Steps',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: stravaOrange,
                    backgroundColor: stravaOrangeLight,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: stravaOrange,
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: stravaBlack, padding: 12, cornerRadius: 8 }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { drawBorder: false, color: '#eee' },
                        ticks: { callback: value => value / 1000 + 'k' }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    function updateDashboard() {
        const logs = JSON.parse(localStorage.getItem('fitnessLogs')) || [];

        // Update Summaries
        const totalDuration = logs.reduce((sum, log) => sum + (parseInt(log.duration) || 0), 0);
        const totalSteps = logs.reduce((sum, log) => sum + (parseInt(log.steps) || 0), 0);
        const workoutsCount = logs.length;
        const avgDuration = workoutsCount > 0 ? Math.round(totalDuration / workoutsCount) : 0;

        if (document.getElementById('summaryWorkouts')) {
            document.getElementById('summaryWorkouts').innerHTML = `${workoutsCount}<span class="card-unit">sessions</span>`;
            document.getElementById('summaryDuration').innerHTML = `${totalDuration}<span class="card-unit">min</span>`;
            document.getElementById('summarySteps').innerHTML = `${(totalSteps / 1000).toFixed(1)}<span class="card-unit">k</span>`;
            document.getElementById('summaryAvg').innerHTML = `${avgDuration}<span class="card-unit">min</span>`;
        }

        // Update Charts Data (Example based on last 7 days)
        // Note: For a prototype, we'll just distribute data across labels if real dates aren't handled fully
        if (activityChart && stepsChart) {
            const durationData = [0, 0, 0, 0, 0, 0, 0];
            const stepsData = [0, 0, 0, 0, 0, 0, 0];

            logs.slice(0, 7).forEach((log, index) => {
                const dayIndex = 6 - index; // Simplistic reverse mapping
                if (dayIndex >= 0) {
                    durationData[dayIndex] = log.duration;
                    stepsData[dayIndex] = parseInt(log.steps) || 0;
                }
            });

            activityChart.data.datasets[0].data = durationData;
            activityChart.update();

            stepsChart.data.datasets[0].data = stepsData;
            stepsChart.update();
        }

        renderRecentMeals();
    }

    function renderRecentMeals() {
        const mealsBody = document.getElementById('recentMealsBody');
        if (!mealsBody) return;

        const trackedMeals = JSON.parse(localStorage.getItem('trackedMeals')) || [];

        if (trackedMeals.length === 0) {
            mealsBody.innerHTML = '<tr><td colspan="3" class="text-muted text-center py-4">No meals tracked yet</td></tr>';
            return;
        }

        mealsBody.innerHTML = '';
        // Show last 5 meals
        trackedMeals.slice(0, 5).forEach(meal => {
            const time = new Date(meal.trackedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-bold">${meal.name}</td>
                <td>${meal.calories}</td>
                <td class="text-muted small">${time}</td>
            `;
            mealsBody.appendChild(tr);
        });
    }

    // Initialize
    initCharts();
    updateDashboard();

    // Listen for updates from fitness.js
    window.addEventListener('logsUpdated', updateDashboard);
});
