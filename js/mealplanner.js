/**
 * Recipe Planner - Meal Planning Functionality
 * Handles meal planning calendar, recipe assignment, and shopping list generation
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const favoriteRecipesContainer = document.getElementById('favoriteRecipes');
    const recentRecipesContainer = document.getElementById('recentRecipes');
    const recipeSearchInput = document.getElementById('recipeSearchInput');
    const mealSlots = document.querySelectorAll('.meal-slot');
    const generateShoppingListBtn = document.getElementById('generateShoppingList');
    const printMealPlanBtn = document.getElementById('printMealPlan');
    const clearMealPlanBtn = document.getElementById('clearMealPlan');
    const shoppingListModal = new bootstrap.Modal(document.getElementById('shoppingListModal'));
    const shoppingListContent = document.getElementById('shoppingListContent');
    const printShoppingListBtn = document.getElementById('printShoppingList');
    
    // Nutrition summary elements
    const totalCaloriesEl = document.getElementById('totalCalories');
    const totalProteinEl = document.getElementById('totalProtein');
    const totalCarbsEl = document.getElementById('totalCarbs');
    const totalFatEl = document.getElementById('totalFat');
    
    // State variables
    let mealPlan = loadMealPlan();
    let favoriteRecipes = loadFavorites();
    let recentlyViewedRecipes = loadRecentlyViewed();
    
    // Initialize the page
    displayFavoriteRecipes();
    displayRecentRecipes();
    displayMealPlan();
    updateNutritionSummary();
    
    // Event listeners
    recipeSearchInput.addEventListener('keyup', handleRecipeSearch);
    generateShoppingListBtn.addEventListener('click', generateShoppingList);
    printMealPlanBtn.addEventListener('click', printMealPlan);
    clearMealPlanBtn.addEventListener('click', clearMealPlan);
    printShoppingListBtn.addEventListener('click', printShoppingList);
    
    // Add event listeners to meal slots
    mealSlots.forEach(slot => {
        slot.addEventListener('click', function() {
            const day = this.getAttribute('data-day');
            const mealType = this.getAttribute('data-meal');
            openRecipeSelection(day, mealType, this);
        });
        
        // Enable drop functionality
        slot.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });
        
        slot.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });
        
        slot.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            const recipeId = e.dataTransfer.getData('text/plain');
            const day = this.getAttribute('data-day');
            const mealType = this.getAttribute('data-meal');
            
            assignRecipeToSlot(recipeId, day, mealType);
        });
    });
    
    // Load meal plan from localStorage
    function loadMealPlan() {
        const plan = localStorage.getItem('weeklyMealPlan');
        if (!plan) {
            // Initialize empty meal plan
            const emptyPlan = {
                monday: { breakfast: null, lunch: null, dinner: null },
                tuesday: { breakfast: null, lunch: null, dinner: null },
                wednesday: { breakfast: null, lunch: null, dinner: null },
                thursday: { breakfast: null, lunch: null, dinner: null },
                friday: { breakfast: null, lunch: null, dinner: null },
                saturday: { breakfast: null, lunch: null, dinner: null },
                sunday: { breakfast: null, lunch: null, dinner: null }
            };
            return emptyPlan;
        }
        return JSON.parse(plan);
    }
    
    // Save meal plan to localStorage
    function saveMealPlan() {
        localStorage.setItem('weeklyMealPlan', JSON.stringify(mealPlan));
    }
    
    // Load favorite recipes from localStorage
    function loadFavorites() {
        const favorites = localStorage.getItem('favoriteRecipes');
        return favorites ? JSON.parse(favorites) : [];
    }
    
    // Load recently viewed recipes from localStorage
    function loadRecentlyViewed() {
        const recent = localStorage.getItem('recentlyViewedRecipes');
        return recent ? JSON.parse(recent) : [];
    }
    
    // Display favorite recipes in the sidebar
    function displayFavoriteRecipes() {
        favoriteRecipesContainer.innerHTML = '';
        
        if (favoriteRecipes.length === 0) {
            favoriteRecipesContainer.innerHTML = '<p class="text-muted">No favorite recipes yet</p>';
            return;
        }
        
        favoriteRecipes.forEach(recipeId => {
            const recipe = recipeData.find(r => r.id === recipeId);
            if (recipe) {
                const recipeElement = createRecipeElement(recipe);
                favoriteRecipesContainer.appendChild(recipeElement);
            }
        });
    }
    
    // Display recently viewed recipes in the sidebar
    function displayRecentRecipes() {
        recentRecipesContainer.innerHTML = '';
        
        if (recentlyViewedRecipes.length === 0) {
            recentRecipesContainer.innerHTML = '<p class="text-muted">No recently viewed recipes</p>';
            return;
        }
        
        // Only show the 5 most recent recipes
        recentlyViewedRecipes.slice(0, 5).forEach(recipeId => {
            const recipe = recipeData.find(r => r.id === recipeId);
            if (recipe) {
                const recipeElement = createRecipeElement(recipe);
                recentRecipesContainer.appendChild(recipeElement);
            }
        });
    }
    
    // Create a recipe element for the sidebar
    function createRecipeElement(recipe) {
        const recipeElement = document.createElement('div');
        recipeElement.className = 'meal-item';
        recipeElement.setAttribute('draggable', 'true');
        recipeElement.setAttribute('data-id', recipe.id);
        
        recipeElement.innerHTML = `
            <div class="meal-item-title">${recipe.title}</div>
            <div class="meal-item-meta">
                <span><i class="far fa-clock"></i> ${recipe.prepTime + recipe.cookTime} min</span>
                <span><i class="fas fa-utensils"></i> ${recipe.difficulty}</span>
            </div>
        `;
        
        // Add event listener for drag
        recipeElement.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', recipe.id);
        });
        
        // Add event listener for click
        recipeElement.addEventListener('click', function() {
            // Open recipe details modal
            openRecipeModal(recipe.id);
        });
        
        return recipeElement;
    }
    
    // Display the current meal plan
    function displayMealPlan() {
        mealSlots.forEach(slot => {
            const day = slot.getAttribute('data-day');
            const mealType = slot.getAttribute('data-meal');
            
            // Clear the slot
            slot.innerHTML = '';
            slot.classList.remove('has-meal');
            
            // Check if there is a meal assigned to this slot
            const recipeId = mealPlan[day][mealType];
            if (recipeId) {
                const recipe = recipeData.find(r => r.id === recipeId);
                if (recipe) {
                    slot.classList.add('has-meal');
                    
                    const mealContent = document.createElement('div');
                    mealContent.className = 'meal-content';
                    mealContent.innerHTML = `
                        <div class="meal-item-title">${recipe.title}</div>
                        <div class="meal-item-meta">
                            <span><i class="far fa-clock"></i> ${recipe.prepTime + recipe.cookTime} min</span>
                        </div>
                        <button class="btn btn-sm btn-outline-danger remove-meal" title="Remove meal">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    
                    // Add event listener to remove button
                    const removeBtn = mealContent.querySelector('.remove-meal');
                    removeBtn.addEventListener('click', function(e) {
                        e.stopPropagation(); // Prevent slot click event
                        removeMeal(day, mealType);
                    });
                    
                    slot.appendChild(mealContent);
                }
            }
        });
    }
    
    // Open recipe modal from recipes.js
    function openRecipeModal(recipeId) {
        // This function is defined in recipes.js
        // Add recipe to recently viewed
        addToRecentlyViewed(recipeId);
    }
    
    // Add recipe to recently viewed
    function addToRecentlyViewed(recipeId) {
        // Remove if already in the list
        const index = recentlyViewedRecipes.indexOf(recipeId);
        if (index !== -1) {
            recentlyViewedRecipes.splice(index, 1);
        }
        
        // Add to the beginning of the list
        recentlyViewedRecipes.unshift(recipeId);
        
        // Keep only the 10 most recent
        if (recentlyViewedRecipes.length > 10) {
            recentlyViewedRecipes.pop();
        }
        
        // Save to localStorage
        localStorage.setItem('recentlyViewedRecipes', JSON.stringify(recentlyViewedRecipes));
        
        // Update the display
        displayRecentRecipes();
    }
    
    // Open recipe selection for a meal slot
    function openRecipeSelection(day, mealType, slot) {
        // In a real app, this would open a modal with recipe selection
        // For now, let's use a simple prompt
        const recipeId = prompt('Enter recipe ID to assign to ' + day + ' ' + mealType);
        if (recipeId) {
            assignRecipeToSlot(recipeId, day, mealType);
        }
    }
    
    // Assign a recipe to a meal slot
    function assignRecipeToSlot(recipeId, day, mealType) {
        const recipe = recipeData.find(r => r.id === recipeId);
        if (!recipe) {
            alert('Recipe not found');
            return;
        }
        
        // Update the meal plan
        mealPlan[day][mealType] = recipeId;
        saveMealPlan();
        
        // Update the display
        displayMealPlan();
        updateNutritionSummary();
    }
    
    // Remove a meal from the plan
    function removeMeal(day, mealType) {
        mealPlan[day][mealType] = null;
        saveMealPlan();
        
        // Update the display
        displayMealPlan();
        updateNutritionSummary();
    }
    
    // Update the nutrition summary
    function updateNutritionSummary() {
        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        let mealCount = 0;
        
        // Calculate totals
        for (const day in mealPlan) {
            for (const mealType in mealPlan[day]) {
                const recipeId = mealPlan[day][mealType];
                if (recipeId) {
                    const recipe = recipeData.find(r => r.id === recipeId);
                    if (recipe && recipe.nutritionInfo) {
                        totalCalories += parseInt(recipe.nutritionInfo.calories);
                        totalProtein += parseInt(recipe.nutritionInfo.protein);
                        totalCarbs += parseInt(recipe.nutritionInfo.carbs);
                        totalFat += parseInt(recipe.nutritionInfo.fat);
                        mealCount++;
                    }
                }
            }
        }
        
        // Calculate daily averages
        const daysInWeek = 7;
        const avgCalories = mealCount > 0 ? Math.round(totalCalories / daysInWeek) : 0;
        const avgProtein = mealCount > 0 ? Math.round(totalProtein / daysInWeek) : 0;
        const avgCarbs = mealCount > 0 ? Math.round(totalCarbs / daysInWeek) : 0;
        const avgFat = mealCount > 0 ? Math.round(totalFat / daysInWeek) : 0;
        
        // Update the display
        totalCaloriesEl.textContent = avgCalories;
        totalProteinEl.textContent = avgProtein + 'g';
        totalCarbsEl.textContent = avgCarbs + 'g';
        totalFatEl.textContent = avgFat + 'g';
    }
    
    // Handle recipe search
    function handleRecipeSearch() {
        const searchTerm = recipeSearchInput.value.trim().toLowerCase();
        
        // In a real app, this would filter the recipes in the sidebar
        // For now, let's just log it
        console.log('Searching for: ' + searchTerm);
    }
    
    // Generate shopping list
    function generateShoppingList() {
        // Get all ingredients from the meal plan
        const ingredients = [];
        
        for (const day in mealPlan) {
            for (const mealType in mealPlan[day]) {
                const recipeId = mealPlan[day][mealType];
                if (recipeId) {
                    const recipe = recipeData.find(r => r.id === recipeId);
                    if (recipe && recipe.ingredients) {
                        recipe.ingredients.forEach(ingredient => {
                            // Check if ingredient already exists in the list
                            const existingIngredient = ingredients.find(i => i.name === ingredient.name);
                            if (existingIngredient) {
                                // In a real app, we would convert and aggregate quantities
                                existingIngredient.recipes.push(`${recipe.title} (${day} ${mealType})`);
                            } else {
                                ingredients.push({
                                    name: ingredient.name,
                                    amount: ingredient.amount,
                                    recipes: [`${recipe.title} (${day} ${mealType})`]
                                });
                            }
                        });
                    }
                }
            }
        }
        
        // Generate HTML for the shopping list
        let html = '';
        
        if (ingredients.length === 0) {
            html = '<p>No ingredients needed - add recipes to your meal plan first.</p>';
        } else {
            html = `
                <div class="mb-3">
                    <p>Here's your shopping list for the week:</p>
                </div>
                <ul class="list-group mb-3">
            `;
            
            ingredients.forEach(ingredient => {
                html += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${ingredient.name}</strong> - ${ingredient.amount}
                            <div class="small text-muted">Used in: ${ingredient.recipes.join(', ')}</div>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" value="" id="check-${ingredient.name.replace(/\s+/g, '-')}">
                        </div>
                    </li>
                `;
            });
            
            html += '</ul>';
        }
        
        // Update the modal content
        shoppingListContent.innerHTML = html;
        
        // Show the modal
        shoppingListModal.show();
    }
    
    // Print meal plan
    function printMealPlan() {
        window.print();
    }
    
    // Print shopping list
    function printShoppingList() {
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        
        // Generate HTML for the shopping list
        let html = `
            <html>
            <head>
                <title>Shopping List</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { text-align: center; }
                    ul { list-style-type: none; padding: 0; }
                    li { padding: 8px 0; border-bottom: 1px solid #eee; }
                    .small { font-size: 0.85em; color: #666; }
                </style>
            </head>
            <body>
                <h1>Shopping List</h1>
        `;
        
        // Add ingredients
        html += '<ul>';
        
        const listItems = shoppingListContent.querySelectorAll('.list-group-item');
        listItems.forEach(item => {
            const nameEl = item.querySelector('strong');
            const amountText = nameEl.nextSibling.textContent;
            const usedInEl = item.querySelector('.small');
            
            html += `
                <li>
                    <strong>${nameEl.textContent}</strong>${amountText}
                    <div class="small">${usedInEl.textContent}</div>
                </li>
            `;
        });
        
        html += `
                </ul>
            </body>
            </html>
        `;
        
        // Write HTML to the new window
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Print after the document has loaded
        printWindow.onload = function() {
            printWindow.print();
            printWindow.close();
        };
    }
    
    // Clear meal plan
    function clearMealPlan() {
        if (confirm('Are you sure you want to clear the entire meal plan?')) {
            // Reset meal plan
            mealPlan = {
                monday: { breakfast: null, lunch: null, dinner: null },
                tuesday: { breakfast: null, lunch: null, dinner: null },
                wednesday: { breakfast: null, lunch: null, dinner: null },
                thursday: { breakfast: null, lunch: null, dinner: null },
                friday: { breakfast: null, lunch: null, dinner: null },
                saturday: { breakfast: null, lunch: null, dinner: null },
                sunday: { breakfast: null, lunch: null, dinner: null }
            };
            
            // Save to localStorage
            saveMealPlan();
            
            // Update the display
            displayMealPlan();
            updateNutritionSummary();
        }
    }
}); 