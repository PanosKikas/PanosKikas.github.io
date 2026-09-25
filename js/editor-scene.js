/**
 * Editor scene interactions for the index hero:
 * - Corner handles scale the selected object (like a 2D rect tool)
 * - In 3D view, dragging turns the selected object in place (eased);
 *   the camera, floor grid and axis gizmo stay put
 * - The "I specialize in" enum field cycles its value; Play / Pause / Step
 *   in the toolbar drive it through the window.*Typing hooks index.js calls
 * - The FPS readout shows the page's real frame rate; draw calls and ping
 *   drift like a running scene; all three freeze on pause
 * - Switching Scene/Game view replays a short settle transition
 */
(function() {
	const MIN_SCALE = 0.6;
	const MAX_SCALE = 1.8;
	// Desktop renders the object at ~1.06x by default (see .hero-object zoom in
	// editor-theme.css); the readout and handles work relative to that size.
	const DESKTOP_BASE_SCALE = 1.0584; // 1.08 x 0.98
	const desktopQuery = window.matchMedia('(min-width: 769px)');
	const baseScale = () => desktopQuery.matches ? DESKTOP_BASE_SCALE : 1;
	const TILT_LIMIT_Y = 35; // steeper angles show GPU rendering artifacts in some browsers
	const TILT_LIMIT_X = 20;
	// Fixed 3D view used for the axis gizmo: turned slightly, like Unity's default
	// 3D view, so Z doesn't point straight at the viewer and collapse onto Y
	const GIZMO_YAW = -35;
	const GIZMO_PITCH = 20;

	const FOCUS_VALUES = ['Systems Design', 'Unity Engine', 'Unreal Engine', 'SOLID Principles'];
	const FOCUS_INTERVAL = 2600;

	function init() {
		const hero = document.querySelector('.hero-section');
		const box = document.querySelector('.hero-text');
		const object = document.querySelector('.hero-object');
		const readout = document.querySelector('.sel-readout');
		const gizmo = document.querySelector('.coordinate-axis');
		const rotateHint = document.querySelector('.orbit-hint');
		if (!hero || !box || !object) return;

		const is3D = () => hero.classList.contains('view-3d');
		const isGameView = () => hero.classList.contains('game-view');
		const isPaused = () => hero.classList.contains('paused');
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		// ---------- Scaling ----------

		let scale = 1;

		// Keep clear of the stats overlay (sides) and the toolbar / scroll hint (top, bottom)
		function fitsInScene() {
			if (window.innerWidth <= 768) return box.offsetWidth <= hero.clientWidth - 24;
			return box.offsetWidth <= hero.clientWidth - 2 * 190 &&
				box.offsetHeight <= hero.clientHeight - 36 - 2 * 70;
		}

		function setScale(next) {
			const previous = scale;
			scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
			object.style.zoom = scale * baseScale();
			// Don't let the object grow past the viewport frame
			if (scale > previous && !fitsInScene()) {
				scale = previous;
				object.style.zoom = scale * baseScale();
			}
			if (readout) readout.textContent = 'Scale ' + scale.toFixed(2) + '×';
		}

		box.querySelectorAll('.sel-handle').forEach(handle => {
			handle.addEventListener('pointerdown', e => {
				if (isGameView()) return;
				e.preventDefault();
				e.stopPropagation();
				handle.setPointerCapture(e.pointerId);

				const rect = box.getBoundingClientRect();
				const cx = rect.left + rect.width / 2;
				const cy = rect.top + rect.height / 2;
				const startDistance = Math.max(1, Math.hypot(e.clientX - cx, e.clientY - cy));
				const startScale = scale;
				box.classList.add('scaling');
				setScale(scale);

				function onMove(ev) {
					const distance = Math.hypot(ev.clientX - cx, ev.clientY - cy);
					setScale(startScale * distance / startDistance);
				}
				function onUp() {
					box.classList.remove('scaling');
					handle.removeEventListener('pointermove', onMove);
					handle.removeEventListener('pointerup', onUp);
					handle.removeEventListener('pointercancel', onUp);
				}
				handle.addEventListener('pointermove', onMove);
				handle.addEventListener('pointerup', onUp);
				handle.addEventListener('pointercancel', onUp);
			});

			// Double-click a handle to reset the scale
			handle.addEventListener('dblclick', () => setScale(1));
		});

		// ---------- Object rotation (3D) ----------

		// The drag sets a target; each frame the object eases toward it
		let rotY = 0, rotX = 0;
		let targetY = 0, targetX = 0;
		let easing = false;

		function applyRotation() {
			hero.style.setProperty('--rot-y', rotY.toFixed(2) + 'deg');
			hero.style.setProperty('--rot-x', rotX.toFixed(2) + 'deg');
		}

		function easeRotation() {
			rotY += (targetY - rotY) * 0.2;
			rotX += (targetX - rotX) * 0.2;
			const settled = Math.abs(targetY - rotY) < 0.05 && Math.abs(targetX - rotX) < 0.05;
			if (settled) {
				rotY = targetY;
				rotX = targetX;
			}
			applyRotation();
			easing = !settled;
			hero.classList.toggle('rotating', easing);
			if (easing) requestAnimationFrame(easeRotation);
		}

		function setRotationTarget(y, x) {
			targetY = Math.max(-TILT_LIMIT_Y, Math.min(TILT_LIMIT_Y, y));
			targetX = Math.max(-TILT_LIMIT_X, Math.min(TILT_LIMIT_X, x));
			if (!easing) {
				easing = true;
				hero.classList.add('rotating');
				requestAnimationFrame(easeRotation);
			}
		}

		const ignoreDrag = 'a, button, .sel-handle, .viewport-toolbar, .scroll-indicator';

		hero.addEventListener('pointerdown', e => {
			if (!is3D() || isGameView() || e.button !== 0 || e.target.closest(ignoreDrag)) return;
			e.preventDefault();
			let lastX = e.clientX;
			let lastY = e.clientY;
			hero.classList.add('dragging');
			if (rotateHint) rotateHint.classList.add('used');

			function onMove(ev) {
				setRotationTarget(targetY + (ev.clientX - lastX) * 0.3, targetX - (ev.clientY - lastY) * 0.15);
				lastX = ev.clientX;
				lastY = ev.clientY;
			}
			function onUp() {
				hero.classList.remove('dragging');
				window.removeEventListener('pointermove', onMove);
				window.removeEventListener('pointerup', onUp);
			}
			window.addEventListener('pointermove', onMove);
			window.addEventListener('pointerup', onUp);
		});

		// Double-click the scene in 3D to reset the rotation
		hero.addEventListener('dblclick', e => {
			if (!is3D() || e.target.closest(ignoreDrag)) return;
			setRotationTarget(0, 0);
		});

		// ---------- Axis gizmo ----------

		const AXES = [
			{ name: 'X', color: 'rgba(255, 100, 120, 0.9)', vec: [1, 0, 0] },
			{ name: 'Y', color: 'rgba(120, 255, 150, 0.9)', vec: [0, 1, 0] },
			{ name: 'Z', color: 'rgba(100, 150, 255, 0.9)', vec: [0, 0, 1], cls: 'z-axis' }
		];

		function drawGizmo() {
			if (!gizmo) return;
			// 2D looks straight down Z; 3D uses the fixed gizmo view
			const toRad = Math.PI / 180;
			const psi = is3D() ? GIZMO_YAW * toRad : 0;
			const phi = is3D() ? GIZMO_PITCH * toRad : 0;
			const c = 45;
			const len = 25;

			const projected = AXES.map(axis => {
				const [x, y, z] = axis.vec;
				// Yaw around Y, then pitch around X
				const x1 = x * Math.cos(psi) + z * Math.sin(psi);
				const z1 = -x * Math.sin(psi) + z * Math.cos(psi);
				const sy = -(y * Math.cos(phi) - z1 * Math.sin(phi));
				const depth = y * Math.sin(phi) + z1 * Math.cos(phi);
				return { ...axis, sx: x1, sy, depth };
			}).sort((a, b) => a.depth - b.depth); // draw far axes first

			gizmo.innerHTML = projected.map(a => {
				const x2 = c + a.sx * len;
				const y2 = c + a.sy * len;
				const lx = c + a.sx * (len + 9);
				const ly = c + a.sy * (len + 9) + 4;
				const cls = a.cls ? ` class="${a.cls}"` : '';
				return `<g${cls}>` +
					`<line x1="${c}" y1="${c}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${a.color}" stroke-width="2.5" stroke-linecap="round"/>` +
					`<circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="2.5" fill="${a.color}"/>` +
					`<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" fill="${a.color}" font-size="11" font-family="'Inter', sans-serif" font-weight="600" text-anchor="middle">${a.name}</text>` +
					`</g>`;
			}).join('') + `<circle cx="${c}" cy="${c}" r="3" fill="rgba(255, 255, 255, 0.6)"/>`;
		}

		// index.js switches between 2D and 3D; entering 3D starts unrotated
		let was3D = is3D();
		new MutationObserver(() => {
			const now3D = is3D();
			if (now3D !== was3D) {
				rotY = targetY = 0;
				rotX = targetX = 0;
				applyRotation();
				drawGizmo();
			}
			was3D = now3D;
		}).observe(hero, { attributes: true, attributeFilter: ['class'] });

		applyRotation();
		drawGizmo();

		// ---------- Keyboard shortcuts ----------

		const shortcutsBtn = document.querySelector('.shortcuts-btn');
		const shortcutsPanel = document.getElementById('shortcutsPanel');

		function toggleShortcuts(open) {
			if (!shortcutsPanel) return;
			const show = open ?? shortcutsPanel.hidden;
			shortcutsPanel.hidden = !show;
			shortcutsBtn?.setAttribute('aria-expanded', String(show));
		}
		shortcutsBtn?.addEventListener('click', e => {
			e.stopPropagation();
			toggleShortcuts();
		});
		document.addEventListener('click', e => {
			if (shortcutsPanel && !shortcutsPanel.hidden && !shortcutsPanel.contains(e.target)) toggleShortcuts(false);
		});

		const click = selector => document.querySelector(selector)?.click();
		const tabs = () => document.querySelectorAll('.viewport-tab');
		const views = () => document.querySelectorAll('.gizmo-toggle');

		const SHORTCUTS = {
			p: () => (isPaused() ? click('.play-btn') : click('.pause-btn')),
			n: () => click('.step-btn'),
			g: () => tabs()[isGameView() ? 0 : 1]?.click(),
			'2': () => views()[0]?.click(),
			'3': () => views()[1]?.click(),
			f: () => { setScale(1); setRotationTarget(0, 0); },
			'?': () => toggleShortcuts()
		};

		document.addEventListener('keydown', e => {
			if (e.ctrlKey || e.metaKey || e.altKey) return;
			if (e.target.closest('input, textarea, select, [contenteditable]')) return;
			if (document.body.classList.contains('palette-open')) return;
			if (e.key === 'Escape') return toggleShortcuts(false);
			const action = SHORTCUTS[e.key.toLowerCase()];
			if (!action) return;
			e.preventDefault();
			action();
		});

		// ---------- "I specialize in" enum field ----------

		const track = document.querySelector('.focus-track');
		if (track) {
			let index = 0;
			let timer = null;
			let paused = false;
			let current = track.querySelector('.focus-value');
			const chevron = document.querySelector('.focus-chevron');

			const fitTrack = el => { track.style.width = el.offsetWidth + 'px'; };
			fitTrack(current);

			function showValue(next) {
				index = (next + FOCUS_VALUES.length) % FOCUS_VALUES.length;
				const incoming = document.createElement('span');
				incoming.className = 'focus-value entering';
				incoming.textContent = FOCUS_VALUES[index];
				track.appendChild(incoming);
				fitTrack(incoming);

				// The chevron gives a small "click", as if the next option was selected
				if (chevron) {
					chevron.classList.remove('nudge');
					void chevron.offsetWidth;
					chevron.classList.add('nudge');
				}

				const outgoing = current;
				outgoing.classList.add('leaving');
				// Next frame: let the transition run from the start positions
				requestAnimationFrame(() => requestAnimationFrame(() => incoming.classList.remove('entering')));
				setTimeout(() => outgoing.remove(), reduceMotion ? 0 : 450);
				current = incoming;
			}

			function schedule() {
				clearTimeout(timer);
				if (!paused) timer = setTimeout(() => { showValue(index + 1); schedule(); }, FOCUS_INTERVAL);
			}

			// Hooks called by index.js from the toolbar's Play / Pause / Step buttons
			window.pauseTyping = () => { paused = true; clearTimeout(timer); };
			window.resumeTyping = () => { paused = false; schedule(); };
			window.stepTyping = () => { if (paused) showValue(index + 1); };

			window.addEventListener('resize', () => fitTrack(current));
			schedule();
		}

		// ---------- Live FPS readout ----------

		const fpsValue = document.querySelector('.viewport-stats .stat-row .stat-val');
		if (fpsValue) {
			let frames = 0;
			let last = performance.now();
			(function tick(now) {
				frames++;
				if (now - last >= 500) {
					if (!isPaused()) {
						const fps = frames * 1000 / (now - last);
						fpsValue.textContent = fps.toFixed(2) + ' (' + (1000 / fps).toFixed(2) + 'ms)';
					}
					frames = 0;
					last = now;
				}
				requestAnimationFrame(tick);
			})(last);
		}

		// Draw calls and ping drift within a plausible range while playing
		const statVals = document.querySelectorAll('.viewport-stats .stat-row .stat-val');
		const drawCallsValue = statVals[1];
		const pingValue = statVals[2];
		if (drawCallsValue && pingValue) {
			let drawCalls = 356;
			let ping = 48;
			const drift = (value, step, min, max) =>
				Math.min(max, Math.max(min, value + Math.round((Math.random() * 2 - 1) * step)));
			setInterval(() => {
				if (isPaused() || document.hidden) return;
				drawCalls = drift(drawCalls, 4, 342, 368);
				ping = drift(ping, 2, 41, 56);
				drawCallsValue.textContent = drawCalls;
				pingValue.textContent = ping + 'ms';
			}, 900);
		}

		// ---------- Scene / Game switch ----------

		// Replay a short settle animation whenever the view mode changes
		let wasGame = isGameView();
		new MutationObserver(() => {
			const nowGame = isGameView();
			if (nowGame === wasGame) return;
			wasGame = nowGame;
			hero.classList.remove('view-switching');
			void hero.offsetWidth; // restart the animation
			hero.classList.add('view-switching');
		}).observe(hero, { attributes: true, attributeFilter: ['class'] });
		hero.addEventListener('animationend', e => {
			if (e.animationName === 'viewSettle') hero.classList.remove('view-switching');
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
