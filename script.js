/**
 * Recipe Planner - Main JavaScript
 * Handles interactive elements on the recipe planner website
 */

document.addEventListener('DOMContentLoaded', function() {
    // Add a loading state to indicate when page is ready
    document.body.classList.add('page-loaded');
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 70, // Adjust for navbar height
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navbar scroll behavior
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        });
    }

    // Active link highlighting
    const currentLocation = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        // Get the link path
        const linkPath = link.getAttribute('href');
        
        // Check if the current path includes the link path
        // This handles both exact matches and subpaths
        if (currentLocation === linkPath || 
            (linkPath !== '/' && linkPath !== '/index.html' && currentLocation.includes(linkPath))) {
            link.classList.add('active');
        }
    });

    // Form submission handling
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[type="email"]');
            if (emailInput && emailInput.value) {
                // Create success notification
                showNotification('Thank you for subscribing! You\'ll receive our latest recipes and updates.', 'success');
                emailInput.value = '';
            }
        });
    }

    // Recipe card hover effects with lazy loading
    const recipeCards = document.querySelectorAll('.recipe-card');
    recipeCards.forEach(card => {
        // Lazy load recipe images
        const img = card.querySelector('img');
        if (img && img.getAttribute('data-src')) {
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        img.src = img.getAttribute('data-src');
                        observer.unobserve(img);
                    }
                });
            });
            observer.observe(img);
        }
        
        // Add hover effects
        card.addEventListener('mouseenter', function() {
            this.classList.add('recipe-card-hover');
        });
        card.addEventListener('mouseleave', function() {
            this.classList.remove('recipe-card-hover');
        });
    });

    // Mobile menu toggle
    const navbarToggler = document.querySelector('.navbar-toggler');
    if (navbarToggler) {
        navbarToggler.addEventListener('click', function() {
            // Additional animation for mobile menu
            document.querySelectorAll('.navbar-nav .nav-item').forEach((item, index) => {
                item.style.animationDelay = `${index * 0.1}s`;
                item.classList.add('animate-in');
            });
        });
    }
    
    // Theme toggler - light/dark mode (placeholder)
    const themeToggler = document.createElement('button');
    themeToggler.className = 'theme-toggler';
    themeToggler.innerHTML = '<i class="fas fa-moon"></i>';
    themeToggler.setAttribute('title', 'Toggle dark mode');
    document.body.appendChild(themeToggler);
    
    themeToggler.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const icon = this.querySelector('i');
        if (document.body.classList.contains('dark-mode')) {
            icon.className = 'fas fa-sun';
            localStorage.setItem('theme', 'dark');
        } else {
            icon.className = 'fas fa-moon';
            localStorage.setItem('theme', 'light');
        }
    });
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggler.querySelector('i').className = 'fas fa-sun';
    }
    
    // Add a "Back to top" button
    const backToTop = document.createElement('button');
    backToTop.className = 'back-to-top';
    backToTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTop.setAttribute('title', 'Back to top');
    document.body.appendChild(backToTop);
    
    // Show/hide back to top button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    });
    
    // Scroll to top when button is clicked
    backToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Function to show notifications
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            </div>
            <div class="notification-message">${message}</div>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto-remove after 5 seconds
        const timeout = setTimeout(() => {
            removeNotification(notification);
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(timeout);
            removeNotification(notification);
        });
    }
    
    function removeNotification(notification) {
        notification.classList.remove('show');
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }
});

// Add CSS classes and styles for new elements
document.head.insertAdjacentHTML('beforeend', `
<style>
.navbar-scrolled {
    background-color: white;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.page-loaded {
    animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.animate-in {
    animation: slideIn 0.3s ease forwards;
    opacity: 0;
    transform: translateY(10px);
}

@keyframes slideIn {
    to { opacity: 1; transform: translateY(0); }
}

.theme-toggler, .back-to-top {
    position: fixed;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: var(--primary);
    color: white;
    border: none;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 999;
}

.theme-toggler {
    bottom: 90px;
    right: 20px;
}

.back-to-top {
    bottom: 30px;
    right: 20px;
    opacity: 0;
    transform: translateY(20px);
    pointer-events: none;
}

.back-to-top.show {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
}

.theme-toggler:hover, .back-to-top:hover {
    background-color: var(--primary-dark);
    transform: translateY(-3px);
}

.notification {
    position: fixed;
    bottom: 20px;
    left: 20px;
    display: flex;
    align-items: center;
    padding: 15px;
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    max-width: 350px;
    z-index: 1000;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
}

.notification.show {
    opacity: 1;
    transform: translateY(0);
}

.notification.hide {
    opacity: 0;
    transform: translateY(20px);
}

.notification-success {
    border-left: 4px solid #10B981;
}

.notification-error {
    border-left: 4px solid #EF4444;
}

.notification-info {
    border-left: 4px solid #3B82F6;
}

.notification-icon {
    margin-right: 12px;
    font-size: 20px;
}

.notification-success .notification-icon {
    color: #10B981;
}

.notification-error .notification-icon {
    color: #EF4444;
}

.notification-info .notification-icon {
    color: #3B82F6;
}

.notification-message {
    flex: 1;
    font-size: 14px;
}

.notification-close {
    background: none;
    border: none;
    color: #9CA3AF;
    cursor: pointer;
    margin-left: 10px;
}

.dark-mode {
    background-color: #1F2937;
    color: #E5E7EB;
}

.dark-mode .navbar,
.dark-mode .hero,
.dark-mode .feature-card,
.dark-mode .step-card,
.dark-mode .recipe-card,
.dark-mode .testimonial-card,
.dark-mode .footer {
    background-color: #111827;
    color: #E5E7EB;
}

.dark-mode h1, 
.dark-mode h2, 
.dark-mode h3, 
.dark-mode h4 {
    color: #F9FAFB;
}

.dark-mode .navbar-light .navbar-nav .nav-link {
    color: #E5E7EB;
}

.dark-mode .navbar-light .navbar-toggler-icon {
    filter: invert(1);
}

.dark-mode .notification {
    background-color: #374151;
    color: #F9FAFB;
}
</style>
`);
