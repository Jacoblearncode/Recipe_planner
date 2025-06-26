/**
 * Recipe Planner - Authentication Service
 * Handles user authentication, registration, and profile management
 */

import { getFromStorage, setInStorage, removeFromStorage } from './utils.js';
import { account, ID } from './appwrite.js';

class AuthService {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.authStateListeners = [];
        this.apiBaseUrl = 'https://api.recipeplanner.com/v1'; // Replace with your actual API URL
        this.tokenRefreshInterval = null;
        
        // Initialize auth state from localStorage
        this.initAuthState();
    }
    
    /**
     * Initialize authentication state from localStorage
     */
    initAuthState() {
        const userData = getFromStorage('currentUser', null);
        const token = getFromStorage('authToken', null);
        
        if (userData && token) {
            this.currentUser = userData;
            this.isAuthenticated = true;
            this.setupTokenRefresh();
            this.notifyAuthStateChanged();
        }
    }
    
    /**
     * Register a new user
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @param {string} name - User's name
     * @returns {Promise} - Promise with user data or error
     */
    async register(email, password, name) {
        try {
            const user = await account.create(
                ID.unique(),
                email,
                password,
                name
            );
            
            if (user) {
                // Send verification email
                await account.createVerification(
                    window.location.origin + '/pages/verify-email.html'
                );
            }
            
            return user;
        } catch (error) {
            console.error("Registration error:", error);
            throw error;
        }
    }
    
    /**
     * Login with email and password
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise} - Promise with session data or error
     */
    async login(email, password) {
        try {
            return await account.createEmailSession(email, password);
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    }
    
    /**
     * Logout current user
     * @returns {Promise} - Promise with logout result or error
     */
    async logout() {
        try {
            return await account.deleteSession('current');
        } catch (error) {
            console.error("Logout error:", error);
            throw error;
        }
    }
    
    /**
     * Get current user data
     * @returns {Promise} - Promise with user data or error
     */
    async getCurrentUser() {
        try {
            return await account.get();
        } catch (error) {
            console.error("Get current user error:", error);
            return null;
        }
    }
    
    /**
     * Send password reset email
     * @param {string} email - User's email
     * @returns {Promise} - Promise with reset result or error
     */
    async resetPassword(email) {
        try {
            return await account.createRecovery(
                email,
                window.location.origin + '/pages/reset-password.html'
            );
        } catch (error) {
            console.error("Reset password error:", error);
            throw error;
        }
    }
    
    /**
     * Complete password reset
     * @param {string} userId - User ID
     * @param {string} secret - Reset secret
     * @param {string} password - New password
     * @param {string} passwordAgain - New password confirmation
     * @returns {Promise} - Promise with reset result or error
     */
    async completeReset(userId, secret, password, passwordAgain) {
        try {
            return await account.updateRecovery(
                userId,
                secret,
                password,
                passwordAgain
            );
        } catch (error) {
            console.error("Complete reset error:", error);
            throw error;
        }
    }
    
    /**
     * Verify email address
     * @param {string} userId - User ID
     * @param {string} secret - Verification secret
     * @returns {Promise} - Promise with verification result or error
     */
    async verifyEmail(userId, secret) {
        try {
            return await account.updateVerification(userId, secret);
        } catch (error) {
            console.error("Email verification error:", error);
            throw error;
        }
    }
    
    /**
     * Update user profile
     * @param {string} name - User's new name
     * @param {object} preferences - User's preferences
     * @returns {Promise} - Promise with update result or error
     */
    async updateProfile(name, preferences = {}) {
        try {
            return await account.updatePrefs({
                ...preferences,
                name
            });
        } catch (error) {
            console.error("Update profile error:", error);
            throw error;
        }
    }
    
    /**
     * Add auth state change listener
     * @param {Function} listener - Listener function
     */
    addAuthStateListener(listener) {
        if (typeof listener === 'function' && !this.authStateListeners.includes(listener)) {
            this.authStateListeners.push(listener);
        }
    }
    
    /**
     * Remove auth state change listener
     * @param {Function} listener - Listener function
     */
    removeAuthStateListener(listener) {
        const index = this.authStateListeners.indexOf(listener);
        if (index !== -1) {
            this.authStateListeners.splice(index, 1);
        }
    }
    
    /**
     * Notify all listeners of auth state change
     */
    notifyAuthStateChanged() {
        const authState = {
            user: this.currentUser,
            isAuthenticated: this.isAuthenticated
        };
        
        this.authStateListeners.forEach(listener => {
            try {
                listener(authState);
            } catch (error) {
                console.error('Error in auth state listener:', error);
            }
        });
    }
    
    /**
     * Set authentication state
     * @param {Object} user - User data
     * @param {string} token - Authentication token
     * @param {boolean} rememberMe - Whether to remember the user
     */
    setAuthState(user, token, rememberMe = false) {
        this.currentUser = user;
        this.isAuthenticated = true;
        
        // Store token and user data
        setInStorage('authToken', token);
        setInStorage('currentUser', user);
        
        if (rememberMe) {
            setInStorage('rememberMe', true);
        } else {
            removeFromStorage('rememberMe');
        }
        
        // Setup token refresh
        this.setupTokenRefresh();
        
        // Notify listeners
        this.notifyAuthStateChanged();
    }
    
    /**
     * Clear authentication state
     */
    clearAuthState() {
        this.currentUser = null;
        this.isAuthenticated = false;
        
        // Clear token and user data
        removeFromStorage('authToken');
        removeFromStorage('currentUser');
        
        // Clear token refresh interval
        if (this.tokenRefreshInterval) {
            clearInterval(this.tokenRefreshInterval);
            this.tokenRefreshInterval = null;
        }
        
        // Notify listeners
        this.notifyAuthStateChanged();
    }
    
    /**
     * Setup token refresh interval
     */
    setupTokenRefresh() {
        // Clear existing interval if any
        if (this.tokenRefreshInterval) {
            clearInterval(this.tokenRefreshInterval);
        }
        
        // Set up new interval (refresh every 15 minutes)
        this.tokenRefreshInterval = setInterval(() => {
            this.refreshToken();
        }, 15 * 60 * 1000);
    }
    
    /**
     * Refresh authentication token
     * @returns {Promise} - Promise that resolves when token is refreshed
     */
    async refreshToken() {
        try {
            // Skip if not authenticated
            if (!this.isAuthenticated) {
                return;
            }
            
            // For development/demo purposes, simulate API call
            if (this.isDevelopment()) {
                return await this.simulateRefreshToken();
            }
            
            // Get current token
            const token = getFromStorage('authToken', null);
            
            if (!token) {
                this.clearAuthState();
                return;
            }
            
            // Real implementation would call your API
            const response = await fetch(`${this.apiBaseUrl}/auth/refresh-token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                // If token refresh fails, log out
                this.clearAuthState();
                return;
            }
            
            const data = await response.json();
            
            // Update token
            setInStorage('authToken', data.token);
            
            return data.token;
        } catch (error) {
            console.error('Token refresh error:', error);
            
            // If token refresh fails, log out
            this.clearAuthState();
        }
    }
    
    /**
     * Get authentication status
     * @returns {boolean} - Whether user is authenticated
     */
    getIsAuthenticated() {
        return this.isAuthenticated;
    }
    
    /**
     * Check if running in development mode
     * @returns {boolean} - Whether in development mode
     */
    isDevelopment() {
        return true; // For demo purposes, always return true
        // In production, you would check for environment variables
        // return process.env.NODE_ENV === 'development';
    }
    
    // Simulation methods for development/demo purposes
    
    /**
     * Simulate token refresh
     * @returns {Promise} - Promise that resolves with simulated response
     */
    simulateRefreshToken() {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Generate new token
                const newToken = `simulated-token-${Date.now()}`;
                
                resolve({
                    token: newToken
                });
            }, 500);
        });
    }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService; 