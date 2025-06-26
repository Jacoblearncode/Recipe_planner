/**
 * Recipe Planner - Main Application
 * Handles application-wide functionality and authentication state
 */

import { isLoggedIn } from './appwrite.js';
import authService from './authService.js';
import userPreferencesService from './userPreferencesService.js';

/**
 * Main application initialization
 */
document.addEventListener('DOMContentLoaded', async function() {
    // DOM elements
    const authGuestElements = document.querySelectorAll('.auth-guest');
    const authUserElements = document.querySelectorAll('.auth-user');
    const navUsername = document.getElementById('navUsername');
    const logoutButton = document.getElementById('logoutButton');
    
    // Initialize auth state
    await updateAuthState();

    // Initialize user preferences
    await initializeUserPreferences();
    
    // Add logout functionality
    if (logoutButton) {
        logoutButton.addEventListener('click', async function(e) {
            e.preventDefault();
            
            try {
                await authService.logout();
                window.location.reload();
            } catch (error) {
                console.error('Logout error:', error);
                alert('Logout failed: ' + error.message);
            }
        });
    }

    // Apply theme preference if available
    const themeSwitcher = document.getElementById('themeSwitcher');
    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', async function() {
            const currentTheme = await userPreferencesService.getPreference('theme', 'light');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            await userPreferencesService.setPreference('theme', newTheme);
            applyTheme(newTheme);
        });
    }
    
    /**
     * Update UI based on authentication state
     */
    async function updateAuthState() {
        try {
            const user = await isLoggedIn();
            
            if (user) {
                // User is logged in
                authGuestElements.forEach(el => el.style.display = 'none');
                authUserElements.forEach(el => el.style.display = 'block');
                
                // Update username if element exists
                if (navUsername) {
                    navUsername.textContent = user.name || 'Account';
                }
                
                console.log('User authenticated:', user);
            } else {
                // User is not logged in
                authGuestElements.forEach(el => el.style.display = 'block');
                authUserElements.forEach(el => el.style.display = 'none');
                
                console.log('User not authenticated');
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
            
            // Default to logged out state on error
            authGuestElements.forEach(el => el.style.display = 'block');
            authUserElements.forEach(el => el.style.display = 'none');
        }
    }

    /**
     * Initialize user preferences
     */
    async function initializeUserPreferences() {
        try {
            // Get preferences
            const preferences = await userPreferencesService.getPreferences();
            
            // Apply theme preference
            const theme = preferences.theme || 'light';
            applyTheme(theme);
            
            // Apply other preferences as needed
            console.log('User preferences loaded:', preferences);
        } catch (error) {
            console.error('Error loading user preferences:', error);
        }
    }

    /**
     * Apply theme to the application
     * @param {string} theme - Theme name ('light' or 'dark')
     */
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            if (themeSwitcher) {
                themeSwitcher.innerHTML = '<i class="fas fa-sun"></i>';
                themeSwitcher.title = 'Switch to Light Theme';
            }
        } else {
            document.body.classList.remove('dark-theme');
            if (themeSwitcher) {
                themeSwitcher.innerHTML = '<i class="fas fa-moon"></i>';
                themeSwitcher.title = 'Switch to Dark Theme';
            }
        }
    }
}); 