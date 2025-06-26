/**
 * Recipe Planner - Utility Functions
 * Common utility functions that can be used throughout the application
 */

/**
 * Debounce function to limit the rate at which a function can fire
 * @param {Function} func - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} - The debounced function
 */
export function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

/**
 * Throttle function to limit how often a function can be called
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} - The throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Format a date string
 * @param {string|Date} date - The date to format
 * @param {string} format - The format to use (default: 'MM/DD/YYYY')
 * @returns {string} - The formatted date string
 */
export function formatDate(date, format = 'MM/DD/YYYY') {
    const d = new Date(date);
    
    if (isNaN(d.getTime())) {
        return 'Invalid Date';
    }
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    let formatted = format;
    formatted = formatted.replace('MM', month);
    formatted = formatted.replace('DD', day);
    formatted = formatted.replace('YYYY', year);
    
    return formatted;
}

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency code (default: 'USD')
 * @returns {string} - The formatted currency string
 */
export function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency
    }).format(amount);
}

/**
 * Get a value from localStorage with error handling
 * @param {string} key - The key to get
 * @param {any} defaultValue - The default value to return if key doesn't exist
 * @returns {any} - The value from localStorage or defaultValue
 */
export function getFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error getting ${key} from localStorage:`, error);
        return defaultValue;
    }
}

/**
 * Set a value in localStorage with error handling
 * @param {string} key - The key to set
 * @param {any} value - The value to store
 * @returns {boolean} - Whether the operation was successful
 */
export function setInStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Error setting ${key} in localStorage:`, error);
        return false;
    }
}

/**
 * Remove a value from localStorage with error handling
 * @param {string} key - The key to remove
 * @returns {boolean} - Whether the operation was successful
 */
export function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error(`Error removing ${key} from localStorage:`, error);
        return false;
    }
}

/**
 * Clear all data from localStorage with error handling
 * @returns {boolean} - Whether the operation was successful
 */
export function clearStorage() {
    try {
        localStorage.clear();
        return true;
    } catch (error) {
        console.error('Error clearing localStorage:', error);
        return false;
    }
}

/**
 * Generate a random ID
 * @param {number} length - The length of the ID (default: 8)
 * @returns {string} - The random ID
 */
export function generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    
    for (let i = 0; i < length; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return id;
}

/**
 * Capitalize the first letter of a string
 * @param {string} string - The string to capitalize
 * @returns {string} - The capitalized string
 */
export function capitalize(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Truncate a string to a specified length
 * @param {string} string - The string to truncate
 * @param {number} length - The maximum length (default: 50)
 * @param {string} suffix - The suffix to add (default: '...')
 * @returns {string} - The truncated string
 */
export function truncate(string, length = 50, suffix = '...') {
    if (!string) return '';
    return string.length > length ? string.substring(0, length) + suffix : string;
}

/**
 * Format a number with commas
 * @param {number} number - The number to format
 * @returns {string} - The formatted number
 */
export function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Parse a URL query string into an object
 * @param {string} queryString - The query string to parse
 * @returns {Object} - The parsed query parameters
 */
export function parseQueryString(queryString) {
    const params = {};
    const queries = queryString.substring(1).split('&');
    
    for (const query of queries) {
        if (!query) continue;
        const [key, value] = query.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
    
    return params;
}

/**
 * Detect if the user is on a mobile device
 * @returns {boolean} - Whether the user is on a mobile device
 */
export function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Get the current viewport dimensions
 * @returns {Object} - The viewport width and height
 */
export function getViewportDimensions() {
    return {
        width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
        height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    };
}

/**
 * Check if an element is in the viewport
 * @param {HTMLElement} element - The element to check
 * @returns {boolean} - Whether the element is in the viewport
 */
export function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Copy text to clipboard
 * @param {string} text - The text to copy
 * @returns {Promise} - Promise that resolves when text is copied
 */
export function copyToClipboard(text) {
    return navigator.clipboard.writeText(text);
}

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} html - The HTML to sanitize
 * @returns {string} - The sanitized HTML
 */
export function sanitizeHTML(html) {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
}

/**
 * Get a cookie by name
 * @param {string} name - The name of the cookie
 * @returns {string|null} - The cookie value or null if not found
 */
export function getCookie(name) {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Set a cookie
 * @param {string} name - The name of the cookie
 * @param {string} value - The value of the cookie
 * @param {number} days - The number of days until the cookie expires
 */
export function setCookie(name, value, days) {
    let expires = '';
    
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = `; expires=${date.toUTCString()}`;
    }
    
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/`;
}

/**
 * Delete a cookie
 * @param {string} name - The name of the cookie
 */
export function deleteCookie(name) {
    setCookie(name, '', -1);
} 