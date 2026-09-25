import type { BadgeDefinition } from '../models/BadgeDefinition';
import { setBadgeIcon } from '../utils/icon';

// Adds "[prefix icon] prefix label |" to the start of a badge, when the badge has a prefix.
export function addBadgePrefix(el: HTMLElement, def: BadgeDefinition): void {
	const icon = def.prefixIcon.trim();
	const label = def.prefixLabel.trim();
	if (!icon && !label) return;

	if (icon) setBadgeIcon(el.createSpan({ cls: 'inline-badge-icon inline-badge-prefix-icon' }), icon);
	if (label) el.createSpan({ cls: 'inline-badge-title-inner inline-badge-prefix-label', text: label });
	el.createSpan({ cls: 'inline-badge-divider', text: '|' });
}
