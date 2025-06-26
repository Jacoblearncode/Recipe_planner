/**
 * Recipe Planner - Dynamic Recipe Browsing Functionality
 * Uses the recipeLoader to handle recipe data, searching, filtering, and displaying recipes
 */

import * as recipeLoader from './recipeLoader.js';
import { debounce, getFromStorage, setInStorage } from './utils.js';

document.addEventListener('DOMContentLoaded', async function() {
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
    const loadingIndicator = document.createElement('div');
    
    // Setup loading indicator
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <p>Loading recipes...</p>
    `;
    document.body.appendChild(loadingIndicator);
    
    // State variables
    let filteredRecipes = [];
    let currentPage = 1;
    const recipesPerPage = 6;
    
    // Initialize recipe data
    try {
        await recipeLoader.initRecipeData();
        filteredRecipes = await recipeLoader.getRecipes();
        hideLoading();
        displayRecipes();
        updateRecipeCount();
    } catch (error) {
        console.error('Error initializing recipe data:', error);
        hideLoading();
        showError('Failed to load recipe data. Please try again later.');
    }
    
    // Event listeners
    searchButton.addEventListener('click', handleSearch);
    
    // Apply debounce to search input with a 500ms delay
    const debouncedSearch = debounce(handleSearch, 500);
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            handleSearch(); // Immediate search on Enter key
        } else {
            debouncedSearch(); // Debounced search while typing
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
    document.getElementById('favoritesOnly')?.addEventListener('change', async function() {
        showLoading();
        if (this.checked) {
            filteredRecipes = await recipeLoader.getFavoriteRecipes();
        } else {
            // Reapply other filters
            applyFilters();
        }
        currentPage = 1;
        hideLoading();
        displayRecipes();
        updateRecipeCount();
    });
    
    // Handle search functionality
    async function handleSearch() {
        const searchTerm = searchInput.value.trim();
        showLoading();
        
        try {
            filteredRecipes = await recipeLoader.searchRecipes(searchTerm);
            currentPage = 1;
            displayRecipes();
            updateRecipeCount();
        } catch (error) {
            console.error('Error searching recipes:', error);
            showError('Failed to search recipes. Please try again.');
        }
        
        hideLoading();
    }
    
    // Handle sorting
    async function handleSort() {
        const sortBy = sortSelect.value;
        showLoading();
        
        try {
            filteredRecipes = recipeLoader.sortRecipes(filteredRecipes, sortBy);
            displayRecipes();
        } catch (error) {
            console.error('Error sorting recipes:', error);
            showError('Failed to sort recipes. Please try again.');
        }
        
        hideLoading();
    }
    
    // Apply filters
    async function applyFilters() {
        showLoading();
        
        try {
            // Get selected filters
            const mealTypes = getSelectedValues('mealType');
            const cuisines = getSelectedValues('cuisine');
            const dietaryRestrictions = getSelectedValues('diet');
            const cookingTimes = getSelectedValues('time');
            const difficulties = getSelectedValues('difficulty');
            
            // Create filter object
            const filters = {
                mealTypes,
                cuisines,
                dietaryRestrictions,
                cookingTimes,
                difficulties
            };
            
            // Apply filters
            filteredRecipes = await recipeLoader.filterRecipes(filters);
            currentPage = 1;
            displayRecipes();
            updateRecipeCount();
        } catch (error) {
            console.error('Error filtering recipes:', error);
            showError('Failed to filter recipes. Please try again.');
        }
        
        hideLoading();
    }
    
    // Helper function to get selected checkbox values
    function getSelectedValues(name) {
        return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
            .map(checkbox => checkbox.value);
    }
    
    // Clear all filters
    async function clearFilters() {
        document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        searchInput.value = '';
        showLoading();
        
        try {
            filteredRecipes = await recipeLoader.getRecipes();
            currentPage = 1;
            displayRecipes();
            updateRecipeCount();
        } catch (error) {
            console.error('Error clearing filters:', error);
            showError('Failed to clear filters. Please try again.');
        }
        
        hideLoading();
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
        
        // Create tags HTML
        const tagsHTML = recipe.tags.slice(0, 3).map(tag => 
            `<span class="recipe-tag">${tag}</span>`
        ).join('');
        
        // Check if recipe is in favorites
        const isFavorite = recipeLoader.isFavorite(recipe.id);
        const heartIcon = isFavorite ? 'fas fa-heart' : 'far fa-heart';
        const savedClass = isFavorite ? 'saved' : '';
        
        // Generate star rating HTML
        const ratingHTML = generateStarRating(recipe.id);
        
        // Set card content
        card.innerHTML = `
            <div class="recipe-image">
                <img src="${recipe.image}" alt="${recipe.title}">
            </div>
            <div class="recipe-content">
                <h3 class="recipe-title">${recipe.title}</h3>
                ${ratingHTML}
                <div class="recipe-meta">
                    <span><i class="far fa-clock"></i> ${recipe.prepTime + recipe.cookTime} min</span>
                    <span><i class="fas fa-utensils"></i> ${recipe.difficulty}</span>
                </div>
                <div class="recipe-tags">
                    ${tagsHTML}
                </div>
                <div class="recipe-actions">
                    <button class="view-recipe" data-id="${recipe.id}">View Recipe</button>
                    <button class="save-recipe ${savedClass}" data-id="${recipe.id}"><i class="${heartIcon}"></i></button>
                </div>
            </div>
        `;
        
        // Add event listeners
        card.querySelector('.view-recipe').addEventListener('click', () => {
            openRecipeModal(recipe.id);
        });
        
        card.querySelector('.save-recipe').addEventListener('click', function() {
            const recipeId = this.getAttribute('data-id');
            const isNowFavorite = recipeLoader.toggleFavorite(recipeId);
            
            // Update heart icon
            if (isNowFavorite) {
                this.innerHTML = '<i class="fas fa-heart"></i>';
                this.classList.add('saved');
            } else {
                this.innerHTML = '<i class="far fa-heart"></i>';
                this.classList.remove('saved');
            }
        });
        
        return card;
    }
    
    // Generate star rating HTML
    function generateStarRating(recipeId, interactive = false) {
        const averageRating = recipeLoader.getAverageRating(recipeId);
        const userRating = recipeLoader.getUserRating(recipeId);
        const ratingCount = recipeLoader.getAverageRating(recipeId) > 0 ? 1 : 0; // Simplified for now
        
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
    async function openRecipeModal(recipeId) {
        showLoading();
        
        try {
            const recipe = await recipeLoader.getRecipeById(recipeId);
            if (!recipe) {
                throw new Error('Recipe not found');
            }
            
            // Add to recently viewed
            recipeLoader.addToRecentlyViewed(recipeId);
            
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
            setupRatingStars(recipe.id);
            
            // Add event listeners for meal plan buttons
            setupMealPlanButtons(recipe.id);
            
            // Show modal
            recipeModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('Error opening recipe modal:', error);
            showError('Failed to load recipe details. Please try again.');
        }
        
        hideLoading();
    }
    
    // Generate meal plan dropdown for recipe modal
    function generateMealPlanDropdown(recipeId) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const meals = ['breakfast', 'lunch', 'dinner'];
        
        let html = `
            <div class="meal-plan-dropdown mt-3">
                <h4>Add to Meal Plan</h4>
                <div class="row">
                    <div class="col-6">
                        <select class="form-select" id="mealPlanDay">
                            <option value="">Select Day</option>
                            ${days.map(day => `<option value="${day}">${day.charAt(0).toUpperCase() + day.slice(1)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-6">
                        <select class="form-select" id="mealPlanType">
                            <option value="">Select Meal</option>
                            ${meals.map(meal => `<option value="${meal}">${meal.charAt(0).toUpperCase() + meal.slice(1)}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <button class="btn btn-success mt-2" id="addToMealPlanBtn">Add to Plan</button>
            </div>
        `;
        
        // Check if recipe is already in meal plan
        const recipeInPlan = recipeLoader.isInMealPlan(recipeId);
        if (recipeInPlan) {
            html += `
                <div class="alert alert-info mt-2">
                    This recipe is already in your meal plan for ${recipeInPlan.day.charAt(0).toUpperCase() + recipeInPlan.day.slice(1)}'s ${recipeInPlan.meal}.
                    <button class="btn btn-sm btn-danger ms-2" id="removeFromMealPlanBtn" data-day="${recipeInPlan.day}" data-meal="${recipeInPlan.meal}">Remove</button>
                </div>
            `;
        }
        
        return html;
    }
    
    // Setup rating stars event listeners
    function setupRatingStars(recipeId) {
        const stars = recipeModalBody.querySelectorAll('.rating-star');
        stars.forEach(star => {
            star.addEventListener('click', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                recipeLoader.rateRecipe(recipeId, rating);
                
                // Update the stars
                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.className = 'fas fa-star rating-star';
                    } else {
                        s.className = 'far fa-star rating-star';
                    }
                });
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
                const userRating = recipeLoader.getUserRating(recipeId);
                
                stars.forEach((s, index) => {
                    if (index < userRating) {
                        s.className = 'fas fa-star rating-star';
                    } else {
                        s.className = 'far fa-star rating-star';
                    }
                });
            });
        });
    }
    
    // Setup meal plan buttons event listeners
    function setupMealPlanButtons(recipeId) {
        const addToMealPlanBtn = recipeModalBody.querySelector('#addToMealPlanBtn');
        if (addToMealPlanBtn) {
            addToMealPlanBtn.addEventListener('click', function() {
                const day = document.getElementById('mealPlanDay').value;
                const mealType = document.getElementById('mealPlanType').value;
                
                if (!day || !mealType) {
                    showError('Please select both a day and meal type');
                    return;
                }
                
                recipeLoader.addToMealPlan(recipeId, day, mealType);
                
                // Update the dropdown area
                const mealPlanArea = recipeModalBody.querySelector('.meal-plan-dropdown').parentNode;
                mealPlanArea.innerHTML = generateMealPlanDropdown(recipeId);
                
                // Re-add event listeners
                setupMealPlanButtons(recipeId);
            });
        }
        
        const removeFromMealPlanBtn = recipeModalBody.querySelector('#removeFromMealPlanBtn');
        if (removeFromMealPlanBtn) {
            removeFromMealPlanBtn.addEventListener('click', function() {
                const day = this.getAttribute('data-day');
                const meal = this.getAttribute('data-meal');
                
                recipeLoader.removeFromMealPlan(day, meal);
                
                // Update the dropdown area
                const mealPlanArea = recipeModalBody.querySelector('.meal-plan-dropdown').parentNode;
                mealPlanArea.innerHTML = generateMealPlanDropdown(recipeId);
                
                // Re-add event listeners
                setupMealPlanButtons(recipeId);
            });
        }
    }
    
    // Show loading indicator
    function showLoading() {
        loadingIndicator.style.display = 'flex';
    }
    
    // Hide loading indicator
    function hideLoading() {
        loadingIndicator.style.display = 'none';
    }
    
    // Show error message
    function showError(message) {
        const errorToast = document.createElement('div');
        errorToast.className = 'error-toast';
        errorToast.innerHTML = `
            <div class="error-icon">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <div class="error-message">${message}</div>
            <button class="error-close"><i class="fas fa-times"></i></button>
        `;
        
        document.body.appendChild(errorToast);
        
        // Show toast
        setTimeout(() => {
            errorToast.classList.add('show');
        }, 10);
        
        // Auto-remove after 5 seconds
        const timeout = setTimeout(() => {
            removeError(errorToast);
        }, 5000);
        
        // Close button
        errorToast.querySelector('.error-close').addEventListener('click', () => {
            clearTimeout(timeout);
            removeError(errorToast);
        });
    }
    
    // Remove error toast
    function removeError(errorToast) {
        errorToast.classList.remove('show');
        errorToast.classList.add('hide');
        setTimeout(() => {
            errorToast.remove();
        }, 300);
    }
});

// Add CSS for loading indicator and error toast
document.head.insertAdjacentHTML('beforeend', `
<style>
.loading-indicator {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.error-toast {
    position: fixed;
    bottom: 20px;
    left: 20px;
    display: flex;
    align-items: center;
    padding: 15px;
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-left: 4px solid #EF4444;
    border-radius: 8px;
    max-width: 350px;
    z-index: 1000;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
}

.error-toast.show {
    opacity: 1;
    transform: translateY(0);
}

.error-toast.hide {
    opacity: 0;
    transform: translateY(20px);
}

.error-icon {
    margin-right: 12px;
    font-size: 20px;
    color: #EF4444;
}

.error-message {
    flex: 1;
    font-size: 14px;
}

.error-close {
    background: none;
    border: none;
    color: #9CA3AF;
    cursor: pointer;
    margin-left: 10px;
}
</style>
`); 