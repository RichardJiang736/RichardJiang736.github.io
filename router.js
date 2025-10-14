// Single Page Application Router
// Prevents navigation bar from reloading on page navigation

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
        
        this.contentContainer = document.getElementById('main-content');
        this.navigationLoaded = false;
        this.footerLoaded = false;
        
        this.init();
    }
    
    async init() {
        // Load navigation and footer components
        await this.loadComponents();
        
        // Load initial page content
        await this.loadPage(window.location.pathname);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            this.loadPage(e.state?.path || window.location.pathname, false);
        });
    }
    
    async loadComponents() {
        try {
            // Load navigation
            if (!this.navigationLoaded) {
                const navResponse = await fetch('/components/navigation.html');
                const navHTML = await navResponse.text();
                const navContainer = document.getElementById('navigation-container');
                if (navContainer) {
                    navContainer.innerHTML = navHTML;
                    this.navigationLoaded = true;
                }
            }
            
            // Load footer
            if (!this.footerLoaded) {
                const footerResponse = await fetch('/components/footer.html');
                const footerHTML = await footerResponse.text();
                const footerContainer = document.getElementById('footer-container');
                if (footerContainer) {
                    footerContainer.innerHTML = footerHTML;
                    this.footerLoaded = true;
                }
            }
        } catch (error) {
            console.warn('Could not load components:', error);
        }
    }
    
    setupEventListeners() {
        // Intercept navigation clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-link]');
            if (link) {
                e.preventDefault();
                const path = link.getAttribute('href');
                this.navigate(path);
            }
        });
    }
    
    async navigate(path) {
        // Update active nav link
        this.updateActiveNavLink(path);
        
        // Load page content
        await this.loadPage(path, true);
        
        // Update browser history
        window.history.pushState({ path }, '', path);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    async loadPage(path, addToHistory = true) {
        const route = this.routes[path] || this.routes['/'];
        
        try {
            // Add transition effect
            if (this.contentContainer) {
                this.contentContainer.classList.remove('active');
            }
            
            const response = await fetch(`/${route}`);
            const html = await response.text();
            
            // Extract main content from the fetched page
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const mainContent = doc.querySelector('main') || doc.querySelector('.content-overlay') || doc.body;
            
            if (this.contentContainer && mainContent) {
                this.contentContainer.innerHTML = mainContent.innerHTML;
                
                // Trigger transition
                setTimeout(() => {
                    this.contentContainer.classList.add('active');
                }, 50);
                
                // Re-initialize page-specific scripts
                this.initializePageScripts(path);
                
                // Update page title
                const pageTitle = doc.querySelector('title')?.textContent;
                if (pageTitle) {
                    document.title = pageTitle;
                }
                
                // Update meta description
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
            }
        } catch (error) {
            console.error('Error loading page:', error);
            // Fallback to traditional navigation
            window.location.href = path;
        }
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
        // Re-initialize scroll reveal
        if (window.ScrollReveal) {
            new ScrollReveal();
        }
        
        // Dispatch custom event for page-specific initialization
        const event = new CustomEvent('pageLoaded', { detail: { path } });
        document.dispatchEvent(event);
    }
}

// Initialize router when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize SPA router if components are available
    if (document.getElementById('navigation-container')) {
        window.spaRouter = new SPARouter();
    }
});
