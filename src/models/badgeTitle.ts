import type { BadgeDefinition } from './BadgeDefinition';

// Text a badge shows on its own ([!!key], settings, picker): its label.
// No label = icon only; the key is used only when there's no icon either, so the badge isn't blank.
export function badgeTitle(def: BadgeDefinition): string {
	return def.label.trim() || (def.icon.trim() ? '' : def.key);
}
