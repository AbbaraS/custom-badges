import type { BadgeDefinition } from '../../models/BadgeDefinition';
import type { BadgesSettings } from '../../models/BadgesSettings';
import { resolvePlaceholder } from '../../models/placeholder';
import { buildBadge } from '../../render/buildBadge';

// Draws a badge as it looks in a note, with the syntax "Insert badge" types next to it.
export function renderBadgePreview(el: HTMLElement, badge: BadgeDefinition, settings: BadgesSettings): HTMLElement {
	el.empty();
	const key = badge.key.trim().toLowerCase() || 'badge';
	const title = badge.label.trim() || badge.key || 'Badge';
	const wrap = el.createDiv({ cls: 'badge-setting-preview' });
	wrap.appendChild(buildBadge(`[!!${key}:${title}]`, badge));
	wrap.createEl('code', { cls: 'badge-setting-syntax', text: `\`[!!${key}:${resolvePlaceholder(badge, settings)}]\`` });
	return wrap;
}
