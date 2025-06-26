/**
 * Recipe Planner - Meal Planner Service
 * Handles meal plans using Appwrite for persistent storage
 * with localStorage fallback for unauthenticated users
 */

import { 
    COLLECTIONS, 
    getCurrentUserId, 
    createDocument, 
    listDocuments, 
    getDocument,
    updateDocument,
    deleteDocument 
} from './appwrite.js';
import { getFromStorage, setInStorage } from './utils.js';

class MealPlannerService {
    constructor() {
        this.mealPlans = {};
        this.initialized = false;
        this.initPromise = null;
    }

    /**
     * Initialize meal planner service
     * @returns {Promise} Promise that resolves when meal plans are loaded
     */
    async init() {
        if (this.initialized) {
            return this.mealPlans;
        }

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise(async (resolve) => {
            try {
                // Try to get user ID (will be null if not logged in)
                const userId = await getCurrentUserId();

                if (userId) {
                    // User is logged in, load meal plans from Appwrite
                    await this.loadMealPlansFromAppwrite(userId);

                    // Check if there are meal plans in localStorage to migrate
                    const localMealPlans = getFromStorage('mealPlans', {});
                    if (Object.keys(localMealPlans).length > 0) {
                        await this.migrateMealPlansFromLocalStorage(userId, localMealPlans);
                    }
                } else {
                    // User is not logged in, use localStorage
                    this.mealPlans = getFromStorage('mealPlans', {});
                }

                this.initialized = true;
                resolve(this.mealPlans);
            } catch (error) {
                console.error('Error initializing meal plans:', error);
                // Fallback to localStorage if anything fails
                this.mealPlans = getFromStorage('mealPlans', {});
                this.initialized = true;
                resolve(this.mealPlans);
            }
        });

        return this.initPromise;
    }

    /**
     * Load meal plans from Appwrite
     * @param {string} userId - Current user ID
     * @returns {Promise} Promise that resolves when meal plans are loaded
     */
    async loadMealPlansFromAppwrite(userId) {
        try {
            // Fetch meal plans for current user
            const response = await listDocuments(
                COLLECTIONS.MEAL_PLANS,
                [
                    { field: 'userId', operator: 'equal', value: userId }
                ]
            );
            
            // Convert to expected format
            this.mealPlans = {};
            response.documents.forEach(doc => {
                this.mealPlans[doc.week] = doc.plan;
            });
            
            return this.mealPlans;
        } catch (error) {
            console.error('Error loading meal plans from Appwrite:', error);
            throw error;
        }
    }

    /**
     * Migrate meal plans from localStorage to Appwrite
     * @param {string} userId - Current user ID
     * @param {Object} localMealPlans - Meal plans from localStorage
     * @returns {Promise} Promise that resolves when migration is complete
     */
    async migrateMealPlansFromLocalStorage(userId, localMealPlans) {
        try {
            // Upload each week's meal plan to Appwrite
            const promises = Object.entries(localMealPlans).map(([week, plan]) => 
                createDocument(COLLECTIONS.MEAL_PLANS, {
                    userId,
                    week,
                    plan,
                    lastUpdated: new Date().toISOString()
                })
            );
            
            await Promise.all(promises);
            
            // Clear localStorage meal plans after migration
            setInStorage('mealPlans', {});
            
            return true;
        } catch (error) {
            console.error('Error migrating meal plans to Appwrite:', error);
            throw error;
        }
    }

    /**
     * Get all meal plans
     * @returns {Promise<Object>} Promise that resolves with meal plans object
     */
    async getMealPlans() {
        await this.init();
        return this.mealPlans;
    }

    /**
     * Get meal plan for a specific week
     * @param {string} week - Week identifier (e.g., '2023-W42')
     * @returns {Promise<Object>} Promise that resolves with meal plan object
     */
    async getMealPlan(week) {
        await this.init();
        return this.mealPlans[week] || null;
    }

    /**
     * Save meal plan for a specific week
     * @param {string} week - Week identifier (e.g., '2023-W42')
     * @param {Object} plan - Meal plan object
     * @returns {Promise<boolean>} Promise that resolves with success status
     */
    async saveMealPlan(week, plan) {
        await this.init();
        
        try {
            const userId = await getCurrentUserId();
            
            if (userId) {
                // User is logged in, save to Appwrite
                
                // Check if we already have a document for this week
                const response = await listDocuments(
                    COLLECTIONS.MEAL_PLANS,
                    [
                        { field: 'userId', operator: 'equal', value: userId },
                        { field: 'week', operator: 'equal', value: week }
                    ]
                );
                
                if (response.documents.length > 0) {
                    // Update existing plan
                    const documentId = response.documents[0].$id;
                    await updateDocument(COLLECTIONS.MEAL_PLANS, documentId, {
                        plan,
                        lastUpdated: new Date().toISOString()
                    });
                } else {
                    // Create new plan
                    await createDocument(COLLECTIONS.MEAL_PLANS, {
                        userId,
                        week,
                        plan,
                        lastUpdated: new Date().toISOString()
                    });
                }
            } else {
                // User is not logged in, save to localStorage
                const updatedMealPlans = { ...this.mealPlans, [week]: plan };
                setInStorage('mealPlans', updatedMealPlans);
            }
            
            // Update local cache
            this.mealPlans[week] = plan;
            return true;
        } catch (error) {
            console.error('Error saving meal plan:', error);
            return false;
        }
    }

    /**
     * Delete meal plan for a specific week
     * @param {string} week - Week identifier (e.g., '2023-W42')
     * @returns {Promise<boolean>} Promise that resolves with success status
     */
    async deleteMealPlan(week) {
        await this.init();
        
        if (!this.mealPlans[week]) {
            return true; // Nothing to delete
        }
        
        try {
            const userId = await getCurrentUserId();
            
            if (userId) {
                // User is logged in, delete from Appwrite
                const response = await listDocuments(
                    COLLECTIONS.MEAL_PLANS,
                    [
                        { field: 'userId', operator: 'equal', value: userId },
                        { field: 'week', operator: 'equal', value: week }
                    ]
                );
                
                if (response.documents.length > 0) {
                    const documentId = response.documents[0].$id;
                    await deleteDocument(COLLECTIONS.MEAL_PLANS, documentId);
                }
            } else {
                // User is not logged in, delete from localStorage
                const { [week]: removedPlan, ...remainingPlans } = this.mealPlans;
                setInStorage('mealPlans', remainingPlans);
            }
            
            // Update local cache
            const { [week]: removedPlan, ...remainingPlans } = this.mealPlans;
            this.mealPlans = remainingPlans;
            
            return true;
        } catch (error) {
            console.error('Error deleting meal plan:', error);
            return false;
        }
    }

    /**
     * Add meal to a specific day and meal type
     * @param {string} week - Week identifier (e.g., '2023-W42')
     * @param {string} day - Day of the week (e.g., 'monday')
     * @param {string} mealType - Type of meal (e.g., 'breakfast')
     * @param {Object} recipe - Recipe object or ID
     * @returns {Promise<boolean>} Promise that resolves with success status
     */
    async addMeal(week, day, mealType, recipe) {
        await this.init();
        
        try {
            // Get current plan for the week
            const currentPlan = this.mealPlans[week] || {
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
            
            // Ensure day and meal type exist in the plan
            if (!currentPlan.days[day]) {
                currentPlan.days[day] = { breakfast: [], lunch: [], dinner: [] };
            }
            
            if (!currentPlan.days[day][mealType]) {
                currentPlan.days[day][mealType] = [];
            }
            
            // Add recipe to the meal
            const recipeId = typeof recipe === 'object' ? recipe.id : recipe;
            currentPlan.days[day][mealType].push(recipeId);
            
            // Save updated plan
            return await this.saveMealPlan(week, currentPlan);
        } catch (error) {
            console.error('Error adding meal:', error);
            return false;
        }
    }

    /**
     * Remove meal from a specific day and meal type
     * @param {string} week - Week identifier (e.g., '2023-W42')
     * @param {string} day - Day of the week (e.g., 'monday')
     * @param {string} mealType - Type of meal (e.g., 'breakfast')
     * @param {string} recipeId - Recipe ID to remove
     * @returns {Promise<boolean>} Promise that resolves with success status
     */
    async removeMeal(week, day, mealType, recipeId) {
        await this.init();
        
        try {
            // Get current plan for the week
            const currentPlan = this.mealPlans[week];
            
            if (!currentPlan || !currentPlan.days[day] || !currentPlan.days[day][mealType]) {
                return false; // Plan, day, or meal type doesn't exist
            }
            
            // Remove recipe from the meal
            const meals = currentPlan.days[day][mealType];
            const index = meals.indexOf(recipeId);
            
            if (index !== -1) {
                meals.splice(index, 1);
                
                // Save updated plan
                return await this.saveMealPlan(week, currentPlan);
            }
            
            return true; // Recipe wasn't in the meal
        } catch (error) {
            console.error('Error removing meal:', error);
            return false;
        }
    }

    /**
     * Generate a shopping list for a week's meal plan
     * @param {string} week - Week identifier (e.g., '2023-W42')
     * @param {Function} getRecipeById - Function to fetch recipe details by ID
     * @returns {Promise<Array>} Promise that resolves with shopping list items
     */
    async generateShoppingList(week, getRecipeById) {
        await this.init();
        
        const plan = this.mealPlans[week];
        if (!plan) {
            return [];
        }
        
        const shoppingList = {};
        
        try {
            // Process all recipes in the meal plan
            for (const day in plan.days) {
                for (const mealType in plan.days[day]) {
                    const recipes = plan.days[day][mealType];
                    
                    for (const recipeId of recipes) {
                        const recipe = await getRecipeById(recipeId);
                        
                        if (recipe && recipe.ingredients) {
                            recipe.ingredients.forEach(ingredient => {
                                const key = ingredient.name.toLowerCase();
                                
                                if (!shoppingList[key]) {
                                    shoppingList[key] = {
                                        name: ingredient.name,
                                        amount: 0,
                                        unit: ingredient.unit,
                                        recipes: []
                                    };
                                }
                                
                                shoppingList[key].amount += ingredient.amount;
                                
                                if (!shoppingList[key].recipes.includes(recipe.title)) {
                                    shoppingList[key].recipes.push(recipe.title);
                                }
                            });
                        }
                    }
                }
            }
            
            // Convert to array and sort alphabetically
            return Object.values(shoppingList).sort((a, b) => a.name.localeCompare(b.name));
            
        } catch (error) {
            console.error('Error generating shopping list:', error);
            return [];
        }
    }
}

// Create singleton instance
const mealPlannerService = new MealPlannerService();

export default mealPlannerService; 