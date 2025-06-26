/**
 * Recipe Planner - Authentication UI
 * Handles UI interactions for authentication pages
 */

import authService from './authService.js';
import { debounce } from './utils.js';
import { isLoggedIn, loginWithGoogle } from './appwrite.js';

document.addEventListener('DOMContentLoaded', async function() {
    // DOM Elements - Login
    const authContainer = document.getElementById('authContainer');
    const signInBtn = document.getElementById('signInBtn');
    const signUpBtn = document.getElementById('signUpBtn');
    const loginForm = document.getElementById('loginForm');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const loginPasswordToggle = document.getElementById('loginPasswordToggle');
    const loginButton = document.getElementById('loginButton');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginAlert = document.getElementById('loginAlert');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    
    // DOM Elements - Register
    const registerForm = document.getElementById('registerForm');
    const registerName = document.getElementById('registerName');
    const registerEmail = document.getElementById('registerEmail');
    const registerPassword = document.getElementById('registerPassword');
    const registerPasswordToggle = document.getElementById('registerPasswordToggle');
    const confirmPassword = document.getElementById('confirmPassword');
    const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
    const agreeTermsCheckbox = document.getElementById('agreeTerms');
    const registerButton = document.getElementById('registerButton');
    const registerSpinner = document.getElementById('registerSpinner');
    const registerAlert = document.getElementById('registerAlert');
    const passwordStrengthMeter = document.getElementById('passwordStrengthMeter');
    
    // DOM Elements - Forgot Password
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const forgotPasswordModal = new bootstrap.Modal(document.getElementById('forgotPasswordModal'));
    const forgotPasswordEmail = document.getElementById('forgotPasswordEmail');
    const forgotPasswordSubmit = document.getElementById('forgotPasswordSubmit');
    const forgotPasswordSpinner = document.getElementById('forgotPasswordSpinner');
    const forgotPasswordAlert = document.getElementById('forgotPasswordAlert');
    const forgotPasswordSuccess = document.getElementById('forgotPasswordSuccess');
    
    // Form Validation Elements
    const loginEmailError = document.getElementById('loginEmailError');
    const loginPasswordError = document.getElementById('loginPasswordError');
    const registerNameError = document.getElementById('registerNameError');
    const registerEmailError = document.getElementById('registerEmailError');
    const registerPasswordError = document.getElementById('registerPasswordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    const forgotPasswordEmailError = document.getElementById('forgotPasswordEmailError');
    
    // Elements
    const logoutButton = document.getElementById('logoutButton');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const verifyEmailContainer = document.getElementById('verifyEmailContainer');
    const authGuestElements = document.querySelectorAll('.auth-guest');
    const authUserElements = document.querySelectorAll('.auth-user');
    const navUsername = document.getElementById('navUsername');
    
    // Check authentication state
    await updateAuthState();
    
    // Initialize the page
    initPage();
    
    // Panel toggle functionality
    signUpBtn.addEventListener('click', () => {
        authContainer.classList.add('active');
        // Update URL hash without page reload
        history.pushState(null, null, '#signup');
    });
    
    signInBtn.addEventListener('click', () => {
        authContainer.classList.remove('active');
        // Update URL hash without page reload
        history.pushState(null, null, '#signin');
    });
    
    // Password visibility toggles
    loginPasswordToggle.addEventListener('click', () => togglePasswordVisibility(loginPassword, loginPasswordToggle));
    registerPasswordToggle.addEventListener('click', () => togglePasswordVisibility(registerPassword, registerPasswordToggle));
    confirmPasswordToggle.addEventListener('click', () => togglePasswordVisibility(confirmPassword, confirmPasswordToggle));
    
    // Password strength meter
    registerPassword.addEventListener('input', debounce(() => {
        updatePasswordStrength(registerPassword.value);
    }, 300));
    
    // Form submissions
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    
    // Forgot password
    forgotPasswordLink.addEventListener('click', () => {
        resetForgotPasswordForm();
        forgotPasswordModal.show();
    });
    
    forgotPasswordSubmit.addEventListener('click', handleForgotPassword);
    
    // Logout button click
    if (logoutButton) {
        logoutButton.addEventListener('click', async function(e) {
            e.preventDefault();
            
            try {
                await authService.logout();
                window.location.href = '../index.html';
            } catch (error) {
                console.error('Logout error:', error);
                alert('Logout failed: ' + error.message);
            }
        });
    }
    
    // Forgot password form submission
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const email = document.getElementById('forgotEmail').value;
            
            // Show loading state
            const submitButton = forgotPasswordForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';
            
            try {
                // Request password reset
                await authService.resetPassword(email);
                
                // Show success message
                forgotPasswordForm.innerHTML = `
                    <div class="alert alert-success">
                        <h4>Reset Link Sent!</h4>
                        <p>If ${email} is registered, you will receive a password reset link shortly.</p>
                        <p>Please check your inbox and follow the instructions.</p>
                    </div>
                `;
            } catch (error) {
                console.error('Password reset request error:', error);
                
                // Show generic message for security (don't reveal if email exists)
                forgotPasswordForm.innerHTML = `
                    <div class="alert alert-success">
                        <h4>Reset Link Sent!</h4>
                        <p>If ${email} is registered, you will receive a password reset link shortly.</p>
                        <p>Please check your inbox and follow the instructions.</p>
                    </div>
                `;
            }
        });
    }
    
    // Reset password form submission
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const password = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmNewPassword').value;
            
            // Get URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const userId = urlParams.get('userId');
            const secret = urlParams.get('secret');
            
            if (!userId || !secret) {
                const errorElement = document.getElementById('resetError');
                if (errorElement) {
                    errorElement.textContent = 'Invalid or expired reset link.';
                    errorElement.style.display = 'block';
                }
                return;
            }
            
            // Validate passwords match
            if (password !== confirmPassword) {
                const errorElement = document.getElementById('resetError');
                if (errorElement) {
                    errorElement.textContent = 'Passwords do not match.';
                    errorElement.style.display = 'block';
                }
                return;
            }
            
            // Show loading state
            const submitButton = resetPasswordForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Resetting password...';
            
            try {
                // Complete password reset
                await authService.completeReset(userId, secret, password, confirmPassword);
                
                // Show success message
                resetPasswordForm.innerHTML = `
                    <div class="alert alert-success">
                        <h4>Password Reset Successful!</h4>
                        <p>Your password has been reset successfully.</p>
                        <p><a href="../pages/login.html" class="btn btn-primary mt-3">Login with New Password</a></p>
                    </div>
                `;
            } catch (error) {
                console.error('Password reset error:', error);
                
                // Show error message
                const errorElement = document.getElementById('resetError');
                if (errorElement) {
                    errorElement.textContent = error.message || 'Password reset failed. Please try again.';
                    errorElement.style.display = 'block';
                }
                
                // Reset button
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        });
    }
    
    // Email verification
    if (verifyEmailContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        const secret = urlParams.get('secret');
        
        if (userId && secret) {
            try {
                // Verify email
                await authService.verifyEmail(userId, secret);
                
                // Show success message
                verifyEmailContainer.innerHTML = `
                    <div class="alert alert-success">
                        <h4>Email Verified Successfully!</h4>
                        <p>Your email has been verified. You can now log in to your account.</p>
                        <p><a href="../pages/login.html" class="btn btn-primary mt-3">Login to Your Account</a></p>
                    </div>
                `;
            } catch (error) {
                console.error('Email verification error:', error);
                
                // Show error message
                verifyEmailContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <h4>Verification Failed</h4>
                        <p>Email verification failed: ${error.message || 'Invalid or expired verification link.'}</p>
                        <p><a href="../pages/login.html" class="btn btn-primary mt-3">Back to Login</a></p>
                    </div>
                `;
            }
        }
    }
    
    // Google login button
    setupGoogleAuth();
    
    /**
     * Initialize the page
     */
    function initPage() {
        // Check URL hash for direct navigation to signup or signin
        if (window.location.hash === '#signup') {
            authContainer.classList.add('active');
        } else if (window.location.hash === '#signin' || !window.location.hash) {
            authContainer.classList.remove('active');
        }
        
        // Listen for hash changes
        window.addEventListener('hashchange', function() {
            if (window.location.hash === '#signup') {
                authContainer.classList.add('active');
            } else if (window.location.hash === '#signin' || !window.location.hash) {
                authContainer.classList.remove('active');
            }
        });
        
        // Check for remembered email
        const rememberedUser = localStorage.getItem('rememberedEmail');
        if (rememberedUser) {
            loginEmail.value = rememberedUser;
            rememberMeCheckbox.checked = true;
        }
    }
    
    /**
     * Handle login form submission
     * @param {Event} e - Form submit event
     */
    async function handleLogin(e) {
        e.preventDefault();
        
        // Reset errors
        resetFormErrors(loginForm);
        hideAlert(loginAlert);
        
        // Validate form
        let isValid = true;
        
        if (!loginEmail.value.trim()) {
            showFieldError(loginEmail, loginEmailError, 'Email is required');
            isValid = false;
        } else if (!validateEmail(loginEmail.value)) {
            showFieldError(loginEmail, loginEmailError, 'Please enter a valid email address');
            isValid = false;
        }
        
        if (!loginPassword.value) {
            showFieldError(loginPassword, loginPasswordError, 'Password is required');
            isValid = false;
        }
        
        if (!isValid) {
            return;
        }
        
        try {
            // Show loading state
            setButtonLoading(loginButton, loginSpinner, true);
            
            // Attempt login
            await authService.login(
                loginEmail.value,
                loginPassword.value,
                rememberMeCheckbox.checked
            );
            
            // If remember me is checked, store email
            if (rememberMeCheckbox.checked) {
                localStorage.setItem('rememberedEmail', loginEmail.value);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            
            // Redirect to home page
            window.location.href = '../index.html';
        } catch (error) {
            showAlert(loginAlert, error.message);
        } finally {
            setButtonLoading(loginButton, loginSpinner, false);
        }
    }
    
    /**
     * Handle register form submission
     * @param {Event} e - Form submit event
     */
    async function handleRegister(e) {
        e.preventDefault();
        
        // Reset errors
        resetFormErrors(registerForm);
        hideAlert(registerAlert);
        
        // Validate form - if any field is invalid and has different fields, show an error message
        let isValid = true;
        // Name validation - if not filled, show error message
        if (!registerName.value.trim()) {
            showFieldError(registerName, registerNameError, 'Name is required');
            isValid = false;
        }
        // Email validation - if not filled, show error message
        if (!registerEmail.value.trim()) {
            showFieldError(registerEmail, registerEmailError, 'Email is required');
            isValid = false;
        } else if (!validateEmail(registerEmail.value)) {
            showFieldError(registerEmail, registerEmailError, 'Please enter a valid email address');
            isValid = false;
        }
        // Password validation - must be at least 8 characters, contain letters and numbers, if not show error message
        if (!registerPassword.value) {
            showFieldError(registerPassword, registerPasswordError, 'Password is required');
            isValid = false;
        } else if (registerPassword.value.length < 8) { // Password must be at least 8 characters and contain letters and numbers
            showFieldError(registerPassword, registerPasswordError, 'Password must be at least 8 characters'); // Show error message if password is less than 8 characters
            isValid = false;
        } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(registerPassword.value)) { // Password must contain letters and numbers
            showFieldError(registerPassword, registerPasswordError, 'Password must contain letters and numbers'); // Show error message if password does not contain letters and numbers
            isValid = false;
        }
        
        // Confirm password validation - must match the password, if not show error message
        if (!confirmPassword.value) {
            showFieldError(confirmPassword, confirmPasswordError, 'Please confirm your password');
            isValid = false;
        } else if (confirmPassword.value !== registerPassword.value) { // Confirm password must match the password
            showFieldError(confirmPassword, confirmPasswordError, 'Passwords do not match'); // Show error message if passwords do not match
            isValid = false;
        }
        
        // Terms of service and privacy policy validation - must be checked, if not show error message
        if (!agreeTermsCheckbox.checked) {
            isValid = false;
            showAlert(registerAlert, 'You must agree to the Terms of Service and Privacy Policy'); // Show error message if terms of service and privacy policy are not checked
        }
        
        if (!isValid) { // If any field is invalid and has different fields, show an error message
            return; // Return if any field is invalid and has different fields
        }
        
        try {
            // Show loading state
            setButtonLoading(registerButton, registerSpinner, true); // Show loading state
            
            // Attempt registration
            await authService.register({ // Attempt registration
                name: registerName.value, // Name
                email: registerEmail.value, // Email
                password: registerPassword.value // Password
            });
            
            // Show success message and switch to login
            showAlert(loginAlert, 'Registration successful! Please check your email for verification.', 'success'); // Show success message
            authContainer.classList.remove('active'); // Remove active class from authContainer
            registerForm.reset(); // Reset the register form
        } catch (error) {
            showAlert(registerAlert, error.message); // Show error message
        } finally {
            setButtonLoading(registerButton, registerSpinner, false); // Set button loading state
        }
    }
    
    /**
     * Handle forgot password request
     */
    async function handleForgotPassword() {
        // Reset errors
        resetFormErrors(document.getElementById('forgotPasswordModal')); // Reset form errors
        hideAlert(forgotPasswordAlert); // Hide alert
        hideAlert(forgotPasswordSuccess); // Hide alert
        
        // Validate email
        if (!forgotPasswordEmail.value.trim()) { // If email is not filled, show error message
            showFieldError(forgotPasswordEmail, forgotPasswordEmailError, 'Email is required'); // Show error message if email is not filled
            return; // Return if email is not filled
        } else if (!validateEmail(forgotPasswordEmail.value)) { // If email is not valid, show error message
            showFieldError(forgotPasswordEmail, forgotPasswordEmailError, 'Please enter a valid email address'); // Show error message if email is not valid
            return;
        }
        
        try {
            // Show loading state
            setButtonLoading(forgotPasswordSubmit, forgotPasswordSpinner, true); // Show loading state
            
            // Request password reset
            await authService.requestPasswordReset(forgotPasswordEmail.value); // Request password reset
            
            // Show success message
            hideAlert(forgotPasswordAlert); // Hide alert
            showAlert(forgotPasswordSuccess, 'Password reset link sent! Please check your email.', 'success'); // Show success message
            
            // Clear the form
            forgotPasswordEmail.value = ''; // Clear the email input
        } catch (error) {
            hideAlert(forgotPasswordSuccess); // Hide success message
            showAlert(forgotPasswordAlert, error.message); // Show error message
        } finally {
            setButtonLoading(forgotPasswordSubmit, forgotPasswordSpinner, false); // Set button loading state
        }
    }
    
    /**
     * Reset the forgot password form
     */
    function resetForgotPasswordForm() {
        forgotPasswordEmail.value = ''; // Clear the email input
        hideAlert(forgotPasswordAlert); // Hide alert
        hideAlert(forgotPasswordSuccess); // Hide alert
        resetFormErrors(document.getElementById('forgotPasswordModal')); // Reset form errors
    }
    
    /**
     * Toggle password visibility
     * @param {HTMLElement} inputElement - Password input element
     * @param {HTMLElement} toggleElement - Toggle icon element
     */
    function togglePasswordVisibility(inputElement, toggleElement) {
        if (inputElement.type === 'password') { // If the input element is a password
            inputElement.type = 'text'; // Set the input element to text
            toggleElement.classList.remove('fa-eye'); // Remove the eye icon
            toggleElement.classList.add('fa-eye-slash'); // Add the eye-slash icon
        } else {
            inputElement.type = 'password'; // Set the input element to password
            toggleElement.classList.remove('fa-eye-slash'); // Remove the eye-slash icon
            toggleElement.classList.add('fa-eye'); // Add the eye icon
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
        // Password must be at least 8 characters, contain letters and numbers, if not show error message
        if (password.length < 8) { // Password must be at least 8 characters
            passwordStrengthMeter.classList.add('strength-weak'); // Add the strength-weak class to the password strength meter
        } else if (password.length >= 8 && hasLetter && hasNumber && hasSpecial) { // Password must contain letters and numbers
            passwordStrengthMeter.classList.add('strength-strong'); // Add the strength-strong class to the password strength meter
        } else if (password.length >= 8 && ((hasLetter && hasNumber) || (hasLetter && hasSpecial) || (hasNumber && hasSpecial))) { // Password must contain letters and numbers
            passwordStrengthMeter.classList.add('strength-medium'); // Add the strength-medium class to the password strength meter
        } else {
            passwordStrengthMeter.classList.add('strength-weak'); // Add the strength-weak class to the password strength meter
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
        const inputs = form.querySelectorAll('input');
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
        alertElement.className = `auth-alert auth-alert-${type}`;
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
    
    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} - Whether email is valid
     */
    function validateEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
    
    /**
     * Update the UI based on authentication state
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
            } else {
                // User is not logged in
                authGuestElements.forEach(el => el.style.display = 'block');
                authUserElements.forEach(el => el.style.display = 'none');
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
            
            // Default to logged out state on error
            authGuestElements.forEach(el => el.style.display = 'block');
            authUserElements.forEach(el => el.style.display = 'none');
        }
    }
    
    // Google login button
    function setupGoogleAuth() {
        const googleLoginButton = document.getElementById('googleLoginButton');
        
        if (googleLoginButton) { // Check if the button exists in the DOM
            googleLoginButton.addEventListener('click', async (e) => { // Add event listener to the button to handle clicks
                e.preventDefault(); // Prevent default form submission behavior
                try {
                    // Redirect URL after successful login - this is where the user will be redirected after successful login
                    const successRedirect = window.location.origin + '/pages/profile.html';
                    await loginWithGoogle(successRedirect); // Call the loginWithGoogle function to handle the login process
                } catch (error) { // Catch any errors that occur during the login process
                    console.error('Google login failed:', error); // Log the error to the console
                    // Show error to user
                    const errorElement = document.getElementById('login-error'); // Get the error element from the DOM
                    if (errorElement) { // Check if the error element exists in the DOM
                        errorElement.textContent = 'Google login failed. Please try again.'; // Set the error message when the login fails
                        errorElement.style.display = 'block'; // Show the error message when the login fails by setting the display property to block
                    }
                }
            });
        }
    }
}); 