/**
 * Recipe Planner - Data Service
 * Handles fetching and managing recipe data from external sources
 */

import apiService from './apiService.js';

class DataService {
    constructor() {
        this.recipes = [];
        this.apiRecipes = [];
        this.isLoaded = false;
        this.loadingPromise = null;
        this.useApi = true; // Flag to toggle between local data and API
    }

    /**
     * Load recipe data from JSON file
     * @returns {Promise} Promise that resolves when data is loaded
     */
    async loadRecipes() {
        // If data is already loaded, return it
        if (this.isLoaded) {
            return this.recipes;
        }

        // If loading is in progress, return the existing promise
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        // Start loading data
        this.loadingPromise = new Promise((resolve, reject) => {
            fetch('../data/recipes.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    this.recipes = data;
                    this.isLoaded = true;
                    console.log('Recipe data loaded successfully', data.length);
                    resolve(this.recipes);
                })
                .catch(error => {
                    console.error('Error loading recipe data:', error);
                    reject(error);
                });
        });

        return this.loadingPromise;
    }

    /**
     * Get all recipes
     * @returns {Promise<Array>} Promise that resolves with recipe array
     */
    async getRecipes() {
        await this.loadRecipes();
        return this.recipes;
    }

    /**
     * Get a recipe by ID
     * @param {string} id Recipe ID
     * @returns {Promise<Object>} Promise that resolves with recipe object
     */
    async getRecipeById(id) {
        // Check if this is an API recipe ID
        if (id.startsWith('api-')) {
            const spoonacularId = id.replace('api-', '');
            try {
                const apiRecipe = await apiService.getRecipeById(spoonacularId);
                return apiService.convertRecipeFormat(apiRecipe);
            } catch (error) {
                console.error('Error fetching recipe from API:', error);
                // Fall back to local data if API fails
            }
        }
        
        // Otherwise, look in local data
        await this.loadRecipes();
        return this.recipes.find(recipe => recipe.id === id);
    }

    /**
     * Search recipes by text query
     * @param {string} query Search query
     * @returns {Promise<Array>} Promise that resolves with filtered recipe array
     */
    async searchRecipes(query) {
        if (!query || query.trim() === '') {
            return this.getRecipes();
        }

        const searchTerm = query.trim().toLowerCase();
        
        // If API is enabled, try to search using the API
        if (this.useApi) {
            try {
                const apiResults = await apiService.searchRecipes({
                    query: searchTerm,
                    number: 10
                });
                
                if (apiResults && apiResults.results) {
                    // Convert API results to app format
                    const formattedResults = apiResults.results.map(recipe => 
                        apiService.convertRecipeFormat(recipe)
                    );
                    
                    // Cache API results
                    this.apiRecipes = [...this.apiRecipes, ...formattedResults];
                    
                    // Return combined results (API + local)
                    await this.loadRecipes();
                    const localResults = this.recipes.filter(recipe => {
                        return recipe.title.toLowerCase().includes(searchTerm) ||
                               recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
                               recipe.cuisine.toLowerCase().includes(searchTerm) ||
                               recipe.ingredients.some(ing => ing.name.toLowerCase().includes(searchTerm));
                    });
                    
                    return [...formattedResults, ...localResults];
                }
            } catch (error) {
                console.error('API search failed, falling back to local data:', error);
                // Fall back to local search if API fails
            }
        }
        
        // Search local data
        await this.loadRecipes();
        return this.recipes.filter(recipe => {
            return recipe.title.toLowerCase().includes(searchTerm) ||
                   recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
                   recipe.cuisine.toLowerCase().includes(searchTerm) ||
                   recipe.ingredients.some(ing => ing.name.toLowerCase().includes(searchTerm));
        });
    }

    /**
     * Search recipes by ingredients
     * @param {Array<string>} ingredients List of ingredients
     * @returns {Promise<Array>} Promise that resolves with matching recipes
     */
    async searchByIngredients(ingredients) {
        if (!ingredients || ingredients.length === 0) {
            return this.getRecipes();
        }
        
        // If API is enabled, try to search using the API
        if (this.useApi) {
            try {
                const apiResults = await apiService.findRecipesByIngredients(ingredients);
                
                if (apiResults && apiResults.length > 0) {
                    // For findByIngredients endpoint, we need to get full recipe details
                    const detailedRecipes = await Promise.all(
                        apiResults.map(async result => {
                            try {
                                const fullRecipe = await apiService.getRecipeById(result.id);
                                return apiService.convertRecipeFormat(fullRecipe);
                            } catch (error) {
                                console.error(`Error fetching details for recipe ${result.id}:`, error);
                                return null;
                            }
                        })
                    );
                    
                    // Filter out any null results
                    const validRecipes = detailedRecipes.filter(recipe => recipe !== null);
                    
                    // Cache API results
                    this.apiRecipes = [...this.apiRecipes, ...validRecipes];
                    
                    return validRecipes;
                }
            } catch (error) {
                console.error('API ingredient search failed, falling back to local data:', error);
                // Fall back to local search if API fails
            }
        }
        
        // Search local data
        await this.loadRecipes();
        const lowercaseIngredients = ingredients.map(ing => ing.toLowerCase());
        
        return this.recipes.filter(recipe => {
            return recipe.ingredients.some(ing => 
                lowercaseIngredients.some(searchIng => 
                    ing.name.toLowerCase().includes(searchIng)
                )
            );
        });
    }

    /**
     * Get random recipes
     * @param {number} count Number of recipes to return
     * @param {Array<string>} tags Tags to filter by
     * @returns {Promise<Array>} Promise that resolves with random recipes
     */
    async getRandomRecipes(count = 5, tags = []) {
        // If API is enabled, try to get random recipes from API
        if (this.useApi) {
            try {
                const apiResults = await apiService.getRandomRecipes(count, tags);
                
                if (apiResults && apiResults.recipes && apiResults.recipes.length > 0) {
                    // Convert API results to app format
                    const formattedResults = apiResults.recipes.map(recipe => 
                        apiService.convertRecipeFormat(recipe)
                    );
                    
                    // Cache API results
                    this.apiRecipes = [...this.apiRecipes, ...formattedResults];
                    
                    return formattedResults;
                }
            } catch (error) {
                console.error('API random recipes failed, falling back to local data:', error);
                // Fall back to local data if API fails
            }
        }
        
        // Use local data
        await this.loadRecipes();
        
        // Filter by tags if provided
        let filteredRecipes = this.recipes;
        if (tags && tags.length > 0) {
            filteredRecipes = this.recipes.filter(recipe => 
                tags.some(tag => recipe.tags.includes(tag))
            );
        }
        
        // Shuffle and return requested number of recipes
        const shuffled = [...filteredRecipes].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Filter recipes based on criteria
     * @param {Object} filters Filter criteria
     * @returns {Promise<Array>} Promise that resolves with filtered recipe array
     */
    async filterRecipes(filters) {
        // If API is enabled, try to search using the API with filters
        if (this.useApi && filters) {
            try {
                // Map our filter format to Spoonacular's format
                const apiParams = {};
                
                if (filters.dietaryRestrictions) {
                    if (filters.dietaryRestrictions.includes('vegetarian')) apiParams.vegetarian = true;
                    if (filters.dietaryRestrictions.includes('vegan')) apiParams.vegan = true;
                    if (filters.dietaryRestrictions.includes('gluten-free')) apiParams.glutenFree = true;
                    if (filters.dietaryRestrictions.includes('dairy-free')) apiParams.dairyFree = true;
                }
                
                if (filters.cuisines && filters.cuisines.length > 0) {
                    apiParams.cuisine = filters.cuisines.join(',');
                }
                
                if (filters.mealTypes && filters.mealTypes.length > 0) {
                    apiParams.type = filters.mealTypes.join(',');
                }
                
                if (filters.cookingTimes) {
                    if (filters.cookingTimes.includes('under15')) apiParams.maxReadyTime = 15;
                    else if (filters.cookingTimes.includes('under30')) apiParams.maxReadyTime = 30;
                    else if (filters.cookingTimes.includes('under60')) apiParams.maxReadyTime = 60;
                }
                
                const apiResults = await apiService.searchRecipes(apiParams);
                
                if (apiResults && apiResults.results) {
                    // Convert API results to app format
                    const formattedResults = apiResults.results.map(recipe => 
                        apiService.convertRecipeFormat(recipe)
                    );
                    
                    // Cache API results
                    this.apiRecipes = [...this.apiRecipes, ...formattedResults];
                    
                    return formattedResults;
                }
            } catch (error) {
                console.error('API filter search failed, falling back to local data:', error);
                // Fall back to local filtering if API fails
            }
        }
        
        // Filter local data
        await this.loadRecipes();
        
        return this.recipes.filter(recipe => {
            // Check meal types
            if (filters.mealTypes && filters.mealTypes.length > 0 && 
                !recipe.mealType.some(type => filters.mealTypes.includes(type))) {
                return false;
            }
            
            // Check cuisines
            if (filters.cuisines && filters.cuisines.length > 0 && 
                !filters.cuisines.includes(recipe.cuisine)) {
                return false;
            }
            
            // Check dietary restrictions
            if (filters.dietaryRestrictions && filters.dietaryRestrictions.length > 0 && 
                !filters.dietaryRestrictions.every(diet => recipe.dietaryRestrictions.includes(diet))) {
                return false;
            }
            
            // Check cooking time
            if (filters.cookingTimes && filters.cookingTimes.length > 0) {
                const totalTime = recipe.prepTime + recipe.cookTime;
                if (filters.cookingTimes.includes('under15') && totalTime > 15) return false;
                if (filters.cookingTimes.includes('under30') && totalTime > 30) return false;
                if (filters.cookingTimes.includes('under60') && totalTime > 60) return false;
            }
            
            // Check difficulty
            if (filters.difficulties && filters.difficulties.length > 0 && 
                !filters.difficulties.includes(recipe.difficulty)) {
                return false;
            }
            
            // If recipe passed all filters, include it
            return true;
        });
    }

    /**
     * Sort recipes by given criteria
     * @param {Array} recipes Array of recipes to sort
     * @param {string} sortBy Sort criteria (popular, newest, time, difficulty)
     * @param {Object} options Additional sorting options
     * @returns {Array} Sorted recipe array
     */
    sortRecipes(recipes, sortBy, options = {}) {
        const sortedRecipes = [...recipes];
        
        switch(sortBy) {
            case 'popular':
                // In a real app, this would sort by popularity metrics
                // For now, just use the original order
                break;
                
            case 'newest':
                // In a real app, this would sort by date added
                // For now, just use the original order
                break;
                
            case 'time':
                sortedRecipes.sort((a, b) => 
                    (a.prepTime + a.cookTime) - (b.prepTime + b.cookTime)
                );
                break;
                
            case 'difficulty':
                const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
                sortedRecipes.sort((a, b) => 
                    difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
                );
                break;
        }
        
        return sortedRecipes;
    }
    
    /**
     * Toggle API usage
     * @param {boolean} useApi Whether to use the API
     */
    setUseApi(useApi) {
        this.useApi = useApi;
    }
    
    /**
     * Check if API is currently enabled
     * @returns {boolean} Whether API is enabled
     */
    isApiEnabled() {
        return this.useApi;
    }
}

// Create a singleton instance
const dataService = new DataService();

// Export the singleton
export default dataService; 