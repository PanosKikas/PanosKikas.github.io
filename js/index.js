/**
 * Index page JavaScript
 * Handles hero section animations, viewport controls, and page interactions
 */

// Use window object to persist initialization state across script re-executions
if (!window.pageInitialized) {
	window.pageInitialized = {};
}

// Wait for DOM to be ready before initializing
function initIndexPage() {
	// Prevent re-initialization on resize
	(function() {
		// Smooth scrolling
		if (!window.pageInitialized.smoothScroll) {
			document.querySelectorAll('a[href^="#"]').forEach(anchor => {
				anchor.addEventListener('click', function (e) {
					e.preventDefault();
					const target = document.querySelector(this.getAttribute('href'));
					if (target) {
						target.scrollIntoView({
							behavior: 'smooth',
							block: 'start'
						});
					}
				});
			});
			window.pageInitialized.smoothScroll = true;
		}

		// Parallax effect for hero and header visibility - disabled on mobile for performance
		if (!window.pageInitialized.scrollHandler) {
			// Detect mobile device - only by user agent and screen size, NOT touch capability
			// Use 1024px threshold instead of 768px to ensure laptops get animations
			const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
			const isMobileDevice = isMobileUserAgent || window.innerWidth <= 768;
			
			// Cache DOM elements
			const headerWrapper = document.querySelector('.wrapper-holder:not(.grey)');
			const scrollIndicator = document.querySelector('.scroll-indicator');
			const hero = document.querySelector('.hero-section');
			
			// Throttle scroll handler for better performance - more aggressive throttling
			let ticking = false;
			let lastScrollY = 0;
			
			function updateOnScroll() {
				const scrolled = window.pageYOffset;
				const scrollDelta = Math.abs(scrolled - lastScrollY);
				lastScrollY = scrolled;
				
				// Skip update if scroll delta is too small (performance optimization)
				if (scrollDelta < 5 && scrolled > 100) {
					ticking = false;
					return;
				}
				
				if (hero && !isMobileDevice) {
					// Only apply parallax on desktop
					hero.style.transform = `translateY(${scrolled * 0.5}px)`;
					hero.style.opacity = 1 - (scrolled / 600);
				} else if (hero && isMobileDevice) {
					// On mobile, just handle opacity without transform for better performance
					hero.style.opacity = Math.max(0.3, 1 - (scrolled / 600));
				}
				
				// Hide scroll indicator when scrolled
				if (scrollIndicator) {
					if (scrolled > 50) {
						scrollIndicator.style.opacity = '0';
						scrollIndicator.style.pointerEvents = 'none';
					} else {
						scrollIndicator.style.opacity = '0.7';
						scrollIndicator.style.pointerEvents = 'auto';
					}
				}
				
				// Add scrolled class to header wrapper for styling
				if (headerWrapper) {
					if (scrolled > 100) {
						headerWrapper.classList.add('scrolled');
					} else {
						headerWrapper.classList.remove('scrolled');
					}
				}
				ticking = false;
			}
			
			window.addEventListener('scroll', () => {
				if (!ticking) {
					window.requestAnimationFrame(updateOnScroll);
					ticking = true;
				}
			}, { passive: true });
			
			window.pageInitialized.scrollHandler = true;
		}
		
		// Disable transitions during resize to prevent jitter - optimized
		if (!window.pageInitialized.resizeHandler) {
			let resizeTimerLocal;
			let lastWidth = window.innerWidth;
			
			window.addEventListener('resize', () => {
				const currentWidth = window.innerWidth;
				// Only trigger if width actually changed significantly
				if (Math.abs(currentWidth - lastWidth) > 10) {
					document.body.classList.add('resizing');
					clearTimeout(resizeTimerLocal);
					resizeTimerLocal = setTimeout(() => {
						document.body.classList.remove('resizing');
						lastWidth = currentWidth;
					}, 150);
				}
			}, { passive: true });
			
			window.pageInitialized.resizeHandler = true;
		}
	})();

	// Viewport pause/play functionality
	(function() {
		const pauseBtn = document.querySelector('.pause-btn');
		const playBtn = document.querySelector('.play-btn');
		const stepBtn = document.querySelector('.step-btn');
		const heroSection = document.querySelector('.hero-section');
		
		if (pauseBtn && playBtn && heroSection) {
			pauseBtn.addEventListener('click', function() {
				heroSection.classList.add('paused');
				pauseBtn.classList.add('active');
				pauseBtn.disabled = true;
				playBtn.classList.remove('active');
				playBtn.disabled = false;
				playBtn.style.pointerEvents = 'auto';
				// Freeze the "I specialize in" field (js/editor-scene.js)
				if (window.pauseTyping) {
					window.pauseTyping();
				}
			});
			
			playBtn.addEventListener('click', function() {
				heroSection.classList.remove('paused');
				playBtn.classList.add('active');
				playBtn.disabled = true;
				playBtn.style.pointerEvents = 'none';
				pauseBtn.classList.remove('active');
				pauseBtn.disabled = false;
				// Resume the "I specialize in" field
				if (window.resumeTyping) {
					window.resumeTyping();
				}
			});
		}

		// Step button functionality
		if (stepBtn) {
			stepBtn.addEventListener('click', function() {
				// Advance the "I specialize in" field by one value
				if (window.stepTyping) {
					window.stepTyping();
				}
			});
		}
	})();

	// Scene/Game view toggle functionality
	(function() {
		const viewportTabs = document.querySelectorAll('.viewport-tab');
		const heroSection = document.querySelector('.hero-section');
		
		viewportTabs.forEach(tab => {
			tab.addEventListener('click', function() {
				// Remove active from all tabs
				viewportTabs.forEach(t => t.classList.remove('active'));
				// Add active to clicked tab
				this.classList.add('active');
				
				// Toggle game view mode
				if (this.textContent === 'Game') {
					heroSection.classList.add('game-view');
				} else {
					heroSection.classList.remove('game-view');
				}
			});
		});
	})();

	// 2D/3D view toggle functionality
	(function() {
		const gizmoToggles = document.querySelectorAll('.gizmo-toggle');
		const heroSection = document.querySelector('.hero-section');
		
		gizmoToggles.forEach(toggle => {
			toggle.addEventListener('click', function() {
				// Remove active from all toggles
				gizmoToggles.forEach(t => t.classList.remove('active'));
				// Add active to clicked toggle
				this.classList.add('active');
				
				// Toggle 2D/3D view mode
				if (this.textContent === '2D') {
					heroSection.classList.add('view-2d');
					heroSection.classList.remove('view-3d');
				} else {
					heroSection.classList.add('view-3d');
					heroSection.classList.remove('view-2d');
				}
			});
		});
	})();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initIndexPage);
} else {
	// DOM already loaded
	initIndexPage();
}
