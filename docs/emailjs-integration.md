# EmailJS Integration Documentation

## Overview
This document provides comprehensive information about the EmailJS integration in the Recipe Planner application. EmailJS is used to handle newsletter subscriptions and other email communications directly from the client side without requiring a backend server.

## Setup & Configuration

### 1. EmailJS Account Setup
1. Create an account at [EmailJS](https://www.emailjs.com/)
2. Log in to the [EmailJS Dashboard](https://dashboard.emailjs.com/admin)

### 2. Email Service Configuration
We've connected our Gmail service to EmailJS:
- **Service ID**: `service_oq04ybe`
- **Service Name**: Contact Us

### 3. Email Templates
We've created the following templates:
- **Newsletter Subscription Template**
  - **Template ID**: `template_73m38z2`
  - **Template Name**: Contact Us
  - **Dynamic Variables**: 
    - `user_email`: Subscriber's email address

### 4. Public Key
- **Public Key**: `gJ-E18JRSDyKcCUpy`

## Implementation

### Newsletter Subscription Form
The newsletter subscription form is implemented in the footer section of `index.html`:

```html
<form class="newsletter-form" id="newsletterForm">
    <div class="input-group">
        <input type="email" class="form-control" id="newsletterEmail" name="user_email" placeholder="Your email address" required>
        <button class="btn btn-primary" type="submit">Subscribe</button>
    </div>
</form>
<div id="newsletter-feedback" class="mt-2"></div>
```

### JavaScript Implementation
The functionality is implemented in `js/newsletter.js`:

```javascript
document.addEventListener('DOMContentLoaded', function () {
    // Initialize EmailJS with Public Key
    emailjs.init({
        publicKey: 'gJ-E18JRSDyKcCUpy',
    });

    const newsletterForm = document.getElementById('newsletterForm');
    const feedbackElement = document.getElementById('newsletter-feedback');
    const submitButton = newsletterForm ? newsletterForm.querySelector('button[type="submit"]') : null;

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const serviceID = 'service_oq04ybe';
            const templateID = 'template_73m38z2';

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
```

## Usage Limits and Monitoring

- Free plan includes 200 emails per month
- Monitor your usage in the [EmailJS Dashboard](https://dashboard.emailjs.com/admin)
- Email history can be viewed in the dashboard
- Set up email notifications for when you approach your limits

## Troubleshooting

### Common Issues

#### 1. Emails Not Sending
- Verify that service ID and template ID are correct
- Check the browser console for errors
- Ensure the form has the correct field names that match template variables
- Verify the EmailJS service is properly connected to your email provider

#### 2. Template Variables Not Populating
- Ensure form field names match the variable names in the template
- Example: For `{{user_email}}` in the template, use `name="user_email"` in the HTML

#### 3. Emails Going to Spam
- Add proper sender information in the EmailJS template
- Include a clear subject line
- Avoid spam-triggering words in email content

### Debugging Tips
- Use `console.log` statements to track the flow of data
- Check the EmailJS dashboard for error messages
- Look at the Network tab in browser developer tools to see the API requests

## Security Considerations

- The public key can be exposed in client-side code
- Service and template IDs are safe to include in client-side code
- Consider adding CAPTCHA for public-facing forms
- Set domain restrictions in EmailJS dashboard to prevent unauthorized use

## Future Improvements

- Add CAPTCHA verification for the newsletter form
- Implement auto-reply functionality
- Add contact form with more fields
- Set up email templates for different types of notifications

## References

- [EmailJS Documentation](https://www.emailjs.com/docs/)
- [EmailJS React Examples](https://www.emailjs.com/docs/examples/reactjs/)
- [EmailJS Tutorial](https://www.emailjs.com/docs/tutorial/overview/) 