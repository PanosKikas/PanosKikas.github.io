/**
 * Sidebar Web Component
 * A reusable navigation sidebar that automatically highlights the active page
 */
class SidebarNav extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // Determine current page for active state
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Check if sidebar should start collapsed (read localStorage BEFORE rendering)
    const storedState = localStorage.getItem('sidebarCollapsed');
    const shouldBeCollapsed = storedState === 'true';
    
    // Define menu items
    const menuItems = [
      { href: 'index.html', text: 'Home' },
      { href: 'portfolio.html', text: 'Portfolio' },
      { href: 'myskills.html', text: 'Skills' },
      { href: 'contact.html', text: 'Contact' }
    ];

    // Generate menu HTML with active state
    const menuHTML = menuItems.map(item => {
      const isActive = currentPage === item.href || 
                       (currentPage === '' && item.href === 'index.html');
      return `
        <li>
          <a class="retro-menu-item${isActive ? ' active' : ''}" href="${item.href}">
            <span class="menu-text">${item.text}</span>
          </a>
        </li>
      `;
    }).join('');

    // Render the sidebar - apply collapsed class immediately if needed
    this.innerHTML = `
      <!-- Mobile Menu Toggle -->
      <div class="menu-toggle${shouldBeCollapsed ? ' visible' : ''}" id="menuToggle">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
      
      <!-- Left Sidebar Navigation -->
      <nav id="sidebar-nav" class="retro-sidebar${shouldBeCollapsed ? ' collapsed' : ''}">
        <div class="sidebar-header">
          <div class="retro-screen">
            <h1 class="sidebar-logo">PANOS KIKAS</h1>
            <div class="retro-divider"></div>
            <h2 class="sidebar-slogan">GAME DEVELOPER</h2>
          </div>
          <button class="sidebar-collapse-btn" id="sidebarCollapseBtn" title="Collapse Sidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <ul class="retro-menu">
          ${menuHTML}
        </ul>
        <div class="sidebar-footer">
          <div class="sidebar-contact">
            <a href="mailto:panoskikas@protonmail.com" class="sidebar-link sidebar-email">
              <svg class="email-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
              </svg>
              <span>panoskikas@protonmail.com</span>
            </a>
            <a href="https://github.com/PanosKikas" target="_blank" rel="noopener noreferrer" class="sidebar-link sidebar-github">
              <svg class="github-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" fill="currentColor"/>
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </nav>
    `;

    // Also apply collapsed class to wrapper if needed
    if (shouldBeCollapsed) {
      const wrapper = document.getElementById('wrapper');
      wrapper?.classList.add('sidebar-collapsed');
    }

    // Initialize sidebar functionality after render
    this.initSidebarToggle();
  }

  initSidebarToggle() {
    const menuToggle = this.querySelector('#menuToggle');
    const sidebar = this.querySelector('.retro-sidebar');
    const overlay = this.querySelector('#sidebarOverlay');
    const collapseBtn = this.querySelector('#sidebarCollapseBtn');
    const wrapper = document.getElementById('wrapper');

    // Function to collapse sidebar (saveState=true by default, false when restoring)
    const collapseSidebar = (saveState = true) => {
      sidebar.classList.add('collapsed');
      wrapper?.classList.add('sidebar-collapsed');
      menuToggle?.classList.add('visible');
      if (saveState) {
        localStorage.setItem('sidebarCollapsed', 'true');
      }
    };

    // Function to expand sidebar (saveState=true by default, false when restoring)
    const expandSidebar = (saveState = true) => {
      sidebar.classList.remove('collapsed');
      wrapper?.classList.remove('sidebar-collapsed');
      menuToggle?.classList.remove('visible');
      menuToggle?.classList.remove('active');
      if (saveState) {
        localStorage.setItem('sidebarCollapsed', 'false');
      }
    };

    // Collapse button click
    collapseBtn?.addEventListener('click', collapseSidebar);

    // Hamburger button click
    menuToggle?.addEventListener('click', () => {
      if (window.innerWidth > 1024 && sidebar.classList.contains('collapsed')) {
        // Desktop: expand the sidebar
        expandSidebar();
      } else {
        // Mobile: toggle open/close
        sidebar.classList.toggle('open');
        overlay?.classList.toggle('active');
        menuToggle.classList.toggle('active');
      }
    });

    // Overlay click closes sidebar
    overlay?.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
      menuToggle?.classList.remove('active');
    });

    // Close menu when clicking a link on mobile
    const menuLinks = this.querySelectorAll('.retro-menu-item');
    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 1024) {
          sidebar.classList.remove('open');
          overlay?.classList.remove('active');
          menuToggle?.classList.remove('active');
        }
      });
    });

    // Fallback: Re-check and apply state after DOM is fully ready
    // This handles edge cases where the initial render didn't apply correctly
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.ensureCorrectState());
    } else {
      // DOM already loaded, run on next frame to ensure styles are applied
      requestAnimationFrame(() => this.ensureCorrectState());
    }
  }

  // Ensure the sidebar state matches localStorage
  ensureCorrectState() {
    const storedState = localStorage.getItem('sidebarCollapsed');
    const shouldBeCollapsed = storedState === 'true';
    const sidebar = this.querySelector('.retro-sidebar');
    const menuToggle = this.querySelector('#menuToggle');
    const wrapper = document.getElementById('wrapper');
    
    // Only apply on desktop
    if (window.innerWidth <= 1024) return;
    
    const isCurrentlyCollapsed = sidebar?.classList.contains('collapsed');
    
    if (shouldBeCollapsed && !isCurrentlyCollapsed) {
      sidebar?.classList.add('collapsed');
      wrapper?.classList.add('sidebar-collapsed');
      menuToggle?.classList.add('visible');
    } else if (!shouldBeCollapsed && isCurrentlyCollapsed) {
      sidebar?.classList.remove('collapsed');
      wrapper?.classList.remove('sidebar-collapsed');
      menuToggle?.classList.remove('visible');
    }
  }
}

// Register the custom element
customElements.define('sidebar-nav', SidebarNav);

// Additional fallback: Check state when window loads (catches late-loading scenarios)
window.addEventListener('load', () => {
  const sidebarNav = document.querySelector('sidebar-nav');
  if (sidebarNav && typeof sidebarNav.ensureCorrectState === 'function') {
    sidebarNav.ensureCorrectState();
  }
});

