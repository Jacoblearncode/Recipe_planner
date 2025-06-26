/**
 * Recipe Planner - User Profile
 * Handles user profile management functionality
 */

import authService from './authService.js';
import { debounce } from './utils.js';

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    if (!authService.getIsAuthenticated()) {
        // Redirect to login page
        window.location.href = 'login.html';
        return;
    }
    
    // DOM Elements - Navigation
    const navUsername = document.getElementById('navUsername');
    const logoutButton = document.getElementById('logoutButton');
    
    // DOM Elements - Profile Info
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    
    // DOM Elements - Personal Info Form
    const personalInfoForm = document.getElementById('personalInfoForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const cookingSkillSelect = document.getElementById('cookingSkill');
    const savePersonalInfoBtn = document.getElementById('savePersonalInfoBtn');
    const personalInfoSpinner = document.getElementById('personalInfoSpinner');
    const personalInfoSuccess = document.getElementById('personalInfoSuccess');
    const personalInfoError = document.getElementById('personalInfoError');
    const nameError = document.getElementById('nameError');
    
    // DOM Elements - Dietary Preferences Form
    const dietaryPreferencesForm = document.getElementById('dietaryPreferencesForm');
    const dietarySuccess = document.getElementById('dietarySuccess');
    const dietaryError = document.getElementById('dietaryError');
    const saveDietaryBtn = document.getElementById('saveDietaryBtn');
    const dietarySpinner = document.getElementById('dietarySpinner');
    
    // DOM Elements - Change Password Form
    const changePasswordForm = document.getElementById('changePasswordForm');
    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const currentPasswordToggle = document.getElementById('currentPasswordToggle');
    const newPasswordToggle = document.getElementById('newPasswordToggle');
    const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
    const passwordStrengthMeter = document.getElementById('passwordStrengthMeter');
    const currentPasswordError = document.getElementById('currentPasswordError');
    const newPasswordError = document.getElementById('newPasswordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const passwordSpinner = document.getElementById('passwordSpinner');
    const passwordSuccess = document.getElementById('passwordSuccess');
    const passwordError = document.getElementById('passwordError');
    
    // Load user data
    loadUserData();
    
    // Event Listeners
    logoutButton.addEventListener('click', handleLogout);
    personalInfoForm.addEventListener('submit', handlePersonalInfoSubmit);
    dietaryPreferencesForm.addEventListener('submit', handleDietaryPreferencesSubmit);
    changePasswordForm.addEventListener('submit', handleChangePasswordSubmit);
    
    // Password toggles
    currentPasswordToggle.addEventListener('click', () => togglePasswordVisibility(currentPassword, currentPasswordToggle));
    newPasswordToggle.addEventListener('click', () => togglePasswordVisibility(newPassword, newPasswordToggle));
    confirmPasswordToggle.addEventListener('click', () => togglePasswordVisibility(confirmPassword, confirmPasswordToggle));
    
    // Password strength meter
    newPassword.addEventListener('input', debounce(() => {
        updatePasswordStrength(newPassword.value);
    }, 300));
    
    /**
     * Load user data
     */
    async function loadUserData() {
        try {
            const user = authService.getCurrentUser();
            
            // Update navigation
            navUsername.textContent = user.name || 'Account';
            
            // Update profile sidebar
            profileName.textContent = user.name || 'User';
            profileEmail.textContent = user.email || 'user@example.com';
            
            // If user has a profile picture
            if (user.profilePicture) {
                profileAvatar.src = user.profilePicture;
            }
            
            // Update personal info form
            nameInput.value = user.name || '';
            emailInput.value = user.email || '';
            cookingSkillSelect.value = user.cookingSkill || 'beginner';
            
            // Update dietary preferences
            if (user.dietaryPreferences) {
                // Diet types
                if (user.dietaryPreferences.dietType) {
                    user.dietaryPreferences.dietType.forEach(diet => {
                        const checkbox = document.getElementById(diet);
                        if (checkbox) checkbox.checked = true;
                    });
                }
                
                // Allergies
                if (user.dietaryPreferences.allergies) {
                    user.dietaryPreferences.allergies.forEach(allergy => {
                        const checkbox = document.getElementById(allergy);
                        if (checkbox) checkbox.checked = true;
                    });
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }
    
    /**
     * Handle logout
     * @param {Event} e - Click event
     */
    async function handleLogout(e) {
        e.preventDefault();
        
        try {
            await authService.logout();
            window.location.href = '../index.html';
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }
    
    /**
     * Handle personal info form submission
     * @param {Event} e - Form submit event
     */
    async function handlePersonalInfoSubmit(e) {
        e.preventDefault();
        
        // Reset errors
        resetFormErrors(personalInfoForm);
        hideAlert(personalInfoSuccess);
        hideAlert(personalInfoError);
        
        // Validate form
        let isValid = true;
        
        if (!nameInput.value.trim()) {
            showFieldError(nameInput, nameError, 'Name is required');
            isValid = false;
        }
        
        if (!isValid) {
            return;
        }
        
        try {
            // Show loading state
            setButtonLoading(savePersonalInfoBtn, personalInfoSpinner, true);
            
            // Update user profile
            await authService.updateProfile({
                name: nameInput.value.trim(),
                cookingSkill: cookingSkillSelect.value
            });
            
            // Show success message
            showAlert(personalInfoSuccess, 'Personal information updated successfully!', 'success');
            
            // Reload user data
            loadUserData();
        } catch (error) {
            showAlert(personalInfoError, error.message);
        } finally {
            setButtonLoading(savePersonalInfoBtn, personalInfoSpinner, false);
        }
    }
    
    /**
     * Handle dietary preferences form submission
     * @param {Event} e - Form submit event
     */
    async function handleDietaryPreferencesSubmit(e) {
        e.preventDefault();
        
        // Reset errors
        hideAlert(dietarySuccess);
        hideAlert(dietaryError);
        
        try {
            // Show loading state
            setButtonLoading(saveDietaryBtn, dietarySpinner, true);
            
            // Get selected diet types
            const dietTypes = [];
            document.querySelectorAll('input[name="dietType"]:checked').forEach(checkbox => {
                dietTypes.push(checkbox.value);
            });
            
            // Get selected allergies
            const allergies = [];
            document.querySelectorAll('input[name="allergies"]:checked').forEach(checkbox => {
                allergies.push(checkbox.value);
            });
            
            // Update dietary preferences
            await authService.updateDietaryPreferences({
                dietType: dietTypes,
                allergies: allergies
            });
            
            // Show success message
            showAlert(dietarySuccess, 'Dietary preferences updated successfully!', 'success');
        } catch (error) {
            showAlert(dietaryError, error.message);
        } finally {
            setButtonLoading(saveDietaryBtn, dietarySpinner, false);
        }
    }
    
    /**
     * Handle change password form submission
     * @param {Event} e - Form submit event
     */
    async function handleChangePasswordSubmit(e) {
        e.preventDefault();
        
        // Reset errors
        resetFormErrors(changePasswordForm);
        hideAlert(passwordSuccess);
        hideAlert(passwordError);
        
        // Validate form
        let isValid = true;
        
        if (!currentPassword.value) {
            showFieldError(currentPassword, currentPasswordError, 'Current password is required');
            isValid = false;
        }
        
        if (!newPassword.value) {
            showFieldError(newPassword, newPasswordError, 'New password is required');
            isValid = false;
        } else if (newPassword.value.length < 8) {
            showFieldError(newPassword, newPasswordError, 'Password must be at least 8 characters');
            isValid = false;
        } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(newPassword.value)) {
            showFieldError(newPassword, newPasswordError, 'Password must contain letters and numbers');
            isValid = false;
        }
        
        if (!confirmPassword.value) {
            showFieldError(confirmPassword, confirmPasswordError, 'Please confirm your new password');
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
            setButtonLoading(changePasswordBtn, passwordSpinner, true);
            
            // Change password
            await authService.changePassword(currentPassword.value, newPassword.value);
            
            // Show success message
            showAlert(passwordSuccess, 'Password changed successfully!', 'success');
            
            // Reset form
            changePasswordForm.reset();
            passwordStrengthMeter.className = 'password-strength-meter';
        } catch (error) {
            showAlert(passwordError, error.message);
        } finally {
            setButtonLoading(changePasswordBtn, passwordSpinner, false);
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
     * @param {HTMLElement} form - Form element
     */
    function resetFormErrors(form) {
        const inputs = form.querySelectorAll('input, select');
        const errors = form.querySelectorAll('.form-error');
        
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
     * Show alert message
     * @param {HTMLElement} alertElement - Alert element
     * @param {string} message - Alert message
     * @param {string} type - Alert type (success or danger)
     */
    function showAlert(alertElement, message, type = 'danger') {
        alertElement.textContent = message;
        alertElement.className = `alert alert-${type}`;
        alertElement.style.display = 'block';
    }
    
    /**
     * Hide alert message
     * @param {HTMLElement} alertElement - Alert element
     */
    function hideAlert(alertElement) {
        alertElement.style.display = 'none';
    }
    
    /**
     * Set button loading state
     * @param {HTMLElement} button - Button element
     * @param {HTMLElement} spinner - Spinner element
     * @param {boolean} isLoading - Whether button is in loading state
     */
    function setButtonLoading(button, spinner, isLoading) {
        if (isLoading) {
            button.disabled = true;
            spinner.style.display = 'inline-block';
        } else {
            button.disabled = false;
            spinner.style.display = 'none';
        }
    }
}); 