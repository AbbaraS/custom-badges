import { Setting } from 'obsidian';
import type { BadgeDefinition } from '../../models/BadgeDefinition';
import { LUCIDE_ICONS_URL } from '../../defaults/defaultBadges';

// Key, label and icon. `others` are the other saved badges, for the duplicate-key warning.
export function basicFields(
	el: HTMLElement, draft: BadgeDefinition, others: BadgeDefinition[], refresh: () => void,
): void {
	const keySetting = new Setting(el)
		.setName('Key')
		.setDesc('What you type: [!!key:text]. Lowercase, no spaces, ":" or "|".');
	const warning = keySetting.descEl.createDiv({ cls: 'badge-setting-warning' });
	// Warns while another badge already uses this key.
	const checkKey = () => {
		const clash = others.find((b) => b.key === draft.key);
		warning.setText(clash ? `Also used by "${clash.label || clash.key}". Your badges win over others.` : '');
	};
	keySetting.addText((t) => {
		t.setPlaceholder('Idea').setValue(draft.key).onChange((v) => {
			draft.key = v.trim().toLowerCase();
			checkKey();
			refresh();
		});
		window.setTimeout(() => t.inputEl.focus(), 0);
	});
	checkKey();

	new Setting(el)
		.setName('Label')
		.setDesc('Shown by the shorthand [!!key].')
		.addText((t) => t.setPlaceholder('Idea').setValue(draft.label).onChange((v) => {
			draft.label = v;
			refresh();
		}));

	new Setting(el)
		.setName('Icon')
		.setDesc(createFragment((f) => {
			f.createEl('a', { text: 'Lucide icon', href: LUCIDE_ICONS_URL });
			f.appendText(' name, or paste an emoji (e.g. 🚀).');
		}))
		.addText((t) => t.setPlaceholder('Lightbulb or 💡').setValue(draft.icon).onChange((v) => {
			draft.icon = v.trim();
			refresh();
		}));
}
