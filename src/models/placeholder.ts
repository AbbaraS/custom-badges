import type { BadgeDefinition, PlaceholderMode } from './BadgeDefinition';
import type { BadgesSettings } from './BadgesSettings';

// Dropdown labels for each placeholder mode.
export const PLACEHOLDER_OPTIONS: Record<PlaceholderMode, string> = {
	selection: 'Empty',
	label: 'Label',
	custom: 'Custom text',
};

// Which placeholder mode applies to a badge: its own choice, or the global default.
export function resolvePlaceholderMode(badge: BadgeDefinition, settings: BadgesSettings): PlaceholderMode {
	return badge.placeholder === 'default' ? settings.placeholderMode : badge.placeholder;
}

// Text "Insert badge" puts in the badge, flattened to one line.
export function resolvePlaceholder(badge: BadgeDefinition, settings: BadgesSettings): string {
	const useDefault = badge.placeholder === 'default';
	const mode = resolvePlaceholderMode(badge, settings);
	let text = '';
	if (mode === 'label') {
		text = badge.label.trim() || badge.key;
	} else if (mode === 'custom') {
		text = useDefault ? settings.customPlaceholder : badge.placeholderText;
	}
	return text.replace(/\s*\n\s*/g, '').trim();
}
