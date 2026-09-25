import type { BadgeDefinition } from '../models/BadgeDefinition';

export const LUCIDE_ICONS_URL = 'https://lucide.dev/icons/';

// Shared empty style/placeholder fields, so the list below stays short.
const base = {
	prefixIcon: '', prefixLabel: '', textColor: '', backgroundColor: '', borderRadius: null, fontSize: null,
	placeholder: 'default', placeholderText: '', source: '',
} as const;

// Badges every new install starts with. They are copied into settings on first
// load, after which users can edit or delete them like any other badge.
export const DEFAULT_BADGES: readonly BadgeDefinition[] = [
	{ ...base, key: 'note',    label: 'Note',    icon: 'pencil',         color: '#87b0f9' },
	{ ...base, key: 'info',    label: 'Info',    icon: 'info',           color: '#87b0f9' },
	{ ...base, key: 'success', label: 'Success', icon: 'check',          color: '#4caf50' },
	{ ...base, key: 'warning', label: 'Warning', icon: 'alert-triangle', color: '#ff9800' },
	{ ...base, key: 'error',   label: 'Error',   icon: 'zap',            color: '#f44336' },
];

// Fresh, editable copies of the defaults.
export const copyDefaultBadges = (): BadgeDefinition[] => DEFAULT_BADGES.map((b) => structuredClone(b));
