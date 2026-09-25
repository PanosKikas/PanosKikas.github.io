/**
 * Project popups on portfolio.html, using the native <dialog> element
 * (replaces jQuery + Fancybox).
 * - Each card link (href="#portfolio_N") opens a copy of that hidden .popup_portfolio
 * - Prev / next (buttons or ← →) move through the projects visible under the
 *   current filter, wrapping at the ends
 * - Esc, the close button or a click outside closes it; focus returns to the card
 * - window.openProject(id) is used by js/site.js for Search and #portfolio_N links
 */
(function() {
	const CARD_LINK = '.arcade-card-link[href^="#portfolio_"]';

	const dialog = document.createElement('dialog');
	dialog.className = 'project-dialog';
	dialog.innerHTML = `
		<button type="button" class="project-dialog-close" aria-label="Close">
			<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>
		</button>
		<button type="button" class="project-dialog-nav prev" aria-label="Previous project">
			<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M10.5 3v10L4 8z"/></svg>
		</button>
		<button type="button" class="project-dialog-nav next" aria-label="Next project">
			<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5.5 3v10L12 8z"/></svg>
		</button>
		<div class="project-dialog-body"></div>`;

	const body = dialog.querySelector('.project-dialog-body');
	let currentId = null;
	let returnFocusTo = null;

	// Cards shown under the active filter, in page order (filters hide cards with inline display:none)
	function visibleLinks() {
		return [...document.querySelectorAll(CARD_LINK)]
			.filter(link => getComputedStyle(link.closest('.arcade-card')).display !== 'none');
	}

	function render(id) {
		const source = document.getElementById(id);
		if (!source) return false;
		const copy = source.cloneNode(true);
		copy.removeAttribute('id');
		body.replaceChildren(copy);

		const title = copy.querySelector('h3');
		if (title) {
			title.id = 'project-dialog-title';
			dialog.setAttribute('aria-labelledby', title.id);
		}
		currentId = id;

		const count = visibleLinks().length;
		dialog.querySelectorAll('.project-dialog-nav').forEach(btn => { btn.hidden = count < 2; });
		copy.scrollTop = 0;
		return true;
	}

	function open(id, opener) {
		if (!render(id)) return;
		returnFocusTo = opener || document.activeElement;
		if (!dialog.open) {
			document.documentElement.classList.add('dialog-open');
			dialog.showModal();
		}
		dialog.querySelector('.project-dialog-close').focus({ preventScroll: true });
	}

	function step(direction) {
		const links = visibleLinks();
		if (links.length < 2) return;
		const ids = links.map(link => link.getAttribute('href').slice(1));
		let index = ids.indexOf(currentId);
		if (index === -1) index = 0;
		const next = ids[(index + direction + ids.length) % ids.length];
		render(next);
		// Returning focus should land on the project the visitor ended up on
		returnFocusTo = links[ids.indexOf(next)];
	}

	function close() {
		if (dialog.open) dialog.close();
	}

	dialog.addEventListener('close', () => {
		document.documentElement.classList.remove('dialog-open');
		body.replaceChildren();
		currentId = null;
		returnFocusTo?.focus?.({ preventScroll: true });
	});

	dialog.querySelector('.project-dialog-close').addEventListener('click', close);
	dialog.querySelector('.prev').addEventListener('click', () => step(-1));
	dialog.querySelector('.next').addEventListener('click', () => step(1));

	// A click on the dialog element itself (not its content) is a click on the backdrop
	dialog.addEventListener('click', e => { if (e.target === dialog) close(); });

	dialog.addEventListener('keydown', e => {
		if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
		else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
	});

	function init() {
		document.body.appendChild(dialog);
		document.addEventListener('click', e => {
			const link = e.target.closest(CARD_LINK);
			if (!link) return;
			e.preventDefault();
			open(link.getAttribute('href').slice(1), link);
		});
	}

	window.openProject = id => open(id, document.querySelector(`${CARD_LINK}[href="#${id}"]`));

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
	else init();
})();
