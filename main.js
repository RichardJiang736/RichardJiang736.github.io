class InkRippleSystem {
    constructor() {
        this.canvas = document.getElementById('ripple-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d', {
            alpha: true,
            desynchronized: true,
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
        
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.resizeCanvas(), 150);
        }, { passive: true });
    }
    
    resizeCanvas() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.canvas.width = width * this.pixelRatio;
        this.canvas.height = height * this.pixelRatio;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        this.ctx.scale(this.pixelRatio, this.pixelRatio);
    }
    
    setupVisibilityDetection() {
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
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            
            const now = performance.now();
            if (now - this.lastMouseMove > 100 && Math.random() < 0.1) {
                this.createRipple(e.clientX, e.clientY, 2, 0.05);
                this.lastMouseMove = now;
            }
        }, { passive: true });
        
        document.addEventListener('click', (e) => {
            if (e.target.closest('a, button, input, textarea')) return;
            this.createRipple(e.clientX, e.clientY, 8, 0.3);
        }, { passive: true });
        
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (this.ripples.length < 5) {
                    const centerX = window.innerWidth / 2;
                    const centerY = window.innerHeight / 2;
                    this.createRipple(centerX, centerY, 4, 0.1);
                }
            }, 100);
        }, { passive: true });
    }
    
    createRipple(x, y, maxRadius = 5, opacity = 0.2) {
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
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
        if (typeof Typed === 'undefined') {
            let attempts = 0;
            const checkTyped = setInterval(() => {
                attempts++;
                if (typeof Typed !== 'undefined') {
                    clearInterval(checkTyped);
                    this.initTyped();
                } else if (attempts > 20) {
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
            const selector = `#${this.element.id}`;
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
        } catch (error) {
            this.fallback();
        }
    }
    
    fallback() {
        this.element.textContent = this.options.strings[0];
        if (this.options.onComplete) {
            setTimeout(this.options.onComplete, 100);
        }
    }
}

class ScrollReveal {
    constructor() {
        this.elements = document.querySelectorAll('.scroll-reveal');
        this.observedElements = new Set();
        
        if (this.elements.length === 0) return;
        this.init();
    }
    
    init() {
        this.revealVisibleElements();
        
        if ('IntersectionObserver' in window) {
            this.setupObserver();
        } else {
            this.revealAll();
        }
        
        setTimeout(() => {
            const stillHidden = document.querySelectorAll('.scroll-reveal:not(.revealed)').length;
            if (stillHidden > 0) {
                this.revealAll();
            }
        }, 200);
    }
    
    revealVisibleElements() {
        this.elements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            const isVisible = (
                rect.top < window.innerHeight + 200 &&
                rect.bottom > -200 &&
                rect.left < window.innerWidth + 200 &&
                rect.right > -200
            );
            
            if (isVisible && !el.classList.contains('revealed')) {
                el.classList.add('revealed');
                el.style.opacity = '1';
                el.style.transform = 'translate3d(0, 0, 0)';
                this.observedElements.add(el);
            }
        });
    }
    
    setupObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('revealed')) {
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
        this.elements.forEach(el => {
            if (!el.classList.contains('revealed')) {
                el.classList.add('revealed');
                el.style.opacity = '1';
                el.style.transform = 'translate3d(0, 0, 0)';
            }
        });
    }
}

class NavigationHandler {
    constructor() {
        this.navLinks = null;
        this.mobileMenuBtn = null;
        this.navElement = null;
        this.lastScrollPos = 0;
        this.ticking = false;
        this.init();
    }
    
    init() {
        const checkNavigation = setInterval(() => {
            this.navLinks = document.querySelectorAll('.nav-link');
            this.mobileMenuBtn = document.getElementById('mobile-menu-btn');
            this.navElement = document.querySelector('nav');
            
            if (this.navLinks.length > 0) {
                clearInterval(checkNavigation);
                this.setupNavigation();
            }
        }, 100);
        
        setTimeout(() => clearInterval(checkNavigation), 5000);
    }
    
    setupNavigation() {
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
        
        window.addEventListener('scroll', () => {
            this.lastScrollPos = window.scrollY;
            
            if (!this.ticking) {
                requestAnimationFrame(() => {
                    this.updateActiveNavLink();
                    this.updateNavTransparency();
                    this.ticking = false;
                });
                this.ticking = true;
            }
        }, { passive: true });
        
        this.updateNavTransparency();
    }
    
    updateNavTransparency() {
        if (!this.navElement) return;
        
        if (this.lastScrollPos > 50) {
            this.navElement.classList.add('scrolled');
        } else {
            this.navElement.classList.remove('scrolled');
        }
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
        
        requestAnimationFrame(() => {
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
        });
        
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
        
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                window.rippleSystem.createRipple(centerX, centerY, 3, type === 'success' ? 0.2 : 0.3);
            }, i * 100);
        }
    }
}

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
        }
        
        requestAnimationFrame(() => this.monitor());
    }
    
    getAverageFps() {
        return this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    }
}

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
            this.images.forEach(img => {
                img.src = img.dataset.src;
                img.classList.add('loaded');
            });
        }
    }
}

function initializePage() {
    const canvas = document.getElementById('ripple-canvas');
    if (canvas && !window.rippleSystem) {
        window.rippleSystem = new InkRippleSystem();
    }
    
    const typewriterElement = document.getElementById('typewriter-text');
    if (typewriterElement && typeof Typed !== 'undefined') {
        new TypewriterAnimation(typewriterElement, {
            strings: ['Richard Jiang - ML Researcher & Artistic Explorer'],
            typeSpeed: 50,
            showCursor: false
        });
    }
    
    new ScrollReveal();
    
    if (!window.navigationHandlerInitialized) {
        new NavigationHandler();
        window.navigationHandlerInitialized = true;
    }
    
    if (!window.formHandlerInitialized) {
        new FormHandler();
        window.formHandlerInitialized = true;
    }
    
    if (!window.lazyImageLoaderInitialized) {
        new LazyImageLoader();
        window.lazyImageLoaderInitialized = true;
    }
    
    if (!window.perfMonitorInitialized && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        window.perfMonitor = new PerformanceMonitor();
        window.perfMonitorInitialized = true;
    }
    
    document.querySelectorAll('.ink-ripple').forEach(element => {
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
        
        newElement.addEventListener('click', (e) => {
            if (window.rippleSystem) {
                const rect = newElement.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                rippleSystem.createRipple(centerX, centerY, 6, 0.25);
            }
        }, { passive: true });
    });
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion && window.rippleSystem) {
        rippleSystem.stopAnimation();
        document.body.classList.add('reduced-motion');
    }
}

document.addEventListener('DOMContentLoaded', initializePage);

// Re-initialize when navigating in SPA
document.addEventListener('pageLoaded', (e) => {
    console.log('Page loaded event received for:', e.detail.path);
    initializePage();
});

// Keyboard navigation (only initialize once)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
    }
});

document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
});

window.addEventListener('beforeunload', () => {
    if (window.rippleSystem) {
        window.rippleSystem.stopAnimation();
    }
});

if (typeof window !== 'undefined') {
    window.InkRippleSystem = InkRippleSystem;
    window.TypewriterAnimation = TypewriterAnimation;
    window.ScrollReveal = ScrollReveal;
    window.NavigationHandler = NavigationHandler;
    window.PerformanceMonitor = PerformanceMonitor;
}