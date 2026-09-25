/**
 * Site-wide helpers, loaded on every page:
 * - Command palette on "/" (Ctrl/Cmd+K too where the browser allows it)
 * - "Download CV" buttons appear only when CV_PUBLISHED is true
 * - portfolio.html#portfolio_N opens that project's popup
 * - Page footer: an editor-style status bar
 * - A note for anyone who opens the DevTools console
 */
(function() {
	// Set to true once Panos_Kikas_CV.pdf is in the site root; shows the Download CV buttons
	const CV_PUBLISHED = true;
	const CV_URL = 'Panos_Kikas_CV.pdf';
	const EMAIL = 'panoskikas@protonmail.com';
	const GITHUB = 'https://github.com/PanosKikas';
	const LINKEDIN = 'https://www.linkedin.com/in/panos-kikas-36a2221b6/';

	const PAGES = [
		{ label: 'Home', hint: 'Page', href: 'index.html' },
		{ label: 'Professional Experience', hint: 'Section', href: 'index.html#career', keywords: ['career', 'experience', 'work', 'jobs', 'timeline'] },
		{ label: 'Portfolio', hint: 'Page', href: 'portfolio.html' },
		{ label: 'Skills', hint: 'Page', href: 'myskills.html' },
		{ label: 'Contact', hint: 'Page', href: 'contact.html' }
	];
	const PROJECTS = [
		{ label: 'Esports Heroes', id: 'portfolio_8' },
		{ label: 'XR Training', id: 'portfolio_6' },
		{ label: 'Dungeon Mobile', id: 'portfolio_1' },
		{ label: 'TriviYES!', id: 'portfolio_2' },
		{ label: "Monster's Lair", id: 'portfolio_4' },
		{ label: 'Ludo Mobile', id: 'portfolio_5' },
		{ label: 'Atari RL', id: 'portfolio_3' }
	];

	const onPortfolio = () => !!document.querySelector('.arcade-grid');

	// ---------- Toast ----------

	function toast(message) {
		let el = document.querySelector('.site-toast');
		if (!el) {
			el = document.createElement('div');
			el.className = 'site-toast';
			el.setAttribute('role', 'status');
			document.body.appendChild(el);
		}
		el.textContent = message;
		el.classList.add('visible');
		clearTimeout(el._timer);
		el._timer = setTimeout(() => el.classList.remove('visible'), 1800);
	}

	// ---------- Projects ----------

	// js/project-dialog.js (portfolio.html only) provides window.openProject
	function openProject(id) {
		window.openProject?.(id);
	}

	// Same-page section links scroll smoothly instead of reloading
	function goTo(href) {
		const [page, hash] = href.split('#');
		const current = location.pathname.split('/').pop() || 'index.html';
		const target = hash && page === current && document.getElementById(hash);
		if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
		else location.href = href;
	}

	// A real download (not a navigation), same as the page's Download CV buttons
	function downloadCV() {
		const link = document.createElement('a');
		link.href = CV_URL;
		link.download = 'Panos_Kikas_CV.pdf';
		document.body.appendChild(link);
		link.click();
		link.remove();
	}

	// ---------- Command palette ----------

	function commands() {
		const list = PAGES.map(p => ({ ...p, run: () => goTo(p.href) }));
		PROJECTS.forEach(p => list.push({
			label: p.label,
			hint: 'Project',
			run: () => onPortfolio() ? openProject(p.id) : (location.href = 'portfolio.html#' + p.id)
		}));
		list.push(
			{ label: 'Copy email address', hint: 'Action', run: () => {
				navigator.clipboard?.writeText(EMAIL).then(() => toast('Email copied'), () => { location.href = 'mailto:' + EMAIL; });
			} },
			{ label: 'Send an email', hint: 'Action', run: () => { location.href = 'mailto:' + EMAIL; } },
			{ label: 'Open GitHub', hint: 'Link', run: () => window.open(GITHUB, '_blank', 'noopener') },
			{ label: 'Open LinkedIn', hint: 'Link', run: () => window.open(LINKEDIN, '_blank', 'noopener') }
		);
		if (CV_PUBLISHED) list.push({ label: 'Download CV', hint: 'Action', keywords: ['resume', 'résumé', 'cv', 'download', 'pdf'], run: downloadCV });
		return list;
	}

	// Characters must appear in order ("prtf" matches "Portfolio"); earlier, tighter matches rank first
	function score(query, text) {
		if (!query) return 0;
		const q = query.toLowerCase();
		const t = text.toLowerCase();
		const direct = t.indexOf(q);
		if (direct !== -1) return direct;
		let pos = -1;
		let gaps = 0;
		for (const ch of q) {
			const next = t.indexOf(ch, pos + 1);
			if (next === -1) return null;
			gaps += next - pos - 1;
			pos = next;
		}
		return 100 + gaps;
	}

	// Label first, then keywords (e.g. "career" finds Professional Experience), then the category
	function matchScore(q, c) {
		const label = score(q, c.label);
		if (label !== null) return label;
		for (const k of c.keywords || []) {
			if (q && k.startsWith(q.toLowerCase())) return 10;
		}
		return q && c.hint.toLowerCase().startsWith(q.toLowerCase()) ? 50 : null;
	}

	let palette = null;
	let lastFocus = null;

	function buildPalette() {
		palette = document.createElement('div');
		palette.className = 'palette-backdrop';
		palette.hidden = true;
		palette.innerHTML = `
			<div class="palette" role="dialog" aria-modal="true" aria-label="Search">
				<div class="palette-search">
					<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14 14"/></svg>
					<input type="text" placeholder="Go to a page, project or action…" aria-label="Search" role="combobox" aria-expanded="true" aria-controls="paletteList" aria-autocomplete="list" autocomplete="off" spellcheck="false">
					<kbd>Esc</kbd>
				</div>
				<ul class="palette-list" id="paletteList" role="listbox"></ul>
				<div class="palette-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span><span><kbd>Enter</kbd> open</span></div>
			</div>`;
		document.body.appendChild(palette);

		const input = palette.querySelector('input');
		const listEl = palette.querySelector('.palette-list');
		let items = [];
		let active = 0;

		function render() {
			const q = input.value.trim();
			items = commands()
				.map(c => ({ ...c, s: matchScore(q, c) }))
				.filter(c => c.s !== null)
				.sort((a, b) => a.s - b.s);
			active = Math.min(active, Math.max(items.length - 1, 0));
			listEl.innerHTML = items.length
				? items.map((c, i) => `<li role="option" id="pal-${i}" class="palette-item${i === active ? ' active' : ''}" aria-selected="${i === active}" data-index="${i}"><span>${c.label}</span><span class="palette-hint">${c.hint}</span></li>`).join('')
				: '<li class="palette-empty">No matches. Try "portfolio" or "email".</li>';
			input.setAttribute('aria-activedescendant', items.length ? 'pal-' + active : '');
			listEl.querySelector('.active')?.scrollIntoView({ block: 'nearest' });
		}

		function run(index) {
			const item = items[index];
			if (!item) return;
			close();
			item.run();
		}

		input.addEventListener('input', () => { active = 0; render(); });
		input.addEventListener('keydown', e => {
			if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % Math.max(items.length, 1); render(); }
			else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + items.length) % Math.max(items.length, 1); render(); }
			else if (e.key === 'Enter') { e.preventDefault(); run(active); }
			else if (e.key === 'Escape') { e.preventDefault(); close(); }
			else if (e.key === 'Tab') e.preventDefault(); // keep focus in the dialog
		});
		listEl.addEventListener('mousemove', e => {
			const li = e.target.closest('.palette-item');
			if (li && +li.dataset.index !== active) { active = +li.dataset.index; render(); }
		});
		listEl.addEventListener('click', e => {
			const li = e.target.closest('.palette-item');
			if (li) run(+li.dataset.index);
		});
		palette.addEventListener('mousedown', e => { if (e.target === palette) close(); });

		palette._render = () => { input.value = ''; active = 0; render(); input.focus(); };
	}

	function open() {
		if (!palette) buildPalette();
		lastFocus = document.activeElement;
		palette.hidden = false;
		document.body.classList.add('palette-open');
		palette._render();
	}

	function close() {
		if (!palette || palette.hidden) return;
		palette.hidden = true;
		document.body.classList.remove('palette-open');
		lastFocus?.focus?.();
	}

	// "/" is the primary shortcut: Firefox-based browsers (Zen) keep Ctrl+K for their own search bar
	document.addEventListener('keydown', e => {
		const typing = e.target.closest?.('input, textarea, select, [contenteditable]');
		const slash = e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !typing;
		const ctrlK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k';
		if (!slash && !ctrlK) return;
		e.preventDefault();
		palette && !palette.hidden ? close() : open();
	});
	document.addEventListener('click', e => {
		if (e.target.closest('[data-open-palette]')) { e.preventDefault(); open(); }
	});

	// ---------- Footer ----------

	function buildFooter() {
		const host = document.querySelector('#wrapper .wrapper-holder.grey');
		if (!host || host.querySelector('.site-footer')) return;
		const footer = document.createElement('footer');
		footer.className = 'site-footer';
		footer.innerHTML = `
			<div class="status-bar">
				<span class="status-ready"><span class="build-status">Building…</span></span>
				<nav class="status-links" aria-label="Elsewhere">
					<a href="${GITHUB}" target="_blank" rel="noopener noreferrer">GitHub</a>
					<a href="${LINKEDIN}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
					<a href="mailto:${EMAIL}">Email</a>
				</nav>
			</div>`;
		host.appendChild(footer);
		reportBuild(footer.querySelector('.build-status'));
	}

	// Mirrors Visual Studio's build output line: "Build completed at 9:41 AM and took 1.24 seconds"
	function reportBuild(el) {
		if (!el) return;
		const show = () => {
			const nav = performance.getEntriesByType('navigation')[0];
			const ms = nav && nav.loadEventEnd > 0 ? nav.loadEventEnd : performance.now();
			const at = new Date(performance.timeOrigin + ms)
				.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
			el.textContent = `Build completed at ${at} and took ${(ms / 1000).toFixed(2)} seconds`;
		};
		// loadEventEnd is only filled in once the load handlers have finished
		if (document.readyState === 'complete') setTimeout(show, 0);
		else window.addEventListener('load', () => setTimeout(show, 0), { once: true });
	}

	// ---------- Init ----------

	// Phones: the floating menu button slides away while scrolling down (so it
	// doesn't sit on top of content) and returns on any scroll up
	function autoHideMenuButton() {
		const narrow = window.matchMedia('(max-width: 768px)');
		let lastY = window.scrollY;
		let queued = false;
		window.addEventListener('scroll', () => {
			if (queued) return;
			queued = true;
			requestAnimationFrame(() => {
				queued = false;
				const button = document.getElementById('menuToggle');
				const y = window.scrollY;
				const hide = narrow.matches && y > 120 && y > lastY + 4 && !button?.classList.contains('active');
				const show = y < lastY - 4 || y <= 120;
				if (hide) document.body.classList.add('menu-button-hidden');
				else if (show) document.body.classList.remove('menu-button-hidden');
				lastY = y;
			});
		}, { passive: true });
	}

	function init() {
		buildFooter();
		autoHideMenuButton();
		if (CV_PUBLISHED) document.querySelectorAll('[data-cv]').forEach(el => { el.hidden = false; });

		// portfolio.html#portfolio_N opens that project
		if (onPortfolio() && /^#portfolio_\d+$/.test(location.hash)) {
			window.addEventListener('load', () => setTimeout(() => openProject(location.hash.slice(1)), 150));
		}
	}

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
	else init();

	// ---------- Console ----------

	const scene = (document.title.split(' - ').pop() || 'Home').replace(/\W+/g, '');
	console.log(
		'%c▶ ' + (scene === 'Home' ? 'Portfolio_Home' : scene) + 'Scene %c loaded',
		'background:#6c7fe8;color:#fff;padding:3px 8px;border-radius:3px 0 0 3px;font:600 12px Inter,sans-serif',
		'background:#292e42;color:#c9cee8;padding:3px 8px;border-radius:0 3px 3px 0;font:12px Inter,sans-serif'
	);
	console.log(
		"%cHey, you opened the console. I'm Panos, a game developer and Systems Designer at Rockstar Games.\n" +
		'This site is hand-built HTML, CSS and vanilla JS, with no framework.\n\n' +
		'Source:  https://github.com/PanosKikas/PanosKikas.github.io\n' +
		'Email:   ' + EMAIL + '\n\n' +
		'Tip: press / to jump to any page or project.',
		'color:#a9b1d6;font:13px/1.6 "JetBrains Mono",monospace'
	);
})();
