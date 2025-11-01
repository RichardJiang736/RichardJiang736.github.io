class SPARouter {
    constructor() {
        this.routes = {
            '/': 'index.html',
            '/blogs': 'blogs.html',
            '/reflection': 'reflection.html',
            '/film': 'film.html',
            '/music': 'music.html',
            '/travel': 'travel.html'
        };
        
        this.contentContainer = null;
        this.pageCache = new Map();
        this.isTransitioning = false;
        this.preloadedPages = new Set();
        
        this.init();
    }
    
    async init() {
        this.contentContainer = document.querySelector('main');
        
        if (!this.contentContainer) {
            return;
        }
        
        this.setupEventListeners();
        this.updateActiveNavLink(window.location.pathname);
        this.initializePageScripts(window.location.pathname);
        this.preloadPages();
        
        window.addEventListener('popstate', (e) => {
            this.loadPage(e.state?.path || window.location.pathname, false);
        });
    }
    
    async preloadPages() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-link]');
            if (link) {
                e.preventDefault();
                const path = link.getAttribute('href');
                console.log('Navigation clicked:', path);
                this.navigate(path);
            }
        }, true);
        
        document.addEventListener('mouseover', (e) => {
            const link = e.target.closest('a[data-link]');
            if (link) {
                const path = link.getAttribute('href');
                this.preloadPage(path);
            }
        }, { passive: true });
    }
    
    async preloadPages() {
        const paths = Object.keys(this.routes);
        const currentPath = window.location.pathname;
        setTimeout(() => {
            paths.forEach(path => {
                if (path !== currentPath && !this.preloadedPages.has(path)) {
                    this.preloadPage(path);
                }
            });
        }, 2000);
    }
    
    async preloadPage(path) {
        if (this.preloadedPages.has(path) || this.pageCache.has(path)) {
            return;
        }
        
        const route = this.routes[path];
        if (!route) return;
        
        try {
            const response = await fetch(`/${route}`);
            const html = await response.text();
            this.pageCache.set(path, html);
            this.preloadedPages.add(path);
        } catch (error) {
        }
    }
    
    async navigate(path) {
        if (this.isTransitioning) return;
        
        this.updateActiveNavLink(path);
        await this.loadPage(path, true);
        window.history.pushState({ path }, '', path);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    async loadPage(path, addToHistory = true) {
        if (this.isTransitioning) return;
        
        const route = this.routes[path] || this.routes['/'];
        
        try {
            this.isTransitioning = true;
            
            if (this.contentContainer) {
                this.contentContainer.classList.add('page-exit');
                await this.sleep(300);
            }
            
            let html;
            if (this.pageCache.has(path)) {
                html = this.pageCache.get(path);
            } else {
                const response = await fetch(`/${route}`);
                html = await response.text();
                this.pageCache.set(path, html);
            }
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const mainContent = doc.querySelector('#main-content') || doc.querySelector('main') || doc.querySelector('.content-overlay') || doc.body;
            
            if (this.contentContainer && mainContent) {
                this.contentContainer.innerHTML = mainContent.innerHTML;
                
                const scripts = this.contentContainer.querySelectorAll('script');
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    if (oldScript.src) {
                        newScript.src = oldScript.src;
                    } else {
                        newScript.textContent = oldScript.textContent;
                    }
                    Array.from(oldScript.attributes).forEach(attr => {
                        newScript.setAttribute(attr.name, attr.value);
                    });
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                });
                
                const pageTitle = doc.querySelector('title')?.textContent;
                if (pageTitle) {
                    document.title = pageTitle;
                }
                
                const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content');
                if (metaDesc) {
                    let metaTag = document.querySelector('meta[name="description"]');
                    if (!metaTag) {
                        metaTag = document.createElement('meta');
                        metaTag.name = 'description';
                        document.head.appendChild(metaTag);
                    }
                    metaTag.content = metaDesc;
                }
                
                this.contentContainer.classList.remove('page-exit');
                void this.contentContainer.offsetWidth;
                this.contentContainer.classList.add('page-enter');
                
                setTimeout(() => {
                    this.contentContainer.classList.remove('page-enter');
                    this.isTransitioning = false;
                }, 400);
                
                this.initializePageScripts(path);
            }
        } catch (error) {
            window.location.href = path;
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    updateActiveNavLink(path) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === path) {
                link.classList.add('active');
            }
        });
    }
    
    initializePageScripts(path) {
        if (window.ScrollReveal) {
            const sr = new ScrollReveal();
            const scrollElements = document.querySelectorAll('.scroll-reveal');
            scrollElements.forEach(el => {
                el.classList.remove('revealed');
                sr.reveal(el, {
                    duration: 600,
                    distance: '30px',
                    origin: 'bottom',
                    opacity: 0,
                    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    reset: false
                });
            });
        }
        
        if (path === '/' && window.InkRippleSystem) {
            new InkRippleSystem();
        }
        const event = new CustomEvent('pageLoaded', { detail: { path } });
        document.dispatchEvent(event);
    }
}

function initRouter() {
    const navContainer = document.getElementById('navigation-container');
    if (navContainer) {
        window.spaRouter = new SPARouter();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRouter);
} else {
    initRouter();
}