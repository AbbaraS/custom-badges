// What the "Insert badge" command puts in the badge when nothing is selected.
// A text selection always wins over these.
export type PlaceholderMode = 'selection' | 'label' | 'custom';

// One badge type, as saved in data.json.
export interface BadgeDefinition {
	key: string;                  // what you type: [!!key:...]
	label: string;                // display text for the shorthand [!!key]
	icon: string;                 // Lucide icon name or an emoji
	prefixIcon: string;           // icon shown first, before a "|" divider; empty = none
	prefixLabel: string;          // text after the prefix icon, e.g. a parent group; empty = none
	color: string;                // tint: "#e5534b", "144,144,144" or "var(--color-red-rgb)"; empty = text colour
	textColor: string;            // same formats; empty = the tint
	backgroundColor: string;      // same formats; empty = a faint tint
	borderRadius: number | null;  // px; null = theme default
	fontSize: number | null;      // em; null = theme default (0.8)
	placeholder: 'default' | PlaceholderMode; // 'default' = use the global setting
	placeholderText: string;      // used when placeholder is 'custom'
	source: string;               // id of the plugin that created it; empty = made in this plugin
}
