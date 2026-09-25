import type { BadgeDefinition } from '../models/BadgeDefinition';
import { cssColor, rgbTriplet } from '../utils/color';

// Puts a badge's colours and sizes on its element as CSS variables read by styles.css.
export function applyBadgeStyle(el: HTMLElement, def: BadgeDefinition): void {
	const tint = rgbTriplet(def.color ?? '');
	if (tint) {
		el.addClass('inline-badge-custom-color');
		el.style.setProperty('--badge-color', tint);
	}
	const text = cssColor(def.textColor ?? '');
	if (text) el.style.setProperty('--badge-text-color', text);
	const bg = cssColor(def.backgroundColor ?? '');
	if (bg) el.style.setProperty('--badge-bg-color', bg);
	if (def.borderRadius != null) el.style.setProperty('--badge-radius', `${def.borderRadius}px`);
	if (def.fontSize != null) {
		el.addClass('inline-badge-sized'); // styles.css centres its contents instead of the fixed top padding
		el.style.setProperty('--inline-badge-font-size', `${def.fontSize}em`);
		el.style.setProperty('--badge-icon-size', `${(def.fontSize * 1.1).toFixed(3)}em`); // icon keeps pace with the text
	}
}
