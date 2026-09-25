import { setIcon } from 'obsidian';
import type { BadgeDefinition } from '../models/BadgeDefinition';
import { getBadge } from '../models/badgeIndex';
import { badgeTitle } from '../models/badgeTitle';
import { setBadgeIcon } from '../utils/icon';
import { capitalise } from '../utils/text';
import { applyBadgeStyle } from './applyBadgeStyle';
import { parseBadge } from './parseBadge';
import { wrapInLink } from './wrapInLink';

// Red "syntax error" placeholder.
function syntaxError(): HTMLElement {
	return createSpan({ cls: 'inline-badge-error', text: '❌ Badges syntax error' });
}

// Builds the badge element for text like "[!!note:Hello]".
// `override` styles it with an unsaved definition (settings preview) instead of the saved one.
export function buildBadge(text: string, override?: BadgeDefinition): HTMLElement {
	const parsed = parseBadge(text);
	if (!parsed) return syntaxError();
	const { type, extras, link } = parsed;
	const def = override ?? getBadge(type);

	// Shorthand [!!key]: label from settings (none = icon only), else the capitalised key ([!!bug] -> "Bug").
	let content = parsed.content;
	if (content === null) {
		if (def) content = badgeTitle(def);
		else if (type && !type.includes('|')) content = capitalise(type);
		else return syntaxError();
	}

	const el = createSpan({ cls: 'inline-badge' });
	const iconEl = el.createSpan();
	const extraEl = createSpan();
	const titleEl = createSpan({ cls: 'inline-badge-title-inner' });
	let variant: string;

	if (extras.length === 3) {
		// [!!x|icon|tooltip:title|color] — fully inline badge.
		const [title, color] = content.split('|');
		variant = 'customized';
		iconEl.addClass('inline-badge-icon');
		setBadgeIcon(iconEl, extras[1]);
		iconEl.setAttr('aria-label', extras[2]);
		content = title.trim();
		el.style.setProperty('--customize-badge-color', color?.trim() || 'currentColor');
	} else if (extras.length > 1 && /^gh[bs]>/.test(extras[1])) {
		// [!!x|ghb>type:title] — GitHub-style badge.
		variant = extras[1].startsWith('ghb>') ? 'github' : 'github-success';
		iconEl.addClass('inline-badge-icon');
		setIcon(iconEl, 'github');
		iconEl.setAttr('aria-label', 'Github');
		extraEl.addClass('gh-type');
		extraEl.setText(extras[1].split('>')[1].trim());
	} else if (extras.length > 1) {
		// [!!x|text:title] — text prefix instead of an icon.
		variant = 'text';
		iconEl.addClass('inline-badge-extra');
		iconEl.setText(extras[1].trim());
		iconEl.dataset.badgeType = extras[1].trim();
	} else {
		// [!!key:title] — icon from settings, else the key as a Lucide name.
		variant = type;
		iconEl.addClass('inline-badge-icon');
		setBadgeIcon(iconEl, def?.icon.trim() || type);
		iconEl.setAttr('aria-label', type);
	}

	el.setAttr('data-inline-badge', variant.toLowerCase());
	if (extraEl.getText()) el.appendChild(extraEl);
	titleEl.setText(content);
	el.appendChild(titleEl);
	if (def) applyBadgeStyle(el, def);
	return link ? wrapInLink(el, link) : el;
}
