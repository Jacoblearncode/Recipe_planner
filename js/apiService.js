/**
 * Recipe Planner - API Service
 * Handles API calls to Spoonacular for recipe data
 */

class ApiService {
    constructor() {
        this.apiKey = 'e6ee9bb53ed947e8a07c946e51631141'; // Your Spoonacular API key
        this.baseUrl = 'https://api.spoonacular.com'; // Spoonacular API base URL
        this.headers = {
            'Content-Type': 'application/json' // Content type for API requests
        };
        this.requestCache = new Map(); // Cache for API requests
        this.cacheTimeout = 30 * 60 * 1000; // Cache timeout (30 minutes)
    }

    /**
     * Debounce function to limit the rate at which a function can fire
     * @param {Function} func - The function to debounce
     * @param {number} delay - The delay in milliseconds
     * @returns {Function} - The debounced function
     */
    debounce(func, delay) {
        let timeout;
        return (...args) => {
            return new Promise(resolve => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    resolve(func.apply(this, args));
                }, delay);
            });
        };
    }

    /**
     * Make a GET request to the Spoonacular API
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} - Promise that resolves with the API response
     */
    async get(endpoint, params = {}) {
        // Add API key to params
        params.apiKey = this.apiKey;
        
        // Build query string
        const queryString = Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
        
        // Build URL with query string and API key to the end of the url for security
        const url = `${this.baseUrl}${endpoint}?${queryString}`;
        
        // Check cache first
        const cacheKey = url;
        if (this.requestCache.has(cacheKey)) {
            const cachedData = this.requestCache.get(cacheKey);
            if (Date.now() - cachedData.timestamp < this.cacheTimeout) {
                console.log('Returning cached response for:', endpoint);
                return cachedData.data;
            } else {
                // Cache expired, remove it
                this.requestCache.delete(cacheKey);
            }
        }
        
        try { // try to fetch the data from the url
            const response = await fetch(url, { // fetch the data from the url
                method: 'GET', // get method
                headers: this.headers // headers for the request
            });
            
            // Check if response is OK, if not throw an error
            if (!response.ok) { // if the response is not ok, throw an error
                const errorData = await response.json(); // get the error data from the response
                throw new Error(`API Error: ${response.status} - ${errorData.message || response.statusText}`); // throw an error with the status and message
            }
            
            const data = await response.json();
            
            // Cache the response
            this.requestCache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data; // return the data from the response
        } catch (error) { // if there is an error, throw an error
            console.error('API Request Error:', error); // log the error
            throw error; // throw the error
        }
    }

    /**
     * Search for recipes using various criteria
     * @param {Object} params - Search parameters
     * @returns {Promise<Object>} - Promise that resolves with search results
     */
    searchRecipes = this.debounce(async function(params = {}) {
        return this.get('/recipes/complexSearch', {
            ...params,
            addRecipeInformation: true,
            fillIngredients: true,
            number: params.number || 10
        });
    }, 300);

    /**
     * Get detailed information about a specific recipe
     * @param {number} id - Recipe ID
     * @returns {Promise<Object>} - Promise that resolves with recipe details
     */
    async getRecipeById(id) { // get the recipe by id
        return this.get(`/recipes/${id}/information`, {
            includeNutrition: true
        });
    }

    /**
     * Search recipes by ingredients
     * @param {Array<string>} ingredients - List of ingredients
     * @param {number} number - Number of results to return
     * @returns {Promise<Array>} - Promise that resolves with matching recipes
     */
    findRecipesByIngredients = this.debounce(async function(ingredients, number = 10) {
        return this.get('/recipes/findByIngredients', {
            ingredients: ingredients.join(','),
            number,
            ranking: 1, // 1 = maximize used ingredients, 2 = minimize missing ingredients
            ignorePantry: true
        });
    }, 300);

    /**
     * Get random recipes
     * @param {number} number - Number of random recipes to return
     * @param {Array<string>} tags - Tags to filter by (e.g., vegetarian, dessert)
     * @returns {Promise<Object>} - Promise that resolves with random recipes
     */
    async getRandomRecipes(number = 10, tags = []) {
        return this.get('/recipes/random', {
            number,
            tags: tags.join(',')
        });
    }

    /**
     * Convert Spoonacular recipe to app format
     * @param {Object} spoonacularRecipe - Recipe from Spoonacular API
     * @returns {Object} - Recipe in app format
     */
    convertRecipeFormat(spoonacularRecipe) {
        // Extract dietary restrictions
        const dietaryRestrictions = [];
        if (spoonacularRecipe.vegetarian) dietaryRestrictions.push('vegetarian');
        if (spoonacularRecipe.vegan) dietaryRestrictions.push('vegan');
        if (spoonacularRecipe.glutenFree) dietaryRestrictions.push('gluten-free');
        if (spoonacularRecipe.dairyFree) dietaryRestrictions.push('dairy-free');
        
        // Determine meal type based on dish types
        const mealType = [];
        if (spoonacularRecipe.dishTypes) {
            if (spoonacularRecipe.dishTypes.includes('breakfast')) mealType.push('breakfast');
            if (spoonacularRecipe.dishTypes.includes('lunch')) mealType.push('lunch');
            if (spoonacularRecipe.dishTypes.includes('main course') || 
                spoonacularRecipe.dishTypes.includes('dinner')) mealType.push('dinner');
            if (spoonacularRecipe.dishTypes.includes('snack')) mealType.push('snack');
            if (spoonacularRecipe.dishTypes.includes('dessert')) mealType.push('dessert');
        }
        
        // Determine difficulty based on cooking time and complexity
        let difficulty = 'medium';
        const totalTime = (spoonacularRecipe.readyInMinutes || 0);
        if (totalTime < 30) difficulty = 'easy';
        if (totalTime > 60) difficulty = 'hard';
        
        // Format ingredients
        const ingredients = spoonacularRecipe.extendedIngredients ? 
            spoonacularRecipe.extendedIngredients.map(ing => ({
                name: ing.name,
                amount: `${ing.amount} ${ing.unit}`
            })) : [];
        
        // Format instructions
        const instructions = [];
        if (spoonacularRecipe.analyzedInstructions && spoonacularRecipe.analyzedInstructions.length > 0) {
            const steps = spoonacularRecipe.analyzedInstructions[0].steps;
            steps.forEach(step => {
                instructions.push(step.step);
            });
        }
        
        // Extract nutrition info
        const nutritionInfo = {
            calories: 0,
            protein: '0g',
            carbs: '0g',
            fat: '0g'
        };
        
        if (spoonacularRecipe.nutrition && spoonacularRecipe.nutrition.nutrients) {
            spoonacularRecipe.nutrition.nutrients.forEach(nutrient => {
                if (nutrient.name === 'Calories') nutritionInfo.calories = nutrient.amount;
                if (nutrient.name === 'Protein') nutritionInfo.protein = `${Math.round(nutrient.amount)}g`;
                if (nutrient.name === 'Carbohydrates') nutritionInfo.carbs = `${Math.round(nutrient.amount)}g`;
                if (nutrient.name === 'Fat') nutritionInfo.fat = `${Math.round(nutrient.amount)}g`;
            });
        }
        
        // Create recipe in app format
        return {
            id: `api-${spoonacularRecipe.id}`,
            title: spoonacularRecipe.title,
            image: spoonacularRecipe.image,
            prepTime: Math.round((spoonacularRecipe.readyInMinutes || 0) / 3), // Estimate prep time as 1/3 of total time
            cookTime: Math.round((spoonacularRecipe.readyInMinutes || 0) * 2 / 3), // Estimate cook time as 2/3 of total time
            difficulty,
            servings: spoonacularRecipe.servings || 4,
            tags: [...(spoonacularRecipe.dishTypes || []), ...(spoonacularRecipe.cuisines || [])],
            mealType,
            cuisine: (spoonacularRecipe.cuisines && spoonacularRecipe.cuisines.length > 0) ? 
                spoonacularRecipe.cuisines[0].toLowerCase() : 'other',
            dietaryRestrictions,
            ingredients,
            instructions,
            nutritionInfo,
            sourceUrl: spoonacularRecipe.sourceUrl,
            spoonacularId: spoonacularRecipe.id
        };
    }
}

// Create a singleton instance
const apiService = new ApiService();

// Export the singleton
export default apiService; 