import type { BadgeDefinition } from './BadgeDefinition';

// key -> badge, rebuilt whenever settings change. Read by the renderer, which
// runs outside the plugin instance. If two badges share a key, the first wins.
let index = new Map<string, BadgeDefinition>();
// Bumped on every rebuild so live-preview widgets know to redraw.
let version = 0;

export function refreshBadgeIndex(badges: BadgeDefinition[]): void {
	index = new Map();
	for (const b of badges) {
		const key = b.key.trim().toLowerCase();
		if (key && !index.has(key)) index.set(key, b);
	}
	version++;
}

// Badge for a key, or undefined when none is defined.
export const getBadge = (key: string) => index.get(key.trim().toLowerCase());

// All usable badges, first-wins order.
export const allBadges = () => [...index.values()];

export const badgeIndexVersion = () => version;
