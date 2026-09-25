import type { BadgeDefinition } from './BadgeDefinition';
import { normaliseBadge } from './normaliseBadge';

// Swap every badge owned by `pluginId` for `incoming`, tagged with that plugin.
// Your own and default badges are left alone. Pure: returns a new list.
export function replacePluginBadges(
	badges: BadgeDefinition[], pluginId: string, incoming: Partial<BadgeDefinition>[],
): BadgeDefinition[] {
	const kept = badges.filter((b) => b.source !== pluginId);
	const added = incoming.map((raw) => normaliseBadge({ ...raw, source: pluginId })).filter((b) => b.key);
	return [...kept, ...added];
}
