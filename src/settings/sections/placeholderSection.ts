import { Setting } from 'obsidian';
import type { PlaceholderMode } from '../../models/BadgeDefinition';
import { PLACEHOLDER_OPTIONS } from '../../models/placeholder';
import type { SettingsContext } from '../context';

// "Inserting badges": the global placeholder used by the Insert badge command.
export function placeholderSection(el: HTMLElement, ctx: SettingsContext): void {
	const settings = ctx.plugin.settings;
	new Setting(el).setName('Inserting badges').setHeading();
	new Setting(el)
		.setName('Default placeholder')
		.setDesc('Placeholder with no text selection. Selected text is always used.')
		.addDropdown((dd) => dd
			.addOptions(PLACEHOLDER_OPTIONS)
			.setValue(settings.placeholderMode)
			.onChange(async (value) => {
				settings.placeholderMode = value as PlaceholderMode;
				await ctx.saveAndRedraw(); // show/hide the custom text field
			}));
	if (settings.placeholderMode !== 'custom') return;
	new Setting(el)
		.setName('Default custom text')
		.setDesc('Avoid ":" and "|" - used as separators in syntax.')
		.addText((text) => text
			.setPlaceholder('Text')
			.setValue(settings.customPlaceholder)
			.onChange((value) => {
				settings.customPlaceholder = value;
				ctx.save();
			}));
}
