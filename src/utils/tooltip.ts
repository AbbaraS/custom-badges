import type { ExtraButtonComponent } from 'obsidian';

// Hover label for an icon button (setTooltip needs Obsidian 1.1+, minAppVersion is 1.0).
export function tooltip(btn: ExtraButtonComponent, text: string): ExtraButtonComponent {
	btn.extraSettingsEl.setAttribute('aria-label', text);
	return btn;
}
