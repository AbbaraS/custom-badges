import type { BadgeDefinition, PlaceholderMode } from './BadgeDefinition';

// Everything saved in data.json.
export interface BadgesSettings {
	badges: BadgeDefinition[];
	placeholderMode: PlaceholderMode;
	customPlaceholder: string;
}
