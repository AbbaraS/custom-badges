import { Setting } from 'obsidian';

// Sub-heading for one group of badges, with an optional note underneath.
export function groupHeading(el: HTMLElement, name: string, desc = ''): Setting {
	const heading = new Setting(el).setName(name).setDesc(desc).setHeading();
	heading.settingEl.addClass('badge-group-heading');
	return heading;
}
