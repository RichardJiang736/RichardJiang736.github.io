// Main JavaScript for Richard Jiang's Personal Blog
// Ink ripple effects and animations

class InkRippleSystem {
    constructor() {
        this.canvas = document.getElementById('ripple-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ripples = [];
        this.animationId = null;
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.bindEvents();
        this.startAnimation();
        
        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    bindEvents() {
        // Mouse move for gentle ripples
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            
            // Create subtle trailing ripples
            if (Math.random() < 0.1) {
                this.createRipple(e.clientX, e.clientY, 2, 0.05);
            }
        });
        
        // Click for larger ripples
        document.addEventListener('click', (e) => {
            // Don't create ripples on links or buttons
            if (e.target.closest('a, button')) return;
            
            this.createRipple(e.clientX, e.clientY, 8, 0.3);
        });
        
        // Scroll for background ripples
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;
                this.createRipple(centerX, centerY, 4, 0.1);
            }, 100);
        });
    }
    
    createRipple(x, y, maxRadius = 5, opacity = 0.2) {
        this.ripples.push({
            x,
            y,
            radius: 0,
            maxRadius,
            opacity,
            speed: 0.05 + Math.random() * 0.1,
            rings: Math.floor(Math.random() * 3) + 1
        });
    }
    
    updateRipples() {
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const ripple = this.ripples[i];
            
            ripple.radius += ripple.speed;
            ripple.opacity *= 0.98;
            
            if (ripple.radius > ripple.maxRadius || ripple.opacity < 0.01) {
                this.ripples.splice(i, 1);
            }
        }
    }
    
    renderRipples() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (const ripple of this.ripples) {
            for (let ring = 0; ring < ripple.rings; ring++) {
                const ringRadius = ripple.radius - ring * 0.5;
                const ringOpacity = ripple.opacity * (1 - ring * 0.3);
                
                if (ringRadius > 0) {
                    this.ctx.beginPath();
                    this.ctx.arc(ripple.x, ripple.y, ringRadius, 0, Math.PI * 2);
                    this.ctx.strokeStyle = `rgba(0, 0, 0, ${ringOpacity})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        }
    }
    
    animate() {
        this.updateRipples();
        this.renderRipples();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    startAnimation() {
        if (!this.animationId) {
            this.animate();
        }
    }
    
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// Typewriter Animation
class TypewriterAnimation {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            strings: options.strings || ['Richard Jiang - ML Researcher & Artistic Explorer'],
            typeSpeed: options.typeSpeed || 50,
            backSpeed: options.backSpeed || 30,
            backDelay: options.backDelay || 2000,
            loop: options.loop || false,
            showCursor: options.showCursor !== false,
            cursorChar: options.cursorChar || '|',
            onComplete: options.onComplete || null
        };
        
        this.init();
    }
    
    init() {
        if (typeof Typed !== 'undefined') {
            new Typed(this.element, this.options);
        } else {
            // Fallback if Typed.js is not loaded
            this.element.textContent = this.options.strings[0];
        }
    }
}

// Scroll Reveal Animation
class ScrollReveal {
    constructor() {
        this.elements = document.querySelectorAll('.scroll-reveal');
        this.init();
    }
    
    init() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });
            
            this.elements.forEach(el => observer.observe(el));
        } else {
            // Fallback for older browsers
            this.elements.forEach(el => el.classList.add('revealed'));
        }
    }
}

// Navigation Handler
class NavigationHandler {
    constructor() {
        this.navLinks = document.querySelectorAll('.nav-link');
        this.mobileMenuBtn = document.getElementById('mobile-menu-btn');
        this.init();
    }
    
    init() {
        // Smooth scrolling for anchor links
        this.navLinks.forEach(link => {
            if (link.getAttribute('href').startsWith('#')) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute('href').substring(1);
                    const targetElement = document.getElementById(targetId);
                    
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            }
        });
        
        // Mobile menu toggle
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.addEventListener('click', () => {
                // Mobile menu implementation
                console.log('Mobile menu clicked');
            });
        }
        
        // Update active nav link based on scroll position
        window.addEventListener('scroll', () => {
            this.updateActiveNavLink();
        });
    }
    
    updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                this.navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
}

// Ink Drop Animation
function createInkDrop(x, y) {
    const drop = document.createElement('div');
    drop.className = 'ink-drop';
    drop.style.left = x + 'px';
    drop.style.top = y + 'px';
    
    document.body.appendChild(drop);
    
    setTimeout(() => {
        drop.remove();
    }, 1000);
}

// Form Handler (for contact forms)
class FormHandler {
    constructor() {
        this.forms = document.querySelectorAll('form');
        this.init();
    }
    
    init() {
        this.forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit(form);
            });
        });
    }
    
    handleSubmit(form) {
        // Simulate form submission with ink feedback
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        // Create success ripple
        setTimeout(() => {
            submitBtn.textContent = 'Message Sent!';
            this.createRippleFeedback(submitBtn, 'success');
            
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                form.reset();
            }, 2000);
        }, 1500);
    }
    
    createRippleFeedback(element, type) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create multiple ripples for feedback
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                rippleSystem.createRipple(centerX, centerY, 3, type === 'success' ? 0.2 : 0.3);
            }, i * 100);
        }
    }
}

// Performance Monitor
class PerformanceMonitor {
    constructor() {
        this.fps = 0;
        this.lastTime = performance.now();
        this.frames = 0;
        this.init();
    }
    
    init() {
        this.monitor();
    }
    
    monitor() {
        const now = performance.now();
        this.frames++;
        
        if (now >= this.lastTime + 1000) {
            this.fps = Math.round((this.frames * 1000) / (now - this.lastTime));
            this.frames = 0;
            this.lastTime = now;
            
            // Log performance issues
            if (this.fps < 30) {
                console.warn('Low FPS detected:', this.fps);
            }
        }
        
        requestAnimationFrame(() => this.monitor());
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize ripple system
    window.rippleSystem = new InkRippleSystem();
    
    // Initialize typewriter animation
    const typewriterElement = document.getElementById('typewriter-text');
    if (typewriterElement) {
        new TypewriterAnimation(typewriterElement, {
            strings: ['Richard Jiang - ML Researcher & Artistic Explorer'],
            typeSpeed: 50,
            showCursor: false,
            onComplete: () => {
                // Create ink drop animation when typewriter completes
                setTimeout(() => {
                    const container = document.getElementById('ink-drop-container');
                    if (container) {
                        createInkDrop(container.offsetLeft + 100, container.offsetTop + 20);
                    }
                }, 500);
            }
        });
    }
    
    // Initialize scroll reveal
    new ScrollReveal();
    
    // Initialize navigation
    new NavigationHandler();
    
    // Initialize form handler
    new FormHandler();
    
    // Initialize performance monitor (only in development)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        new PerformanceMonitor();
    }
    
    // Add ink ripple effects to interactive elements
    document.querySelectorAll('.ink-ripple').forEach(element => {
        element.addEventListener('click', (e) => {
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            rippleSystem.createRipple(centerX, centerY, 6, 0.25);
        });
    });
    
    // Handle reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        rippleSystem.stopAnimation();
        document.body.classList.add('reduced-motion');
    }
    
    // Add keyboard navigation support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.rippleSystem) {
        window.rippleSystem.stopAnimation();
    }
});

// Export for use in other modules
window.InkRippleSystem = InkRippleSystem;
window.TypewriterAnimation = TypewriterAnimation;
window.ScrollReveal = ScrollReveal;
window.NavigationHandler = NavigationHandler;