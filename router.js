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
        await this.loadComponents();
        await this.loadPage(window.location.pathname);
        this.setupEventListeners();
        
        window.addEventListener('popstate', (e) => {
            this.loadPage(e.state?.path || window.location.pathname, false);
        });
    }
    
    async loadComponents() {
        try {
            if (!this.navigationLoaded) {
                const navResponse = await fetch('/components/navigation.html');
                const navHTML = await navResponse.text();
                const navContainer = document.getElementById('navigation-container');
                if (navContainer) {
                    navContainer.innerHTML = navHTML;
                    this.navigationLoaded = true;
                }
            }
            
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
        this.updateActiveNavLink(path);
        await this.loadPage(path, true);
        window.history.pushState({ path }, '', path);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    async loadPage(path, addToHistory = true) {
        const route = this.routes[path] || this.routes['/'];
        
        try {
            if (this.contentContainer) {
                this.contentContainer.classList.remove('active');
            }
            
            const response = await fetch(`/${route}`);
            const html = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const mainContent = doc.querySelector('main') || doc.querySelector('.content-overlay') || doc.body;
            
            if (this.contentContainer && mainContent) {
                this.contentContainer.innerHTML = mainContent.innerHTML;
                
                setTimeout(() => {
                    this.contentContainer.classList.add('active');
                }, 50);
                
                this.initializePageScripts(path);
                
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
            }
        } catch (error) {
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
        if (window.ScrollReveal) {
            new ScrollReveal();
        }
        
        const event = new CustomEvent('pageLoaded', { detail: { path } });
        document.dispatchEvent(event);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('navigation-container')) {
        window.spaRouter = new SPARouter();
    }
});