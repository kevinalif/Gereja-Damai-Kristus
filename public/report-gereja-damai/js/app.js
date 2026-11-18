// Main Application Entry Point
import { Finance } from './components/finance.js';
import { Events } from './components/events.js';
import { Settings } from './components/settings.js';
import { showToast } from './utils/toast.js';

class App {
    constructor() {
        this.currentSection = 'finance';
        this.currentComponent = null; // Track current component instance
        this.menuItems = [
            { 
                id: 'finance', 
                label: 'Finance', 
                icon: 'dollar-sign',
                component: Finance
            },
            { 
                id: 'events', 
                label: 'Events', 
                icon: 'calendar',
                component: Events
            },
            { 
                id: 'settings', 
                label: 'Settings', 
                icon: 'settings',
                component: Settings
            },
        ];
        
        this.init();
    }

    init() {
        // Initialize Lucide icons
        lucide.createIcons();
        
        // Initialize mobile hamburger menu
        this.initMobileMenu();
        
        // Render menu
        this.renderMenu();
        
        // Load default section
        this.loadSection('finance');
        
        // Show welcome toast
        setTimeout(() => {
            showToast('Selamat datang di Report Gereja Damai!', 'info');
        }, 500);
    }

    initMobileMenu() {
        // Create hamburger button and overlay if not exists
        if (!document.getElementById('sidebar-toggle')) {
            const toggle = document.createElement('button');
            toggle.id = 'sidebar-toggle';
            toggle.className = 'hidden';
            toggle.innerHTML = '<span></span><span></span><span></span>';
            document.body.appendChild(toggle);

            const overlay = document.createElement('div');
            overlay.id = 'sidebar-overlay';
            document.body.appendChild(overlay);

            // Add event listeners
            toggle.addEventListener('click', () => {
                this.toggleSidebar();
            });

            overlay.addEventListener('click', () => {
                this.closeSidebar();
            });

            // Close sidebar when menu item is clicked
            const observer = new MutationObserver(() => {
                const menuItems = document.querySelectorAll('.menu-item');
                menuItems.forEach(item => {
                    item.removeEventListener('click', () => this.closeSidebar());
                    item.addEventListener('click', () => this.closeSidebar());
                });
            });

            observer.observe(document.getElementById('menu-list'), {
                childList: true,
                subtree: true
            });
        }
    }

    toggleSidebar() {
        const aside = document.querySelector('aside');
        const toggle = document.getElementById('sidebar-toggle');
        const overlay = document.getElementById('sidebar-overlay');

        if (aside && toggle && overlay) {
            const isOpen = aside.classList.toggle('show');
            toggle.classList.toggle('open');
            if (isOpen) {
                overlay.classList.add('active');
            } else {
                overlay.classList.remove('active');
            }
        }
    }

    closeSidebar() {
        const aside = document.querySelector('aside');
        const toggle = document.getElementById('sidebar-toggle');
        const overlay = document.getElementById('sidebar-overlay');

        if (aside && toggle && overlay) {
            aside.classList.remove('show');
            toggle.classList.remove('open');
            overlay.classList.remove('active');
        }
    }

    renderMenu() {
        const menuList = document.getElementById('menu-list');
        menuList.innerHTML = '';

        this.menuItems.forEach(item => {
            const li = document.createElement('li');
            const button = document.createElement('button');
            
            button.className = `menu-item w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                this.currentSection === item.id 
                    ? 'active' 
                    : 'text-gray-700 hover:bg-gray-100'
            }`;
            
            button.innerHTML = `
                <i data-lucide="${item.icon}" class="h-4 w-4"></i>
                <span>${item.label}</span>
            `;
            
            button.addEventListener('click', () => this.loadSection(item.id));
            
            li.appendChild(button);
            menuList.appendChild(li);
        });

        // Re-initialize Lucide icons for new elements
        lucide.createIcons();
    }

    async loadSection(sectionId) {
        // Destroy previous component if it has cleanup method
        if (this.currentComponent && typeof this.currentComponent.destroy === 'function') {
            this.currentComponent.destroy();
        }
        
        this.currentSection = sectionId;
        
        // Update menu active state
        this.renderMenu();
        
        // Show loading
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="flex items-center justify-center h-64">
                <div class="spinner"></div>
            </div>
        `;

        // Find component
        const menuItem = this.menuItems.find(item => item.id === sectionId);
        
        if (menuItem) {
            try {
                // Load component
                const component = new menuItem.component();
                this.currentComponent = component; // Save reference
                await component.render(mainContent);
                
                // Add fade-in animation
                mainContent.querySelector('div').classList.add('fade-in');
                
                // Re-initialize Lucide icons
                lucide.createIcons();
            } catch (error) {
                console.error('Error loading section:', error);
                showToast('Gagal memuat halaman', 'error');
                mainContent.innerHTML = `
                    <div class="flex items-center justify-center h-64 text-red-600">
                        <div class="text-center">
                            <p class="text-lg font-semibold">Error</p>
                            <p class="text-sm">${error.message}</p>
                        </div>
                    </div>
                `;
            }
        }
    }
}

// Logout Handler - Simple & Direct
window.handleLogout = function() {
    // Check if running inside iframe
    if (window.parent !== window) {
        // Redirect parent window to logout
        window.parent.location.href = '/logout';
    } else {
        // Direct access, redirect to logout
        window.location.href = '/logout';
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new App();
    });
} else {
    window.app = new App();
}

export default App;
