// Main JavaScript for Richard Jiang's Personal Blog
// Ink ripple effects and animations - Optimized for 60-120Hz

class InkRippleSystem {
    constructor() {
        this.canvas = document.getElementById('ripple-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d', {
            alpha: true,
            desynchronized: true, // Enable low-latency rendering
            willReadFrequently: false
        });
        this.ripples = [];
        this.animationId = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.lastMouseMove = 0;
        this.isVisible = true;
        this.pixelRatio = window.devicePixelRatio || 1;
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.bindEvents();
        this.setupVisibilityDetection();
        this.startAnimation();
        
        // Optimized resize handler with debounce
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.resizeCanvas(), 150);
        }, { passive: true });
    }
    
    resizeCanvas() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Set canvas size with device pixel ratio for crisp rendering
        this.canvas.width = width * this.pixelRatio;
        this.canvas.height = height * this.pixelRatio;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        // Scale context to match pixel ratio
        this.ctx.scale(this.pixelRatio, this.pixelRatio);
    }
    
    setupVisibilityDetection() {
        // Pause animations when tab is not visible
        document.addEventListener('visibilitychange', () => {
            this.isVisible = !document.hidden;
            if (this.isVisible) {
                this.startAnimation();
            } else {
                this.stopAnimation();
            }
        });
    }
    
    bindEvents() {
        // Throttled mouse move for better performance
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            
            const now = performance.now();
            // Only create ripples every 100ms
            if (now - this.lastMouseMove > 100 && Math.random() < 0.1) {
                this.createRipple(e.clientX, e.clientY, 2, 0.05);
                this.lastMouseMove = now;
            }
        }, { passive: true });
        
        // Click for larger ripples
        document.addEventListener('click', (e) => {
            // Don't create ripples on links or buttons
            if (e.target.closest('a, button, input, textarea')) return;
            
            this.createRipple(e.clientX, e.clientY, 8, 0.3);
        }, { passive: true });
        
        // Debounced scroll ripples
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (this.ripples.length < 5) { // Limit concurrent ripples
                    const centerX = window.innerWidth / 2;
                    const centerY = window.innerHeight / 2;
                    this.createRipple(centerX, centerY, 4, 0.1);
                }
            }, 100);
        }, { passive: true });
    }
    
    createRipple(x, y, maxRadius = 5, opacity = 0.2) {
        // Limit total ripples for performance
        if (this.ripples.length > 20) {
            this.ripples.shift();
        }
        
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
        // Use clearRect for better performance than fillRect
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Batch draw calls
        this.ctx.lineWidth = 1;
        
        for (const ripple of this.ripples) {
            for (let ring = 0; ring < ripple.rings; ring++) {
                const ringRadius = ripple.radius - ring * 0.5;
                const ringOpacity = ripple.opacity * (1 - ring * 0.3);
                
                if (ringRadius > 0 && ringOpacity > 0.01) {
                    this.ctx.beginPath();
                    this.ctx.arc(ripple.x, ripple.y, ringRadius, 0, Math.PI * 2);
                    this.ctx.strokeStyle = `rgba(0, 0, 0, ${ringOpacity})`;
                    this.ctx.stroke();
                }
            }
        }
    }
    
    animate() {
        if (!this.isVisible) return;
        
        this.updateRipples();
        this.renderRipples();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    startAnimation() {
        if (!this.animationId && this.isVisible) {
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
        
        console.log('🎯 TypewriterAnimation constructor called');
        console.log('Element:', this.element);
        console.log('Typed available?', typeof Typed);
        this.init();
    }
    
    init() {
        // Wait for Typed.js to load if not ready yet
        if (typeof Typed === 'undefined') {
            console.warn('⏳ Typed.js not loaded yet, waiting...');
            let attempts = 0;
            const checkTyped = setInterval(() => {
                attempts++;
                if (typeof Typed !== 'undefined') {
                    console.log('✅ Typed.js loaded after', attempts, 'attempts');
                    clearInterval(checkTyped);
                    this.initTyped();
                } else if (attempts > 20) {
                    console.error('❌ Typed.js failed to load after 20 attempts. Using fallback.');
                    clearInterval(checkTyped);
                    this.fallback();
                }
            }, 100);
            return;
        }
        
        this.initTyped();
    }
    
    initTyped() {
        try {
            console.log('✍️ Initializing Typed.js...');
            // Typed.js expects a CSS selector string
            const selector = `#${this.element.id}`;
            console.log('Using selector:', selector);
            
            new Typed(selector, {
                strings: this.options.strings,
                typeSpeed: this.options.typeSpeed,
                backSpeed: this.options.backSpeed,
                backDelay: this.options.backDelay,
                loop: this.options.loop,
                showCursor: this.options.showCursor,
                cursorChar: this.options.cursorChar,
                onComplete: this.options.onComplete
            });
            console.log('✅ Typed.js initialized successfully');
        } catch (error) {
            console.error('❌ Typed.js initialization failed:', error);
            this.fallback();
        }
    }
    
    fallback() {
        console.log('📝 Using fallback text display');
        this.element.textContent = this.options.strings[0];
        if (this.options.onComplete) {
            setTimeout(this.options.onComplete, 100);
        }
    }
}

// Scroll Reveal Animation - Optimized with IntersectionObserver
class ScrollReveal {
    constructor() {
        this.elements = document.querySelectorAll('.scroll-reveal');
        this.observedElements = new Set();
        console.log('📜 ScrollReveal: Found', this.elements.length, 'elements');
        
        if (this.elements.length === 0) {
            console.warn('⚠️ No .scroll-reveal elements found!');
            return;
        }
        
        // List all elements found
        this.elements.forEach((el, i) => {
            console.log(`  ${i + 1}. ${el.className}`);
        });
        
        this.init();
    }
    
    init() {
        console.log('🔍 ScrollReveal init starting...');
        
        // IMMEDIATELY reveal ALL elements that are currently visible
        this.revealVisibleElements();
        
        // Then set up IntersectionObserver for future reveals
        if ('IntersectionObserver' in window) {
            this.setupObserver();
        } else {
            // Fallback for older browsers - reveal everything
            console.log('⚠️ IntersectionObserver not supported, revealing all');
            this.revealAll();
        }
        
        // Aggressive fallback: reveal everything after just 200ms if not already revealed
        setTimeout(() => {
            const stillHidden = document.querySelectorAll('.scroll-reveal:not(.revealed)').length;
            if (stillHidden > 0) {
                console.log(`⚡ Fallback: Force-revealing ${stillHidden} remaining elements`);
                this.revealAll();
            }
        }, 200);
    }
    
    revealVisibleElements() {
        console.log('🔍 Checking for visible elements immediately...');
        let revealedCount = 0;
        
        this.elements.forEach((el, index) => {
            const rect = el.getBoundingClientRect();
            // More generous viewport detection - reveal if ANY part is within 200px of viewport
            const isVisible = (
                rect.top < window.innerHeight + 200 &&
                rect.bottom > -200 &&
                rect.left < window.innerWidth + 200 &&
                rect.right > -200
            );
            
            if (isVisible && !el.classList.contains('revealed')) {
                console.log(`✨ Revealing visible element ${index + 1}`);
                el.classList.add('revealed');
                el.style.opacity = '1';
                el.style.transform = 'translate3d(0, 0, 0)';
                this.observedElements.add(el);
                revealedCount++;
            }
        });
        
        console.log(`✅ Revealed ${revealedCount} initially visible elements`);
    }
    
    setupObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('revealed')) {
                    console.log('✨ Revealing element via IntersectionObserver');
                    entry.target.classList.add('revealed');
                    this.observedElements.add(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        this.elements.forEach(el => {
            if (!el.classList.contains('revealed')) {
                observer.observe(el);
            }
        });
    }
    
    revealAll() {
        let revealedCount = 0;
        this.elements.forEach(el => {
            if (!el.classList.contains('revealed')) {
                el.classList.add('revealed');
                el.style.opacity = '1';
                el.style.transform = 'translate3d(0, 0, 0)';
                revealedCount++;
            }
        });
        
        if (revealedCount > 0) {
            console.log(`⚡ Force-revealed ${revealedCount} elements`);
        }
    }
}

// Navigation Handler - Optimized
class NavigationHandler {
    constructor() {
        this.navLinks = null;
        this.mobileMenuBtn = null;
        this.lastScrollPos = 0;
        this.ticking = false;
        this.init();
    }
    
    init() {
        // Wait for navigation to be loaded with timeout
        const checkNavigation = setInterval(() => {
            this.navLinks = document.querySelectorAll('.nav-link');
            this.mobileMenuBtn = document.getElementById('mobile-menu-btn');
            
            if (this.navLinks.length > 0) {
                clearInterval(checkNavigation);
                this.setupNavigation();
            }
        }, 100);
        
        // Clear interval after 5 seconds if navigation not found
        setTimeout(() => clearInterval(checkNavigation), 5000);
    }
    
    setupNavigation() {
        // Smooth scrolling for anchor links
        this.navLinks.forEach(link => {
            if (link.getAttribute('href')?.startsWith('#')) {
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
                }, { passive: false });
            }
        });
        
        // Mobile menu toggle
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.addEventListener('click', () => {
                console.log('Mobile menu clicked');
            }, { passive: true });
        }
        
        // Throttled scroll handler using requestAnimationFrame
        window.addEventListener('scroll', () => {
            this.lastScrollPos = window.scrollY;
            
            if (!this.ticking) {
                requestAnimationFrame(() => {
                    this.updateActiveNavLink();
                    this.ticking = false;
                });
                this.ticking = true;
            }
        }, { passive: true });
    }
    
    updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = this.lastScrollPos + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                this.navLinks.forEach(link => {
                    const isActive = link.getAttribute('href') === `#${sectionId}`;
                    link.classList.toggle('active', isActive);
                });
            }
        });
    }
}


// Form Handler (for contact forms) - Optimized
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
            }, { passive: false });
        });
    }
    
    handleSubmit(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (!submitBtn) return;
        
        const originalText = submitBtn.textContent;
        
        // Use requestAnimationFrame for smooth UI updates
        requestAnimationFrame(() => {
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
        });
        
        // Simulate form submission
        setTimeout(() => {
            requestAnimationFrame(() => {
                submitBtn.textContent = 'Message Sent!';
                this.createRippleFeedback(submitBtn, 'success');
            });
            
            setTimeout(() => {
                requestAnimationFrame(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    form.reset();
                });
            }, 2000);
        }, 1500);
    }
    
    createRippleFeedback(element, type) {
        if (!window.rippleSystem) return;
        
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create multiple ripples for feedback
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                window.rippleSystem.createRipple(centerX, centerY, 3, type === 'success' ? 0.2 : 0.3);
            }, i * 100);
        }
    }
}

// Performance Monitor - Enhanced for 120Hz
class PerformanceMonitor {
    constructor() {
        this.fps = 0;
        this.lastTime = performance.now();
        this.frames = 0;
        this.fpsHistory = [];
        this.maxHistory = 60;
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
            this.fpsHistory.push(this.fps);
            
            if (this.fpsHistory.length > this.maxHistory) {
                this.fpsHistory.shift();
            }
            
            this.frames = 0;
            this.lastTime = now;
            
            // Log performance metrics
            const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
            
            if (this.fps < 45) {
                console.warn('⚠️ Low FPS detected:', this.fps, '(avg:', Math.round(avgFps), ')');
            } else if (this.fps >= 60) {
                // Running at 60Hz or higher - good performance
            }
        }
        
        requestAnimationFrame(() => this.monitor());
    }
    
    getAverageFps() {
        return this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    }
}

// Lazy Loading for Images - Performance optimization
class LazyImageLoader {
    constructor() {
        this.images = document.querySelectorAll('img[data-src]');
        this.init();
    }
    
    init() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        imageObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });
            
            this.images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback: load all images immediately
            this.images.forEach(img => {
                img.src = img.dataset.src;
                img.classList.add('loaded');
            });
        }
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize ripple system if canvas exists
    const canvas = document.getElementById('ripple-canvas');
    if (canvas) {
        window.rippleSystem = new InkRippleSystem();
    }
    
    // Initialize typewriter animation
    const typewriterElement = document.getElementById('typewriter-text');
    if (typewriterElement && typeof Typed !== 'undefined') {
        new TypewriterAnimation(typewriterElement, {
            strings: ['Richard Jiang - ML Researcher & Artistic Explorer'],
            typeSpeed: 50,
            showCursor: false
        });
    }
    
    // Initialize scroll reveal
    new ScrollReveal();
    
    // Initialize navigation (waits for component to load)
    new NavigationHandler();
    
    // Initialize form handler
    new FormHandler();
    
    // Initialize lazy loading
    new LazyImageLoader();
    
    // Initialize performance monitor (only in development)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const perfMonitor = new PerformanceMonitor();
        window.perfMonitor = perfMonitor;
        
        // Log performance stats every 10 seconds
        setInterval(() => {
            console.log('📊 Average FPS:', Math.round(perfMonitor.getAverageFps()));
        }, 10000);
    }
    
    // Add ink ripple effects to interactive elements
    document.querySelectorAll('.ink-ripple').forEach(element => {
        element.addEventListener('click', (e) => {
            if (window.rippleSystem) {
                const rect = element.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                rippleSystem.createRipple(centerX, centerY, 6, 0.25);
            }
        }, { passive: true });
    });
    
    // Handle reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        if (window.rippleSystem) {
            rippleSystem.stopAnimation();
        }
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
    
    // Preload critical resources
    const preloadLinks = document.querySelectorAll('link[rel="preload"]');
    console.log('🚀 Preloaded', preloadLinks.length, 'resources');
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


// Export for use in other modules (at the end, no duplicates)
if (typeof window !== 'undefined') {
    window.InkRippleSystem = InkRippleSystem;
    window.TypewriterAnimation = TypewriterAnimation;
    window.ScrollReveal = ScrollReveal;
    window.NavigationHandler = NavigationHandler;
    window.PerformanceMonitor = PerformanceMonitor;
}