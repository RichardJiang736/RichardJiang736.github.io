// Optimized Component Loader
// Loads navigation and footer with performance optimizations

(function() {
    'use strict';
    
    // Cache for loaded components
    const componentCache = new Map();
    
    async function loadComponent(containerId, componentPath) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container ${containerId} not found`);
            return;
        }
        
        try {
            // Check cache first
            let html;
            if (componentCache.has(componentPath)) {
                html = componentCache.get(componentPath);
            } else {
                const response = await fetch(componentPath);
                if (!response.ok) {
                    throw new Error(`Failed to load ${componentPath}: ${response.status}`);
                }
                html = await response.text();
                componentCache.set(componentPath, html);
            }
            
            // Use requestAnimationFrame for smooth DOM updates
            requestAnimationFrame(() => {
                container.innerHTML = html;
                
                // Execute any scripts in the loaded HTML
                const scripts = container.querySelectorAll('script');
                scripts.forEach(script => {
                    const newScript = document.createElement('script');
                    if (script.src) {
                        newScript.src = script.src;
                    } else {
                        newScript.textContent = script.textContent;
                    }
                    script.parentNode.replaceChild(newScript, script);
                });
                
                // Dispatch custom event for component loaded
                container.dispatchEvent(new CustomEvent('componentLoaded', {
                    detail: { path: componentPath }
                }));
            });
        } catch (error) {
            console.error('Error loading component:', error);
            // Fallback: show minimal content
            container.innerHTML = `<!-- Component loading failed: ${componentPath} -->`;
        }
    }
    
    async function initComponents() {
        const startTime = performance.now();
        
        // Load components in parallel for faster initial render
        await Promise.all([
            loadComponent('navigation-container', '/components/navigation.html'),
            loadComponent('footer-container', '/components/footer.html')
        ]);
        
        const loadTime = performance.now() - startTime;
        
        // Log performance in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log(`✨ Components loaded in ${loadTime.toFixed(2)}ms`);
        }
        
        // Initialize scroll reveal after components are loaded
        if (window.ScrollReveal) {
            requestAnimationFrame(() => {
                new ScrollReveal();
            });
        }
        
        // Dispatch global event
        document.dispatchEvent(new CustomEvent('componentsReady'));
    }
    
    // Use modern loading strategy
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initComponents);
    } else {
        // DOM already loaded, run immediately
        initComponents();
    }
    
    // Export for debugging
    window.componentLoader = {
        reload: initComponents,
        clearCache: () => componentCache.clear()
    };
})();
