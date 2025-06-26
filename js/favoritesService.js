/**
 * Recipe Planner - Favorites Service
 * Handles recipe favorites using Appwrite for persistent storage
 * with localStorage fallback for unauthenticated users
 */

import { 
    COLLECTIONS, 
    getCurrentUserId, 
    createDocument, 
    listDocuments, 
    deleteDocument
} from './appwrite.js';
import { getFromStorage, setInStorage } from './utils.js';

class FavoritesService {
    constructor() {
        this.favorites = [];
        this.initialized = false;
        this.initPromise = null;
    }

    /**
     * Initialize favorites service
     * @returns {Promise} Promise that resolves when favorites are loaded
     */
    async init() {
        if (this.initialized) {
            return this.favorites;
        }

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise(async (resolve) => {
            try {
                // Try to get user ID (will be null if not logged in)
                const userId = await getCurrentUserId();

                if (userId) {
                    // User is logged in, load favorites from Appwrite
                    await this.loadFavoritesFromAppwrite(userId);

                    // Check if there are favorites in localStorage to migrate
                    const localFavorites = getFromStorage('favorites', []);
                    if (localFavorites.length > 0) {
                        await this.migrateFavoritesFromLocalStorage(userId, localFavorites);
                    }
                } else {
                    // User is not logged in, use localStorage
                    this.favorites = getFromStorage('favorites', []);
                }

                this.initialized = true;
                resolve(this.favorites);
            } catch (error) {
                console.error('Error initializing favorites:', error);
                // Fallback to localStorage if anything fails
                this.favorites = getFromStorage('favorites', []);
                this.initialized = true;
                resolve(this.favorites);
            }
        });

        return this.initPromise;
    }

    /**
     * Load favorites from Appwrite
     * @param {string} userId - Current user ID
     * @returns {Promise} Promise that resolves when favorites are loaded
     */
    async loadFavoritesFromAppwrite(userId) {
        try {
            // Fetch favorites for current user
            const response = await listDocuments(
                COLLECTIONS.FAVORITES,
                [
                    { field: 'userId', operator: 'equal', value: userId }
                ]
            );
            
            // Extract recipe IDs from documents
            this.favorites = response.documents.map(doc => doc.recipeId);
            return this.favorites;
        } catch (error) {
            console.error('Error loading favorites from Appwrite:', error);
            throw error;
        }
    }

    /**
     * Migrate favorites from localStorage to Appwrite
     * @param {string} userId - Current user ID
     * @param {Array} localFavorites - Favorites from localStorage
     * @returns {Promise} Promise that resolves when migration is complete
     */
    async migrateFavoritesFromLocalStorage(userId, localFavorites) {
        try {
            // Upload each favorite to Appwrite
            const promises = localFavorites.map(recipeId => 
                createDocument(COLLECTIONS.FAVORITES, {
                    userId,
                    recipeId,
                    dateAdded: new Date().toISOString()
                })
            );
            
            await Promise.all(promises);
            
            // Clear localStorage favorites after migration
            setInStorage('favorites', []);
            
            return true;
        } catch (error) {
            console.error('Error migrating favorites to Appwrite:', error);
            throw error;
        }
    }

    /**
     * Get all favorite recipes
     * @returns {Promise<Array>} Promise that resolves with array of favorite recipe IDs
     */
    async getFavorites() {
        await this.init();
        return this.favorites;
    }

    /**
     * Check if a recipe is favorited
     * @param {string} recipeId Recipe ID to check
     * @returns {Promise<boolean>} Promise that resolves with boolean indicating if recipe is favorited
     */
    async isFavorite(recipeId) {
        await this.init();
        return this.favorites.includes(recipeId);
    }

    /**
     * Add a recipe to favorites
     * @param {string} recipeId Recipe ID to add
     * @returns {Promise<boolean>} Promise that resolves with success status
     */
    async addFavorite(recipeId) {
        await this.init();
        
        // Check if already favorited
        if (this.favorites.includes(recipeId)) {
            return true;
        }
        
        try {
            const userId = await getCurrentUserId();
            
            if (userId) {
                // User is logged in, save to Appwrite
                await createDocument(COLLECTIONS.FAVORITES, {
                    userId,
                    recipeId,
                    dateAdded: new Date().toISOString()
                });
            } else {
                // User is not logged in, save to localStorage
                setInStorage('favorites', [...this.favorites, recipeId]);
            }
            
            // Update local cache
            this.favorites.push(recipeId);
            return true;
        } catch (error) {
            console.error('Error adding favorite:', error);
            return false;
        }
    }

    /**
     * Remove a recipe from favorites
     * @param {string} recipeId Recipe ID to remove
     * @returns {Promise<boolean>} Promise that resolves with success status
     */
    async removeFavorite(recipeId) {
        await this.init();
        
        // Check if not favorited
        if (!this.favorites.includes(recipeId)) {
            return true;
        }
        
        try {
            const userId = await getCurrentUserId();
            
            if (userId) {
                // User is logged in, remove from Appwrite
                
                // First, find the document ID for this favorite
                const response = await listDocuments(
                    COLLECTIONS.FAVORITES,
                    [
                        { field: 'userId', operator: 'equal', value: userId },
                        { field: 'recipeId', operator: 'equal', value: recipeId }
                    ]
                );
                
                if (response.documents.length > 0) {
                    const documentId = response.documents[0].$id;
                    await deleteDocument(COLLECTIONS.FAVORITES, documentId);
                }
            } else {
                // User is not logged in, remove from localStorage
                const updatedFavorites = this.favorites.filter(id => id !== recipeId);
                setInStorage('favorites', updatedFavorites);
            }
            
            // Update local cache
            this.favorites = this.favorites.filter(id => id !== recipeId);
            return true;
        } catch (error) {
            console.error('Error removing favorite:', error);
            return false;
        }
    }

    /**
     * Toggle favorite status for a recipe
     * @param {string} recipeId Recipe ID to toggle
     * @returns {Promise<boolean>} Promise that resolves with new favorite status
     */
    async toggleFavorite(recipeId) {
        const isFav = await this.isFavorite(recipeId);
        
        if (isFav) {
            await this.removeFavorite(recipeId);
            return false;
        } else {
            await this.addFavorite(recipeId);
            return true;
        }
    }
}

// Create singleton instance
const favoritesService = new FavoritesService();

export default favoritesService; 