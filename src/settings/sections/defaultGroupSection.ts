import { Setting } from 'obsidian';
import type { BadgeDefinition } from '../../models/BadgeDefinition';
import { DEFAULT_BADGES } from '../../defaults/defaultBadges';
import type { SettingsContext } from '../context';
import { badgeRow } from './badgeRow';
import { groupHeading } from './groupHeading';

// Built-in badges, plus a button to bring back any that were deleted.
export function defaultGroupSection(el: HTMLElement, ctx: SettingsContext, badges: BadgeDefinition[]): void {
	groupHeading(el, 'Default', 'Built-in badges. Edit them freely; the reset button restores the original.');
	badges.forEach((b) => badgeRow(el, ctx, b));

	const all = ctx.plugin.settings.badges;
	const missing = DEFAULT_BADGES.filter((d) => !all.some((b) => !b.source && b.key === d.key));
	if (!missing.length) return;
	new Setting(el).addButton((btn) => {
		btn.setButtonText('Restore default badges').onClick(async () => {
			all.push(...missing.map((d) => structuredClone(d)));
			await ctx.saveAndRedraw();
		});
		btn.buttonEl.setAttribute('aria-label', `Adds back: ${missing.map((d) => d.key).join(', ')}`);
	});
}
