document.addEventListener('DOMContentLoaded', function () {
    // Initialize EmailJS with your Public Key using the recommended object format
    // IMPORTANT: Replace 'YOUR_PUBLIC_KEY' with your actual Public Key from your EmailJS account.
    emailjs.init({ //this is the public key for the emailjs account
        publicKey: 'gJ-E18JRSDyKcCUpy',
    });

    const newsletterForm = document.getElementById('newsletterForm');
    const feedbackElement = document.getElementById('newsletter-feedback');
    const submitButton = newsletterForm ? newsletterForm.querySelector('button[type="submit"]') : null;

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function (event) {
            event.preventDefault();

            // These IDs correspond to the ones you create in your EmailJS account.
            // IMPORTANT: Replace with your actual Service ID and Template ID.
            const serviceID = 'YOUR_SERVICE_ID';
            const templateID = 'YOUR_TEMPLATE_ID';

            // Disable the submit button and show loading state
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Subscribing...';
            }

            // Show submitting message
            feedbackElement.textContent = 'Subscribing...';
            feedbackElement.style.color = '#333';

            // Send the form data using EmailJS
            emailjs.sendForm(serviceID, templateID, this)
                .then((response) => {
                    // Success message
                    feedbackElement.textContent = '✅ Thank you for subscribing!';
                    feedbackElement.style.color = 'green';
                    newsletterForm.reset();
                    console.log('SUCCESS!', response.status, response.text);
                })
                .catch((err) => {
                    // Error message with more helpful details
                    feedbackElement.textContent = '❌ Subscription failed. Please try again later.';
                    feedbackElement.style.color = 'red';
                    console.error('EmailJS error:', err);
                })
                .finally(() => {
                    // Re-enable the submit button
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = 'Subscribe';
                    }
                    
                    // Clear the feedback message after 5 seconds
                    setTimeout(() => {
                        feedbackElement.textContent = '';
                    }, 5000);
                });
        });
    }
}); 