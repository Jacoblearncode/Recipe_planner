/**
 * Recipe Planner - Email Verification
 * Handles email verification process
 */

import authService from './authService.js';

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loadingState = document.getElementById('loadingState');
    const successState = document.getElementById('successState');
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    // Check if token exists
    if (!token) {
        showError('Invalid or missing verification token. Please request a new verification email.');
        return;
    }
    
    // Verify email
    verifyEmail(token);
    
    /**
     * Verify email with token
     * @param {string} token - Verification token
     */
    async function verifyEmail(token) {
        try {
            // Show loading state
            showLoading();
            
            // Verify email
            await authService.verifyEmail(token);
            
            // Show success state
            showSuccess();
        } catch (error) {
            // Show error state
            showError(error.message);
        }
    }
    
    /**
     * Show loading state
     */
    function showLoading() {
        loadingState.style.display = 'block';
        successState.style.display = 'none';
        errorState.style.display = 'none';
    }
    
    /**
     * Show success state
     */
    function showSuccess() {
        loadingState.style.display = 'none';
        successState.style.display = 'block';
        errorState.style.display = 'none';
    }
    
    /**
     * Show error state
     * @param {string} message - Error message
     */
    function showError(message) {
        loadingState.style.display = 'none';
        successState.style.display = 'none';
        errorState.style.display = 'block';
        errorMessage.textContent = message || 'We couldn\'t verify your email address. The verification link may be invalid or expired.';
    }
}); 