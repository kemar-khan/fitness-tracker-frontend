/* ═══════════════════════════════════════════════════════════════
   FitPulse — Nutrition Planner Logic
   High-Contrast Lime & Black Edition
   ═══════════════════════════════════════════════════════════════ */

'use strict';
import './auth.js';
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { loadNutritionState, saveNutritionState, saveCalorieHistoryDay } from './firestore-data.js';

let nutritionAppStarted = false;

document.addEventListener('DOMContentLoaded', function () {
    onAuthStateChanged(auth, async (user) => {
        if (!user || nutritionAppStarted) return;
        nutritionAppStarted = true;
        await startNutritionApp(user.uid);
    });
});

async function startNutritionApp(uid) {
    // --- DATA ---
    const mealDatabase = [
        { id: 1, name: "Grilled Chicken Salad", category: "Lunch", calories: 350, protein: 35, carbs: 10, fat: 12, cuisine: "Western", dietTags: ["High-Protein", "Low-Carb"], ingredients: ["Grilled chicken", "Romaine lettuce", "Cherry tomatoes", "Cucumber"], prepTime: "15 min", instructions: "Slice the grilled chicken, toss with vegetables, and finish with a light dressing.", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80" },
        { id: 2, name: "Oatmeal with Berries", category: "Breakfast", calories: 280, protein: 8, carbs: 45, fat: 5, cuisine: "Western", dietTags: ["Vegetarian"], ingredients: ["Rolled oats", "Mixed berries", "Low-fat milk"], prepTime: "10 min", instructions: "Cook oats with milk until creamy, then top with fresh berries and serve warm.", img: "https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=200&q=80" },
        { id: 3, name: "Salmon with Asparagus", category: "Dinner", calories: 420, protein: 30, carbs: 5, fat: 25, cuisine: "Mediterranean", dietTags: ["Keto", "Low-Carb", "High-Protein"], ingredients: ["Salmon fillet", "Asparagus", "Olive oil", "Lemon"], prepTime: "20 min", instructions: "Pan-sear salmon, roast asparagus, and finish with lemon juice before serving.", img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&q=80" },
        { id: 4, name: "Avocado Toast", category: "Breakfast", calories: 310, protein: 7, carbs: 28, fat: 18, cuisine: "Western", dietTags: ["Vegetarian"], ingredients: ["Whole grain bread", "Ripe avocado", "Poached egg"], prepTime: "12 min", instructions: "Toast bread, mash avocado with seasoning, spread evenly, and top with egg.", img: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&q=80" },
        { id: 5, name: "Beef & Broccoli", category: "Lunch", calories: 450, protein: 28, carbs: 35, fat: 15, cuisine: "Asian", dietTags: ["High-Protein"], ingredients: ["Lean beef", "Broccoli florets", "Soy sauce", "Garlic"], prepTime: "25 min", instructions: "Stir-fry beef with garlic, add broccoli and sauce, then cook until tender-crisp.", img: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&q=80" },
        { id: 6, name: "Greek Yogurt Parfait", category: "Snack", calories: 220, protein: 15, carbs: 25, fat: 6, cuisine: "Mediterranean", dietTags: ["Vegetarian", "High-Protein"], ingredients: ["Greek yogurt", "Granola", "Fresh berries", "Honey"], prepTime: "5 min", instructions: "Layer yogurt, berries, and granola in a glass, then drizzle with a little honey.", img: "https://images.unsplash.com/photo-1488477181946-6228a0291777?w=200&q=80" }
    ];

    let favorites = [];
    let savedMeals = [];
    let trackedMeals = [];
    let dailyGoal = 2500;
    let calorieMetrics = null;
    let waterGlasses = 0;
    let waterDate = '';

    // --- DOM ---
    const mealSearch = document.getElementById('mealSearch');
    const mealResults = document.getElementById('mealResults');
    const favoritesList = document.getElementById('favoritesList');
    const filterMealType = document.getElementById('filterMealType');
    const filterDiet = document.getElementById('filterDiet');
    const filterCuisine = document.getElementById('filterCuisine');
    const filterMaxCalories = document.getElementById('filterMaxCalories');

    // Modals
    const calculatorModal = document.getElementById('calculatorModal');
    const goalModal = document.getElementById('goalModal');
    const mealDetailModal = document.getElementById('mealDetailModal');
    const customMealModal = document.getElementById('customMealModal');

    // --- STATE ---
    let pendingCategory = null;
    let detailMealId = null;
    let detailPortion = 1;
    let customCategory = null;
    let customPortion = 1;

    function getTodayKey() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function mealIsToday(trackedAt) {
        if (!trackedAt) return false;
        const mealDate = new Date(trackedAt);
        const now = new Date();
        return mealDate.getFullYear() === now.getFullYear()
            && mealDate.getMonth() === now.getMonth()
            && mealDate.getDate() === now.getDate();
    }

    function getTodayMeals() {
        return trackedMeals.filter((m) => mealIsToday(m.trackedAt));
    }

    function getTodayConsumed() {
        return getTodayMeals().reduce((sum, m) => sum + m.calories, 0);
    }

    function syncWaterForToday() {
        const today = getTodayKey();
        if (waterDate !== today) {
            waterDate = today;
            waterGlasses = 0;
        }
    }

    function applyNutritionState(state) {
        if (!state) return;
        trackedMeals = Array.isArray(state.trackedMeals) ? state.trackedMeals : [];
        favorites = Array.isArray(state.favorites) ? state.favorites : [];
        savedMeals = Array.isArray(state.savedMeals) ? state.savedMeals : [];
        dailyGoal = Number.isFinite(state.dailyGoal) ? state.dailyGoal : 2500;
        calorieMetrics = state.calorieMetrics ?? null;
        waterGlasses = Number.isFinite(state.waterGlasses) ? state.waterGlasses : 0;
        waterDate = state.waterDate || '';
        syncWaterForToday();
    }

    function persistNutritionState() {
        syncWaterForToday();
        const todayKey = getTodayKey();
        const consumed = getTodayConsumed();

        saveNutritionState(uid, {
            trackedMeals,
            favorites,
            savedMeals,
            dailyGoal,
            calorieMetrics,
            waterGlasses,
            waterDate
        }).catch((error) => {
            console.error('Unable to save nutrition state to Firestore:', error);
        });

        saveCalorieHistoryDay(uid, todayKey, { consumed, goal: dailyGoal }).catch((error) => {
            console.error('Unable to save calorie history to Firestore:', error);
        });
    }

    function refreshUI() {
        renderJournal();
        renderDiscovery(mealSearch?.value || '');
        renderFavorites();
        updateStats();
        renderCalorieMetrics();
        updateWaterUI();
    }

    // ── JOURNAL RENDERING ───────────────────────────────────────
    function renderJournal() {
        const categories = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
        categories.forEach(cat => {
            const container = document.getElementById(`items${cat}`);
            const countEl = document.getElementById(`count${cat}`);
            if (!container) return;

            const items = trackedMeals.filter(m => m.category === cat && mealIsToday(m.trackedAt));
            countEl.textContent = items.length;

            if (items.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-title">No meals logged yet</div>
                        <div class="empty-subtitle">Search meals on the right, or use <strong>Add</strong> for a custom entry.</div>
                    </div>
                `;
            } else {
                container.innerHTML = items.map(m => `
                    <div class="item-card">
                        <div class="item-icon"><i class="bi bi-check-circle-fill"></i></div>
                        <div class="item-body">
                            <div class="item-title">${m.name}</div>
                            <div class="item-meta">${m.calories} kcal • P:${m.protein}g C:${m.carbs}g F:${m.fat}g${m.portion && m.portion !== 1 ? ` • ${m.portion}x` : ''}</div>
                        </div>
                        <div class="item-actions">
                            <button class="btn-small danger" onclick="removeTracked('${m.trackedAt}')"><i class="bi bi-trash"></i></button>
                        </div>
                    </div>
                `).join('');
            }
        });
    }

    function normalizeMealName(name) {
        return (name || '').trim().toLowerCase();
    }

    function getSearchableMeals() {
        return [...mealDatabase, ...savedMeals];
    }

    function findMealById(id) {
        const matchId = Number(id);
        return getSearchableMeals().find((m) => m.id === matchId || m.id === id);
    }

    function saveMealTemplate(meal) {
        const key = normalizeMealName(meal.name);
        if (!key) return;

        const existingIdx = savedMeals.findIndex((m) => normalizeMealName(m.name) === key);
        const template = {
            id: existingIdx >= 0 ? savedMeals[existingIdx].id : meal.id,
            name: meal.name.trim(),
            category: meal.category,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            cuisine: 'Custom',
            dietTags: ['Custom'],
            ingredients: meal.ingredients || [],
            prepTime: meal.prepTime || '--',
            instructions: meal.instructions || '',
            img: meal.img || ''
        };

        if (existingIdx >= 0) {
            savedMeals[existingIdx] = template;
        } else {
            savedMeals.unshift(template);
        }
    }

    function mealResultImage(meal) {
        if (meal.img) {
            return `<div class="result-img" style="background-image: url('${meal.img}')"></div>`;
        }
        return `<div class="result-img result-img-custom"><i class="bi bi-journal-text"></i></div>`;
    }

    // ── DISCOVERY RENDERING ─────────────────────────────────────
    function renderDiscovery(query = '') {
        const q = query.trim().toLowerCase();
        const selectedType = filterMealType?.value || 'All';
        const selectedDiet = filterDiet?.value || 'All';
        const selectedCuisine = filterCuisine?.value || 'All';
        const maxCalories = parseInt(filterMaxCalories?.value || '', 10);

        const filtered = getSearchableMeals().filter((m) => {
            const textMatch = !q
                || m.name.toLowerCase().includes(q)
                || m.cuisine.toLowerCase().includes(q)
                || m.ingredients.some((ingredient) => ingredient.toLowerCase().includes(q));
            const typeMatch = selectedType === 'All' || m.category === selectedType;
            const dietMatch = selectedDiet === 'All' || m.dietTags.includes(selectedDiet);
            const cuisineMatch = selectedCuisine === 'All' || m.cuisine === selectedCuisine;
            const caloriesMatch = Number.isNaN(maxCalories) || m.calories <= maxCalories;

            return textMatch && typeMatch && dietMatch && cuisineMatch && caloriesMatch;
        });

        if (filtered.length === 0) {
            mealResults.innerHTML = `
                <div class="empty-state empty-state-compact">
                    <div class="empty-title">No matches found</div>
                    <div class="empty-subtitle">Try clearing filters, or log a custom meal with <strong>Add</strong> to save it for next time.</div>
                    <button class="empty-cta" type="button" onclick="window.clearDiscoveryFilters()">Clear filters</button>
                </div>
            `;
            return;
        }

        mealResults.innerHTML = filtered.map(m => `
            <div class="result-item">
                ${mealResultImage(m)}
                <div class="result-info">
                    <span class="result-name">${m.name}</span>
                    <span class="result-stats">${m.calories} kcal • ${m.category} • ${m.cuisine}</span>
                </div>
                <button class="btn-small" onclick="openMealDetails(${m.id})" title="View details">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn-small ${isFavoriteMeal(m.id) ? 'active-favorite' : ''}" onclick="toggleFavoriteMeal(${m.id})" title="Toggle favorite">
                    <i class="bi ${isFavoriteMeal(m.id) ? 'bi-heart-fill' : 'bi-heart'}"></i>
                </button>
                <button class="btn-small" onclick="openAddMeal(${m.id})" title="Add with portion">
                    <i class="bi bi-plus-lg"></i>
                </button>
            </div>
        `).join('');
    }

    function isFavoriteMeal(id) {
        return favorites.some((m) => m.id === id);
    }

    function renderFavorites() {
        if (!favoritesList) return;
        if (favorites.length === 0) {
            favoritesList.innerHTML = `
                <div class="empty-state empty-state-compact">
                    <div class="empty-title">No favorites yet</div>
                    <div class="empty-subtitle">Tap the heart on a meal to save it here for quick access.</div>
                </div>
            `;
            return;
        }
        favoritesList.innerHTML = favorites.map(m => `
            <div class="fav-item">
                <div class="fav-info">
                    <span class="fav-name">${m.name}</span>
                    <span class="fav-stats">${m.calories} kcal • ${m.category}</span>
                </div>
                <button class="btn-small" onclick="openAddMeal(${m.id})" title="Add with portion"><i class="bi bi-plus-lg"></i></button>
            </div>
        `).join('');
    }

    // ── STATS ───────────────────────────────────────────────────
    function updateStats() {
        const todayMeals = getTodayMeals();
        const consumed = todayMeals.reduce((sum, m) => sum + m.calories, 0);
        const remaining = dailyGoal - consumed;

        const protein = todayMeals.reduce((sum, m) => sum + m.protein, 0);
        const carbs = todayMeals.reduce((sum, m) => sum + m.carbs, 0);
        const fat = todayMeals.reduce((sum, m) => sum + m.fat, 0);

        const pct = dailyGoal > 0 ? Math.min(100, (consumed / dailyGoal) * 100) : 0;

        document.getElementById('statDailyBudget').textContent = dailyGoal.toLocaleString();
        document.getElementById('statConsumed').textContent = consumed.toLocaleString();

        const remainingEl = document.getElementById('statRemaining');
        if (remainingEl) {
            remainingEl.textContent = remaining.toLocaleString();
            remainingEl.classList.toggle('stat-over', remaining < 0);
        }

        document.getElementById('statMacros').textContent = `${protein}g / ${carbs}g / ${fat}g`;

        const fill = document.getElementById('calorieProgressFill');
        const bar = document.getElementById('calorieProgressBar');
        const caption = document.getElementById('calorieProgressCaption');
        if (fill) {
            fill.style.width = `${pct}%`;
            fill.classList.toggle('over', consumed > dailyGoal);
        }
        if (bar) {
            bar.setAttribute('aria-valuenow', String(Math.round(pct)));
        }
        if (caption) {
            caption.textContent = consumed > dailyGoal
                ? `${(consumed - dailyGoal).toLocaleString()} kcal over budget`
                : `${Math.round(pct)}% of daily budget`;
        }
    }

    function updateWaterUI() {
        const countEl = document.getElementById('statWaterGlasses');
        if (countEl) countEl.textContent = String(waterGlasses);
    }

    function changeWaterGlasses(delta) {
        syncWaterForToday();
        waterGlasses = Math.max(0, waterGlasses + delta);
        persistNutritionState();
        updateWaterUI();
    }

    function startDayRolloverWatcher() {
        let activeDay = getTodayKey();
        setInterval(() => {
            const todayKey = getTodayKey();
            if (todayKey === activeDay) return;
            activeDay = todayKey;
            syncWaterForToday();
            persistNutritionState();
            refreshUI();
        }, 60000);
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

    function convertHeightToCm(height, unit) {
        return unit === 'ft' ? height * 30.48 : height;
    }

    function convertWeightToKg(weight, unit) {
        return unit === 'lb' ? weight * 0.45359237 : weight;
    }

    function getGoalAdjustedCalories(tdee, goalType) {
        if (goalType === 'lose') return tdee - 500;
        if (goalType === 'gain') return tdee + 300;
        return tdee;
    }

    function calculateMacroTargets(targetCalories) {
        const proteinCalories = targetCalories * 0.3;
        const carbCalories = targetCalories * 0.4;
        const fatCalories = targetCalories * 0.3;

        return {
            proteinGrams: Math.round(proteinCalories / 4),
            carbsGrams: Math.round(carbCalories / 4),
            fatGrams: Math.round(fatCalories / 9),
            proteinPct: 30,
            carbsPct: 40,
            fatPct: 30
        };
    }

    function getBMICategoryClass(category) {
        if (category === 'Normal') return 'metric-value-good';
        if (category === 'Overweight') return 'metric-value-warn';
        if (category === 'Obese') return 'metric-value-danger';
        return 'metric-value-neutral';
    }

    function setFieldError(inputId, errorId, message) {
        const input = document.getElementById(inputId);
        const errorEl = document.getElementById(errorId);
        if (input) input.classList.add('invalid');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('visible');
        }
    }

    function clearFieldError(inputId, errorId) {
        const input = document.getElementById(inputId);
        const errorEl = document.getElementById(errorId);
        if (input) input.classList.remove('invalid');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.remove('visible');
        }
    }

    function clearCalculatorErrors() {
        clearFieldError('age', 'ageError');
        clearFieldError('height', 'heightError');
        clearFieldError('weight', 'weightError');
        clearFieldError('activity', 'activityError');
        clearFieldError('goalType', 'goalTypeError');
    }

    function validateCalculatorForm({ weight, height, age, activity, gender, goalType, heightUnit, weightUnit }) {
        const errors = {};

        if (!Number.isInteger(age) || age < 10 || age > 120) {
            errors.age = 'Enter an age between 10 and 120.';
        }

        if (!Number.isFinite(height) || height <= 0) {
            errors.height = 'Enter a valid height.';
        }

        if (!Number.isFinite(weight) || weight <= 0) {
            errors.weight = 'Enter a valid weight.';
        }

        if (!Number.isFinite(activity) || activity < 1.2 || activity > 2.0) {
            errors.activity = 'Select an activity level.';
        }

        if (gender !== 'male' && gender !== 'female') {
            errors.gender = 'Select a gender.';
        }

        if (goalType !== 'lose' && goalType !== 'maintain' && goalType !== 'gain') {
            errors.goalType = 'Select a goal.';
        }

        if (heightUnit !== 'cm' && heightUnit !== 'ft') {
            errors.height = 'Select a valid height unit.';
        }

        if (weightUnit !== 'kg' && weightUnit !== 'lb') {
            errors.weight = 'Select a valid weight unit.';
        }

        // Only enforce realistic ranges after unit selection is known
        const heightCm = convertHeightToCm(height, heightUnit);
        const weightKg = convertWeightToKg(weight, weightUnit);

        if (Number.isFinite(heightCm) && (heightCm < 100 || heightCm > 250)) {
            errors.height = 'Height looks off. Please check the number/unit.';
        }

        if (Number.isFinite(weightKg) && (weightKg < 30 || weightKg > 250)) {
            errors.weight = 'Weight looks off. Please check the number/unit.';
        }

        return errors;
    }

    function renderCalorieMetrics() {
        const metrics = calorieMetrics;
        const fields = [
            {
                bmi: document.getElementById('calcBmi'),
                category: document.getElementById('calcBmiCategory'),
                bmr: document.getElementById('calcBmr'),
                tdee: document.getElementById('calcTdee'),
                target: document.getElementById('calcTargetCalories'),
                macros: document.getElementById('calcMacroTargets')
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
                if (group.target) group.target.textContent = '--';
                if (group.macros) group.macros.textContent = '--';
                return;
            }

            group.bmi.textContent = metrics.bmi ?? '--';
            group.category.textContent = metrics.bmiCategory ?? '--';
            group.category.classList.remove('metric-value-good', 'metric-value-warn', 'metric-value-danger', 'metric-value-neutral');
            group.category.classList.add(getBMICategoryClass(metrics.bmiCategory));
            group.bmr.textContent = Number.isFinite(metrics.bmr) ? metrics.bmr.toLocaleString() : '--';
            group.tdee.textContent = Number.isFinite(metrics.tdee) ? metrics.tdee.toLocaleString() : '--';
            if (group.target) {
                group.target.textContent = Number.isFinite(metrics.targetCalories) ? metrics.targetCalories.toLocaleString() : '--';
            }
            if (group.macros) {
                const macros = metrics.macroTargets;
                group.macros.textContent = macros
                    ? `P:${macros.proteinGrams}g (${macros.proteinPct}%) C:${macros.carbsGrams}g (${macros.carbsPct}%) F:${macros.fatGrams}g (${macros.fatPct}%)`
                    : '--';
            }
        });
    }

    // ── ACTIONS ─────────────────────────────────────────────────
    function scaleMeal(meal, portion) {
        return {
            calories: Math.round(meal.calories * portion),
            protein: Math.round(meal.protein * portion),
            carbs: Math.round(meal.carbs * portion),
            fat: Math.round(meal.fat * portion)
        };
    }

    function addMealToJournal(meal, portion) {
        const scaled = scaleMeal(meal, portion);
        const entry = {
            ...meal,
            ...scaled,
            baseCalories: meal.calories,
            baseProtein: meal.protein,
            baseCarbs: meal.carbs,
            baseFat: meal.fat,
            portion,
            category: pendingCategory || meal.category,
            trackedAt: new Date().toISOString()
        };

        trackedMeals.unshift(entry);
        persistNutritionState();
        pendingCategory = null;
        mealSearch.placeholder = "Search meals...";
        refreshUI();
    }

    window.removeTracked = (timestamp) => {
        trackedMeals = trackedMeals.filter(m => m.trackedAt !== timestamp);
        persistNutritionState();
        refreshUI();
    };

    window.toggleFavoriteMeal = (id) => {
        const meal = findMealById(id);
        if (!meal) return;

        if (isFavoriteMeal(id)) {
            favorites = favorites.filter((m) => m.id !== id);
        } else {
            favorites.unshift(meal);
        }

        persistNutritionState();
        renderFavorites();
        renderDiscovery(mealSearch.value);
    };

    function renderMealDetails(meal) {
        detailMealId = meal.id;
        detailPortion = 1;
        const detailImage = document.getElementById('detailMealImage');
        if (meal.img) {
            detailImage.style.backgroundImage = `url('${meal.img}')`;
            detailImage.classList.remove('meal-detail-image-custom');
            detailImage.innerHTML = '';
        } else {
            detailImage.style.backgroundImage = 'none';
            detailImage.classList.add('meal-detail-image-custom');
            detailImage.innerHTML = '<i class="bi bi-journal-text"></i>';
        }
        document.getElementById('detailMealName').textContent = meal.name;
        document.getElementById('detailMealMeta').textContent = `${meal.category} • ${meal.cuisine}`;
        updateDetailNutrition(meal, detailPortion);
        document.getElementById('detailMealPrepTime').textContent = meal.prepTime || '--';
        document.getElementById('detailMealInstructions').textContent = meal.instructions || '--';

        const tagsEl = document.getElementById('detailMealTags');
        tagsEl.innerHTML = (meal.dietTags || []).map((tag) => `<span class="meal-tag">${tag}</span>`).join('');

        const ingredientsEl = document.getElementById('detailMealIngredients');
        ingredientsEl.innerHTML = (meal.ingredients || []).map((ingredient) => `<li>${ingredient}</li>`).join('');

        setActivePortionButton(detailPortion);
    }

    function updateDetailNutrition(meal, portion) {
        const scaled = scaleMeal(meal, portion);
        document.getElementById('detailMealCalories').textContent = `${scaled.calories} kcal`;
        document.getElementById('detailMealMacros').textContent = `P:${scaled.protein}g C:${scaled.carbs}g F:${scaled.fat}g`;
    }

    function setActivePortionButton(portion) {
        document.querySelectorAll('.portion-btn').forEach((btn) => {
            const btnPortion = parseFloat(btn.dataset.portion);
            btn.classList.toggle('active', btnPortion === portion);
        });
    }

    const closeMealDetail = () => {
        if (mealDetailModal) mealDetailModal.style.display = 'none';
    };

    window.openMealDetails = (id) => {
        const meal = findMealById(id);
        if (!meal || !mealDetailModal) return;
        renderMealDetails(meal);
        mealDetailModal.style.display = 'flex';
    };

    window.openAddMeal = (id) => {
        window.openMealDetails(id);
    };

    window.focusMealSearch = () => {
        mealSearch?.focus();
        mealSearch?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    window.clearDiscoveryFilters = () => {
        if (filterMealType) filterMealType.value = 'All';
        if (filterDiet) filterDiet.value = 'All';
        if (filterCuisine) filterCuisine.value = 'All';
        if (filterMaxCalories) filterMaxCalories.value = '';
        renderDiscovery(mealSearch?.value || '');
        window.focusMealSearch();
    };

    function setActiveCustomPortionButton(portion) {
        customMealModal?.querySelectorAll('.custom-portion-btn').forEach((btn) => {
            const btnPortion = parseFloat(btn.dataset.portion);
            btn.classList.toggle('active', btnPortion === portion);
        });
    }

    function closeCustomMeal() {
        if (customMealModal) customMealModal.style.display = 'none';
    }

    window.openCustomMeal = (category) => {
        customCategory = category;
        customPortion = 1;

        const label = document.getElementById('customMealCategoryLabel');
        if (label) label.textContent = category;

        document.getElementById('customMealForm')?.reset();
        clearFieldError('customMealName', 'customMealNameError');
        clearFieldError('customMealCalories', 'customMealCaloriesError');
        setActiveCustomPortionButton(customPortion);

        if (customMealModal) customMealModal.style.display = 'flex';
        document.getElementById('customMealName')?.focus();
    };

    // ── MODALS ──────────────────────────────────────────────────
    document.getElementById('openCalculatorBtn').onclick = () => calculatorModal.style.display = 'flex';
    document.getElementById('closeCalcModal').onclick = () => calculatorModal.style.display = 'none';
    document.getElementById('closeMealDetailModal').onclick = closeMealDetail;
    document.getElementById('closeCustomMealModal')?.addEventListener('click', closeCustomMeal);
    customMealModal?.addEventListener('click', (e) => {
        if (e.target === customMealModal) closeCustomMeal();
    });
    document.getElementById('addMealFromDetailBtn')?.addEventListener('click', () => {
        const meal = findMealById(detailMealId);
        if (!meal) return;
        addMealToJournal(meal, detailPortion);
        closeMealDetail();
    });
    document.querySelectorAll('.portion-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const nextPortion = parseFloat(btn.dataset.portion);
            if (!Number.isFinite(nextPortion)) return;
            detailPortion = nextPortion;
            setActivePortionButton(detailPortion);
            const meal = findMealById(detailMealId);
            if (meal) updateDetailNutrition(meal, detailPortion);
        });
    });
    mealDetailModal?.addEventListener('click', (e) => {
        if (e.target === mealDetailModal) closeMealDetail();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mealDetailModal?.style.display === 'flex') closeMealDetail();
        if (e.key === 'Escape' && customMealModal?.style.display === 'flex') closeCustomMeal();
    });

    document.getElementById('editGoalBtn').onclick = () => {
        document.getElementById('manualGoal').value = dailyGoal;
        goalModal.style.display = 'flex';
    };
    document.getElementById('closeGoalModal').onclick = () => goalModal.style.display = 'none';
    document.getElementById('age')?.addEventListener('input', () => clearFieldError('age', 'ageError'));
    document.getElementById('height')?.addEventListener('input', () => clearFieldError('height', 'heightError'));
    document.getElementById('weight')?.addEventListener('input', () => clearFieldError('weight', 'weightError'));
    document.getElementById('activity')?.addEventListener('change', () => clearFieldError('activity', 'activityError'));
    document.getElementById('goalType')?.addEventListener('change', () => clearFieldError('goalType', 'goalTypeError'));
    document.getElementById('heightUnit')?.addEventListener('change', () => clearFieldError('height', 'heightError'));
    document.getElementById('weightUnit')?.addEventListener('change', () => clearFieldError('weight', 'weightError'));
    document.getElementById('manualGoal')?.addEventListener('input', () => clearFieldError('manualGoal', 'manualGoalError'));
    document.getElementById('customMealName')?.addEventListener('input', () => clearFieldError('customMealName', 'customMealNameError'));
    document.getElementById('customMealCalories')?.addEventListener('input', () => clearFieldError('customMealCalories', 'customMealCaloriesError'));

    document.getElementById('customMealForm')?.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = (document.getElementById('customMealName')?.value || '').trim();
        const calories = parseFloat(document.getElementById('customMealCalories')?.value);
        const protein = parseFloat(document.getElementById('customMealProtein')?.value) || 0;
        const carbs = parseFloat(document.getElementById('customMealCarbs')?.value) || 0;
        const fat = parseFloat(document.getElementById('customMealFat')?.value) || 0;

        clearFieldError('customMealName', 'customMealNameError');
        clearFieldError('customMealCalories', 'customMealCaloriesError');

        let hasError = false;
        if (!name) {
            setFieldError('customMealName', 'customMealNameError', 'Enter a meal name.');
            hasError = true;
        }
        if (!Number.isFinite(calories) || calories <= 0) {
            setFieldError('customMealCalories', 'customMealCaloriesError', 'Enter valid calories.');
            hasError = true;
        }
        if (hasError) return;

        // Force category to the selected section and reuse the same journal pipeline
        pendingCategory = customCategory || 'Snack';

        const customMeal = {
            id: Date.now(),
            name,
            category: pendingCategory,
            calories: Math.round(calories),
            protein: Math.max(0, Math.round(protein)),
            carbs: Math.max(0, Math.round(carbs)),
            fat: Math.max(0, Math.round(fat)),
            cuisine: 'Custom',
            dietTags: ['Custom'],
            ingredients: [],
            prepTime: '--',
            instructions: ''
        };

        saveMealTemplate(customMeal);
        addMealToJournal(customMeal, customPortion);
        closeCustomMeal();
    });

    customMealModal?.querySelectorAll('.custom-portion-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const nextPortion = parseFloat(btn.dataset.portion);
            if (!Number.isFinite(nextPortion)) return;
            customPortion = nextPortion;
            setActiveCustomPortionButton(customPortion);
        });
    });

    // Forms
    document.getElementById('calorieForm').onsubmit = (e) => {
        e.preventDefault();
        const weight = parseFloat(document.getElementById('weight').value);
        const height = parseFloat(document.getElementById('height').value);
        const age = parseInt(document.getElementById('age').value, 10);
        const gender = document.getElementById('gender').value;
        const activity = parseFloat(document.getElementById('activity').value);
        const goalType = document.getElementById('goalType').value;
        const heightUnit = document.getElementById('heightUnit').value;
        const weightUnit = document.getElementById('weightUnit').value;

        try {
            clearCalculatorErrors();
            const errors = validateCalculatorForm({ weight, height, age, activity, gender, goalType, heightUnit, weightUnit });
            if (Object.keys(errors).length > 0) {
                if (errors.age) setFieldError('age', 'ageError', errors.age);
                if (errors.height) setFieldError('height', 'heightError', errors.height);
                if (errors.weight) setFieldError('weight', 'weightError', errors.weight);
                if (errors.activity) setFieldError('activity', 'activityError', errors.activity);
                if (errors.goalType) setFieldError('goalType', 'goalTypeError', errors.goalType);
                return;
            }

            const heightCm = convertHeightToCm(height, heightUnit);
            const weightKg = convertWeightToKg(weight, weightUnit);

            const bmi = calculateBMI(weightKg, heightCm);
            const bmiCategory = getBMICategory(bmi);
            const bmr = calculateBMR(weightKg, heightCm, age, gender);
            const tdee = calculateTDEE(bmr, activity);
            const targetCalories = Math.round(getGoalAdjustedCalories(tdee, goalType));
            const macroTargets = calculateMacroTargets(targetCalories);

            dailyGoal = targetCalories;
            calorieMetrics = {
                bmi: Number(bmi.toFixed(1)),
                bmiCategory,
                bmr: Math.round(bmr),
                tdee: Math.round(tdee),
                targetCalories,
                goalType,
                macroTargets
            };
            persistNutritionState();

            calculatorModal.style.display = 'none';
            updateStats();
            renderCalorieMetrics();
        } catch (error) {
            // Unexpected failure (not user-fixable) — keep as alert.
            alert('Something went wrong while calculating. Please try again.');
        }
    };

    document.getElementById('goalForm').onsubmit = (e) => {
        e.preventDefault();
        const manualGoal = parseInt(document.getElementById('manualGoal').value, 10);
        clearFieldError('manualGoal', 'manualGoalError');
        if (!Number.isInteger(manualGoal) || manualGoal < 800 || manualGoal > 10000) {
            setFieldError('manualGoal', 'manualGoalError', 'Enter a goal between 800 and 10,000 calories.');
            return;
        }
        dailyGoal = manualGoal;
        persistNutritionState();
        goalModal.style.display = 'none';
        updateStats();
    };

    // Search
    mealSearch.oninput = (e) => renderDiscovery(e.target.value);
    filterMealType?.addEventListener('change', () => renderDiscovery(mealSearch.value));
    filterDiet?.addEventListener('change', () => renderDiscovery(mealSearch.value));
    filterCuisine?.addEventListener('change', () => renderDiscovery(mealSearch.value));
    filterMaxCalories?.addEventListener('input', () => renderDiscovery(mealSearch.value));

    document.getElementById('waterMinusBtn')?.addEventListener('click', () => changeWaterGlasses(-1));
    document.getElementById('waterPlusBtn')?.addEventListener('click', () => changeWaterGlasses(1));

    try {
        applyNutritionState(await loadNutritionState(uid));
    } catch (error) {
        console.error('Unable to load nutrition state from Firestore:', error);
    }

    startDayRolloverWatcher();
    refreshUI();
}
