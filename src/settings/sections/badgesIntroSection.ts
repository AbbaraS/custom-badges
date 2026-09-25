import { Setting } from 'obsidian';
import { LUCIDE_ICONS_URL } from '../../defaults/defaultBadges';

// "Badges" heading with a short syntax reminder.
export function badgesIntroSection(el: HTMLElement): void {
	new Setting(el)
		.setName('Badges')
		.setDesc(createFragment((frag) => {
			frag.appendText('Syntax: `[!!key:text]`, or `[!!key]` to show its label. Icons: a ');
			frag.createEl('a', { text: 'Lucide icon', href: LUCIDE_ICONS_URL });
			frag.appendText(' name or an emoji.');
		}))
		.setHeading();
}
