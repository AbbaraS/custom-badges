import type { BadgesSettings } from '../models/BadgesSettings';

// Settings other than the badge list, for a fresh install.
export const DEFAULT_SETTINGS: Omit<BadgesSettings, 'badges'> = {
	placeholderMode: 'selection',
	customPlaceholder: 'text',
};

// Style slider ranges, and the value each shows while set to "default".
export const RADIUS_RANGE = { min: 0, max: 20, step: 1, fallback: 4 };        // px
export const FONT_SIZE_RANGE = { min: 0.5, max: 2, step: 0.05, fallback: 0.8 }; // em
