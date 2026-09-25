import { Setting } from 'obsidian';
import type { BadgeDefinition } from '../../models/BadgeDefinition';
import type { BadgesSettings } from '../../models/BadgesSettings';
import { PLACEHOLDER_OPTIONS } from '../../models/placeholder';

// Per-badge placeholder for "Insert badge". The text box only shows for "Custom text".
export function placeholderFields(
	el: HTMLElement, draft: BadgeDefinition, settings: BadgesSettings, refresh: () => void,
): void {
	const textSetting = new Setting(el);
	const modeSetting = new Setting(el)
		.setName('Placeholder')
		.setDesc('Inserted when nothing is selected.')
		.addDropdown((dd) => dd
			.addOption('default', `Default (${PLACEHOLDER_OPTIONS[settings.placeholderMode]})`)
			.addOptions(PLACEHOLDER_OPTIONS)
			.setValue(draft.placeholder)
			.onChange((v) => {
				draft.placeholder = v as BadgeDefinition['placeholder'];
				textSetting.settingEl.toggle(draft.placeholder === 'custom');
				refresh();
			}));
	// Keep the text box under its dropdown.
	modeSetting.settingEl.after(textSetting.settingEl);
	textSetting
		.setName('Placeholder text')
		.addText((t) => t.setValue(draft.placeholderText).onChange((v) => {
			draft.placeholderText = v;
			refresh();
		}));
	textSetting.settingEl.toggle(draft.placeholder === 'custom');
}
