const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

// Check URL hash for direct navigation to signup
if (window.location.hash === '#signup') {
    container.classList.add('active');
}

// Listen for hash changes
window.addEventListener('hashchange', function() {
    if (window.location.hash === '#signup') {
        container.classList.add('active');
    } else if (window.location.hash === '#signin' || !window.location.hash) {
        container.classList.remove('active');
    }
});

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
    history.pushState(null, null, '#signup');
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
    history.pushState(null, null, '#signin');
}); 