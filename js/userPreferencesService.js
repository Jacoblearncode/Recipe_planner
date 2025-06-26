/**
 * Recipe Planner - User Preferences Service
 * Handles user preferences using Appwrite for persistent storage
 * with localStorage fallback for unauthenticated users
 */

import { 
    COLLECTIONS, 
    getCurrentUserId, 
    createDocument, 
    listDocuments, 
    updateDocument,
    deleteDocument 
} from './appwrite.js';
import { getFromStorage, setInStorage } from './utils.js';

class UserPreferencesService {
    constructor() {
        this.preferences = {};
        this.initialized = false;
        this.initPromise = null;
        this.preferencesDocId = null;
    }

    /**
     * Initialize user preferences service
     * @returns {Promise} Promise that resolves when preferences are loaded
     */
    async init() {
        if (this.initialized) {
            return this.preferences;
        }

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise(async (resolve) => {
            try {
                // Try to get user ID (will be null if not logged in)
                const userId = await getCurrentUserId();

                if (userId) {
                    // User is logged in, load preferences from Appwrite
                    await this.loadPreferencesFromAppwrite(userId);

                    // Check if there are preferences in localStorage to migrate
                    const localPreferences = getFromStorage('userPreferences', {});
                    if (Object.keys(localPreferences).length > 0) {
                        await this.migratePreferencesFromLocalStorage(userId, localPreferences);
                    }
                } else {
                    // User is not logged in, use localStorage
                    this.preferences = getFromStorage('userPreferences', this.getDefaultPreferences());
                }

                this.initialized = true;
                resolve(this.preferences);
            } catch (error) {
                console.error('Error initializing user preferences:', error);
                // Fallback to localStorage if anything fails
                this.preferences = getFromStorage('userPreferences', this.getDefaultPreferences());
                this.initialized = true;
                resolve(this.preferences);
            }
        });

        return this.initPromise;
    }

    /**
     * Get default preferences
     * @returns {Object} Default preferences object
     */
    getDefaultPreferences() {
        return {
            theme: 'light',
            dietaryRestrictions: [],
            allergies: [],
            cuisinePreferences: [],
            mealPlanDays: 7,
            useMetricSystem: false,
            notificationPreferences: {
                mealReminders: true,
                weeklyPlanning: true,
                newRecipes: false
            },
            showNutritionalInfo: true,
            language: 'en',
            // Add other default preferences as needed
        };
    }

    /**
     * Load preferences from Appwrite
     * @param {string} userId - Current user ID
     * @returns {Promise} Promise that resolves when preferences are loaded
     */
    async loadPreferencesFromAppwrite(userId) {
        try {
            // Fetch preferences for current user
            const response = await listDocuments(
                COLLECTIONS.USER_PREFERENCES,
                [
                    { field: 'userId', operator: 'equal', value: userId }
                ]
            );
            
            if (response.documents.length > 0) {
                // User has preferences
                const doc = response.documents[0];
                this.preferences = doc.preferences;
                this.preferencesDocId = doc.$id;
            } else {
                // User doesn't have preferences yet, use defaults
                this.preferences = this.getDefaultPreferences();
            }
            
            return this.preferences;
        } catch (error) {
            console.error('Error loading preferences from Appwrite:', error);
            throw error;
        }
    }

    /**
     * Migrate preferences from localStorage to Appwrite
     * @param {string} userId - Current user ID
     * @param {Object} localPreferences - Preferences from localStorage
     * @returns {Promise} Promise that resolves when migration is complete
     */
    async migratePreferencesFromLocalStorage(userId, localPreferences) {
        try {
            // Check if user already has preferences in Appwrite
            if (this.preferencesDocId) {
                // Update existing preferences
                await updateDocument(
                    COLLECTIONS.USER_PREFERENCES, 
                    this.preferencesDocId,
                    {
                        preferences: {
                            ...this.preferences,
                            ...localPreferences
                        },
                        lastUpdated: new Date().toISOString()
                    }
                );
            } else {
                // Create new preferences
                const result = await createDocument(
                    COLLECTIONS.USER_PREFERENCES,
                    {
                        userId,
                        preferences: localPreferences,
                        createdAt: new Date().toISOString(),
                        lastUpdated: new Date().toISOString()
                    }
                );
                
                this.preferencesDocId = result.$id;
            }
            
            // Update local cache
            this.preferences = {
                ...this.preferences,
                ...localPreferences
            };
            
            // Clear localStorage preferences after migration
            setInStorage('userPreferences', {});
            
            return true;
        } catch (error) {
            console.error('Error migrating preferences to Appwrite:', error);
            throw error;
        }
    }

    /**
     * Get all user preferences
     * @returns {Promise<Object>} Promise that resolves with preferences object
     */
    async getPreferences() {
        await this.init();
        return this.preferences;
    }

    /**
     * Get a specific preference
     * @param {string} key - Preference key
     * @param {*} defaultValue - Default value if preference doesn't exist
     * @returns {Promise<*>} Promise that resolves with preference value
     */
    async getPreference(key, defaultValue = null) {
        await this.init();
        return this.preferences[key] !== undefined ? this.preferences[key] : defaultValue;
    }

    /**
     * Set a specific preference
     * @param {string} key - Preference key
     * @param {*} value - Preference value
     * @returns {Promise<boolean>} Promise that resolves with success status
     */
    async setPreference(key, value) {
        await this.init();
        
        try {
            const userId = await getCurrentUserId();
            
            if (userId) {
                // User is logged in, save to Appwrite
                if (this.preferencesDocId) {
                    // Update existing preferences
                    const updatedPreferences = {
                        ...this.preferences,
                        [key]: value
                    };
                    
                    await updateDocument(
                        COLLECTIONS.USER_PREFERENCES, 
                        this.preferencesDocId,
                        {
                            preferences: updatedPreferences,
                            lastUpdated: new Date().toISOString()
                        }
                    );
                } else {
                    // Create new preferences document
                    const newPreferences = {
                        ...this.getDefaultPreferences(),
                        [key]: value
                    };
                    
                    const result = await createDocument(
                        COLLECTIONS.USER_PREFERENCES,
                        {
                            userId,
                            preferences: newPreferences,
                            createdAt: new Date().toISOString(),
                            lastUpdated: new Date().toISOString()
                        }
                    );
                    
                    this.preferencesDocId = result.$id;
                }
            } else {
                // User is not logged in, save to localStorage
                const updatedPreferences = {
                    ...this.preferences,
                    [key]: value
                };
                
                setInStorage('userPreferences', updatedPreferences);
            }
            
            // Update local cache
            this.preferences[key] = value;
            return true;
        } catch (error) {
            console.error('Error setting preference:', error);
            return false;
        }
    }

    /**
     * Update multiple preferences at once
     * @param {Object} preferencesObj - Object with preference key/value pairs
     * @returns {Promise<boolean>} Promise that resolves with success status
     */
    async updatePreferences(preferencesObj) {
        await this.init();
        
        try {
            const userId = await getCurrentUserId();
            
            if (userId) {
                // User is logged in, save to Appwrite
                const updatedPreferences = {
                    ...this.preferences,
                    ...preferencesObj
                };
                
                if (this.preferencesDocId) {
                    // Update existing preferences
                    await updateDocument(
                        COLLECTIONS.USER_PREFERENCES, 
                        this.preferencesDocId,
                        {
                            preferences: updatedPreferences,
                            lastUpdated: new Date().toISOString()
                        }
                    );
                } else {
                    // Create new preferences document
                    const result = await createDocument(
                        COLLECTIONS.USER_PREFERENCES,
                        {
                            userId,
                            preferences: updatedPreferences,
                            createdAt: new Date().toISOString(),
                            lastUpdated: new Date().toISOString()
                        }
                    );
                    
                    this.preferencesDocId = result.$id;
                }
            } else {
                // User is not logged in, save to localStorage
                const updatedPreferences = {
                    ...this.preferences,
                    ...preferencesObj
                };
                
                setInStorage('userPreferences', updatedPreferences);
            }
            
            // Update local cache
            this.preferences = {
                ...this.preferences,
                ...preferencesObj
            };
            
            return true;
        } catch (error) {
            console.error('Error updating preferences:', error);
            return false;
        }
    }

    /**
     * Reset preferences to defaults
     * @returns {Promise<boolean>} Promise that resolves with success status
     */
    async resetPreferences() {
        const defaultPreferences = this.getDefaultPreferences();
        
        try {
            const userId = await getCurrentUserId();
            
            if (userId && this.preferencesDocId) {
                // User is logged in with existing preferences
                await updateDocument(
                    COLLECTIONS.USER_PREFERENCES, 
                    this.preferencesDocId,
                    {
                        preferences: defaultPreferences,
                        lastUpdated: new Date().toISOString()
                    }
                );
            } else if (userId) {
                // User is logged in but no preferences document
                const result = await createDocument(
                    COLLECTIONS.USER_PREFERENCES,
                    {
                        userId,
                        preferences: defaultPreferences,
                        createdAt: new Date().toISOString(),
                        lastUpdated: new Date().toISOString()
                    }
                );
                
                this.preferencesDocId = result.$id;
            } else {
                // User is not logged in
                setInStorage('userPreferences', defaultPreferences);
            }
            
            // Update local cache
            this.preferences = defaultPreferences;
            return true;
        } catch (error) {
            console.error('Error resetting preferences:', error);
            return false;
        }
    }
}

// Create singleton instance
const userPreferencesService = new UserPreferencesService();

export default userPreferencesService; 