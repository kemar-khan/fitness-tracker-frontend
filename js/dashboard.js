'use strict';
import './auth.js';
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function () {

    /* ── COLOUR TOKENS ────────────────────────────────────────── */
    const LIME = '#B4D400';
    const LIME_FILL = 'rgba(180,212,0,0.12)';
    const LIME_BAR = 'rgba(180,212,0,0.20)';
    const DARK_BAR = '#2a2a2a';
    const GRID = '#1e1e1e';
    const TEXT_MUTED = '#666666';
    const BLUE = '#38BDF8';
    const RED = '#F87171';
    const AMBER = '#F59E0B';
    const SURFACE = '#111111';

    /* ── CHART.JS GLOBAL DEFAULTS ─────────────────────────────── */
    Chart.defaults.font.family = "'DM Sans', sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.color = TEXT_MUTED;
    Chart.defaults.borderColor = GRID;

    const tooltipDefaults = {
        backgroundColor: '#161616',
        borderColor: '#2a2a2a',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleColor: LIME,
        bodyColor: '#ffffff',
        displayColors: false,
    };

    /* ── HELPERS ──────────────────────────────────────────────── */
    function setStat(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    function drawDonutRing(canvasId, pct, color, trackColor, size = 80) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const cx = size / 2, cy = size / 2;
        const r = (size / 2) - 9;
        const startA = -Math.PI / 2;
        const endA = startA + (Math.PI * 2 * (pct / 100));

        ctx.clearRect(0, 0, size, size);

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = trackColor || '#1e1e1e';
        ctx.lineWidth = 8;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, r, startA, endA);
        ctx.strokeStyle = color;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
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
        const week = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
        el.textContent = `Week ${week} of ${now.getFullYear()}`;
    }
    setWeekLabel();

    /* ── WEEK STRIP ───────────────────────────────────────────── */
    function buildWeekStrip(logs) {
        if (!logs) logs = [];
        const strip = document.getElementById('weekStrip');
        if (!strip) return;
        const today = new Date();
        const dow = today.getDay();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        strip.innerHTML = '';
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - dow + i);
            const isToday = d.toDateString() === today.toDateString();
            const dateStr = d.toISOString().split('T')[0];
            const hasLog = logs.some(l => l.date === dateStr);

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
        const endA = startA + (Math.PI * 2 * (pct / 100));
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
    drawDonutRing('ringWorkouts', 80, LIME, '#1e1e1e', 100);
    drawDonutRing('ringSteps',    58, BLUE, '#1e1e1e', 100);
    drawDonutRing('ringCalories',  0, AMBER, '#1e1e1e', 100);

    /* ── COMBINED ACTIVITY + STEPS CHART (weekly) ────────────── */
    const comboLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const durationData = [45, 30, 60, 35, 45, 90, 20];
    const stepsDataCombo = [8.0, 7.5, 10.2, 6.0, 8.8, 12.0, 9.5];

    const comboCtx = document.getElementById('comboChart');
    let comboChartInst = null;
    let calBalChartInst = null;
    let weightChartInst = null;
    if (comboCtx) {
        comboChartInst = new Chart(comboCtx, {
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
    const calBalLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const consumedData = [1850, 2100, 1950, 2200, 1800, 2400, 2050];
    const burnedData = [2100, 1950, 2300, 1800, 2200, 1950, 1750];

    const calBalCtx = document.getElementById('calorieBalanceChart');
    if (calBalCtx) {
        calBalChartInst = new Chart(calBalCtx, {
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
    const weightLabels = ['Apr 1', 'Apr 3', 'Apr 5', 'Apr 7', 'Apr 9', 'Apr 11', 'Apr 13', 'Apr 15', 'Apr 17', 'Apr 19', 'Apr 21', 'Apr 23', 'Apr 25', 'Apr 27', 'Apr 28'];
    const weightData = [74.2, 74.0, 73.8, 73.9, 73.5, 73.3, 73.1, 72.9, 73.0, 72.7, 72.5, 72.3, 72.4, 72.2, 72.1];

    const weightCtx = document.getElementById('weightChart');
    if (weightCtx) {
        weightChartInst = new Chart(weightCtx, {
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
        if (logs.length === 0) {
            return "No activity logged yet. Head to Workouts and log your first session to get personalised insights!";
        }
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const workouts = logs.filter(l => (l.category || l.type) === 'Workout');
        const dayCounts = Array(7).fill(0);
        workouts.forEach(w => { if (w.date) dayCounts[new Date(w.date).getDay()]++; });
        const bestDay = dayNames[dayCounts.indexOf(Math.max(...dayCounts))];

        const weekDates = getWeekDates();
        const weekSteps = weekDates.map(date =>
            logs.filter(l => l.date === date).reduce((s, l) => s + (parseInt(l.steps) || 0), 0)
        );
        const maxSteps = Math.max(...weekSteps);
        const maxStepDay = dayNames[weekSteps.indexOf(maxSteps)];

        let text = `You've been most consistent on ${bestDay}s — ${workouts.length} workout${workouts.length !== 1 ? 's' : ''} logged total. `;
        text += maxSteps > 0
            ? `${maxStepDay} was your peak step day this week with ${maxSteps.toLocaleString()} steps.`
            : `Start tracking steps to see your peak day performance!`;
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


    /* ── FIRESTORE DATA ──────────────────────────────────────────── */

    function updateCalorieUI(nutrition) {
        const todayStr = new Date().toISOString().split('T')[0];
        const meals = (nutrition.trackedMeals || []).filter(m => m.trackedAt && m.trackedAt.startsWith(todayStr));

        const consumed  = meals.reduce((s, m) => s + (m.calories || 0), 0);
        const protein   = meals.reduce((s, m) => s + (m.protein  || 0), 0);
        const carbs     = meals.reduce((s, m) => s + (m.carbs    || 0), 0);
        const fat       = meals.reduce((s, m) => s + (m.fat      || 0), 0);
        const goal      = nutrition.dailyGoal || 2000;
        const pct       = Math.min(Math.round((consumed / goal) * 100), 100);

        setStat('summaryCalories', consumed.toLocaleString());

        const calNum = document.getElementById('calConsumed');
        if (calNum) calNum.textContent = consumed.toLocaleString();

        const calTgt = document.getElementById('calTarget');
        if (calTgt) calTgt.textContent = goal.toLocaleString() + ' kcal';

        const calPct = document.getElementById('calPctText');
        if (calPct) calPct.textContent = pct + '%';

        const calBar = document.getElementById('calBarFill');
        if (calBar) calBar.style.width = pct + '%';

        const macroGoals = { carbs: Math.round(goal * 0.50 / 4), fat: Math.round(goal * 0.25 / 9), protein: Math.round(goal * 0.25 / 4) };
        const macroItems = document.querySelectorAll('.macro-item');
        const macroMap   = [
            { label: 'Carbs',   val: carbs,   goal: macroGoals.carbs,   color: '#B4D400' },
            { label: 'Fat',     val: fat,     goal: macroGoals.fat,     color: '#F87171' },
            { label: 'Protein', val: protein, goal: macroGoals.protein, color: '#38BDF8' },
        ];
        macroItems.forEach((item, i) => {
            if (!macroMap[i]) return;
            const { val, goal: g, color } = macroMap[i];
            const w = Math.min(Math.round((val / g) * 100), 100);
            const bar  = item.querySelector('.macro-bar');
            const nums = item.querySelector('.macro-nums');
            if (bar)  bar.style.setProperty('--w', w + '%');
            if (nums) nums.innerHTML = `<span style="color:${color}">${val}g</span> / ${g}g`;
        });

        const calRingPct = pct;
        drawDonutRing('ringCalories', calRingPct, AMBER, '#1e1e1e', 100);
        const calRingPctEl = document.querySelector('#ringCalories')?.closest('.goal-ring-wrap')?.querySelector('.goal-ring-pct');
        const calRingLblEl = document.querySelector('#ringCalories')?.closest('.goal-ring-item')?.querySelector('.goal-ring-label');
        if (calRingPctEl) calRingPctEl.textContent = calRingPct + '%';
        if (calRingLblEl) calRingLblEl.innerHTML = `Calorie Target<br><strong>${consumed.toLocaleString()} / ${goal.toLocaleString()} kcal</strong>`;
    }

    function calcStreak(logs) {
        const dates = [...new Set(
            logs
                .filter(l => (l.category || l.type) === 'Workout' && l.date)
                .map(l => l.date)
        )].sort((a, b) => b.localeCompare(a));
        if (dates.length === 0) return 0;
        let streak = 1, latest = dates[0];
        for (let i = 1; i < dates.length; i++) {
            const [y, m, d] = latest.split('-').map(Number);
            const prev = new Date(Date.UTC(y, m - 1, d));
            prev.setUTCDate(prev.getUTCDate() - 1);
            const prevStr = prev.toISOString().split('T')[0];
            if (dates.includes(prevStr)) { streak++; latest = prevStr; } else break;
        }
        return streak;
    }

    function getWeekDates() {
        const today = new Date();
        const dow = today.getDay();
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - dow + i);
            return d.toISOString().split('T')[0];
        });
    }

    function updateWeeklyCharts(logs) {
        if (!comboChartInst) return;
        const weekDates = getWeekDates();
        const durations = weekDates.map(date =>
            logs.filter(l => l.date === date).reduce((s, l) => s + (parseInt(l.duration) || 0), 0)
        );
        const steps = weekDates.map(date => {
            const total = logs.filter(l => l.date === date).reduce((s, l) => s + (parseInt(l.steps) || 0), 0);
            return Math.round(total / 100) / 10;
        });
        comboChartInst.data.datasets[0].data = durations;
        comboChartInst.data.datasets[1].data = steps;
        comboChartInst.update();
    }

    function updateGoalRings(logs) {
        const weekDates = getWeekDates();
        const weekLogs = logs.filter(l => weekDates.includes(l.date));
        const workoutsThisWeek = weekLogs.filter(l => (l.category || l.type) === 'Workout').length;
        const workoutGoal = 5;
        const workoutPct = Math.min(Math.round((workoutsThisWeek / workoutGoal) * 100), 100);
        const stepGoalDays = weekDates.filter(date => {
            const total = weekLogs.filter(l => l.date === date).reduce((s, l) => s + (parseInt(l.steps) || 0), 0);
            return total >= 10000;
        }).length;
        const stepPct = Math.round((stepGoalDays / 7) * 100);

        drawDonutRing('ringWorkouts', workoutPct, LIME, '#1e1e1e', 100);
        drawDonutRing('ringSteps', stepPct, BLUE, '#1e1e1e', 100);

        const wPctEl = document.querySelector('#ringWorkouts')?.closest('.goal-ring-wrap')?.querySelector('.goal-ring-pct');
        const wLblEl = document.querySelector('#ringWorkouts')?.closest('.goal-ring-item')?.querySelector('.goal-ring-label');
        if (wPctEl) wPctEl.textContent = workoutPct + '%';
        if (wLblEl) wLblEl.innerHTML = `Workouts<br><strong>${workoutsThisWeek}/${workoutGoal}</strong>`;

        const sPctEl = document.querySelector('#ringSteps')?.closest('.goal-ring-wrap')?.querySelector('.goal-ring-pct');
        const sLblEl = document.querySelector('#ringSteps')?.closest('.goal-ring-item')?.querySelector('.goal-ring-label');
        if (sPctEl) sPctEl.textContent = stepPct + '%';
        if (sLblEl) sLblEl.innerHTML = `Step Goal<br><strong>${stepGoalDays}/7 days</strong>`;

        const activeDays = weekDates.filter(date => logs.some(l => l.date === date)).length;
        const progressPct = Math.round((activeDays / 7) * 100);
        drawProgressRing(progressPct);
        const ringPctEl = document.getElementById('ringPct');
        if (ringPctEl) ringPctEl.textContent = progressPct + '%';
    }

    /* ── REAL DATA STORE ──────────────────────────────────────── */
    const _realData = {
        logs: [], weekDates: [], nutrition: null,
        calorieHistory: [], weightLogs: [],
        profile: null, goals: {}, streak: 0
    };

    function updateCalorieBalanceChart(weekDates, calorieHistory, logs) {
        if (!calBalChartInst) return;
        const consumed = weekDates.map(date => {
            const h = calorieHistory.find(h => h.date === date);
            return h ? h.consumed : 0;
        });
        const burned = weekDates.map(date =>
            logs.filter(l => l.date === date).reduce((s, l) => s + (parseInt(l.caloriesBurned) || 0), 0)
        );
        calBalChartInst.data.datasets[0].data = consumed;
        calBalChartInst.data.datasets[1].data = burned;
        const allVals = [...consumed, ...burned].filter(v => v > 0);
        if (allVals.length > 0) {
            calBalChartInst.options.scales.y.min = Math.max(0, Math.min(...allVals) - 300);
        }
        calBalChartInst.update();
    }

    function updateWeightChart(weightLogs, profile) {
        if (!weightChartInst || weightLogs.length === 0) return;
        const recent = weightLogs.slice(-15);
        const labels = recent.map(l => {
            const d = new Date(l.date);
            return d.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' });
        });
        const data = recent.map(l => l.weight);
        const minW = Math.min(...data), maxW = Math.max(...data), range = maxW - minW;
        weightChartInst.data.labels = labels;
        weightChartInst.data.datasets[0].data = data;
        weightChartInst.data.datasets[1].data = Array(labels.length).fill(parseFloat(minW.toFixed(1)));
        weightChartInst.options.scales.y.min = Math.max(0, minW - Math.max(1, range * 0.5));
        weightChartInst.options.scales.y.max = maxW + Math.max(1, range * 0.5);
        weightChartInst.update();
    }

    function updateBodyMetrics(weightLogs, profile) {
        const sorted = [...weightLogs].sort((a, b) => a.date.localeCompare(b.date));
        const currentWeight = sorted.length > 0
            ? sorted[sorted.length - 1].weight
            : (profile && profile.weight) || 0;
        const startWeight = sorted.length > 0 ? sorted[0].weight : currentWeight;
        const lost = Math.max(0, parseFloat((startWeight - currentWeight).toFixed(1)));
        const heightM = ((profile && profile.height) || 0) / 100;
        const bmi = heightM > 0 ? (currentWeight / (heightM * heightM)).toFixed(1) : '—';

        const metricsCard = document.querySelector('.body-metrics-card');
        if (!metricsCard) return;
        const vals = metricsCard.querySelectorAll('.metric-stat-value');
        if (vals[0]) vals[0].textContent = (currentWeight || '—') + (currentWeight ? ' kg' : '');
        if (vals[1]) vals[1].textContent = (startWeight || '—') + (startWeight ? ' kg' : '');
        if (vals[2]) { vals[2].textContent = lost + ' kg'; vals[2].style.color = lost > 0 ? 'var(--lime)' : 'var(--text)'; }
        if (vals[3]) vals[3].textContent = bmi;
    }

    function updateHeroStats(logs, nutrition, goals, todayStr) {
        document.querySelectorAll('.hero-stat').forEach(stat => {
            const label = stat.querySelector('.hstat-label');
            const val = stat.querySelector('.hstat-value');
            if (!label || !val) return;
            if (label.textContent === 'Water intake') {
                if (nutrition) {
                    const glasses = (nutrition.waterDate === todayStr) ? (nutrition.waterGlasses || 0) : 0;
                    val.textContent = glasses + (glasses === 1 ? ' glass' : ' glasses');
                }
            } else if (label.textContent === 'Goals met') {
                let met = 0, total = 0;
                const todayLogs = logs.filter(l => l.date === todayStr);
                const todaySteps = todayLogs.reduce((s, l) => s + (parseInt(l.steps) || 0), 0);
                if ((goals.dailySteps || 0) > 0) { total++; if (todaySteps >= goals.dailySteps) met++; }
                if ((goals.dailyCalories || 0) > 0 && nutrition) {
                    const consumed = (nutrition.trackedMeals || [])
                        .filter(m => m.trackedAt && m.trackedAt.startsWith(todayStr))
                        .reduce((s, m) => s + (m.calories || 0), 0);
                    total++; if (consumed > 0 && consumed <= goals.dailyCalories) met++;
                }
                if ((goals.dailyWater || 0) > 0 && nutrition) {
                    const glasses = (nutrition.waterDate === todayStr) ? (nutrition.waterGlasses || 0) : 0;
                    total++; if (glasses >= goals.dailyWater) met++;
                }
                if ((goals.weeklyWorkouts || 0) > 0) {
                    const wkDates = getWeekDates();
                    const wkWorkouts = logs.filter(l => (l.category || l.type) === 'Workout' && wkDates.includes(l.date)).length;
                    total++; if (wkWorkouts >= goals.weeklyWorkouts) met++;
                }
                val.textContent = total > 0 ? `${met} / ${total}` : '— / —';
            }
        });
    }

    function updateCardTrends(logs, calorieHistory, goals, nutrition) {
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        const todayStr = now.toISOString().split('T')[0];
        const trendEls = document.querySelectorAll('.summary-card .card-trend');
        if (trendEls.length < 4) return;

        // 1. Total Workouts vs last month
        const thisMonthWorkouts = logs.filter(l => (l.category || l.type) === 'Workout' && l.date >= thisMonthStart).length;
        const lastMonthWorkouts = logs.filter(l => (l.category || l.type) === 'Workout' && l.date >= lastMonthStart && l.date <= lastMonthEnd).length;
        const workoutDiff = thisMonthWorkouts - lastMonthWorkouts;
        const wIcon = workoutDiff >= 0 ? 'bi-arrow-up-right' : 'bi-arrow-down-right';
        const wCls  = workoutDiff > 0 ? 'up' : workoutDiff < 0 ? 'down' : 'neutral';
        const wText = workoutDiff === 0 ? 'Same as last month' : `${workoutDiff > 0 ? '+' : ''}${workoutDiff} vs last month`;
        trendEls[0].className = `card-trend ${wCls}`;
        trendEls[0].innerHTML = `<i class="bi ${wIcon}"></i> ${wText}`;

        // 2. Avg. Daily Steps vs last month
        function avgStepsForRange(start, end) {
            const uniqueDays = [...new Set(logs.filter(l => l.date >= start && l.date <= end && (parseInt(l.steps) || 0) > 0).map(l => l.date))];
            if (!uniqueDays.length) return 0;
            return Math.round(logs.filter(l => l.date >= start && l.date <= end).reduce((s, l) => s + (parseInt(l.steps) || 0), 0) / uniqueDays.length);
        }
        const thisAvgSteps = avgStepsForRange(thisMonthStart, todayStr);
        const lastAvgSteps = avgStepsForRange(lastMonthStart, lastMonthEnd);
        if (lastAvgSteps === 0) {
            trendEls[1].className = 'card-trend neutral';
            trendEls[1].innerHTML = '<i class="bi bi-dash-lg"></i> No data last month';
        } else {
            const pct = Math.round(((thisAvgSteps - lastAvgSteps) / lastAvgSteps) * 100);
            trendEls[1].className = `card-trend ${pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral'}`;
            trendEls[1].innerHTML = `<i class="bi ${pct >= 0 ? 'bi-arrow-up-right' : 'bi-arrow-down-right'}"></i> ${pct >= 0 ? '+' : ''}${pct}% vs last month`;
        }

        // 3. Avg. Calories vs target
        const calTarget = (goals && goals.dailyCalories) || (nutrition && nutrition.dailyGoal) || 2000;
        const thisMonthCalDays = calorieHistory.filter(h => h.date >= thisMonthStart && h.consumed > 0);
        if (!thisMonthCalDays.length) {
            trendEls[2].className = 'card-trend neutral';
            trendEls[2].innerHTML = '<i class="bi bi-dash-lg"></i> No data yet';
        } else {
            const avgCal = Math.round(thisMonthCalDays.reduce((s, h) => s + h.consumed, 0) / thisMonthCalDays.length);
            const diff = avgCal - calTarget;
            const pct = Math.round(Math.abs(diff / calTarget) * 100);
            if (Math.abs(diff) <= calTarget * 0.05) {
                trendEls[2].className = 'card-trend neutral';
                trendEls[2].innerHTML = '<i class="bi bi-dash-lg"></i> On target';
            } else if (diff < 0) {
                trendEls[2].className = 'card-trend up';
                trendEls[2].innerHTML = `<i class="bi bi-arrow-down-right"></i> ${pct}% under target`;
            } else {
                trendEls[2].className = 'card-trend down';
                trendEls[2].innerHTML = `<i class="bi bi-arrow-up-right"></i> ${pct}% over target`;
            }
        }

        // 4. Active Streak vs personal best
        const allDates = [...new Set(logs.filter(l => l.date).map(l => l.date))].sort((a, b) => b.localeCompare(a));
        let pb = 0, cur = 0, prev = '';
        allDates.forEach(d => {
            if (!prev) { cur = 1; pb = 1; prev = d; return; }
            const [y, m, dy] = prev.split('-').map(Number);
            const dayBefore = new Date(Date.UTC(y, m - 1, dy));
            dayBefore.setUTCDate(dayBefore.getUTCDate() - 1);
            if (d === dayBefore.toISOString().split('T')[0]) { cur++; pb = Math.max(pb, cur); } else { cur = 1; }
            prev = d;
        });
        const currentStreak = _realData.streak;
        if (currentStreak === 0) {
            trendEls[3].className = 'card-trend neutral';
            trendEls[3].innerHTML = '<i class="bi bi-dash-lg"></i> Start your streak!';
        } else if (currentStreak >= pb) {
            trendEls[3].className = 'card-trend purple';
            trendEls[3].innerHTML = '<i class="bi bi-star-fill"></i> Personal best!';
        } else {
            const toGo = pb - currentStreak;
            trendEls[3].className = 'card-trend neutral';
            trendEls[3].innerHTML = `<i class="bi bi-dash-lg"></i> ${toGo} day${toGo > 1 ? 's' : ''} from best`;
        }
    }

    async function updateDashboard(uid) {
        try {
            const [actSnap, wSnap, chSnap, userDoc] = await Promise.all([
                getDocs(collection(db, 'users', uid, 'activities')),
                getDocs(collection(db, 'users', uid, 'weightLogs')),
                getDocs(collection(db, 'users', uid, 'calorieHistory')),
                getDoc(doc(db, 'users', uid))
            ]);

            const logs = actSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const weightLogs = wSnap.docs.map(d => d.data()).sort((a, b) => a.date.localeCompare(b.date));
            const calorieHistory = chSnap.docs.map(d => d.data());
            const userData = userDoc.exists() ? userDoc.data() : {};
            const profile = userData.profile || null;
            const goals = userData.goals || {};
            const nutrition = userData.nutrition || null;
            const weekDates = getWeekDates();
            const todayStr = new Date().toISOString().split('T')[0];

            const workoutsCount = logs.filter(l => (l.category || l.type) === 'Workout').length;
            const allSteps = logs.map(l => parseInt(l.steps) || 0).filter(s => s > 0);
            const avgSteps = allSteps.length > 0 ? Math.round(allSteps.reduce((a, b) => a + b, 0) / allSteps.length) : 0;
            const streak = calcStreak(logs);

            _realData.logs = logs;
            _realData.weekDates = weekDates;
            _realData.nutrition = nutrition;
            _realData.calorieHistory = calorieHistory;
            _realData.weightLogs = weightLogs;
            _realData.profile = profile;
            _realData.goals = goals;
            _realData.streak = streak;

            setStat('summaryWorkouts', workoutsCount);
            setStat('summarySteps', avgSteps > 0 ? avgSteps.toLocaleString() : '0');
            setStat('summaryStreak', streak);

            const todaySteps = logs.filter(l => l.date === todayStr).reduce((s, l) => s + (parseInt(l.steps) || 0), 0);
            if (todaySteps > 0) setStat('stepsToday', todaySteps.toLocaleString());

            const streakBadge = document.getElementById('streakDays');
            if (streakBadge) streakBadge.textContent = streak;

            buildWeekStrip(logs);
            updateWeeklyCharts(logs);
            updateGoalRings(logs);
            setAIText(generateAIInsight(logs));
            if (nutrition) updateCalorieUI(nutrition);
            updateCalorieBalanceChart(weekDates, calorieHistory, logs);
            updateWeightChart(weightLogs, profile);
            updateBodyMetrics(weightLogs, profile);
            updateHeroStats(logs, nutrition, goals, todayStr);
            updateCardTrends(logs, calorieHistory, goals, nutrition);
        } catch (err) {
            console.error('Dashboard load error:', err);
        }
    }

    /* ── MODAL SYSTEM ────────────────────────────────────────────  */
    const overlay    = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody  = document.getElementById('modalBody');

    function openModal(title, bodyHTML) {
        modalTitle.textContent = title;
        modalBody.innerHTML    = bodyHTML;
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeModal() {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }
    document.getElementById('modalClose').addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    /* ── MODAL BUILDERS (dynamic from real data) ─────────────── */
    function buildWorkoutsModal() {
        const { logs, weekDates } = _realData;
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const workouts = logs.filter(l => (l.category || l.type) === 'Workout');
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const weekWorkouts = workouts.filter(w => weekDates.includes(w.date)).length;
        const monthWorkouts = workouts.filter(w => w.date >= monthStart).length;
        const byWeek = {};
        workouts.forEach(w => {
            if (!w.date) return;
            const d = new Date(w.date);
            const wk = `${d.getFullYear()}-${Math.ceil((d - new Date(d.getFullYear(), 0, 1)) / 604800000)}`;
            byWeek[wk] = (byWeek[wk] || 0) + 1;
        });
        const bestWeek = Object.values(byWeek).length ? Math.max(...Object.values(byWeek)) : 0;
        const typeCounts = {};
        workouts.forEach(w => { const t = w.category || w.type || 'Workout'; typeCounts[t] = (typeCounts[t] || 0) + 1; });
        const total = workouts.length || 1;
        const typeRows = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)
            .map(([t, c]) => { const p = Math.round((c / total) * 100); return `<div class="modal-bar-item"><span class="modal-bar-label">${t}</span><div class="modal-bar-track"><div class="modal-bar-fill" style="width:${p}%;background:var(--lime)"></div></div><span class="modal-bar-value">${p}%</span></div>`; }).join('');
        const recent = workouts.filter(w => w.date).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)
            .map(w => { const d = new Date(w.date); return `<div class="modal-list-item"><span class="modal-list-label">${dayNames[d.getDay()]} — ${w.category || w.type || 'Workout'}</span><span class="modal-list-value accent">${w.duration || '—'} min</span></div>`; }).join('');
        return { title: 'Total Workouts', body: `
            <div class="modal-stat-row">
                <div class="modal-stat"><div class="modal-stat-val">${weekWorkouts}</div><div class="modal-stat-label">This Week</div></div>
                <div class="modal-stat"><div class="modal-stat-val">${monthWorkouts}</div><div class="modal-stat-label">This Month</div></div>
                <div class="modal-stat"><div class="modal-stat-val">${bestWeek}</div><div class="modal-stat-label">Best Week</div></div>
            </div>
            <div><div class="modal-section-title">Workout Types</div><div class="modal-bar-row">${typeRows || '<div style="color:var(--text-muted);font-size:0.8rem">No workouts logged yet</div>'}</div></div>
            <div><div class="modal-section-title">Recent Sessions</div><div class="modal-list">${recent || '<div style="color:var(--text-muted);font-size:0.8rem">No sessions yet</div>'}</div></div>`
        };
    }

    function buildStepsModal() {
        const { logs, weekDates, goals } = _realData;
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const todayStr = new Date().toISOString().split('T')[0];
        const todaySteps = logs.filter(l => l.date === todayStr).reduce((s, l) => s + (parseInt(l.steps) || 0), 0);
        const weekSteps = weekDates.map(d => logs.filter(l => l.date === d).reduce((s, l) => s + (parseInt(l.steps) || 0), 0));
        const daysWithSteps = weekSteps.filter(s => s > 0).length;
        const weekAvg = daysWithSteps ? Math.round(weekSteps.reduce((a, b) => a + b, 0) / daysWithSteps) : 0;
        const maxSteps = Math.max(...weekSteps, 1);
        const stepGoal = goals.dailySteps || 10000;
        const dayRows = weekDates.map((d, i) => {
            const s = weekSteps[i]; const w = Math.min(Math.round((s / stepGoal) * 100), 100); const met = s >= stepGoal;
            return `<div class="modal-bar-item"><span class="modal-bar-label">${dayNames[i]}</span><div class="modal-bar-track"><div class="modal-bar-fill" style="width:${w}%;background:${met ? 'var(--lime)' : 'rgba(180,212,0,0.4)'}"></div></div><span class="modal-bar-value">${s > 0 ? s.toLocaleString() : '—'}</span></div>`;
        }).join('');
        const goalMetDays = weekSteps.filter(s => s >= stepGoal).length;
        return { title: 'Avg. Daily Steps', body: `
            <div class="modal-stat-row">
                <div class="modal-stat"><div class="modal-stat-val">${todaySteps > 0 ? todaySteps.toLocaleString() : '—'}</div><div class="modal-stat-label">Today</div></div>
                <div class="modal-stat"><div class="modal-stat-val">${weekAvg > 0 ? weekAvg.toLocaleString() : '—'}</div><div class="modal-stat-label">Weekly Avg</div></div>
                <div class="modal-stat"><div class="modal-stat-val">${maxSteps > 0 ? maxSteps.toLocaleString() : '—'}</div><div class="modal-stat-label">Best Day</div></div>
            </div>
            <div><div class="modal-section-title">This Week's Breakdown</div><div class="modal-bar-row">${dayRows}</div></div>
            <div class="modal-list-item"><span class="modal-list-label">Goal (${stepGoal.toLocaleString()}/day) met on</span><span class="modal-list-value accent">${goalMetDays} / 7 days</span></div>`
        };
    }

    function buildCaloriesModal() {
        const { calorieHistory, weekDates, goals, nutrition } = _realData;
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const todayStr = new Date().toISOString().split('T')[0];
        const todayHist = calorieHistory.find(h => h.date === todayStr);
        const todayConsumed = todayHist ? todayHist.consumed
            : (nutrition ? (nutrition.trackedMeals || []).filter(m => m.trackedAt && m.trackedAt.startsWith(todayStr)).reduce((s, m) => s + (m.calories || 0), 0) : 0);
        const weekData = weekDates.map(d => { const h = calorieHistory.find(x => x.date === d); return h ? h.consumed : 0; });
        const daysWithData = weekData.filter(v => v > 0).length;
        const weekAvg = daysWithData ? Math.round(weekData.reduce((a, b) => a + b, 0) / daysWithData) : 0;
        const target = (goals && goals.dailyCalories) || (nutrition && nutrition.dailyGoal) || 2000;
        const dayRows = weekDates.map((d, i) => {
            const v = weekData[i]; const w = Math.min(Math.round((v / target) * 100), 100);
            return `<div class="modal-bar-item"><span class="modal-bar-label">${dayNames[i]}</span><div class="modal-bar-track"><div class="modal-bar-fill" style="width:${w}%;background:var(--lime)"></div></div><span class="modal-bar-value">${v > 0 ? v.toLocaleString() : '—'}</span></div>`;
        }).join('');
        return { title: 'Avg. Calories / Day', body: `
            <div class="modal-stat-row">
                <div class="modal-stat"><div class="modal-stat-val">${todayConsumed > 0 ? todayConsumed.toLocaleString() : '—'}</div><div class="modal-stat-label">Today</div></div>
                <div class="modal-stat"><div class="modal-stat-val">${weekAvg > 0 ? weekAvg.toLocaleString() : '—'}</div><div class="modal-stat-label">Weekly Avg</div></div>
                <div class="modal-stat"><div class="modal-stat-val">${target.toLocaleString()}</div><div class="modal-stat-label">Target</div></div>
            </div>
            <div><div class="modal-section-title">This Week</div><div class="modal-bar-row">${dayRows}</div></div>`
        };
    }

    function buildStreakModal() {
        const { streak, logs } = _realData;
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const activeDaysMonth = new Set(logs.filter(l => l.date >= monthStart).map(l => l.date)).size;
        const allDates = [...new Set(logs.filter(l => l.date).map(l => l.date))].sort((a, b) => b.localeCompare(a));
        let pb = 0, cur = 0, prev = '';
        allDates.forEach(d => {
            if (!prev) { cur = 1; pb = 1; prev = d; return; }
            const [y, m, dy] = prev.split('-').map(Number);
            const dayBefore = new Date(Date.UTC(y, m - 1, dy));
            dayBefore.setUTCDate(dayBefore.getUTCDate() - 1);
            if (d === dayBefore.toISOString().split('T')[0]) { cur++; pb = Math.max(pb, cur); } else { cur = 1; }
            prev = d;
        });
        const milestones = [7, 10, 14, 30, 50, 100];
        const icons = { 7: '🏅', 10: '⚡', 14: '🔥', 30: '🎯', 50: '🚀', 100: '👑' };
        const milestoneRows = milestones.filter(m => m <= Math.max(streak, 7)).map(m => {
            const reached = streak >= m;
            return `<div class="modal-list-item"><span class="modal-list-label">${icons[m]} ${m}-Day Streak</span><span class="modal-list-value" style="color:${reached ? '#A78BFA' : 'var(--text-muted)'}">${reached ? 'Unlocked' : 'Locked'}</span></div>`;
        }).join('');
        const nextMilestone = milestones.find(m => m > streak);
        return { title: 'Active Streak', body: `
            <div class="modal-stat-row">
                <div class="modal-stat"><div class="modal-stat-val">${streak}</div><div class="modal-stat-label">Current Streak</div></div>
                <div class="modal-stat"><div class="modal-stat-val" style="color:#A78BFA">${pb}</div><div class="modal-stat-label">Personal Best</div></div>
                <div class="modal-stat"><div class="modal-stat-val">${activeDaysMonth}</div><div class="modal-stat-label">Active Days / Mo</div></div>
            </div>
            <div><div class="modal-section-title">Milestones</div><div class="modal-list">${milestoneRows}${nextMilestone ? `<div class="modal-list-item"><span class="modal-list-label">🎯 Next: ${nextMilestone}-Day</span><span class="modal-list-value" style="color:var(--text-muted)">${nextMilestone - streak} days to go</span></div>` : ''}</div></div>`
        };
    }

    function buildProgressModal() {
        const { logs, weekDates } = _realData;
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const activeDays = weekDates.filter(d => logs.some(l => l.date === d)).length;
        const progressPct = Math.round((activeDays / 7) * 100);
        const weekWorkouts = logs.filter(l => (l.category || l.type) === 'Workout' && weekDates.includes(l.date)).length;
        const dayRows = weekDates.map(d => {
            const dl = logs.filter(l => l.date === d);
            const dn = dayNames[new Date(d).getDay()];
            const steps = dl.reduce((s, l) => s + (parseInt(l.steps) || 0), 0);
            const dur = dl.reduce((s, l) => s + (parseInt(l.duration) || 0), 0);
            const active = dl.length > 0;
            const type = active ? (dl[0].category || dl[0].type || 'Activity') : 'Rest day';
            return `<div class="modal-list-item">
                <div><div style="font-size:0.78rem;font-weight:600;color:${active ? 'var(--text)' : 'var(--text-muted)'}">${dn} — ${type}${dur ? ` · ${dur} min` : ''}</div><div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px">${steps > 0 ? steps.toLocaleString() + ' steps' : '—'}</div></div>
                <span>${active ? '✅' : '—'}</span>
            </div>`;
        }).join('');
        return { title: 'Weekly Progress', body: `
            <div class="modal-stat-row">
                <div class="modal-stat"><div class="modal-stat-val">${progressPct}%</div><div class="modal-stat-label">Complete</div></div>
                <div class="modal-stat"><div class="modal-stat-val">${activeDays}</div><div class="modal-stat-label">Active Days</div></div>
                <div class="modal-stat"><div class="modal-stat-val">${weekWorkouts}</div><div class="modal-stat-label">Workouts</div></div>
            </div>
            <div><div class="modal-section-title">Day by Day Activity</div><div class="modal-list">${dayRows}</div></div>`
        };
    }

    function buildDailyCaloriesModal() {
        const { nutrition, goals } = _realData;
        const todayStr = new Date().toISOString().split('T')[0];
        const todayMeals = (nutrition && nutrition.trackedMeals || []).filter(m => m.trackedAt && m.trackedAt.startsWith(todayStr));
        const consumed = todayMeals.reduce((s, m) => s + (m.calories || 0), 0);
        const target = (goals && goals.dailyCalories) || (nutrition && nutrition.dailyGoal) || 2000;
        const remaining = Math.max(0, target - consumed);
        const protein = todayMeals.reduce((s, m) => s + (m.protein || 0), 0);
        const carbs = todayMeals.reduce((s, m) => s + (m.carbs || 0), 0);
        const fat = todayMeals.reduce((s, m) => s + (m.fat || 0), 0);
        const carbGoal = Math.round(target * 0.50 / 4);
        const fatGoal = Math.round(target * 0.25 / 9);
        const proteinGoal = Math.round(target * 0.25 / 4);
        const catColors = { Breakfast: 'var(--lime)', Lunch: '#38BDF8', Dinner: '#F59E0B', Snack: '#F87171' };
        const catRows = ['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(cat => {
            const cals = todayMeals.filter(m => m.category === cat).reduce((s, m) => s + (m.calories || 0), 0);
            const pct = cals > 0 ? Math.min(Math.round((cals / target) * 100), 100) : 0;
            return `<div class="modal-bar-item"><span class="modal-bar-label">${cat}</span><div class="modal-bar-track"><div class="modal-bar-fill" style="width:${pct}%;background:${catColors[cat]}"></div></div><span class="modal-bar-value">${cals > 0 ? cals + ' kcal' : '—'}</span></div>`;
        }).join('');
        return { title: 'Daily Calories Detail', body: `
            <div class="modal-stat-row">
                <div class="modal-stat"><div class="modal-stat-val">${consumed.toLocaleString()}</div><div class="modal-stat-label">Consumed</div></div>
                <div class="modal-stat"><div class="modal-stat-val">${target.toLocaleString()}</div><div class="modal-stat-label">Target</div></div>
                <div class="modal-stat"><div class="modal-stat-val" style="color:var(--lime)">${remaining.toLocaleString()}</div><div class="modal-stat-label">Remaining</div></div>
            </div>
            <div><div class="modal-section-title">Meal Breakdown</div><div class="modal-bar-row">${catRows}</div></div>
            <div class="modal-list">
                <div class="modal-list-item"><span class="modal-list-label">🟢 Carbs</span><span class="modal-list-value accent">${carbs}g / ${carbGoal}g</span></div>
                <div class="modal-list-item"><span class="modal-list-label">🔴 Fat</span><span class="modal-list-value" style="color:#F87171">${fat}g / ${fatGoal}g</span></div>
                <div class="modal-list-item"><span class="modal-list-label">🔵 Protein</span><span class="modal-list-value" style="color:#38BDF8">${protein}g / ${proteinGoal}g</span></div>
            </div>`
        };
    }

    function buildComboChartModal() {
        const { logs, weekDates } = _realData;
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        let totalMin = 0, totalSteps = 0, peakDay = '—', peakSteps = 0;
        const rows = weekDates.map((d, i) => {
            const dur = logs.filter(l => l.date === d).reduce((s, l) => s + (parseInt(l.duration) || 0), 0);
            const steps = logs.filter(l => l.date === d).reduce((s, l) => s + (parseInt(l.steps) || 0), 0);
            totalMin += dur; totalSteps += steps;
            if (steps > peakSteps) { peakSteps = steps; peakDay = dayNames[i]; }
            return `<div class="modal-list-item">
                <span class="modal-list-label" style="color:var(--text);font-weight:700">${dayNames[i]}</span>
                <div style="display:flex;gap:16px;font-size:0.78rem">
                    <span style="color:rgba(180,212,0,0.7)">⏱ ${dur > 0 ? dur + ' min' : '—'}</span>
                    <span class="modal-list-value accent">👟 ${steps > 0 ? steps.toLocaleString() : '—'}</span>
                </div>
            </div>`;
        }).join('');
        return { title: 'Activity Duration & Steps', body: `
            <div class="modal-section-title">This Week's Breakdown</div>
            <div class="modal-list">${rows}</div>
            <div class="modal-stat-row">
                <div class="modal-stat"><div class="modal-stat-val">${totalMin || '—'}</div><div class="modal-stat-label">Total Min</div></div>
                <div class="modal-stat"><div class="modal-stat-val">${totalSteps > 0 ? (totalSteps / 1000).toFixed(1) + 'k' : '—'}</div><div class="modal-stat-label">Total Steps</div></div>
                <div class="modal-stat"><div class="modal-stat-val">${peakDay}</div><div class="modal-stat-label">Peak Day</div></div>
            </div>`
        };
    }

    function buildCalorieBalanceModal() {
        const { weekDates, calorieHistory, logs } = _realData;
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        let totalConsumed = 0, totalBurned = 0;
        const rows = weekDates.map((d, i) => {
            const hist = calorieHistory.find(h => h.date === d);
            const c = hist ? hist.consumed : 0;
            const b = logs.filter(l => l.date === d).reduce((s, l) => s + (parseInt(l.caloriesBurned) || 0), 0);
            totalConsumed += c; totalBurned += b;
            const net = b - c;
            return `<div class="modal-list-item">
                <span style="font-weight:700;color:var(--text);width:36px">${dayNames[i]}</span>
                <div style="display:flex;gap:10px;font-size:0.75rem;flex:1;justify-content:flex-end;flex-wrap:wrap">
                    ${c > 0 ? `<span style="color:#F87171">↑ ${c.toLocaleString()}</span>` : '<span style="color:var(--text-muted)">— consumed</span>'}
                    ${b > 0 ? `<span style="color:var(--lime)">🔥 ${b.toLocaleString()}</span>` : '<span style="color:var(--text-muted)">— burned</span>'}
                    ${(c > 0 || b > 0) ? `<span style="font-weight:700;color:${net >= 0 ? 'var(--lime)' : '#F87171'}">Net ${net >= 0 ? '+' : ''}${net}</span>` : ''}
                </div>
            </div>`;
        }).join('');
        const weekNet = totalBurned - totalConsumed;
        return { title: 'Calorie Balance', body: `
            <div class="modal-section-title">Consumed vs Burned This Week</div>
            <div class="modal-list">${rows}</div>
            <div class="modal-stat-row">
                <div class="modal-stat"><div class="modal-stat-val" style="color:#F87171">${totalConsumed > 0 ? (totalConsumed / 1000).toFixed(1) + 'k' : '—'}</div><div class="modal-stat-label">Total Consumed</div></div>
                <div class="modal-stat"><div class="modal-stat-val">${totalBurned > 0 ? (totalBurned / 1000).toFixed(1) + 'k' : '—'}</div><div class="modal-stat-label">Total Burned</div></div>
                <div class="modal-stat"><div class="modal-stat-val" style="color:${weekNet >= 0 ? 'var(--lime)' : '#F87171'}">${(totalConsumed > 0 || totalBurned > 0) ? (weekNet >= 0 ? '+' : '') + weekNet : '—'}</div><div class="modal-stat-label">Net (Week)</div></div>
            </div>`
        };
    }

    function buildGoalWorkoutsModal() {
        const { logs, weekDates, goals } = _realData;
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const workoutGoal = (goals && goals.weeklyWorkouts) || 5;
        const weekWorkouts = logs.filter(l => (l.category || l.type) === 'Workout' && weekDates.includes(l.date));
        const completed = weekWorkouts.length;
        const pct = Math.min(Math.round((completed / workoutGoal) * 100), 100);
        const sessions = weekWorkouts.sort((a, b) => a.date.localeCompare(b.date)).map(w => {
            const d = new Date(w.date);
            return `<div class="modal-list-item"><span class="modal-list-label">${dayNames[d.getDay()]} — ${w.category || w.type || 'Workout'}</span><span class="modal-list-value accent">${w.duration || '—'} min ✅</span></div>`;
        }).join('');
        const remaining = Math.max(0, workoutGoal - completed);
        return { title: 'Workouts Goal', body: `
            <div class="modal-stat-row">
                <div class="modal-stat"><div class="modal-stat-val">${completed}</div><div class="modal-stat-label">Completed</div></div>
                <div class="modal-stat"><div class="modal-stat-val">${workoutGoal}</div><div class="modal-stat-label">Goal</div></div>
                <div class="modal-stat"><div class="modal-stat-val">${pct}%</div><div class="modal-stat-label">Progress</div></div>
            </div>
            <div><div class="modal-section-title">Sessions This Week</div><div class="modal-list">${sessions || '<div style="color:var(--text-muted);font-size:0.8rem;padding:8px 0">No workouts logged yet</div>'}${remaining > 0 ? `<div class="modal-list-item" style="opacity:0.5"><span class="modal-list-label">${remaining} session${remaining > 1 ? 's' : ''} remaining</span><span class="modal-list-value" style="color:var(--text-muted)">pending</span></div>` : ''}</div></div>`
        };
    }

    function buildGoalStepsModal() {
        const { logs, weekDates, goals } = _realData;
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const stepGoal = (goals && goals.dailySteps) || 10000;
        const weekSteps = weekDates.map(d => logs.filter(l => l.date === d).reduce((s, l) => s + (parseInt(l.steps) || 0), 0));
        const metDays = weekSteps.filter(s => s >= stepGoal).length;
        const pct = Math.round((metDays / 7) * 100);
        const rows = weekDates.map((d, i) => {
            const s = weekSteps[i]; const met = s >= stepGoal;
            return `<div class="modal-list-item"><span class="modal-list-label" style="color:var(--text)">${dayNames[i]}</span><span class="modal-list-value ${met ? 'accent' : ''}">${s > 0 ? s.toLocaleString() + ' steps' : '—'} ${s > 0 ? (met ? '✅' : '❌') : ''}</span></div>`;
        }).join('');
        return { title: 'Step Goal', body: `
            <div class="modal-stat-row">
                <div class="modal-stat"><div class="modal-stat-val">${metDays}</div><div class="modal-stat-label">Days Met</div></div>
                <div class="modal-stat"><div class="modal-stat-val" style="color:#38BDF8">${(stepGoal / 1000).toFixed(0)}k</div><div class="modal-stat-label">Daily Goal</div></div>
                <div class="modal-stat"><div class="modal-stat-val" style="color:#38BDF8">${pct}%</div><div class="modal-stat-label">Progress</div></div>
            </div>
            <div><div class="modal-section-title">Daily Performance</div><div class="modal-list">${rows}</div></div>`
        };
    }

    function buildGoalCaloriesModal() {
        const { calorieHistory, weekDates, goals, nutrition } = _realData;
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const calGoal = (goals && goals.dailyCalories) || (nutrition && nutrition.dailyGoal) || 2000;
        const weekData = weekDates.map(d => { const h = calorieHistory.find(x => x.date === d); return h ? h.consumed : 0; });
        const metDays = weekData.filter(c => c > 0 && c <= calGoal).length;
        const rows = weekDates.map((d, i) => {
            const c = weekData[i]; const met = c > 0 && c <= calGoal;
            return `<div class="modal-list-item"><span class="modal-list-label" style="color:var(--text)">${dayNames[i]}</span><span class="modal-list-value ${met ? 'accent' : ''}">${c > 0 ? c.toLocaleString() + ' kcal' : '—'} ${c > 0 ? (met ? '✅' : '❌') : ''}</span></div>`;
        }).join('');
        return { title: 'Calorie Target', body: `
            <div class="modal-stat-row">
                <div class="modal-stat"><div class="modal-stat-val">${metDays}</div><div class="modal-stat-label">Days Met</div></div>
                <div class="modal-stat"><div class="modal-stat-val" style="color:#F59E0B">${calGoal.toLocaleString()}</div><div class="modal-stat-label">Daily Target</div></div>
                <div class="modal-stat"><div class="modal-stat-val" style="color:#F59E0B">${Math.round((metDays / 7) * 100)}%</div><div class="modal-stat-label">Progress</div></div>
            </div>
            <div><div class="modal-section-title">Daily Calorie Log</div><div class="modal-list">${rows}</div></div>`
        };
    }

    function buildBodyMetricsModal() {
        const { weightLogs, profile } = _realData;
        const sorted = [...weightLogs].sort((a, b) => a.date.localeCompare(b.date));
        const currentWeight = sorted.length > 0 ? sorted[sorted.length - 1].weight : (profile && profile.weight) || 0;
        const startWeight = sorted.length > 0 ? sorted[0].weight : currentWeight;
        const lost = Math.max(0, parseFloat((startWeight - currentWeight).toFixed(1)));
        const heightM = ((profile && profile.height) || 0) / 100;
        const bmi = heightM > 0 ? parseFloat((currentWeight / (heightM * heightM)).toFixed(1)) : null;
        let bmiLabel = '—', bmiColor = 'var(--text)';
        if (bmi) {
            if (bmi < 18.5) { bmiLabel = 'Underweight'; bmiColor = '#38BDF8'; }
            else if (bmi < 25) { bmiLabel = 'Normal ✓'; bmiColor = 'var(--lime)'; }
            else if (bmi < 30) { bmiLabel = 'Overweight'; bmiColor = '#F59E0B'; }
            else { bmiLabel = 'Obese'; bmiColor = '#F87171'; }
        }
        const recentRows = sorted.slice(-5).reverse().map(l => `<div class="modal-list-item"><span class="modal-list-label">${l.date}</span><span class="modal-list-value accent">${l.weight} kg</span></div>`).join('');
        return { title: 'Body Metrics', body: `
            <div class="modal-stat-row">
                <div class="modal-stat"><div class="modal-stat-val">${currentWeight || '—'}</div><div class="modal-stat-label">Current (kg)</div></div>
                <div class="modal-stat"><div class="modal-stat-val" style="color:var(--lime)">${lost}</div><div class="modal-stat-label">Lost (kg)</div></div>
                <div class="modal-stat"><div class="modal-stat-val">${bmi || '—'}</div><div class="modal-stat-label">BMI</div></div>
            </div>
            ${bmi ? `<div><div class="modal-section-title">BMI Status</div><div class="modal-list-item"><span class="modal-list-label" style="color:${bmiColor}">${bmiLabel}</span><span class="modal-list-value">${bmi}</span></div></div>` : ''}
            <div><div class="modal-section-title">Recent Weigh-ins</div><div class="modal-list">${recentRows || '<div style="color:var(--text-muted);font-size:0.8rem;padding:8px 0">No weight logs yet. Log your weight in Profile.</div>'}</div></div>
            <div class="modal-list">
                <div class="modal-list-item"><span class="modal-list-label">Start weight</span><span class="modal-list-value">${startWeight || '—'} kg</span></div>
                <div class="modal-list-item"><span class="modal-list-label">Current weight</span><span class="modal-list-value accent">${currentWeight || '—'} kg</span></div>
                <div class="modal-list-item"><span class="modal-list-label">Height</span><span class="modal-list-value">${profile && profile.height ? profile.height + ' cm' : '—'}</span></div>
            </div>`
        };
    }

    /* ── ATTACH CLICK HANDLERS ────────────────────────────────── */
    const statKeys = ['workouts', 'steps', 'calories', 'streak'];
    const statBuilders = [buildWorkoutsModal, buildStepsModal, buildCaloriesModal, buildStreakModal];
    document.querySelectorAll('.summary-card').forEach((card, i) => {
        card.classList.add('clickable');
        card.addEventListener('click', () => { const m = statBuilders[i](); openModal(m.title, m.body); });
    });

    const progressCard = document.querySelector('.progress-hero-card');
    if (progressCard) {
        progressCard.classList.add('clickable');
        progressCard.addEventListener('click', () => { const m = buildProgressModal(); openModal(m.title, m.body); });
    }

    const calorieHeroCard = document.querySelector('.calorie-card');
    if (calorieHeroCard) {
        calorieHeroCard.classList.add('clickable');
        calorieHeroCard.addEventListener('click', () => { const m = buildDailyCaloriesModal(); openModal(m.title, m.body); });
    }

    function addDetailsBar(canvasId, builderFn) {
        const card = document.getElementById(canvasId)?.closest('.chart-card');
        if (!card) return;
        const bar = document.createElement('div');
        bar.className = 'chart-details-bar';
        bar.innerHTML = 'View Details <i class="bi bi-arrow-up-right"></i>';
        bar.addEventListener('click', () => { const m = builderFn(); openModal(m.title, m.body); });
        card.appendChild(bar);
    }
    addDetailsBar('comboChart', buildComboChartModal);
    addDetailsBar('calorieBalanceChart', buildCalorieBalanceModal);

    const goalBuilders = [buildGoalWorkoutsModal, buildGoalStepsModal, buildGoalCaloriesModal];
    document.querySelectorAll('.goal-ring-item').forEach((item, i) => {
        item.classList.add('clickable');
        item.addEventListener('click', () => { const m = goalBuilders[i](); openModal(m.title, m.body); });
    });

    const bodyCard = document.querySelector('.body-metrics-card');
    if (bodyCard) {
        bodyCard.classList.add('clickable');
        bodyCard.addEventListener('click', () => { const m = buildBodyMetricsModal(); openModal(m.title, m.body); });
    }

    /* ── INIT ─────────────────────────────────────────────────── */
    buildWeekStrip([]);
    onAuthStateChanged(auth, (user) => {
        if (user) updateDashboard(user.uid);
    });
});
