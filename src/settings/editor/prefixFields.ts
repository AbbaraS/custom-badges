import { Setting } from 'obsidian';
import type { BadgeDefinition } from '../../models/BadgeDefinition';

// Optional prefix shown before a "|" divider, e.g. "📚 PhD | 📗 Report".
// `owner` = name of the plugin that created the badge; it sets the prefix, so it's read-only here.
export function prefixFields(el: HTMLElement, draft: BadgeDefinition, refresh: () => void, owner = ''): void {
	const desc = owner ? `Set by ${owner}.` : 'Optional. Shown first, then a "|" divider, then the icon and label.';

	new Setting(el).setName('Prefix icon').setDesc(desc).addText((t) => {
		t.setPlaceholder('Book or 📚').setValue(draft.prefixIcon).onChange((v) => {
			draft.prefixIcon = v.trim();
			refresh();
		});
		t.inputEl.disabled = !!owner;
	});

	new Setting(el).setName('Prefix label').setDesc(desc).addText((t) => {
		t.setPlaceholder('Group').setValue(draft.prefixLabel).onChange((v) => {
			draft.prefixLabel = v;
			refresh();
		});
		t.inputEl.disabled = !!owner;
	});
}
