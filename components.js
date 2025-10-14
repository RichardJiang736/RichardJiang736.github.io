(function() {
    'use strict';
    
    const componentCache = new Map();
    
    async function loadComponent(containerId, componentPath) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container ${containerId} not found`);
            return;
        }
        
        try {
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
            
            requestAnimationFrame(() => {
                container.innerHTML = html;
                
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
                
                container.dispatchEvent(new CustomEvent('componentLoaded', {
                    detail: { path: componentPath }
                }));
            });
        } catch (error) {
            container.innerHTML = `<!-- Component loading failed: ${componentPath} -->`;
        }
    }
    
    async function initComponents() {
        const startTime = performance.now();
        
        await Promise.all([
            loadComponent('navigation-container', '/components/navigation.html'),
            loadComponent('footer-container', '/components/footer.html')
        ]);
        
        if (window.ScrollReveal) {
            requestAnimationFrame(() => {
                new ScrollReveal();
            });
        }
        
        document.dispatchEvent(new CustomEvent('componentsReady'));
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initComponents);
    } else {
        initComponents();
    }
    
    window.componentLoader = {
        reload: initComponents,
        clearCache: () => componentCache.clear()
    };
})();