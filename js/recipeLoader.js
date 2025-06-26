/**
 * Recipe Planner - Recipe Loader
 * Provides functions to load and access recipe data
 */

import dataService from './dataService.js';
import { getFromStorage, setInStorage } from './utils.js';

// State variables for recipe data
let recipeRatings = {};
let favoriteRecipes = [];
let mealPlan = {};
let recentlyViewedRecipes = [];

/**
 * Initialize recipe data
 * @returns {Promise} Promise that resolves when data is loaded
 */
async function initRecipeData() {
    // Load recipes from data service
    await dataService.loadRecipes();
    
    // Load user data from localStorage
    loadUserData();
    
    return true;
}

/**
 * Load user-specific data from localStorage
 */
function loadUserData() {
    // Load recipe ratings
    recipeRatings = getFromStorage('recipeRatings', {});
    
    // Load favorite recipes
    favoriteRecipes = getFromStorage('favoriteRecipes', []);
    
    // Load meal plan
    mealPlan = getFromStorage('weeklyMealPlan', {
        monday: { breakfast: null, lunch: null, dinner: null },
        tuesday: { breakfast: null, lunch: null, dinner: null },
        wednesday: { breakfast: null, lunch: null, dinner: null },
        thursday: { breakfast: null, lunch: null, dinner: null },
        friday: { breakfast: null, lunch: null, dinner: null },
        saturday: { breakfast: null, lunch: null, dinner: null },
        sunday: { breakfast: null, lunch: null, dinner: null }
    });
    
    // Load recently viewed recipes
    recentlyViewedRecipes = getFromStorage('recentlyViewedRecipes', []);
}

/**
 * Get all recipes
 * @returns {Promise<Array>} Promise that resolves with recipe array
 */
async function getRecipes() {
    return await dataService.getRecipes();
}

/**
 * Get a recipe by ID
 * @param {string} id Recipe ID
 * @returns {Promise<Object>} Promise that resolves with recipe object
 */
async function getRecipeById(id) {
    return await dataService.getRecipeById(id);
}

/**
 * Search recipes by text query
 * @param {string} query Search query
 * @returns {Promise<Array>} Promise that resolves with filtered recipe array
 */
async function searchRecipes(query) {
    return await dataService.searchRecipes(query);
}

/**
 * Filter recipes based on criteria
 * @param {Object} filters Filter criteria
 * @returns {Promise<Array>} Promise that resolves with filtered recipe array
 */
async function filterRecipes(filters) {
    return await dataService.filterRecipes(filters);
}

/**
 * Sort recipes by given criteria
 * @param {Array} recipes Array of recipes to sort
 * @param {string} sortBy Sort criteria (popular, newest, time, difficulty)
 * @returns {Array} Sorted recipe array
 */
function sortRecipes(recipes, sortBy) {
    // If sorting by popularity, use rating data
    if (sortBy === 'popular') {
        return [...recipes].sort((a, b) => {
            const aRating = getAverageRating(a.id);
            const bRating = getAverageRating(b.id);
            return bRating - aRating;
        });
    }
    
    // Otherwise use the data service
    return dataService.sortRecipes(recipes, sortBy);
}

// Rating functions

/**
 * Rate a recipe
 * @param {string} recipeId Recipe ID
 * @param {number} rating Rating (1-5)
 */
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
    
    // Save to localStorage
    saveRatings();
}

/**
 * Get average rating for a recipe
 * @param {string} recipeId Recipe ID
 * @returns {number} Average rating
 */
function getAverageRating(recipeId) {
    if (!recipeRatings[recipeId] || recipeRatings[recipeId].ratingCount === 0) {
        return 0;
    }
    
    return recipeRatings[recipeId].totalRating / recipeRatings[recipeId].ratingCount;
}

/**
 * Get user's rating for a recipe
 * @param {string} recipeId Recipe ID
 * @returns {number} User's rating
 */
function getUserRating(recipeId) {
    if (!recipeRatings[recipeId]) {
        return 0;
    }
    
    return recipeRatings[recipeId].userRating;
}

/**
 * Save ratings to localStorage
 */
function saveRatings() {
    setInStorage('recipeRatings', recipeRatings);
}

// Favorites functions

/**
 * Toggle favorite status for a recipe
 * @param {string} recipeId Recipe ID
 * @returns {boolean} New favorite status
 */
function toggleFavorite(recipeId) {
    const index = favoriteRecipes.indexOf(recipeId);
    if (index === -1) {
        // Add to favorites
        favoriteRecipes.push(recipeId);
    } else {
        // Remove from favorites
        favoriteRecipes.splice(index, 1);
    }
    
    // Save to localStorage
    saveFavorites();
    
    return index === -1; // Return true if added, false if removed
}

/**
 * Check if a recipe is in favorites
 * @param {string} recipeId Recipe ID
 * @returns {boolean} True if in favorites
 */
function isFavorite(recipeId) {
    return favoriteRecipes.includes(recipeId);
}

/**
 * Get all favorite recipes
 * @returns {Promise<Array>} Promise that resolves with favorite recipe array
 */
async function getFavoriteRecipes() {
    const allRecipes = await dataService.getRecipes();
    return allRecipes.filter(recipe => favoriteRecipes.includes(recipe.id));
}

/**
 * Save favorites to localStorage
 */
function saveFavorites() {
    setInStorage('favoriteRecipes', favoriteRecipes);
}

// Meal plan functions

/**
 * Add recipe to meal plan
 * @param {string} recipeId Recipe ID
 * @param {string} day Day of the week
 * @param {string} mealType Type of meal (breakfast, lunch, dinner)
 */
function addToMealPlan(recipeId, day, mealType) {
    mealPlan[day][mealType] = recipeId;
    saveMealPlan();
}

/**
 * Remove recipe from meal plan
 * @param {string} day Day of the week
 * @param {string} mealType Type of meal (breakfast, lunch, dinner)
 */
function removeFromMealPlan(day, mealType) {
    mealPlan[day][mealType] = null;
    saveMealPlan();
}

/**
 * Check if recipe is in meal plan
 * @param {string} recipeId Recipe ID
 * @returns {Object|boolean} Location in meal plan or false
 */
function isInMealPlan(recipeId) {
    for (const day in mealPlan) {
        for (const meal in mealPlan[day]) {
            if (mealPlan[day][meal] === recipeId) {
                return { day, meal };
            }
        }
    }
    return false;
}

/**
 * Get the full meal plan
 * @returns {Object} Meal plan object
 */
function getMealPlan() {
    return mealPlan;
}

/**
 * Set the meal plan (used for loading templates)
 * @param {Object} newMealPlan - New meal plan object to set
 */
function setMealPlan(newMealPlan) {
    mealPlan = newMealPlan;
    saveMealPlan();
}

/**
 * Save meal plan to localStorage
 */
function saveMealPlan() {
    setInStorage('weeklyMealPlan', mealPlan);
}

// Recently viewed functions

/**
 * Add recipe to recently viewed
 * @param {string} recipeId Recipe ID
 */
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
    saveRecentlyViewed();
}

/**
 * Get recently viewed recipes
 * @param {number} limit Maximum number of recipes to return
 * @returns {Promise<Array>} Promise that resolves with recently viewed recipe array
 */
async function getRecentlyViewedRecipes(limit = 5) {
    const allRecipes = await dataService.getRecipes();
    const recentRecipes = [];
    
    // Only get the requested number of recipes
    const recentIds = recentlyViewedRecipes.slice(0, limit);
    
    for (const id of recentIds) {
        const recipe = allRecipes.find(r => r.id === id);
        if (recipe) {
            recentRecipes.push(recipe);
        }
    }
    
    return recentRecipes;
}

/**
 * Save recently viewed recipes to localStorage
 */
function saveRecentlyViewed() {
    setInStorage('recentlyViewedRecipes', recentlyViewedRecipes);
}

// Export functions for use in other modules
export {
    initRecipeData,
    getRecipes,
    getRecipeById,
    searchRecipes,
    filterRecipes,
    sortRecipes,
    rateRecipe,
    getAverageRating,
    getUserRating,
    toggleFavorite,
    isFavorite,
    getFavoriteRecipes,
    addToMealPlan,
    removeFromMealPlan,
    isInMealPlan,
    getMealPlan,
    setMealPlan,
    addToRecentlyViewed,
    getRecentlyViewedRecipes
}; 