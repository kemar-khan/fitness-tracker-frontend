'use strict';

document.addEventListener('DOMContentLoaded', function () {

    /* ── COLOUR TOKENS ────────────────────────────────────────── */
    const LIME       = '#B4D400';
    const LIME_FILL  = 'rgba(180,212,0,0.12)';
    const LIME_BAR   = 'rgba(180,212,0,0.20)';
    const DARK_BAR   = '#2a2a2a';
    const GRID       = '#1e1e1e';
    const TEXT_MUTED = '#666666';
    const BLUE       = '#38BDF8';
    const RED        = '#F87171';
    const AMBER      = '#F59E0B';
    const SURFACE    = '#111111';

    /* ── CHART.JS GLOBAL DEFAULTS ─────────────────────────────── */
    Chart.defaults.font.family = "'DM Sans', sans-serif";
    Chart.defaults.font.size   = 11;
    Chart.defaults.color       = TEXT_MUTED;
    Chart.defaults.borderColor = GRID;

    const tooltipDefaults = {
        backgroundColor : '#161616',
        borderColor     : '#2a2a2a',
        borderWidth     : 1,
        padding         : 12,
        cornerRadius    : 8,
        titleColor      : LIME,
        bodyColor       : '#ffffff',
        displayColors   : false,
    };

    /* ── HELPERS ──────────────────────────────────────────────── */
    function setStat(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    function drawDonutRing(canvasId, pct, color, trackColor, size = 80) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx  = canvas.getContext('2d');
        const cx   = size / 2, cy = size / 2;
        const r    = (size / 2) - 9;
        const startA = -Math.PI / 2;
        const endA   = startA + (Math.PI * 2 * (pct / 100));

        ctx.clearRect(0, 0, size, size);

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = trackColor || '#1e1e1e';
        ctx.lineWidth   = 8;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, r, startA, endA);
        ctx.strokeStyle = color;
        ctx.lineWidth   = 8;
        ctx.lineCap     = 'round';
        ctx.stroke();
    }

    /* ── CURRENT DATE ─────────────────────────────────────────── */
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('en-MY', {
            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
        });
    }

    /* ── WEEK LABEL ───────────────────────────────────────────── */
    function setWeekLabel() {
        const el = document.getElementById('weekLabel');
        if (!el) return;
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const week  = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
        el.textContent = `Week ${week} of ${now.getFullYear()}`;
    }
    setWeekLabel();

    /* ── WEEK STRIP ───────────────────────────────────────────── */
    function buildWeekStrip() {
        const strip = document.getElementById('weekStrip');
        if (!strip) return;
        const today = new Date();
        const dow   = today.getDay();
        const days  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const logs  = JSON.parse(localStorage.getItem('fitnessLogs')) || [];

        strip.innerHTML = '';
        for (let i = 0; i < 7; i++) {
            const d       = new Date(today);
            d.setDate(today.getDate() - dow + i);
            const isToday = d.toDateString() === today.toDateString();
            const dateStr = d.toISOString().split('T')[0];
            const hasLog  = logs.some(l => l.date === dateStr);

            const chip = document.createElement('div');
            chip.className = 'day-chip'
                + (isToday ? ' today' : '')
                + (hasLog && !isToday ? ' active' : '');
            chip.innerHTML = `
                <span style="font-size:0.62rem;text-transform:uppercase">${days[d.getDay()]}</span>
                <span class="day-num">${d.getDate()}</span>
                <span class="day-dot"></span>`;
            strip.appendChild(chip);
        }
    }
    buildWeekStrip();

    /* ── PROGRESS RING (hero) ─────────────────────────────────── */
    function drawProgressRing(pct) {
        const canvas = document.getElementById('progressRing');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const size = 160, cx = size / 2, cy = size / 2;
        const r = 62, rInner = 52;

        ctx.clearRect(0, 0, size, size);

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#1e1e1e';
        ctx.lineWidth = 10;
        ctx.stroke();

        const startA = -Math.PI / 2;
        const endA   = startA + (Math.PI * 2 * (pct / 100));
        ctx.beginPath();
        ctx.arc(cx, cy, r, startA, endA);
        ctx.strokeStyle = LIME;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, r, startA, endA);
        ctx.strokeStyle = 'rgba(180,212,0,0.15)';
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 6;
        ctx.stroke();

        const stepsEndA = startA + (Math.PI * 2 * 0.58);
        ctx.beginPath();
        ctx.arc(cx, cy, rInner, startA, stepsEndA);
        ctx.strokeStyle = BLUE;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    let currentPct = 0;
    const targetPct = 74;
    const ringEl = document.getElementById('ringPct');
    function animateRing() {
        if (currentPct < targetPct) {
            currentPct = Math.min(currentPct + 1.5, targetPct);
            drawProgressRing(currentPct);
            if (ringEl) ringEl.textContent = Math.round(currentPct) + '%';
            requestAnimationFrame(animateRing);
        }
    }
    animateRing();

    /* ── GOAL RINGS ───────────────────────────────────────────── */
    drawDonutRing('ringWorkouts', 80, LIME,  '#1e1e1e', 100);
    drawDonutRing('ringSteps',    58, BLUE,  '#1e1e1e', 100);
    drawDonutRing('ringCalories', 85, AMBER, '#1e1e1e', 100);

    /* ── COMBINED ACTIVITY + STEPS CHART (weekly) ────────────── */
    const comboLabels    = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const durationData   = [45, 30, 60, 35, 45, 90, 20];
    const stepsDataCombo = [8.0, 7.5, 10.2, 6.0, 8.8, 12.0, 9.5];

    const comboCtx = document.getElementById('comboChart');
    if (comboCtx) {
        new Chart(comboCtx, {
            data: {
                labels: comboLabels,
                datasets: [
                    {
                        type: 'bar',
                        label: 'Duration (min)',
                        data: durationData,
                        backgroundColor: LIME_BAR,
                        borderColor: 'rgba(180,212,0,0.35)',
                        borderWidth: 1,
                        yAxisID: 'yDuration',
                        borderRadius: 5,
                        borderSkipped: false,
                        order: 2,
                    },
                    {
                        type: 'line',
                        label: 'Steps (k)',
                        data: stepsDataCombo,
                        borderColor: LIME,
                        backgroundColor: 'transparent',
                        yAxisID: 'ySteps',
                        tension: 0.45,
                        pointRadius: 5,
                        pointBackgroundColor: LIME,
                        pointBorderColor: '#000',
                        pointBorderWidth: 2,
                        pointHoverRadius: 7,
                        borderWidth: 2.5,
                        order: 1,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        ...tooltipDefaults,
                        callbacks: {
                            label: ctx => ctx.datasetIndex === 0
                                ? ` ${ctx.parsed.y} min`
                                : ` ${ctx.parsed.y}k steps`
                        }
                    }
                },
                scales: {
                    yDuration: {
                        type: 'linear',
                        position: 'left',
                        beginAtZero: true,
                        grid: { color: GRID },
                        ticks: { color: TEXT_MUTED },
                        border: { display: false }
                    },
                    ySteps: {
                        type: 'linear',
                        position: 'right',
                        beginAtZero: true,
                        grid: { display: false },
                        ticks: { color: TEXT_MUTED, callback: v => v + 'k' },
                        border: { display: false }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: TEXT_MUTED },
                        border: { display: false }
                    }
                },
                animation: { duration: 1000, easing: 'easeOutQuart' }
            }
        });
    }

    /* ── CALORIE BALANCE CHART ────────────────────────────────── */
    const calBalLabels  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const consumedData  = [1850, 2100, 1950, 2200, 1800, 2400, 2050];
    const burnedData    = [2100, 1950, 2300, 1800, 2200, 1950, 1750];

    const calBalCtx = document.getElementById('calorieBalanceChart');
    if (calBalCtx) {
        new Chart(calBalCtx, {
            type: 'bar',
            data: {
                labels: calBalLabels,
                datasets: [
                    {
                        label: 'Consumed',
                        data: consumedData,
                        backgroundColor: RED,
                        borderRadius: 4,
                        borderSkipped: false,
                    },
                    {
                        label: 'Burned',
                        data: burnedData,
                        backgroundColor: LIME,
                        borderRadius: 4,
                        borderSkipped: false,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        ...tooltipDefaults,
                        mode: 'index',
                        callbacks: {
                            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} kcal`
                        }
                    }
                },
                scales: {
                    y: {
                        min: 1400,
                        grid: { color: GRID },
                        ticks: {
                            color: TEXT_MUTED,
                            callback: v => (v / 1000).toFixed(1) + 'k'
                        },
                        border: { display: false }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: TEXT_MUTED },
                        border: { display: false }
                    }
                },
                animation: { duration: 900, easing: 'easeOutQuart' }
            }
        });
    }

    /* ── WEIGHT TREND CHART ───────────────────────────────────── */
    const weightLabels = ['Apr 1','Apr 3','Apr 5','Apr 7','Apr 9','Apr 11','Apr 13','Apr 15','Apr 17','Apr 19','Apr 21','Apr 23','Apr 25','Apr 27','Apr 28'];
    const weightData   = [74.2, 74.0, 73.8, 73.9, 73.5, 73.3, 73.1, 72.9, 73.0, 72.7, 72.5, 72.3, 72.4, 72.2, 72.1];

    const weightCtx = document.getElementById('weightChart');
    if (weightCtx) {
        new Chart(weightCtx, {
            type: 'line',
            data: {
                labels: weightLabels,
                datasets: [
                    {
                        label: 'Weight (kg)',
                        data: weightData,
                        borderColor: AMBER,
                        backgroundColor: 'rgba(245,158,11,0.08)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointBackgroundColor: AMBER,
                        pointBorderColor: '#000',
                        pointBorderWidth: 1,
                        borderWidth: 2.5,
                    },
                    {
                        label: 'Goal',
                        data: Array(weightLabels.length).fill(72.0),
                        borderColor: 'rgba(255,255,255,0.15)',
                        borderDash: [4, 3],
                        pointRadius: 0,
                        fill: false,
                        borderWidth: 1.5,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        ...tooltipDefaults,
                        callbacks: {
                            label: ctx => ctx.datasetIndex === 0
                                ? ` ${ctx.parsed.y} kg`
                                : ` Goal: ${ctx.parsed.y} kg`
                        }
                    }
                },
                scales: {
                    y: {
                        min: 71.0,
                        max: 75.0,
                        grid: { color: GRID },
                        ticks: {
                            color: TEXT_MUTED,
                            callback: v => v.toFixed(1) + ' kg',
                            stepSize: 1,
                        },
                        border: { display: false }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: TEXT_MUTED, maxTicksLimit: 5 },
                        border: { display: false }
                    }
                },
                animation: { duration: 800, easing: 'easeOutQuart' }
            }
        });
    }

    /* ── AI INSIGHT GENERATOR ─────────────────────────────────── */
    const AI_TIPS = [
        "Try a 20 min walk after lunch to boost your daily step count!",
        "Adding a weekend session could lift your weekly average by ~15%.",
        "Your best performances are on Saturdays — schedule harder workouts then.",
        "Drinking water before meals helps manage daily calorie intake naturally.",
        "A consistent sleep schedule improves workout performance the next day.",
        "Short 10-min stretching sessions on rest days speed up recovery.",
        "Tracking meals alongside workouts gives a clearer picture of your energy balance.",
    ];

    function generateAIInsight(logs) {
        const actData  = [45, 30, 60, 0, 45, 90, 20];
        const actDays  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const stepsRef = [8000, 7500, 10200, 6000, 8800, 12000, 9500];

        const workoutCount = logs.length > 0 ? logs.length : 3;

        const maxIdx      = actData.indexOf(Math.max(...actData));
        const bestDay     = actDays[maxIdx];
        const maxStepIdx  = stepsRef.indexOf(Math.max(...stepsRef));
        const bestStepDay = actDays[maxStepIdx];

        const recentAvg = stepsRef.slice(-3).reduce((a, b) => a + b, 0) / 3;
        const prevAvg   = stepsRef.slice(0, 4).reduce((a, b) => a + b, 0) / 4;
        const stepChange = Math.round(((recentAvg - prevAvg) / prevAvg) * 100);

        let text = `You've been most consistent on ${bestDay}s — ${workoutCount} workout${workoutCount !== 1 ? 's' : ''} logged this month. `;

        if (stepChange < -5) {
            text += `Step average dropped ${Math.abs(stepChange)}%; try a 20 min walk after lunch to close the gap!`;
        } else if (stepChange > 5) {
            text += `Step average is up ${stepChange}% — great momentum! ${bestStepDay} was your peak with ${stepsRef[maxStepIdx].toLocaleString()} steps.`;
        } else {
            text += `Step count is holding steady. ${bestStepDay} was your peak day with ${stepsRef[maxStepIdx].toLocaleString()} steps.`;
        }

        return text;
    }

    function setAIText(text) {
        const el = document.getElementById('aiInsightText');
        if (!el) return;
        el.style.opacity = '0';
        setTimeout(() => {
            el.textContent = text;
            el.style.opacity = '1';
        }, 180);
    }

    document.getElementById('aiTipsBtn')?.addEventListener('click', function () {
        const tip = AI_TIPS[Math.floor(Math.random() * AI_TIPS.length)];
        setAIText(tip);
    });


    /* ── DATA FROM LOCALSTORAGE ───────────────────────────────── */
    function updateDashboard() {
        const logs  = JSON.parse(localStorage.getItem('fitnessLogs'))  || [];
        const meals = JSON.parse(localStorage.getItem('trackedMeals')) || [];

        const totalSteps    = logs.reduce((s, l) => s + (parseInt(l.steps)    || 0), 0);
        const workoutsCount = logs.length;
        const avgSteps      = workoutsCount > 0 ? Math.round(totalSteps / workoutsCount) : 0;

        setStat('summaryWorkouts', workoutsCount || 18);
        setStat('summarySteps',    avgSteps > 0  ? avgSteps.toLocaleString() : '8,420');
        setStat('summaryCalories', '2,104');
        setStat('summaryStreak',   '14');

        // Steps today (hero card)
        const todayStr = new Date().toISOString().split('T')[0];
        const todayLog = logs.find(l => l.date === todayStr);
        if (todayLog) {
            const el = document.getElementById('stepsToday');
            if (el) el.textContent = parseInt(todayLog.steps || 0).toLocaleString();
        }

        buildWeekStrip();
        setAIText(generateAIInsight(logs));
    }

    /* ── INIT ─────────────────────────────────────────────────── */
    updateDashboard();

    window.addEventListener('storage',     updateDashboard);
    window.addEventListener('logsUpdated', updateDashboard);
});
