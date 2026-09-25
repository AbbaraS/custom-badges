import type { BadgeLink } from './parseBadge';

// Wraps a badge in an internal (wikilink) or external link.
export function wrapInLink(badge: HTMLElement, link: BadgeLink): HTMLAnchorElement {
	const anchor = createEl('a', { cls: 'badge-link', href: link.target });
	anchor.setAttr('data-tooltip-position', 'top');
	if (link.isWikilink) {
		anchor.addClass('internal-link');
		anchor.setAttr('data-href', link.target);
	} else {
		anchor.addClass('external-link');
		anchor.setAttr('target', '_blank');
		anchor.setAttr('rel', 'noopener');
		anchor.setAttr('aria-label', link.target);
	}
	anchor.appendChild(badge);
	return anchor;
}
