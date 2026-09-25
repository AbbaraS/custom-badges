import { Setting } from 'obsidian';
import type { BadgeDefinition } from '../../models/BadgeDefinition';
import { findDefaultBadge, matchesDefault } from '../../models/badgeGroups';
import { renderBadgePreview } from '../editor/renderBadgePreview';
import { BadgeEditorModal } from '../editor/BadgeEditorModal';
import type { SettingsContext } from '../context';
import { tooltip } from '../../utils/tooltip';

// One badge in the list: rendered badge + syntax, then edit / reset / delete.
export function badgeRow(el: HTMLElement, ctx: SettingsContext, badge: BadgeDefinition): void {
	const all = ctx.plugin.settings.badges;
	const row = new Setting(el);
	row.settingEl.addClass('badge-setting-row');
	const edit = () => new BadgeEditorModal(ctx, badge).open();

	// Preview is clickable too, as a shortcut to the editor.
	const preview = renderBadgePreview(row.nameEl, badge, ctx.plugin.settings);
	preview.addClass('badge-setting-preview-clickable');
	preview.addEventListener('click', edit);

	// Only the first badge with a key is used.
	const first = all.find((b) => b.key === badge.key);
	if (first !== badge) {
		row.descEl.createDiv({ cls: 'badge-setting-warning', text: 'Duplicate key, ignored' });
	}

	row.addExtraButton((btn) => tooltip(btn, 'Edit badge').setIcon('pencil').onClick(edit));

	// Default badges only: put every field back to its built-in value.
	const def = findDefaultBadge(badge);
	if (def) {
		const unchanged = matchesDefault(badge, def);
		row.addExtraButton((btn) => {
			tooltip(btn, unchanged ? 'Already using default settings' : 'Restore default settings')
				.setIcon('rotate-ccw')
				.onClick(async () => {
					Object.assign(badge, structuredClone(def));
					await ctx.saveAndRedraw();
				});
			btn.extraSettingsEl.toggleClass('badge-reset-disabled', unchanged);
		});
	}

	row.addExtraButton((btn) => tooltip(btn, 'Delete badge').setIcon('trash').onClick(async () => {
		all.remove(badge);
		await ctx.saveAndRedraw();
	}));
}
