import type { BadgeDefinition } from './BadgeDefinition';
import { normaliseBadge } from './normaliseBadge';
import { definedOnly } from '../utils/definedOnly';

// Swap every badge owned by `pluginId` for `incoming`, tagged with that plugin.
// Fields a plugin doesn't send (e.g. font size set in our editor) keep their saved value.
// Your own and default badges are left alone. Pure: returns a new list.
export function replacePluginBadges(
	badges: BadgeDefinition[], pluginId: string, incoming: Partial<BadgeDefinition>[],
): BadgeDefinition[] {
	const previous = new Map(badges.filter((b) => b.source === pluginId).map((b) => [b.key, b]));
	const kept = badges.filter((b) => b.source !== pluginId);
	const added = incoming
		.map((raw) => {
			const prev = previous.get((raw.key ?? '').trim().toLowerCase());
			return normaliseBadge({ ...prev, ...definedOnly(raw), source: pluginId });
		})
		.filter((b) => b.key);
	return [...kept, ...added];
}
