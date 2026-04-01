document.addEventListener('DOMContentLoaded', function () {
    // --- Dummy Meal Dataset ---
    const mealDatabase = [
        { id: 1, name: "Grilled Chicken Salad", category: "Lunch", calories: 350, protein: 35, carbs: 10, fat: 12, tags: ["High Protein", "Low Carb"], img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80" },
        { id: 2, name: "Oatmeal with Berries", category: "Breakfast", calories: 280, protein: 8, carbs: 45, fat: 5, tags: ["Healthy", "Fiber"], img: "https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=500&q=80" },
        { id: 3, name: "Salmon with Asparagus", category: "Dinner", calories: 420, protein: 30, carbs: 5, fat: 25, tags: ["Omega 3", "Keto"], img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&q=80" },
        { id: 4, name: "Avocado Toast", category: "Breakfast", calories: 310, protein: 7, carbs: 28, fat: 18, tags: ["Vegan", "Healthy Fats"], img: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&q=80" },
        { id: 5, name: "Beef & Broccoli", category: "Lunch", calories: 450, protein: 28, carbs: 35, fat: 15, tags: ["High Protein"], img: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&q=80" },
        { id: 6, name: "Greek Yogurt Parfait", category: "Snack", calories: 220, protein: 15, carbs: 25, fat: 6, tags: ["Quick", "High Protein"], img: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&q=80" },
        { id: 7, name: "Quinoa Bowl", category: "Lunch", calories: 380, protein: 12, carbs: 55, fat: 10, tags: ["Vegan", "Complex Carbs"], img: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=500&q=80" },
        { id: 8, name: "Peptide Protein Shake", category: "Snack", calories: 150, protein: 25, carbs: 5, fat: 2, tags: ["Post Workout"], img: "https://images.unsplash.com/photo-1577116662214-727e779a1f10?w=500&q=80" }
    ];

    let favorites = JSON.parse(localStorage.getItem('favoriteMeals')) || [];

    // --- Calorie Calculator ---
    const calorieForm = document.getElementById('calorieForm');
    const calorieResults = document.getElementById('calorieResults');
    const dailyCaloriesEl = document.getElementById('dailyCalories');

    if (calorieForm) {
        calorieForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const gender = document.getElementById('gender').value;
            const age = parseInt(document.getElementById('age').value);
            const height = parseFloat(document.getElementById('height').value);
            const weight = parseFloat(document.getElementById('weight').value);
            const activityValue = parseFloat(document.getElementById('activity').value);

            let bmr;
            if (gender === 'male') {
                // Mifflin-St Jeor Equation (Male)
                bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
            } else {
                // Mifflin-St Jeor Equation (Female)
                bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
            }

            const dailyCalories = Math.round(bmr * activityValue);
            dailyCaloriesEl.textContent = dailyCalories.toLocaleString();
            calorieResults.style.display = 'block';

            // Scroll to results
            calorieResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        calorieForm.addEventListener('reset', function () {
            calorieResults.style.display = 'none';
        });
    }

    // --- Meal Search & Suggestions ---
    const mealSearch = document.getElementById('mealSearch');
    const mealFilter = document.getElementById('mealFilter');
    const searchBtn = document.getElementById('searchBtn');
    const mealGrid = document.getElementById('mealGrid');

    function renderMeals(meals) {
        if (!mealGrid) return;
        mealGrid.innerHTML = '';

        if (meals.length === 0) {
            mealGrid.innerHTML = '<div class="col-12 text-center p-5"><p class="text-muted">No meals found matching your criteria.</p></div>';
            return;
        }

        meals.forEach(meal => {
            const isFavorite = favorites.some(fav => fav.id === meal.id);
            const card = document.createElement('div');
            card.className = 'col-md-6 col-lg-4';
            card.innerHTML = `
                <div class="meal-card">
                    <div class="meal-img" style="background-image: url('${meal.img}')"></div>
                    <div class="meal-body">
                        <div class="meal-title">
                            ${meal.name}
                            <div class="d-flex gap-1">
                                <button class="btn btn-sm ${isFavorite ? 'btn-strava' : 'btn-outline-strava'} fav-toggle" data-id="${meal.id}">
                                    <i class="bi ${isFavorite ? 'bi-heart-fill' : 'bi-heart'}"></i>
                                </button>
                            </div>
                        </div>
                        <div class="text-muted small mb-2">${meal.category} • ${meal.calories} kcal</div>
                        <div class="meal-macros">
                            <span class="macro-badge">P: ${meal.protein}g</span>
                            <span class="macro-badge">C: ${meal.carbs}g</span>
                            <span class="macro-badge">F: ${meal.fat}g</span>
                        </div>
                        <button class="btn btn-strava w-100 btn-sm mt-2 track-meal-btn" data-id="${meal.id}">
                            <i class="bi bi-plus-circle me-1"></i> Track Meal
                        </button>
                    </div>
                </div>
            `;
            mealGrid.appendChild(card);
        });

        // Add Listeners to Favorite Buttons
        document.querySelectorAll('.fav-toggle').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = parseInt(this.getAttribute('data-id'));
                toggleFavorite(id);
            });
        });

        // Add Listeners to Track Buttons
        document.querySelectorAll('.track-meal-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = parseInt(this.getAttribute('data-id'));
                trackMeal(id);
            });
        });
    }

    function trackMeal(mealId) {
        const meal = mealDatabase.find(m => m.id === mealId);
        const trackedMeals = JSON.parse(localStorage.getItem('trackedMeals')) || [];

        // Add timestamp to the tracked meal
        const newTrackedMeal = {
            ...meal,
            trackedAt: new Date().toISOString()
        };

        trackedMeals.unshift(newTrackedMeal);
        localStorage.setItem('trackedMeals', JSON.stringify(trackedMeals));

        alert(`Successfully tracked ${meal.name}!`);

        // Dispatch event for dashboard update
        window.dispatchEvent(new Event('logsUpdated'));
    }

    function toggleFavorite(mealId) {
        const meal = mealDatabase.find(m => m.id === mealId);
        const index = favorites.findIndex(f => f.id === mealId);

        if (index === -1) {
            favorites.push(meal);
        } else {
            favorites.splice(index, 1);
        }

        localStorage.setItem('favoriteMeals', JSON.stringify(favorites));
        renderMeals(filterMeals());
        renderFavorites();
    }

    function filterMeals() {
        const query = mealSearch.value.toLowerCase();
        const category = mealFilter.value;

        return mealDatabase.filter(meal => {
            const matchesQuery = meal.name.toLowerCase().includes(query);
            const matchesCategory = category === 'All' || meal.category === category;
            return matchesQuery && matchesCategory;
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', () => renderMeals(filterMeals()));
    }

    if (mealSearch) {
        mealSearch.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') renderMeals(filterMeals());
        });
    }

    // --- Favorite Management ---
    const favoritesList = document.getElementById('favoritesList');
    const favCount = document.getElementById('favCount');

    function renderFavorites() {
        if (!favoritesList) return;
        favoritesList.innerHTML = '';
        favCount.textContent = favorites.length;

        if (favorites.length === 0) {
            favoritesList.innerHTML = '<p class="text-muted italic mb-0">No favorites yet. Search and add some!</p>';
            return;
        }

        favorites.forEach(meal => {
            const item = document.createElement('div');
            item.className = 'favorite-item';
            item.innerHTML = `
                <div class="favorite-info">
                    <span class="favorite-name">${meal.name}</span>
                    <span class="favorite-calories">${meal.calories} kcal • ${meal.protein}g P / ${meal.carbs}g C</span>
                </div>
                <button class="btn btn-sm btn-outline-danger border-0" onclick="removeFavorite(${meal.id})">
                    <i class="bi bi-trash"></i>
                </button>
            `;
            favoritesList.appendChild(item);
        });
    }

    // Global scope for onclick
    window.removeFavorite = function (id) {
        toggleFavorite(id);
    };

    // Initial Render
    renderMeals(mealDatabase);
    renderFavorites();
});
