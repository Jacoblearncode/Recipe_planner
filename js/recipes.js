/**
 * Recipe Planner - Recipe Browsing Functionality
 * Handles recipe data, searching, filtering, and displaying recipes
 */

import favoritesService from './favoritesService.js';
import mealPlannerService from './mealPlannerService.js';

// Sample recipe data (in a real app, this would come from an API)
const recipeData = [
    {
        id: "recipe-001",
        title: "Mediterranean Pasta Salad",
        image: "https://images.pexels.com/photos/1373915/pexels-photo-1373915.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        prepTime: 15,
        cookTime: 10,
        difficulty: "easy",
        servings: 4,
        tags: ["vegetarian", "italian", "quick", "pasta"],
        mealType: ["lunch", "dinner"],
        cuisine: "italian",
        dietaryRestrictions: ["vegetarian"],
        ingredients: [
            { name: "Pasta", amount: "8 oz" },
            { name: "Cherry tomatoes", amount: "1 cup" },
            { name: "Cucumber", amount: "1 medium" },
            { name: "Red onion", amount: "1/4 cup" },
            { name: "Kalamata olives", amount: "1/2 cup" },
            { name: "Feta cheese", amount: "4 oz" },
            { name: "Olive oil", amount: "1/4 cup" },
            { name: "Lemon juice", amount: "2 tbsp" },
            { name: "Garlic", amount: "2 cloves" },
            { name: "Oregano", amount: "1 tsp" },
            { name: "Salt and pepper", amount: "to taste" }
        ],
        instructions: [
            "Cook pasta according to package directions. Drain and rinse with cold water.",
            "While pasta cooks, chop the tomatoes, cucumber, and red onion.",
            "In a large bowl, combine pasta, vegetables, olives, and feta cheese.",
            "In a small bowl, whisk together olive oil, lemon juice, minced garlic, oregano, salt, and pepper.",
            "Pour dressing over pasta mixture and toss to coat.",
            "Refrigerate for at least 30 minutes before serving to allow flavors to blend."
        ],
        nutritionInfo: {
            calories: 320,
            protein: "9g",
            carbs: "38g",
            fat: "15g"
        }
    },
    {
        id: "recipe-002",
        title: "Quick Chicken Stir-Fry",
        image: "https://images.pexels.com/photos/2313686/pexels-photo-2313686.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        prepTime: 10,
        cookTime: 15,
        difficulty: "medium",
        servings: 3,
        tags: ["quick", "chicken", "asian"],
        mealType: ["dinner"],
        cuisine: "asian",
        dietaryRestrictions: [],
        ingredients: [
            { name: "Chicken breast", amount: "1 lb" },
            { name: "Bell peppers", amount: "2" },
            { name: "Broccoli", amount: "1 cup" },
            { name: "Carrots", amount: "2" },
            { name: "Soy sauce", amount: "3 tbsp" },
            { name: "Honey", amount: "1 tbsp" },
            { name: "Garlic", amount: "3 cloves" },
            { name: "Ginger", amount: "1 tbsp" },
            { name: "Vegetable oil", amount: "2 tbsp" },
            { name: "Rice", amount: "2 cups cooked" }
        ],
        instructions: [
            "Slice chicken into thin strips and chop all vegetables.",
            "In a small bowl, mix soy sauce, honey, minced garlic, and grated ginger.",
            "Heat oil in a large wok or skillet over high heat.",
            "Add chicken and stir-fry until nearly cooked through, about 3-4 minutes.",
            "Add vegetables and stir-fry for another 3-4 minutes until crisp-tender.",
            "Pour sauce over the mixture and cook for 1-2 minutes until thickened.",
            "Serve hot over cooked rice."
        ],
        nutritionInfo: {
            calories: 380,
            protein: "28g",
            carbs: "42g",
            fat: "12g"
        }
    },
    {
        id: "recipe-003",
        title: "Vegetarian Chickpea Curry",
        image: "https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        prepTime: 10,
        cookTime: 25,
        difficulty: "medium",
        servings: 4,
        tags: ["vegetarian", "vegan", "curry", "chickpea"],
        mealType: ["dinner"],
        cuisine: "indian",
        dietaryRestrictions: ["vegetarian", "vegan", "gluten-free"],
        ingredients: [
            { name: "Chickpeas", amount: "2 cans (15 oz each)" },
            { name: "Onion", amount: "1 large" },
            { name: "Garlic", amount: "3 cloves" },
            { name: "Ginger", amount: "1 tbsp" },
            { name: "Tomatoes", amount: "2 large" },
            { name: "Coconut milk", amount: "1 can (14 oz)" },
            { name: "Curry powder", amount: "2 tbsp" },
            { name: "Cumin", amount: "1 tsp" },
            { name: "Turmeric", amount: "1 tsp" },
            { name: "Coriander", amount: "1 tsp" },
            { name: "Vegetable oil", amount: "2 tbsp" },
            { name: "Salt", amount: "to taste" },
            { name: "Fresh cilantro", amount: "for garnish" }
        ],
        instructions: [
            "Dice onion, mince garlic and ginger, and chop tomatoes.",
            "Heat oil in a large pot over medium heat. Add onion and cook until soft, about 5 minutes.",
            "Add garlic and ginger, cook for 1 minute until fragrant.",
            "Add tomatoes, curry powder, cumin, turmeric, and coriander. Cook for 5 minutes.",
            "Drain and rinse chickpeas, then add to the pot.",
            "Pour in coconut milk and bring to a simmer. Cook for 15 minutes.",
            "Season with salt to taste and garnish with fresh cilantro.",
            "Serve with rice or naan bread."
        ],
        nutritionInfo: {
            calories: 350,
            protein: "12g",
            carbs: "35g",
            fat: "18g"
        }
    },
    {
        id: "recipe-004",
        title: "Avocado Toast with Poached Egg",
        image: "https://images.pexels.com/photos/793768/pexels-photo-793768.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        prepTime: 5,
        cookTime: 5,
        difficulty: "easy",
        servings: 1,
        tags: ["breakfast", "quick", "vegetarian", "healthy"],
        mealType: ["breakfast"],
        cuisine: "american",
        dietaryRestrictions: ["vegetarian"],
        ingredients: [
            { name: "Bread", amount: "1 slice" },
            { name: "Avocado", amount: "1/2" },
            { name: "Egg", amount: "1" },
            { name: "Red pepper flakes", amount: "1/4 tsp" },
            { name: "Lemon juice", amount: "1/2 tsp" },
            { name: "Salt and pepper", amount: "to taste" }
        ],
        instructions: [
            "Toast bread until golden and crisp.",
            "In a small pot, bring water to a simmer. Add a splash of vinegar.",
            "Crack egg into a small cup, then carefully slide into simmering water.",
            "Cook for 3-4 minutes until white is set but yolk is still runny.",
            "Meanwhile, mash avocado with lemon juice, salt, and pepper.",
            "Spread avocado mixture on toast.",
            "Remove poached egg with a slotted spoon, drain, and place on top of avocado.",
            "Sprinkle with red pepper flakes and additional salt and pepper if desired."
        ],
        nutritionInfo: {
            calories: 240,
            protein: "9g",
            carbs: "15g",
            fat: "17g"
        }
    },
    {
        id: "recipe-005",
        title: "Quinoa Vegetable Bowl",
        image: "https://images.pexels.com/photos/1410235/pexels-photo-1410235.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        prepTime: 10,
        cookTime: 20,
        difficulty: "easy",
        servings: 2,
        tags: ["vegetarian", "vegan", "bowl", "healthy", "quinoa"],
        mealType: ["lunch", "dinner"],
        cuisine: "mediterranean",
        dietaryRestrictions: ["vegetarian", "vegan", "gluten-free"],
        ingredients: [
            { name: "Quinoa", amount: "1 cup" },
            { name: "Vegetable broth", amount: "2 cups" },
            { name: "Broccoli", amount: "1 cup" },
            { name: "Sweet potato", amount: "1 medium" },
            { name: "Chickpeas", amount: "1 can (15 oz)" },
            { name: "Avocado", amount: "1" },
            { name: "Lemon juice", amount: "1 tbsp" },
            { name: "Olive oil", amount: "2 tbsp" },
            { name: "Garlic powder", amount: "1/2 tsp" },
            { name: "Cumin", amount: "1/2 tsp" },
            { name: "Paprika", amount: "1/2 tsp" },
            { name: "Salt and pepper", amount: "to taste" }
        ],
        instructions: [
            "Rinse quinoa thoroughly. Combine with vegetable broth in a pot, bring to a boil, then reduce heat and simmer covered for 15 minutes.",
            "Meanwhile, peel and dice sweet potato. Toss with olive oil, garlic powder, cumin, paprika, salt, and pepper.",
            "Spread sweet potato on a baking sheet and roast at 400°F for 20 minutes.",
            "Steam broccoli until tender-crisp, about 5 minutes.",
            "Drain and rinse chickpeas.",
            "Slice avocado and drizzle with lemon juice.",
            "Assemble bowls: quinoa on bottom, then arrange sweet potato, broccoli, chickpeas, and avocado on top.",
            "Drizzle with additional olive oil and season with salt and pepper."
        ],
        nutritionInfo: {
            calories: 420,
            protein: "14g",
            carbs: "58g",
            fat: "16g"
        }
    }
];

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const recipeGrid = document.getElementById('recipeGrid');
    const recipeCount = document.getElementById('recipeCount');
    const searchInput = document.getElementById('recipeSearch');
    const searchButton = document.getElementById('searchButton');
    const sortSelect = document.getElementById('sortSelect');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const recipeModal = document.getElementById('recipeModal');
    const closeRecipeModal = document.getElementById('closeRecipeModal');
    const recipeModalBody = document.getElementById('recipeModalBody');
    const modalRecipeImage = document.getElementById('modalRecipeImage');
    
    // State variables
    let filteredRecipes = [...recipeData];
    let currentPage = 1;
    const recipesPerPage = 6;
    let favoriteRecipes = loadFavorites(); // Load favorites from localStorage
    let mealPlan = loadMealPlan(); // Load meal plan from localStorage
    let recipeRatings = loadRatings(); // Load ratings from localStorage
    
    // Initialize the page
    displayRecipes();
    updateRecipeCount();
    
    // Event listeners
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') { //if the user presses enter, the search function is called
            handleSearch(); //the search function is called
        }
    });
    
    sortSelect.addEventListener('change', handleSort);
    applyFiltersBtn.addEventListener('click', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);
    closeRecipeModal.addEventListener('click', function() {
        recipeModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    // Add event listener for favorites filter
    document.getElementById('favoritesOnly')?.addEventListener('change', function() {
        if (this.checked) {
            filteredRecipes = recipeData.filter(recipe => favoriteRecipes.includes(recipe.id));
        } else {
            // Reapply other filters
            applyFilters();
        }
        currentPage = 1;
        displayRecipes();
        updateRecipeCount();
    });

    // Rating System Functions
    
    // Load ratings from localStorage
    function loadRatings() {
        const ratings = localStorage.getItem('recipeRatings');
        return ratings ? JSON.parse(ratings) : {};
    }
    
    // Save ratings to localStorage
    function saveRatings() {
        localStorage.setItem('recipeRatings', JSON.stringify(recipeRatings));
    }
    
    // Rate a recipe
    function rateRecipe(recipeId, rating) {
        if (!recipeRatings[recipeId]) {
            recipeRatings[recipeId] = {
                totalRating: 0,
                ratingCount: 0,
                userRating: 0
            };
        }
        
        // If user has already rated, update the total
        if (recipeRatings[recipeId].userRating > 0) {
            recipeRatings[recipeId].totalRating -= recipeRatings[recipeId].userRating;
        } else {
            recipeRatings[recipeId].ratingCount++;
        }
        
        // Add new rating
        recipeRatings[recipeId].totalRating += rating;
        recipeRatings[recipeId].userRating = rating;
        
        saveRatings();
    }
    
    // Get average rating for a recipe
    function getAverageRating(recipeId) {
        if (!recipeRatings[recipeId] || recipeRatings[recipeId].ratingCount === 0) {
            return 0;
        }
        
        return recipeRatings[recipeId].totalRating / recipeRatings[recipeId].ratingCount;
    }
    
    // Get user's rating for a recipe
    function getUserRating(recipeId) {
        if (!recipeRatings[recipeId]) {
            return 0;
        }
        
        return recipeRatings[recipeId].userRating;
    }
    
    // Generate star rating HTML
    function generateStarRating(recipeId, interactive = false) {
        const averageRating = getAverageRating(recipeId);
        const userRating = getUserRating(recipeId);
        const ratingCount = recipeRatings[recipeId]?.ratingCount || 0;
        
        let starsHTML = '';
        
        if (interactive) {
            // Interactive stars for rating
            for (let i = 1; i <= 5; i++) {
                const starClass = i <= userRating ? 'fas fa-star' : 'far fa-star';
                starsHTML += `<i class="${starClass} rating-star" data-rating="${i}"></i>`;
            }
            
            return `
                <div class="recipe-rating-interactive mb-3">
                    <h4>Rate this Recipe</h4>
                    <div class="stars">
                        ${starsHTML}
                    </div>
                    <small>${ratingCount} ${ratingCount === 1 ? 'rating' : 'ratings'}</small>
                </div>
            `;
        } else {
            // Display-only stars for recipe card
            for (let i = 1; i <= 5; i++) {
                if (i <= Math.floor(averageRating)) {
                    starsHTML += '<i class="fas fa-star"></i>';
                } else if (i - 0.5 <= averageRating) {
                    starsHTML += '<i class="fas fa-star-half-alt"></i>';
                } else {
                    starsHTML += '<i class="far fa-star"></i>';
                }
            }
            
            return `
                <div class="recipe-rating">
                    <div class="stars">
                        ${starsHTML}
                    </div>
                    <small>${averageRating.toFixed(1)} (${ratingCount})</small>
                </div>
            `;
        }
    }
    
    // Meal Plan Functions
    
    // Get the current week number (e.g., 2023-W42)
    function getCurrentWeek() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const week = Math.ceil((((now - start) / 86400000) + start.getDay() + 1) / 7);
        return `${now.getFullYear()}-W${week.toString().padStart(2, '0')}`;
    }
    
    // Load meal plan from storage
    async function loadMealPlan() {
        try {
            const currentWeek = getCurrentWeek();
            return await mealPlannerService.getMealPlan(currentWeek) || {
                days: {
                    monday: { breakfast: [], lunch: [], dinner: [] },
                    tuesday: { breakfast: [], lunch: [], dinner: [] },
                    wednesday: { breakfast: [], lunch: [], dinner: [] },
                    thursday: { breakfast: [], lunch: [], dinner: [] },
                    friday: { breakfast: [], lunch: [], dinner: [] },
                    saturday: { breakfast: [], lunch: [], dinner: [] },
                    sunday: { breakfast: [], lunch: [], dinner: [] }
                }
            };
        } catch (error) {
            console.error('Error loading meal plan:', error);
            return {
                days: {
                    monday: { breakfast: [], lunch: [], dinner: [] },
                    tuesday: { breakfast: [], lunch: [], dinner: [] },
                    wednesday: { breakfast: [], lunch: [], dinner: [] },
                    thursday: { breakfast: [], lunch: [], dinner: [] },
                    friday: { breakfast: [], lunch: [], dinner: [] },
                    saturday: { breakfast: [], lunch: [], dinner: [] },
                    sunday: { breakfast: [], lunch: [], dinner: [] }
                }
            };
        }
    }
    
    // Add a recipe to the meal plan
    async function addToMealPlan(recipeId, day, mealType) {
        try {
            const currentWeek = getCurrentWeek();
            await mealPlannerService.addMeal(currentWeek, day, mealType, recipeId);
            
            // Update UI if needed
            const addButton = document.querySelector(`.add-to-plan[data-recipe="${recipeId}"][data-day="${day}"][data-meal="${mealType}"]`);
            if (addButton) {
                addButton.classList.add('added');
                addButton.textContent = 'Added to Plan';
            }
            
            return true;
        } catch (error) {
            console.error('Error adding to meal plan:', error);
            return false;
        }
    }
    
    // Remove a recipe from the meal plan
    async function removeFromMealPlan(recipeId, day, mealType) {
        try {
            const currentWeek = getCurrentWeek();
            await mealPlannerService.removeMeal(currentWeek, day, mealType, recipeId);
            return true;
        } catch (error) {
            console.error('Error removing from meal plan:', error);
            return false;
        }
    }
    
    // Check if a recipe is in the meal plan
    async function isInMealPlan(recipeId) {
        try {
            const currentWeek = getCurrentWeek();
            const plan = await mealPlannerService.getMealPlan(currentWeek);
            
            if (!plan) return false;
            
            // Check all days and meal types
            for (const day in plan.days) {
                for (const mealType in plan.days[day]) {
                    if (plan.days[day][mealType].includes(recipeId)) {
                        return true;
                    }
                }
            }
            
            return false;
        } catch (error) {
            console.error('Error checking meal plan:', error);
            return false;
        }
    }
    
    // Generate meal plan dropdown for recipe card
    function generateMealPlanDropdown(recipeId) {
        return `
            <div class="dropdown meal-plan-dropdown">
                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="mealPlanDropdown${recipeId}" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-calendar-plus"></i> Add to Plan
                </button>
                <ul class="dropdown-menu" aria-labelledby="mealPlanDropdown${recipeId}">
                    <li><h6 class="dropdown-header">Select Day & Meal</h6></li>
                    <li><hr class="dropdown-divider"></li>
                    ${['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => `
                        <li>
                            <div class="dropdown-item-group">
                                <span class="day-name">${day.charAt(0).toUpperCase() + day.slice(1)}</span>
                                <div class="meal-buttons">
                                    <button class="add-to-plan" data-recipe="${recipeId}" data-day="${day}" data-meal="breakfast">B</button>
                                    <button class="add-to-plan" data-recipe="${recipeId}" data-day="${day}" data-meal="lunch">L</button>
                                    <button class="add-to-plan" data-recipe="${recipeId}" data-day="${day}" data-meal="dinner">D</button>
                                </div>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    // Initialize meal plan buttons after recipes are displayed
    function initMealPlanButtons() {
        document.querySelectorAll('.add-to-plan').forEach(button => {
            button.addEventListener('click', async function() {
                const recipeId = this.dataset.recipe;
                const day = this.dataset.day;
                const mealType = this.dataset.meal;
                
                await addToMealPlan(recipeId, day, mealType);
            });
        });
    }
    
    // Load favorites from localStorage
    async function loadFavorites() {
        try {
            // Use the favorites service instead of localStorage
            favorites = await favoritesService.getFavorites();
            return favorites;
        } catch (error) {
            console.error('Error loading favorites:', error);
            return [];
        }
    }
    
    // Favorites are now saved by the favoritesService
    
    // Toggle favorite status for a recipe
    async function toggleFavorite(recipeId) {
        try {
            const newStatus = await favoritesService.toggleFavorite(recipeId);
            
            // Update favorite button UI
            const button = document.querySelector(`.favorite-btn[data-recipe-id="${recipeId}"]`);
            if (button) {
                if (newStatus) {
                    button.classList.add('active');
                    button.innerHTML = '<i class="fas fa-heart"></i>';
                    button.setAttribute('title', 'Remove from favorites');
                } else {
                    button.classList.remove('active');
                    button.innerHTML = '<i class="far fa-heart"></i>';
                    button.setAttribute('title', 'Add to favorites');
                }
            }
            return newStatus;
        } catch (error) {
            console.error('Error toggling favorite:', error);
            return false;
        }
    }
    
    // Check if a recipe is favorited
    async function isFavorite(recipeId) {
        return await favoritesService.isFavorite(recipeId);
    }
    
    // Handle search functionality
    function handleSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        if (searchTerm === '') {
            filteredRecipes = [...recipeData];
        } else {
            filteredRecipes = recipeData.filter(recipe => {
                return recipe.title.toLowerCase().includes(searchTerm) ||
                       recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
                       recipe.cuisine.toLowerCase().includes(searchTerm) ||
                       recipe.ingredients.some(ing => ing.name.toLowerCase().includes(searchTerm));
            });
        }
        currentPage = 1;
        displayRecipes();
        updateRecipeCount();
    }
    
    // Handle sorting
    function handleSort() {
        const sortBy = sortSelect.value;
        
        switch(sortBy) {
            case 'popular':
                // Sort by rating
                filteredRecipes = [...filteredRecipes].sort((a, b) => 
                    getAverageRating(b.id) - getAverageRating(a.id)
                );
                break;
            case 'newest':
                // In a real app, this would sort by date added
                // For now, just use the original order
                filteredRecipes = [...recipeData].filter(recipe => 
                    filteredRecipes.some(r => r.id === recipe.id)
                );
                break;
            case 'time':
                filteredRecipes = [...filteredRecipes].sort((a, b) => 
                    (a.prepTime + a.cookTime) - (b.prepTime + b.cookTime)
                );
                break;
            case 'difficulty':
                const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
                filteredRecipes = [...filteredRecipes].sort((a, b) => 
                    difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
                );
                break;
        }
        
        displayRecipes();
    }
    
    // Apply filters
    function applyFilters() {
        // Get selected filters
        const selectedMealTypes = getSelectedValues('mealType');
        const selectedCuisines = getSelectedValues('cuisine');
        const selectedDiets = getSelectedValues('diet');
        const selectedTimes = getSelectedValues('time');
        const selectedDifficulties = getSelectedValues('difficulty');
        
        // Filter recipes
        filteredRecipes = recipeData.filter(recipe => {
            // Check meal types
            if (selectedMealTypes.length > 0 && !recipe.mealType.some(type => selectedMealTypes.includes(type))) {
                return false;
            }
            
            // Check cuisines
            if (selectedCuisines.length > 0 && !selectedCuisines.includes(recipe.cuisine)) {
                return false;
            }
            
            // Check dietary restrictions
            if (selectedDiets.length > 0 && !selectedDiets.every(diet => recipe.dietaryRestrictions.includes(diet))) {
                return false;
            }
            
            // Check cooking time
            if (selectedTimes.length > 0) {
                const totalTime = recipe.prepTime + recipe.cookTime;
                if (selectedTimes.includes('under15') && totalTime > 15) return false;
                if (selectedTimes.includes('under30') && totalTime > 30) return false;
                if (selectedTimes.includes('under60') && totalTime > 60) return false;
            }
            
            // Check difficulty
            if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(recipe.difficulty)) {
                return false;
            }
            
            return true;
        });
        
        currentPage = 1;
        displayRecipes();
        updateRecipeCount();
    }
    
    // Helper function to get selected checkbox values
    function getSelectedValues(name) {
        return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
            .map(checkbox => checkbox.value);
    }
    
    // Clear all filters
    function clearFilters() {
        document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        searchInput.value = '';
        filteredRecipes = [...recipeData];
        currentPage = 1;
        displayRecipes();
        updateRecipeCount();
    }
    
    // Display recipes in the grid
    function displayRecipes() {
        // Calculate pagination
        const startIndex = (currentPage - 1) * recipesPerPage;
        const endIndex = startIndex + recipesPerPage;
        const paginatedRecipes = filteredRecipes.slice(startIndex, endIndex);
        
        // Clear the grid
        recipeGrid.innerHTML = '';
        
        // Display recipes
        if (paginatedRecipes.length === 0) {
            recipeGrid.innerHTML = `
                <div class="col-12 text-center my-5">
                    <h3>No recipes found</h3>
                    <p>Try adjusting your filters or search terms</p>
                </div>
            `;
        } else {
            paginatedRecipes.forEach(recipe => {
                const recipeCard = createRecipeCard(recipe);
                recipeGrid.appendChild(recipeCard);
            });
        }
        
        // Update pagination
        updatePagination();
    }
    
    // Create recipe card element
    function createRecipeCard(recipe) {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.setAttribute('data-recipe-id', recipe.id);
        
        // Check if the recipe is favorited and render accordingly
        (async function() {
            const isFav = await isFavorite(recipe.id);
            const favoriteClass = isFav ? 'active' : '';
            const favoriteIcon = isFav ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
            const favoriteTitle = isFav ? 'Remove from favorites' : 'Add to favorites';
            
            card.innerHTML = `
                <div class="card">
                    <img src="${recipe.image}" class="card-img-top" alt="${recipe.title}">
                    <div class="card-body">
                        <h5 class="card-title">${recipe.title}</h5>
                        <div class="recipe-meta">
                            <span class="cooking-time"><i class="far fa-clock"></i> ${recipe.prepTime + recipe.cookTime} min</span>
                            <span class="difficulty"><i class="fas fa-signal"></i> ${recipe.difficulty}</span>
                        </div>
                        <div class="recipe-rating" id="rating-${recipe.id}">
                            ${generateStarRating(recipe.id)}
                        </div>
                        <div class="recipe-tags">
                            ${recipe.tags.slice(0, 3).map(tag => `<span class="badge bg-secondary">${tag}</span>`).join('')}
                        </div>
                        <div class="card-actions">
                            <button class="btn btn-sm btn-outline-primary view-recipe" data-recipe-id="${recipe.id}">View Recipe</button>
                            <button class="btn btn-sm btn-outline-secondary favorite-btn ${favoriteClass}" data-recipe-id="${recipe.id}" title="${favoriteTitle}">${favoriteIcon}</button>
                            ${generateMealPlanDropdown(recipe.id)}
                        </div>
                    </div>
                </div>
            `;
            
            // Add event listeners
            const viewButton = card.querySelector('.view-recipe');
            viewButton.addEventListener('click', () => openRecipeModal(recipe.id));
            
            const favoriteButton = card.querySelector('.favorite-btn');
            favoriteButton.addEventListener('click', async () => {
                await toggleFavorite(recipe.id);
            });
        })();
        
        return card;
    }
    
    // Update recipe count
    function updateRecipeCount() {
        recipeCount.textContent = filteredRecipes.length;
    }
    
    // Update pagination controls
    function updatePagination() {
        const pagination = document.getElementById('recipePagination');
        pagination.innerHTML = '';
        
        const totalPages = Math.ceil(filteredRecipes.length / recipesPerPage);
        
        if (totalPages <= 1) {
            return;
        }
        
        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous">
            <span aria-hidden="true">&laquo;</span>
        </a>`;
        prevLi.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                displayRecipes();
            }
        });
        pagination.appendChild(prevLi);
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const pageLi = document.createElement('li');
            pageLi.className = `page-item ${currentPage === i ? 'active' : ''}`;
            pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            pageLi.addEventListener('click', function(e) {
                e.preventDefault();
                currentPage = i;
                displayRecipes();
            });
            pagination.appendChild(pageLi);
        }
        
        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next">
            <span aria-hidden="true">&raquo;</span>
        </a>`;
        nextLi.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentPage < totalPages) {
                currentPage++;
                displayRecipes();
            }
        });
        pagination.appendChild(nextLi);
    }
    
    // Open recipe modal
    function openRecipeModal(recipeId) {
        const recipe = recipeData.find(r => r.id === recipeId);
        if (!recipe) return;
        
        // Set recipe image
        modalRecipeImage.src = recipe.image;
        modalRecipeImage.alt = recipe.title;
        
        // Create ingredients list
        const ingredientsList = recipe.ingredients.map(ing => 
            `<li>${ing.amount} ${ing.name}</li>`
        ).join('');
        
        // Create instructions list
        const instructionsList = recipe.instructions.map((step, index) => 
            `<li>${step}</li>`
        ).join('');
        
        // Generate interactive rating
        const ratingHTML = generateStarRating(recipe.id, true);
        
        // Fill modal content
        recipeModalBody.innerHTML = `
            <h2 class="recipe-modal-title">${recipe.title}</h2>
            ${ratingHTML}
            <div class="recipe-modal-meta">
                <div><i class="far fa-clock"></i> Prep: ${recipe.prepTime} min</div>
                <div><i class="fas fa-fire"></i> Cook: ${recipe.cookTime} min</div>
                <div><i class="fas fa-utensils"></i> ${recipe.difficulty}</div>
                <div><i class="fas fa-users"></i> Serves: ${recipe.servings}</div>
            </div>
            
            <div class="recipe-modal-section">
                <h3>Ingredients</h3>
                <ul class="ingredients-list">
                    ${ingredientsList}
                </ul>
            </div>
            
            <div class="recipe-modal-section">
                <h3>Instructions</h3>
                <ol class="instructions-list">
                    ${instructionsList}
                </ol>
            </div>
            
            <div class="recipe-modal-section">
                <h3>Nutrition Information</h3>
                <div class="nutrition-grid">
                    <div class="nutrition-item">
                        <div class="nutrition-value">${recipe.nutritionInfo.calories}</div>
                        <div class="nutrition-label">Calories</div>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${recipe.nutritionInfo.protein}</div>
                        <div class="nutrition-label">Protein</div>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${recipe.nutritionInfo.carbs}</div>
                        <div class="nutrition-label">Carbs</div>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${recipe.nutritionInfo.fat}</div>
                        <div class="nutrition-label">Fat</div>
                    </div>
                </div>
            </div>
            
            ${generateMealPlanDropdown(recipe.id)}
            
            <div class="d-flex justify-content-between mt-4">
                <button class="btn btn-outline-primary"><i class="fas fa-print"></i> Print Recipe</button>
                <button class="btn btn-primary"><i class="fas fa-share-alt"></i> Share Recipe</button>
            </div>
        `;
        
        // Add event listeners for rating stars
        const stars = recipeModalBody.querySelectorAll('.rating-star');
        stars.forEach(star => {
            star.addEventListener('click', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                rateRecipe(recipe.id, rating);
                
                // Update the stars
                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.className = 'fas fa-star rating-star';
                    } else {
                        s.className = 'far fa-star rating-star';
                    }
                });
                
                // Update rating count display
                const ratingCount = recipeRatings[recipe.id].ratingCount;
                this.parentNode.nextElementSibling.textContent = `${ratingCount} ${ratingCount === 1 ? 'rating' : 'ratings'}`;
            });
            
            // Add hover effect
            star.addEventListener('mouseenter', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                
                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.className = 'fas fa-star rating-star hovered';
                    } else {
                        s.className = 'far fa-star rating-star';
                    }
                });
            });
            
            star.addEventListener('mouseleave', function() {
                const userRating = getUserRating(recipe.id);
                
                stars.forEach((s, index) => {
                    if (index < userRating) {
                        s.className = 'fas fa-star rating-star';
                    } else {
                        s.className = 'far fa-star rating-star';
                    }
                });
            });
        });
        
        // Show modal
        recipeModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}); 