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

		// Typing effect - only initialize once
		if (!window.pageInitialized.typingEffect) {
			const typingText = document.querySelector('.typing-text');
			if (typingText && !typingText.dataset.initialized) {
				const texts = ['Unity Engine', 'Systems Design', 'Unreal Engine', 'SOLID Principles'];
				const textsWithSemicolon = texts.map(text => text + ';');
				let textIndex = 0;
				let charIndex = 0;
				let isDeleting = false;
				let typingTimeout = null;
				let isPaused = false;
				let waitTimeout = null;

				function typeEffect() {
					if (!typingText || typingText.dataset.initialized !== 'true' || isPaused) return;
					
					const currentText = textsWithSemicolon[textIndex];
					
					if (isDeleting) {
						if (charIndex > 0) {
							typingText.textContent = currentText.substring(0, charIndex - 1);
							charIndex--;
						}
					} else {
						if (charIndex < currentText.length) {
							typingText.textContent = currentText.substring(0, charIndex + 1);
							charIndex++;
						}
					}

					if (!isDeleting && charIndex === currentText.length) {
						// Finished typing, wait before deleting
						waitTimeout = setTimeout(() => {
							if (!isPaused) {
								isDeleting = true;
								typeEffect();
							}
						}, 2000);
					} else if (isDeleting && charIndex === 0) {
						// Finished deleting, move to next text
						isDeleting = false;
						textIndex = (textIndex + 1) % textsWithSemicolon.length;
						const speed = 100;
						typingTimeout = setTimeout(typeEffect, speed);
					} else {
						// Continue typing or deleting
						const speed = isDeleting ? 50 : 100;
						typingTimeout = setTimeout(typeEffect, speed);
					}
				}

				// Expose pause/resume functions globally
				window.pauseTyping = function() {
					isPaused = true;
					if (typingTimeout) {
						clearTimeout(typingTimeout);
						typingTimeout = null;
					}
					if (waitTimeout) {
						clearTimeout(waitTimeout);
						waitTimeout = null;
					}
				};

				window.resumeTyping = function() {
					if (isPaused) {
						isPaused = false;
						// Ensure text is displayed at current state before continuing
						if (typingText) {
							const currentText = textsWithSemicolon[textIndex];
							typingText.textContent = currentText.substring(0, charIndex);
						}
						// Use a small delay to ensure the pause state is cleared
						// Then restart the animation
						setTimeout(() => {
							if (!isPaused) {
								typeEffect();
							}
						}, 10);
					}
				};

				window.stepTyping = function() {
					if (!typingText || typingText.dataset.initialized !== 'true') return;
					
					const currentText = textsWithSemicolon[textIndex];
					
					// Clear any pending timeouts
					if (typingTimeout) {
						clearTimeout(typingTimeout);
						typingTimeout = null;
					}
					if (waitTimeout) {
						clearTimeout(waitTimeout);
						waitTimeout = null;
					}
					
					// Step forward one character
					if (isDeleting) {
						// If deleting, step backward (delete one more character)
						if (charIndex > 0) {
							charIndex--;
							typingText.textContent = currentText.substring(0, charIndex);
						} else {
							// Finished deleting, move to next text
							isDeleting = false;
							textIndex = (textIndex + 1) % textsWithSemicolon.length;
							charIndex = 0;
							typingText.textContent = '';
						}
					} else {
						// If typing, step forward (add one more character)
						if (charIndex < currentText.length) {
							charIndex++;
							typingText.textContent = currentText.substring(0, charIndex);
						} else {
							// At end of text, start deleting on next step
							isDeleting = true;
						}
					}
				};

				typingText.dataset.initialized = 'true';
				typeEffect();
				window.pageInitialized.typingEffect = true;
			}
		}

		// Scroll animations - optimized with single observer
		if (!window.pageInitialized.scrollObserver) {
			const observerOptions = {
				threshold: 0.1,
				rootMargin: '0px 0px -50px 0px'
			};

			const observer = new IntersectionObserver((entries) => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						entry.target.classList.add('animate');
						// Unobserve after animation to improve performance
						observer.unobserve(entry.target);
					}
				});
			}, observerOptions);

			// Observe all items at once - no need for staggered timeouts
			const careerItems = document.querySelectorAll('.career-item');
			careerItems.forEach(item => {
				observer.observe(item);
			});
			
			window.pageInitialized.scrollObserver = true;
		}

		// Parallax effect for hero and header visibility - disabled on mobile for performance
		if (!window.pageInitialized.scrollHandler) {
			// Detect mobile device - only by user agent and screen size, NOT touch capability
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

	// Enhanced particle effect - only create once
	(function() {
		function createParticles() {
			// Check persistent flag
			if (window.pageInitialized.particles) {
				return;
			}
			
			const particlesContainer = document.querySelector('.particles');
			if (!particlesContainer) {
				console.warn('Particles container not found');
				return;
			}

			// Check if particles already exist or are marked as initialized
			if (particlesContainer.children.length > 0 || particlesContainer.dataset.initialized === 'true') {
				window.pageInitialized.particles = true;
				return;
			}

			// Detect mobile device - only by user agent and screen size, NOT touch capability
			// (many laptops have touchscreens but should still get particles)
			const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
			const isSmallScreen = window.innerWidth <= 768;
			const isMobile = isMobileDevice || isSmallScreen;
			
			// Reduce particles on mobile for better performance, full particles on desktop/laptop
			const particleCount = isMobile ? 0 : 45;
			
			// Batch DOM operations for better performance
			const fragment = document.createDocumentFragment();
			
			for (let i = 0; i < particleCount; i++) {
				const particle = document.createElement('div');
				const size = isMobile ? (Math.random() * 2 + 1) : (Math.random() * 3 + 1); // Smaller on mobile
				const type = Math.random();
				
				// Simpler particles on mobile - no glow/trail variants
				if (isMobile) {
					particle.className = 'particle';
				} else if (type < 0.3) {
					particle.className = 'particle particle-glow';
				} else if (type < 0.6) {
					particle.className = 'particle particle-trail';
				} else {
					particle.className = 'particle';
				}
				
				particle.style.width = size + 'px';
				particle.style.height = size + 'px';
				particle.style.left = Math.random() * 100 + '%';
				particle.style.top = Math.random() * 100 + '%';
				particle.style.animationDelay = Math.random() * 5 + 's';
				particle.style.animationDuration = isMobile ? '8s' : ((Math.random() * 4 + 3) + 's'); // Slower on mobile
				particle.style.opacity = isMobile ? (Math.random() * 0.4 + 0.3) : (Math.random() * 0.6 + 0.4);
				
				fragment.appendChild(particle);
			}
			
			// Single DOM append for better performance
			particlesContainer.appendChild(fragment);
			
			particlesContainer.dataset.initialized = 'true';
			window.pageInitialized.particles = true;
		}

		// Create particles once when DOM is ready
		createParticles();
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
				// Pause typing animation
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
				// Resume typing animation
				if (window.resumeTyping) {
					window.resumeTyping();
				}
			});
		}

		// Step button functionality
		if (stepBtn) {
			stepBtn.addEventListener('click', function() {
				// Step through typing animation one character at a time
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
