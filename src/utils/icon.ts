import { setIcon } from 'obsidian';

// True when the text contains an emoji (or other pictograph), not a Lucide name.
export const isEmoji = (text: string) => /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(text);

// Shows a Lucide icon or an emoji. Lucide names work with or without the
// "lucide-" prefix, so both lucide.dev names and Obsidian's legacy ids work.
export function setBadgeIcon(el: HTMLElement, name: string): void {
	const icon = name.trim();
	el.empty();
	el.removeClass('inline-badge-emoji');
	if (!icon) return;
	if (isEmoji(icon)) {
		el.addClass('inline-badge-emoji');
		el.setText(icon);
		return;
	}
	setIcon(el, icon);
	if (!el.querySelector('svg') && !icon.startsWith('lucide-')) setIcon(el, `lucide-${icon}`);
}
