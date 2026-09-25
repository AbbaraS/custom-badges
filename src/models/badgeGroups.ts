import type { BadgeDefinition } from './BadgeDefinition';
import { DEFAULT_BADGES } from '../defaults/defaultBadges';

// The built-in badge with this badge's key, if any (plugin badges never count).
export function findDefaultBadge(badge: BadgeDefinition): BadgeDefinition | undefined {
	if (badge.source) return undefined;
	return DEFAULT_BADGES.find((d) => d.key === badge.key.trim().toLowerCase());
}

// True while every field still equals the built-in value.
export function matchesDefault(badge: BadgeDefinition, def: BadgeDefinition): boolean {
	return (Object.keys(def) as (keyof BadgeDefinition)[]).every((k) => badge[k] === def[k]);
}

// Badges split the way the settings list shows them.
export interface BadgeGroups {
	defaults: BadgeDefinition[];
	plugins: Map<string, BadgeDefinition[]>; // plugin id -> its badges
	user: BadgeDefinition[];
}

export function groupBadges(badges: BadgeDefinition[]): BadgeGroups {
	const groups: BadgeGroups = { defaults: [], plugins: new Map(), user: [] };
	for (const b of badges) {
		if (b.source) {
			const list = groups.plugins.get(b.source) ?? [];
			list.push(b);
			groups.plugins.set(b.source, list);
		} else if (findDefaultBadge(b)) {
			groups.defaults.push(b);
		} else {
			groups.user.push(b);
		}
	}
	return groups;
}

// Saved order: yours, then plugin badges, then defaults. The first badge with a
// key wins, so your own badges override everything else.
function sortRank(badge: BadgeDefinition): number {
	if (badge.source) return 1;
	const def = findDefaultBadge(badge);
	return def ? 2 + DEFAULT_BADGES.indexOf(def) : 0;
}

// Stable sort in place, so order inside each group is kept.
export function sortBadges(badges: BadgeDefinition[]): void {
	const ranked = badges.map((b, i) => ({ b, i, r: sortRank(b) }));
	ranked.sort((x, y) => x.r - y.r || x.i - y.i);
	ranked.forEach((x, i) => (badges[i] = x.b));
}
