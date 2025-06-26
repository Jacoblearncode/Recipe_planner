/**
 * Recipe Planner - Password Reset
 * Handles password reset functionality
 */

import authService from './authService.js';
import { debounce } from './utils.js';

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const passwordResetForm = document.getElementById('passwordResetForm');
    const newPassword = document.getElementById('newPassword');
    const newPasswordError = document.getElementById('newPasswordError');
    const newPasswordToggle = document.getElementById('newPasswordToggle');
    const confirmPassword = document.getElementById('confirmPassword');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
    const resetButton = document.getElementById('resetButton');
    const resetSpinner = document.getElementById('resetSpinner');
    const errorAlert = document.getElementById('errorAlert');
    const successAlert = document.getElementById('successAlert');
    const resetForm = document.getElementById('resetForm');
    const successMessage = document.getElementById('successMessage');
    const passwordStrengthMeter = document.getElementById('passwordStrengthMeter');
    
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    // Check if token exists
    if (!token) {
        showError('Invalid or missing reset token. Please request a new password reset link.');
        disableForm();
        return;
    }
    
    // Password strength meter
    newPassword.addEventListener('input', debounce(() => {
        updatePasswordStrength(newPassword.value);
    }, 300));
    
    // Password visibility toggles
    newPasswordToggle.addEventListener('click', () => togglePasswordVisibility(newPassword, newPasswordToggle));
    confirmPasswordToggle.addEventListener('click', () => togglePasswordVisibility(confirmPassword, confirmPasswordToggle));
    
    // Form submission
    passwordResetForm.addEventListener('submit', handlePasswordReset);
    
    /**
     * Handle password reset form submission
     * @param {Event} e - Form submit event
     */
    async function handlePasswordReset(e) {
        e.preventDefault();
        
        // Reset errors
        resetFormErrors();
        hideAlert(errorAlert);
        hideAlert(successAlert);
        
        // Validate form
        let isValid = true;
        
        if (!newPassword.value) {
            showFieldError(newPassword, newPasswordError, 'Password is required');
            isValid = false;
        } else if (newPassword.value.length < 8) {
            showFieldError(newPassword, newPasswordError, 'Password must be at least 8 characters');
            isValid = false;
        } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(newPassword.value)) {
            showFieldError(newPassword, newPasswordError, 'Password must contain letters and numbers');
            isValid = false;
        }
        
        if (!confirmPassword.value) {
            showFieldError(confirmPassword, confirmPasswordError, 'Please confirm your password');
            isValid = false;
        } else if (confirmPassword.value !== newPassword.value) {
            showFieldError(confirmPassword, confirmPasswordError, 'Passwords do not match');
            isValid = false;
        }
        
        if (!isValid) {
            return;
        }
        
        try {
            // Show loading state
            setButtonLoading(true);
            
            // Reset password
            await authService.resetPassword(token, newPassword.value);
            
            // Show success message
            resetForm.style.display = 'none';
            successMessage.style.display = 'block';
        } catch (error) {
            showError(error.message);
        } finally {
            setButtonLoading(false);
        }
    }
    
    /**
     * Toggle password visibility
     * @param {HTMLElement} inputElement - Password input element
     * @param {HTMLElement} toggleElement - Toggle icon element
     */
    function togglePasswordVisibility(inputElement, toggleElement) {
        if (inputElement.type === 'password') {
            inputElement.type = 'text';
            toggleElement.classList.remove('fa-eye');
            toggleElement.classList.add('fa-eye-slash');
        } else {
            inputElement.type = 'password';
            toggleElement.classList.remove('fa-eye-slash');
            toggleElement.classList.add('fa-eye');
        }
    }
    
    /**
     * Update password strength meter
     * @param {string} password - Password to check
     */
    function updatePasswordStrength(password) {
        // Remove all classes
        passwordStrengthMeter.className = 'password-strength-meter';
        
        if (!password) {
            passwordStrengthMeter.style.width = '0';
            return;
        }
        
        // Check password strength
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^a-zA-Z0-9]/.test(password);
        
        if (password.length < 8) {
            passwordStrengthMeter.classList.add('strength-weak');
        } else if (password.length >= 8 && hasLetter && hasNumber && hasSpecial) {
            passwordStrengthMeter.classList.add('strength-strong');
        } else if (password.length >= 8 && ((hasLetter && hasNumber) || (hasLetter && hasSpecial) || (hasNumber && hasSpecial))) {
            passwordStrengthMeter.classList.add('strength-medium');
        } else {
            passwordStrengthMeter.classList.add('strength-weak');
        }
    }
    
    /**
     * Show field error
     * @param {HTMLElement} field - Input field
     * @param {HTMLElement} errorElement - Error message element
     * @param {string} message - Error message
     */
    function showFieldError(field, errorElement, message) {
        field.classList.add('is-invalid');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    /**
     * Reset form errors
     */
    function resetFormErrors() {
        const inputs = passwordResetForm.querySelectorAll('input');
        const errors = passwordResetForm.querySelectorAll('.form-error');
        
        inputs.forEach(input => {
            input.classList.remove('is-invalid');
            input.classList.remove('is-valid');
        });
        
        errors.forEach(error => {
            error.textContent = '';
            error.style.display = 'none';
        });
    }
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    function showError(message) {
        errorAlert.textContent = message;
        errorAlert.style.display = 'block';
    }
    
    /**
     * Show success message
     * @param {string} message - Success message
     */
    function showSuccess(message) {
        successAlert.textContent = message;
        successAlert.style.display = 'block';
    }
    
    /**
     * Hide alert
     * @param {HTMLElement} alertElement - Alert element
     */
    function hideAlert(alertElement) {
        alertElement.style.display = 'none';
    }
    
    /**
     * Set button loading state
     * @param {boolean} isLoading - Whether button is loading
     */
    function setButtonLoading(isLoading) {
        if (isLoading) {
            resetButton.disabled = true;
            resetSpinner.style.display = 'inline-block';
        } else {
            resetButton.disabled = false;
            resetSpinner.style.display = 'none';
        }
    }
    
    /**
     * Disable the form
     */
    function disableForm() {
        passwordResetForm.querySelectorAll('input').forEach(input => {
            input.disabled = true;
        });
        resetButton.disabled = true;
    }
}); 