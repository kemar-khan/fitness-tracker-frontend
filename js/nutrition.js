/* ═══════════════════════════════════════════════════════════════
   FitPulse — Nutrition Planner Logic
   High-Contrast Lime & Black Edition
   ═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
    // --- DATA ---
    const mealDatabase = [
        { id: 1, name: "Grilled Chicken Salad", category: "Lunch", calories: 350, protein: 35, carbs: 10, fat: 12, img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80" },
        { id: 2, name: "Oatmeal with Berries", category: "Breakfast", calories: 280, protein: 8, carbs: 45, fat: 5, img: "https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=200&q=80" },
        { id: 3, name: "Salmon with Asparagus", category: "Dinner", calories: 420, protein: 30, carbs: 5, fat: 25, img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&q=80" },
        { id: 4, name: "Avocado Toast", category: "Breakfast", calories: 310, protein: 7, carbs: 28, fat: 18, img: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&q=80" },
        { id: 5, name: "Beef & Broccoli", category: "Lunch", calories: 450, protein: 28, carbs: 35, fat: 15, img: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&q=80" },
        { id: 6, name: "Greek Yogurt Parfait", category: "Snack", calories: 220, protein: 15, carbs: 25, fat: 6, img: "https://images.unsplash.com/photo-1488477181946-6228a0291777?w=200&q=80" }
    ];

    let favorites = JSON.parse(localStorage.getItem('favoriteMeals')) || [];
    let trackedMeals = JSON.parse(localStorage.getItem('trackedMeals')) || [];
    let dailyGoal = parseInt(localStorage.getItem('dailyCalorieGoal')) || 2500;

    // --- DOM ---
    const mealSearch = document.getElementById('mealSearch');
    const mealResults = document.getElementById('mealResults');
    const favoritesList = document.getElementById('favoritesList');

    // Modals
    const calculatorModal = document.getElementById('calculatorModal');
    const goalModal = document.getElementById('goalModal');

    // --- STATE ---
    let pendingCategory = null;

    // ── INITIALIZATION ──────────────────────────────────────────
    function init() {
        renderJournal();
        renderDiscovery();
        renderFavorites();
        updateStats();
        renderCalorieMetrics();
    }

    // ── JOURNAL RENDERING ───────────────────────────────────────
    function renderJournal() {
        const categories = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
        categories.forEach(cat => {
            const container = document.getElementById(`items${cat}`);
            const countEl = document.getElementById(`count${cat}`);
            if (!container) return;

            const items = trackedMeals.filter(m => m.category === cat);
            countEl.textContent = items.length;

            if (items.length === 0) {
                container.innerHTML = `<p style="font-size: 0.8rem; color: #444; padding: 10px 0;">No ${cat.toLowerCase()} logged.</p>`;
            } else {
                container.innerHTML = items.map(m => `
                    <div class="item-card">
                        <div class="item-icon"><i class="bi bi-check-circle-fill"></i></div>
                        <div class="item-body">
                            <div class="item-title">${m.name}</div>
                            <div class="item-meta">${m.calories} kcal • P:${m.protein}g C:${m.carbs}g F:${m.fat}g</div>
                        </div>
                        <div class="item-actions">
                            <button class="btn-small danger" onclick="removeTracked('${m.trackedAt}')"><i class="bi bi-trash"></i></button>
                        </div>
                    </div>
                `).join('');
            }
        });
    }

    // ── DISCOVERY RENDERING ─────────────────────────────────────
    function renderDiscovery(query = '') {
        const filtered = mealDatabase.filter(m => m.name.toLowerCase().includes(query.toLowerCase()));
        mealResults.innerHTML = filtered.map(m => `
            <div class="result-item">
                <div class="result-img" style="background-image: url('${m.img}')"></div>
                <div class="result-info">
                    <span class="result-name">${m.name}</span>
                    <span class="result-stats">${m.calories} kcal • ${m.category}</span>
                </div>
                <button class="btn-small" onclick="trackFromSearch(${m.id})"><i class="bi bi-plus-lg"></i></button>
            </div>
        `).join('');
    }

    function renderFavorites() {
        if (!favoritesList) return;
        if (favorites.length === 0) {
            favoritesList.innerHTML = '<p style="font-size: 0.8rem; color: #444;">No favorites yet.</p>';
            return;
        }
        favoritesList.innerHTML = favorites.map(m => `
            <div class="fav-item">
                <div class="fav-info">
                    <span class="fav-name">${m.name}</span>
                    <span class="fav-stats">${m.calories} kcal • ${m.category}</span>
                </div>
                <button class="btn-small" onclick="trackFromSearch(${m.id})"><i class="bi bi-plus-lg"></i></button>
            </div>
        `).join('');
    }

    // ── STATS ───────────────────────────────────────────────────
    function updateStats() {
        const consumed = trackedMeals.reduce((sum, m) => sum + m.calories, 0);
        const remaining = dailyGoal - consumed;

        const protein = trackedMeals.reduce((sum, m) => sum + m.protein, 0);
        const carbs = trackedMeals.reduce((sum, m) => sum + m.carbs, 0);
        const fat = trackedMeals.reduce((sum, m) => sum + m.fat, 0);

        document.getElementById('statDailyBudget').textContent = dailyGoal.toLocaleString();
        document.getElementById('statConsumed').textContent = consumed.toLocaleString();
        document.getElementById('statRemaining').textContent = remaining.toLocaleString();
        document.getElementById('statMacros').textContent = `${protein}g / ${carbs}g / ${fat}g`;
    }

    // ── CALORIE ENGINE (REUSABLE FORMULAS) ─────────────────────
    function calculateBMI(weightKg, heightCm) {
        const heightM = heightCm / 100;
        return weightKg / (heightM * heightM);
    }

    function getBMICategory(bmi) {
        if (bmi < 18.5) return 'Underweight';
        if (bmi < 25) return 'Normal';
        if (bmi < 30) return 'Overweight';
        return 'Obese';
    }

    // Mifflin-St Jeor Equation
    function calculateBMR(weightKg, heightCm, age, gender) {
        const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
        return base + (gender === 'male' ? 5 : -161);
    }

    function calculateTDEE(bmr, activityMultiplier) {
        return bmr * activityMultiplier;
    }

    function validateCalculatorInputs({ weight, height, age, activity, gender }) {
        if (!Number.isFinite(weight) || weight <= 0 || weight > 500) {
            throw new Error('Please enter a valid weight between 1 and 500 kg.');
        }
        if (!Number.isFinite(height) || height <= 0 || height > 300) {
            throw new Error('Please enter a valid height between 1 and 300 cm.');
        }
        if (!Number.isInteger(age) || age < 10 || age > 120) {
            throw new Error('Please enter a valid age between 10 and 120.');
        }
        if (!Number.isFinite(activity) || activity < 1.2 || activity > 2.0) {
            throw new Error('Please select a valid activity level.');
        }
        if (gender !== 'male' && gender !== 'female') {
            throw new Error('Please select a valid gender.');
        }
    }

    function getStoredCalorieMetrics() {
        try {
            const raw = localStorage.getItem('calorieMetrics');
            return raw ? JSON.parse(raw) : null;
        } catch (_) {
            return null;
        }
    }

    function renderCalorieMetrics() {
        const metrics = getStoredCalorieMetrics();
        const fields = [
            {
                bmi: document.getElementById('calcBmi'),
                category: document.getElementById('calcBmiCategory'),
                bmr: document.getElementById('calcBmr'),
                tdee: document.getElementById('calcTdee')
            },
            {
                bmi: document.getElementById('mainCalcBmi'),
                category: document.getElementById('mainCalcBmiCategory'),
                bmr: document.getElementById('mainCalcBmr'),
                tdee: document.getElementById('mainCalcTdee')
            }
        ];

        fields.forEach((group) => {
            if (!group.bmi || !group.category || !group.bmr || !group.tdee) return;

            if (!metrics) {
                group.bmi.textContent = '--';
                group.category.textContent = '--';
                group.bmr.textContent = '--';
                group.tdee.textContent = '--';
                return;
            }

            group.bmi.textContent = metrics.bmi ?? '--';
            group.category.textContent = metrics.bmiCategory ?? '--';
            group.bmr.textContent = Number.isFinite(metrics.bmr) ? metrics.bmr.toLocaleString() : '--';
            group.tdee.textContent = Number.isFinite(metrics.tdee) ? metrics.tdee.toLocaleString() : '--';
        });
    }

    // ── ACTIONS ─────────────────────────────────────────────────
    window.quickAdd = (category) => {
        pendingCategory = category;
        mealSearch.placeholder = `Search for ${category}...`;
        mealSearch.focus();
        // Visual cue
        mealSearch.style.borderColor = 'var(--lime)';
        setTimeout(() => mealSearch.style.borderColor = '', 1500);
    };

    window.trackFromSearch = (id) => {
        const meal = mealDatabase.find(m => m.id === id);
        if (!meal) return;

        const newEntry = {
            ...meal,
            category: pendingCategory || meal.category,
            trackedAt: new Date().toISOString()
        };

        trackedMeals.unshift(newEntry);
        localStorage.setItem('trackedMeals', JSON.stringify(trackedMeals));

        pendingCategory = null;
        mealSearch.placeholder = "Search meals...";

        init();
        window.dispatchEvent(new Event('logsUpdated'));
    };

    window.removeTracked = (timestamp) => {
        trackedMeals = trackedMeals.filter(m => m.trackedAt !== timestamp);
        localStorage.setItem('trackedMeals', JSON.stringify(trackedMeals));
        init();
        window.dispatchEvent(new Event('logsUpdated'));
    };

    // ── MODALS ──────────────────────────────────────────────────
    document.getElementById('openCalculatorBtn').onclick = () => calculatorModal.style.display = 'flex';
    document.getElementById('closeCalcModal').onclick = () => calculatorModal.style.display = 'none';

    document.getElementById('editGoalBtn').onclick = () => {
        document.getElementById('manualGoal').value = dailyGoal;
        goalModal.style.display = 'flex';
    };
    document.getElementById('closeGoalModal').onclick = () => goalModal.style.display = 'none';

    // Forms
    document.getElementById('calorieForm').onsubmit = (e) => {
        e.preventDefault();
        const weight = parseFloat(document.getElementById('weight').value);
        const height = parseFloat(document.getElementById('height').value);
        const age = parseInt(document.getElementById('age').value, 10);
        const gender = document.getElementById('gender').value;
        const activity = parseFloat(document.getElementById('activity').value);

        try {
            validateCalculatorInputs({ weight, height, age, activity, gender });

            const bmi = calculateBMI(weight, height);
            const bmiCategory = getBMICategory(bmi);
            const bmr = calculateBMR(weight, height, age, gender);
            const tdee = calculateTDEE(bmr, activity);

            dailyGoal = Math.round(tdee);
            localStorage.setItem('dailyCalorieGoal', dailyGoal);

            // Keep calculated values for future UI display (dashboard/details)
            localStorage.setItem('calorieMetrics', JSON.stringify({
                bmi: Number(bmi.toFixed(1)),
                bmiCategory,
                bmr: Math.round(bmr),
                tdee: Math.round(tdee)
            }));

            calculatorModal.style.display = 'none';
            updateStats();
            renderCalorieMetrics();
        } catch (error) {
            alert(error.message || 'Unable to calculate calories. Please check your inputs.');
        }
    };

    document.getElementById('goalForm').onsubmit = (e) => {
        e.preventDefault();
        const manualGoal = parseInt(document.getElementById('manualGoal').value, 10);
        if (!Number.isInteger(manualGoal) || manualGoal < 800 || manualGoal > 10000) {
            alert('Please enter a valid calorie goal between 800 and 10,000.');
            return;
        }
        dailyGoal = manualGoal;
        localStorage.setItem('dailyCalorieGoal', dailyGoal);
        goalModal.style.display = 'none';
        updateStats();
    };

    // Search
    mealSearch.oninput = (e) => renderDiscovery(e.target.value);

    // Initial load
    init();
});
