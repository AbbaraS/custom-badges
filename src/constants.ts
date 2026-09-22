// What the "Insert badge" command puts in the badge when nothing is selected.
// A text selection always wins over these.
export type PlaceholderMode = 'selection' | 'label' | 'custom';

export interface BadgeDefinition {
  key: string;         // what you type: [!!key:...]
  label: string;       // default display text for shorthand [!!key]
  icon: string;        // Lucide icon name, see https://lucide.dev/icons/
  color: string;       // e.g. "#e5534b", "144,144,144" or "var(--color-red-rgb)"; empty = default
  placeholder: 'default' | PlaceholderMode; // 'default' = use the global setting
  placeholderText: string;                  // used when placeholder is 'custom'
}

export const LUCIDE_ICONS_URL = 'https://lucide.dev/icons/';

// Badges every new install starts with. They are copied into settings on first
// load, after which users can edit or delete them like any other badge.
export const DEFAULT_BADGES: readonly BadgeDefinition[] = [
  { key: 'note',    label: 'Note',    icon: 'pencil',         color: '#87b0f9',   placeholder: 'default', placeholderText: '' },
  { key: 'info',    label: 'Info',    icon: 'info',           color: '#87b0f9',   placeholder: 'default', placeholderText: '' },
  { key: 'success', label: 'Success', icon: 'check',          color: '#4caf50',  placeholder: 'default', placeholderText: '' },
  { key: 'warning', label: 'Warning', icon: 'alert-triangle', color: '#ff9800', placeholder: 'default', placeholderText: '' },
  { key: 'error',   label: 'Error',   icon: 'zap',            color: '#f44336',    placeholder: 'default', placeholderText: '' },
];
