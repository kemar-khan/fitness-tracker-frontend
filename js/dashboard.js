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
    const weightLabels = ['Apr 1', 'Apr 3', 'Apr 5', 'Apr 7', 'Apr 9', 'Apr 11', 'Apr 13', 'Apr 15', 'Apr 17', 'Apr 19', 'Apr 21', 'Apr 23', 'Apr 25', 'Apr 27', 'Apr 28'];
    const weightData = [74.2, 74.0, 73.8, 73.9, 73.5, 73.3, 73.1, 72.9, 73.0, 72.7, 72.5, 72.3, 72.4, 72.2, 72.1];

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

    async function updateDashboard(uid) {
        try {
            const snap = await getDocs(collection(db, 'users', uid, 'activities'));
            const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            const workoutsCount = logs.filter(l => (l.category || l.type) === 'Workout').length;
            const allSteps = logs.map(l => parseInt(l.steps) || 0).filter(s => s > 0);
            const avgSteps = allSteps.length > 0 ? Math.round(allSteps.reduce((a, b) => a + b, 0) / allSteps.length) : 0;
            const streak = calcStreak(logs);

            setStat('summaryWorkouts', workoutsCount);
            setStat('summarySteps', avgSteps > 0 ? avgSteps.toLocaleString() : '0');
            setStat('summaryStreak', streak);

            const todayStr = new Date().toISOString().split('T')[0];
            const todaySteps = logs.filter(l => l.date === todayStr).reduce((s, l) => s + (parseInt(l.steps) || 0), 0);
            if (todaySteps > 0) setStat('stepsToday', todaySteps.toLocaleString());

            const streakBadge = document.getElementById('streakDays');
            if (streakBadge) streakBadge.textContent = streak;

            buildWeekStrip(logs);
            updateWeeklyCharts(logs);
            updateGoalRings(logs);
            setAIText(generateAIInsight(logs));

            try {
                const userDoc = await getDoc(doc(db, 'users', uid));
                if (userDoc.exists()) {
                    const nutrition = userDoc.data().nutrition;
                    if (nutrition) updateCalorieUI(nutrition);
                }
            } catch (_) {}
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

    /* ── MODAL CONTENT DEFINITIONS ───────────────────────────── */
    const MODAL = {
        workouts: {
            title: 'Total Workouts',
            body: `
                <div class="modal-stat-row">
                    <div class="modal-stat"><div class="modal-stat-val">4</div><div class="modal-stat-label">This Week</div></div>
                    <div class="modal-stat"><div class="modal-stat-val">18</div><div class="modal-stat-label">This Month</div></div>
                    <div class="modal-stat"><div class="modal-stat-val">6</div><div class="modal-stat-label">Best Week</div></div>
                </div>
                <div>
                    <div class="modal-section-title">Workout Types</div>
                    <div class="modal-bar-row">
                        <div class="modal-bar-item"><span class="modal-bar-label">Running</span><div class="modal-bar-track"><div class="modal-bar-fill" style="width:40%;background:var(--lime)"></div></div><span class="modal-bar-value">40%</span></div>
                        <div class="modal-bar-item"><span class="modal-bar-label">Cycling</span><div class="modal-bar-track"><div class="modal-bar-fill" style="width:30%;background:#38BDF8"></div></div><span class="modal-bar-value">30%</span></div>
                        <div class="modal-bar-item"><span class="modal-bar-label">Strength</span><div class="modal-bar-track"><div class="modal-bar-fill" style="width:30%;background:#F59E0B"></div></div><span class="modal-bar-value">30%</span></div>
                    </div>
                </div>
                <div>
                    <div class="modal-section-title">Recent Sessions</div>
                    <div class="modal-list">
                        <div class="modal-list-item"><span class="modal-list-label">Sat — Running</span><span class="modal-list-value accent">90 min</span></div>
                        <div class="modal-list-item"><span class="modal-list-label">Fri — Strength</span><span class="modal-list-value accent">45 min</span></div>
                        <div class="modal-list-item"><span class="modal-list-label">Wed — Cycling</span><span class="modal-list-value accent">60 min</span></div>
                        <div class="modal-list-item"><span class="modal-list-label">Mon — Running</span><span class="modal-list-value accent">45 min</span></div>
                    </div>
                </div>`
        },
        steps: {
            title: 'Avg. Daily Steps',
            body: `
                <div class="modal-stat-row">
                    <div class="modal-stat"><div class="modal-stat-val">8,240</div><div class="modal-stat-label">Today</div></div>
                    <div class="modal-stat"><div class="modal-stat-val">8,847</div><div class="modal-stat-label">Weekly Avg</div></div>
                    <div class="modal-stat"><div class="modal-stat-val">12k</div><div class="modal-stat-label">Best Day</div></div>
                </div>
                <div>
                    <div class="modal-section-title">This Week's Breakdown</div>
                    <div class="modal-bar-row">
                        ${[['Mon','8,000',80],['Tue','7,500',75],['Wed','10,200',100],['Thu','6,000',60],['Fri','8,800',88],['Sat','12,000',100],['Sun','9,500',95]]
                            .map(([d,v,w]) => `<div class="modal-bar-item"><span class="modal-bar-label">${d}</span><div class="modal-bar-track"><div class="modal-bar-fill" style="width:${w}%;background:${w>=100?'var(--lime)':'rgba(180,212,0,0.4)'}"></div></div><span class="modal-bar-value">${v}</span></div>`).join('')}
                    </div>
                </div>
                <div class="modal-list-item"><span class="modal-list-label">Goal (10,000/day) met on</span><span class="modal-list-value accent">4 / 7 days</span></div>`
        },
        calories: {
            title: 'Avg. Calories / Day',
            body: `
                <div class="modal-stat-row">
                    <div class="modal-stat"><div class="modal-stat-val">2,104</div><div class="modal-stat-label">Today</div></div>
                    <div class="modal-stat"><div class="modal-stat-val">2,022</div><div class="modal-stat-label">Weekly Avg</div></div>
                    <div class="modal-stat"><div class="modal-stat-val">2,200</div><div class="modal-stat-label">Target</div></div>
                </div>
                <div>
                    <div class="modal-section-title">Meal Breakdown (Today)</div>
                    <div class="modal-bar-row">
                        <div class="modal-bar-item"><span class="modal-bar-label">Breakfast</span><div class="modal-bar-track"><div class="modal-bar-fill" style="width:28%;background:var(--lime)"></div></div><span class="modal-bar-value">590 kcal</span></div>
                        <div class="modal-bar-item"><span class="modal-bar-label">Lunch</span><div class="modal-bar-track"><div class="modal-bar-fill" style="width:38%;background:#38BDF8"></div></div><span class="modal-bar-value">800 kcal</span></div>
                        <div class="modal-bar-item"><span class="modal-bar-label">Dinner</span><div class="modal-bar-track"><div class="modal-bar-fill" style="width:29%;background:#F59E0B"></div></div><span class="modal-bar-value">614 kcal</span></div>
                        <div class="modal-bar-item"><span class="modal-bar-label">Snacks</span><div class="modal-bar-track"><div class="modal-bar-fill" style="width:5%;background:#F87171"></div></div><span class="modal-bar-value">100 kcal</span></div>
                    </div>
                </div>
                <div class="modal-list-item"><span class="modal-list-label">Remaining today</span><span class="modal-list-value accent">96 kcal</span></div>`
        },
        streak: {
            title: 'Active Streak',
            body: `
                <div class="modal-stat-row">
                    <div class="modal-stat"><div class="modal-stat-val">14</div><div class="modal-stat-label">Current Streak</div></div>
                    <div class="modal-stat"><div class="modal-stat-val" style="color:#A78BFA">14</div><div class="modal-stat-label">Personal Best</div></div>
                    <div class="modal-stat"><div class="modal-stat-val">22</div><div class="modal-stat-label">Active Days / Mo</div></div>
                </div>
                <div>
                    <div class="modal-section-title">Milestones Unlocked</div>
                    <div class="modal-list">
                        <div class="modal-list-item"><span class="modal-list-label">🔥 14-Day Streak</span><span class="modal-list-value accent">Personal Best!</span></div>
                        <div class="modal-list-item"><span class="modal-list-label">⚡ 10-Day Streak</span><span class="modal-list-value" style="color:#A78BFA">Unlocked</span></div>
                        <div class="modal-list-item"><span class="modal-list-label">🏅 7-Day Streak</span><span class="modal-list-value" style="color:#A78BFA">Unlocked</span></div>
                        <div class="modal-list-item"><span class="modal-list-label">🎯 30-Day Streak</span><span class="modal-list-value" style="color:var(--text-muted)">16 days to go</span></div>
                    </div>
                </div>`
        },
        progress: {
            title: 'Weekly Progress',
            body: `
                <div class="modal-stat-row">
                    <div class="modal-stat"><div class="modal-stat-val">74%</div><div class="modal-stat-label">Complete</div></div>
                    <div class="modal-stat"><div class="modal-stat-val">6</div><div class="modal-stat-label">Active Days</div></div>
                    <div class="modal-stat"><div class="modal-stat-val">5/7</div><div class="modal-stat-label">Goals Met</div></div>
                </div>
                <div>
                    <div class="modal-section-title">Day by Day Activity</div>
                    <div class="modal-list">
                        ${[['Sun','Rest day','—',false],['Mon','Running · 45 min','8,000 steps',true],['Tue','Cycling · 30 min','7,500 steps',true],['Wed','Strength · 60 min','10,200 steps',true],['Thu','Running · 35 min','6,000 steps',true],['Fri','Strength · 45 min','8,800 steps',true],['Sat','Running · 90 min','12,000 steps',true]]
                            .map(([d,a,s,active]) => `
                            <div class="modal-list-item">
                                <div><div style="font-size:0.78rem;font-weight:600;color:${active?'var(--text)':'var(--text-muted)'}">${d} — ${a}</div><div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px">${s}</div></div>
                                <span>${active?'✅':'—'}</span>
                            </div>`).join('')}
                    </div>
                </div>`
        },
        dailyCalories: {
            title: 'Daily Calories Detail',
            body: `
                <div class="modal-stat-row">
                    <div class="modal-stat"><div class="modal-stat-val">1,250</div><div class="modal-stat-label">Consumed</div></div>
                    <div class="modal-stat"><div class="modal-stat-val">1,920</div><div class="modal-stat-label">Target</div></div>
                    <div class="modal-stat"><div class="modal-stat-val" style="color:var(--lime)">670</div><div class="modal-stat-label">Remaining</div></div>
                </div>
                <div>
                    <div class="modal-section-title">Macronutrients</div>
                    <div class="modal-list">
                        <div class="modal-list-item"><span class="modal-list-label">🟢 Carbs</span><span class="modal-list-value accent">109g / 198g &nbsp;(55%)</span></div>
                        <div class="modal-list-item"><span class="modal-list-label">🔴 Fat</span><span class="modal-list-value" style="color:#F87171">13g / 52g &nbsp;(26%)</span></div>
                        <div class="modal-list-item"><span class="modal-list-label">🔵 Protein</span><span class="modal-list-value" style="color:#38BDF8">34g / 122g &nbsp;(28%)</span></div>
                    </div>
                </div>
                <div class="modal-list-item" style="background:rgba(180,212,0,0.05);border-color:rgba(180,212,0,0.18)"><span class="modal-list-label" style="color:var(--text-muted)">💡 Increase protein intake to support muscle recovery.</span></div>`
        },
        comboChart: {
            title: 'Activity Duration & Steps',
            body: `
                <div class="modal-section-title">This Week's Breakdown</div>
                <div class="modal-list">
                    ${[['Mon',45,'8,000'],['Tue',30,'7,500'],['Wed',60,'10,200'],['Thu',35,'6,000'],['Fri',45,'8,800'],['Sat',90,'12,000'],['Sun',20,'9,500']]
                        .map(([d,dur,steps]) => `
                        <div class="modal-list-item">
                            <span class="modal-list-label" style="color:var(--text);font-weight:700">${d}</span>
                            <div style="display:flex;gap:16px;font-size:0.78rem">
                                <span style="color:rgba(180,212,0,0.7)">⏱ ${dur} min</span>
                                <span class="modal-list-value accent">👟 ${steps}</span>
                            </div>
                        </div>`).join('')}
                </div>
                <div class="modal-stat-row">
                    <div class="modal-stat"><div class="modal-stat-val">325</div><div class="modal-stat-label">Total Min</div></div>
                    <div class="modal-stat"><div class="modal-stat-val">62k</div><div class="modal-stat-label">Total Steps</div></div>
                    <div class="modal-stat"><div class="modal-stat-val">Sat</div><div class="modal-stat-label">Peak Day</div></div>
                </div>`
        },
        calorieBalance: {
            title: 'Calorie Balance',
            body: `
                <div class="modal-section-title">Consumed vs Burned This Week</div>
                <div class="modal-list">
                    ${[['Mon',1850,2100],['Tue',2100,1950],['Wed',1950,2300],['Thu',2200,1800],['Fri',1800,2200],['Sat',2400,1950],['Sun',2050,1750]]
                        .map(([d,c,b]) => { const net = b - c; return `
                        <div class="modal-list-item">
                            <span style="font-weight:700;color:var(--text);width:36px">${d}</span>
                            <div style="display:flex;gap:10px;font-size:0.75rem;flex:1;justify-content:flex-end;flex-wrap:wrap">
                                <span style="color:#F87171">↑ ${c.toLocaleString()}</span>
                                <span style="color:var(--lime)">🔥 ${b.toLocaleString()}</span>
                                <span style="font-weight:700;color:${net>=0?'var(--lime)':'#F87171'}">Net ${net>=0?'+':''}${net}</span>
                            </div>
                        </div>`;}).join('')}
                </div>
                <div class="modal-stat-row">
                    <div class="modal-stat"><div class="modal-stat-val" style="color:#F87171">14.4k</div><div class="modal-stat-label">Total Consumed</div></div>
                    <div class="modal-stat"><div class="modal-stat-val">14.1k</div><div class="modal-stat-label">Total Burned</div></div>
                    <div class="modal-stat"><div class="modal-stat-val" style="color:#F87171">-300</div><div class="modal-stat-label">Net (Week)</div></div>
                </div>`
        },
        goalWorkouts: {
            title: 'Workouts Goal',
            body: `
                <div class="modal-stat-row">
                    <div class="modal-stat"><div class="modal-stat-val">4</div><div class="modal-stat-label">Completed</div></div>
                    <div class="modal-stat"><div class="modal-stat-val">5</div><div class="modal-stat-label">Goal</div></div>
                    <div class="modal-stat"><div class="modal-stat-val">80%</div><div class="modal-stat-label">Progress</div></div>
                </div>
                <div>
                    <div class="modal-section-title">Sessions This Week</div>
                    <div class="modal-list">
                        <div class="modal-list-item"><span class="modal-list-label">Mon — Running</span><span class="modal-list-value accent">45 min ✅</span></div>
                        <div class="modal-list-item"><span class="modal-list-label">Wed — Strength</span><span class="modal-list-value accent">60 min ✅</span></div>
                        <div class="modal-list-item"><span class="modal-list-label">Fri — Strength</span><span class="modal-list-value accent">45 min ✅</span></div>
                        <div class="modal-list-item"><span class="modal-list-label">Sat — Running</span><span class="modal-list-value accent">90 min ✅</span></div>
                        <div class="modal-list-item" style="opacity:0.5"><span class="modal-list-label">1 session remaining</span><span class="modal-list-value" style="color:var(--text-muted)">pending</span></div>
                    </div>
                </div>`
        },
        goalSteps: {
            title: 'Step Goal',
            body: `
                <div class="modal-stat-row">
                    <div class="modal-stat"><div class="modal-stat-val">4</div><div class="modal-stat-label">Days Met</div></div>
                    <div class="modal-stat"><div class="modal-stat-val" style="color:#38BDF8">10k</div><div class="modal-stat-label">Daily Goal</div></div>
                    <div class="modal-stat"><div class="modal-stat-val" style="color:#38BDF8">58%</div><div class="modal-stat-label">Progress</div></div>
                </div>
                <div>
                    <div class="modal-section-title">Daily Performance</div>
                    <div class="modal-list">
                        ${[['Mon','8,000','❌'],['Tue','7,500','❌'],['Wed','10,200','✅'],['Thu','6,000','❌'],['Fri','8,800','❌'],['Sat','12,000','✅'],['Sun','9,500','❌']]
                            .map(([d,s,m]) => `<div class="modal-list-item"><span class="modal-list-label" style="color:var(--text)">${d}</span><span class="modal-list-value ${m==='✅'?'accent':''}">${s} steps ${m}</span></div>`).join('')}
                    </div>
                </div>`
        },
        goalCalories: {
            title: 'Calorie Target',
            body: `
                <div class="modal-stat-row">
                    <div class="modal-stat"><div class="modal-stat-val">6</div><div class="modal-stat-label">Days Met</div></div>
                    <div class="modal-stat"><div class="modal-stat-val" style="color:#F59E0B">2,200</div><div class="modal-stat-label">Daily Target</div></div>
                    <div class="modal-stat"><div class="modal-stat-val" style="color:#F59E0B">85%</div><div class="modal-stat-label">Progress</div></div>
                </div>
                <div>
                    <div class="modal-section-title">Daily Calorie Log</div>
                    <div class="modal-list">
                        ${[['Mon',1850,'✅'],['Tue',2100,'✅'],['Wed',1950,'✅'],['Thu',2200,'✅'],['Fri',1800,'✅'],['Sat',2400,'❌'],['Sun',2050,'✅']]
                            .map(([d,c,m]) => `<div class="modal-list-item"><span class="modal-list-label" style="color:var(--text)">${d}</span><span class="modal-list-value ${m==='✅'?'accent':''}">${c.toLocaleString()} kcal ${m}</span></div>`).join('')}
                    </div>
                </div>`
        },
        bodyMetrics: {
            title: 'Body Metrics',
            body: `
                <div class="modal-stat-row">
                    <div class="modal-stat"><div class="modal-stat-val">72.1</div><div class="modal-stat-label">Current (kg)</div></div>
                    <div class="modal-stat"><div class="modal-stat-val" style="color:var(--lime)">2.1</div><div class="modal-stat-label">Lost (kg)</div></div>
                    <div class="modal-stat"><div class="modal-stat-val">22.4</div><div class="modal-stat-label">BMI</div></div>
                </div>
                <div>
                    <div class="modal-section-title">BMI Range</div>
                    <div class="modal-bar-row">
                        <div class="modal-bar-item"><span class="modal-bar-label" style="width:90px">Underweight</span><div class="modal-bar-track"><div class="modal-bar-fill" style="width:20%;background:#38BDF8"></div></div><span class="modal-bar-value">< 18.5</span></div>
                        <div class="modal-bar-item"><span class="modal-bar-label" style="color:var(--lime);width:90px">Normal ✓</span><div class="modal-bar-track"><div class="modal-bar-fill" style="width:74%;background:var(--lime)"></div></div><span class="modal-bar-value" style="color:var(--lime)">22.4</span></div>
                        <div class="modal-bar-item"><span class="modal-bar-label" style="width:90px">Overweight</span><div class="modal-bar-track"><div class="modal-bar-fill" style="width:0%"></div></div><span class="modal-bar-value">25–30</span></div>
                    </div>
                </div>
                <div>
                    <div class="modal-section-title">Progress Tracker</div>
                    <div class="modal-list">
                        <div class="modal-list-item"><span class="modal-list-label">Start weight</span><span class="modal-list-value">74.2 kg</span></div>
                        <div class="modal-list-item"><span class="modal-list-label">Current weight</span><span class="modal-list-value accent">72.1 kg</span></div>
                        <div class="modal-list-item"><span class="modal-list-label">Goal weight</span><span class="modal-list-value">72.0 kg</span></div>
                        <div class="modal-list-item"><span class="modal-list-label">Remaining</span><span class="modal-list-value" style="color:#F59E0B">Only 0.1 kg to go! 🎯</span></div>
                    </div>
                </div>`
        }
    };

    /* ── ATTACH CLICK HANDLERS ────────────────────────────────── */

    // Stat cards
    const statKeys = ['workouts', 'steps', 'calories', 'streak'];
    document.querySelectorAll('.summary-card').forEach((card, i) => {
        card.classList.add('clickable');
        card.addEventListener('click', () => openModal(MODAL[statKeys[i]].title, MODAL[statKeys[i]].body));
    });

    // Weekly Progress ring card
    const progressCard = document.querySelector('.progress-hero-card');
    if (progressCard) {
        progressCard.classList.add('clickable');
        progressCard.addEventListener('click', () => openModal(MODAL.progress.title, MODAL.progress.body));
    }

    // Daily Calories card
    const calorieHeroCard = document.querySelector('.calorie-card');
    if (calorieHeroCard) {
        calorieHeroCard.classList.add('clickable');
        calorieHeroCard.addEventListener('click', () => openModal(MODAL.dailyCalories.title, MODAL.dailyCalories.body));
    }

    // Inject "View Details" footer bar into combo chart card and calorie balance card
    function addDetailsBar(canvasId, modalKey) {
        const card = document.getElementById(canvasId)?.closest('.chart-card');
        if (!card) return;
        const bar = document.createElement('div');
        bar.className = 'chart-details-bar';
        bar.innerHTML = 'View Details <i class="bi bi-arrow-up-right"></i>';
        bar.addEventListener('click', () => openModal(MODAL[modalKey].title, MODAL[modalKey].body));
        card.appendChild(bar);
    }
    addDetailsBar('comboChart',          'comboChart');
    addDetailsBar('calorieBalanceChart', 'calorieBalance');

    // Goal ring items
    const goalKeys = ['goalWorkouts', 'goalSteps', 'goalCalories'];
    document.querySelectorAll('.goal-ring-item').forEach((item, i) => {
        item.classList.add('clickable');
        item.addEventListener('click', () => openModal(MODAL[goalKeys[i]].title, MODAL[goalKeys[i]].body));
    });

    // Body Metrics card
    const bodyCard = document.querySelector('.body-metrics-card');
    if (bodyCard) {
        bodyCard.classList.add('clickable');
        bodyCard.addEventListener('click', () => openModal(MODAL.bodyMetrics.title, MODAL.bodyMetrics.body));
    }

    /* ── INIT ─────────────────────────────────────────────────── */
    buildWeekStrip([]);
    onAuthStateChanged(auth, (user) => {
        if (user) updateDashboard(user.uid);
    });
});
