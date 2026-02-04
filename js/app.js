/**
 * CodePulse - Main Application JavaScript
 * Handles landing page interactions
 */

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Navbar background on scroll
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
});

// Check authentication status
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/status');
        if (response.ok) {
            const data = await response.json();
            return data.authenticated;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
    }
    return false;
}

// Redirect to dashboard if already authenticated
async function redirectIfAuthenticated() {
    const isAuthenticated = await checkAuth();
    if (isAuthenticated && window.location.pathname === '/') {
        window.location.href = '/dashboard.html';
    }
}

// Initialize
redirectIfAuthenticated();
