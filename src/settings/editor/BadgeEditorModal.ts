import { Modal, Notice, Setting } from 'obsidian';
import type { BadgeDefinition } from '../../models/BadgeDefinition';
import { normaliseBadge } from '../../models/normaliseBadge';
import { ownerSavesEdits, sendEditToOwner } from '../../integrations/badgeOwners';
import { pluginName } from '../../integrations/obsidianPlugins';
import type { SettingsContext } from '../context';
import { basicFields } from './basicFields';
import { placeholderFields } from './placeholderFields';
import { prefixFields } from './prefixFields';
import { renderBadgePreview } from './renderBadgePreview';
import { styleFields } from './styleFields';

// Create or edit one badge. Edits a draft with a live preview; Save copies it back.
export class BadgeEditorModal extends Modal {
	private draft: BadgeDefinition;

	// `badge` = the saved badge to edit, or null for a new one.
	constructor(private ctx: SettingsContext, private badge: BadgeDefinition | null) {
		super(ctx.app);
		this.draft = normaliseBadge(badge ? structuredClone(badge) : {});
	}

	onOpen(): void {
		const { contentEl } = this;
		const settings = this.ctx.plugin.settings;
		this.modalEl.addClass('badge-editor-modal');
		this.titleEl.setText(this.badge ? 'Edit badge' : 'New badge');

		// Preview stays pinned at the top while the fields scroll.
		const previewEl = contentEl.createDiv({ cls: 'badge-editor-preview' });
		const refresh = () => renderBadgePreview(previewEl, this.draft, settings);
		refresh();

		// Badges from another plugin: say where edits go.
		const owner = this.draft.source ? pluginName(this.app, this.draft.source) : '';
		if (owner) {
			const note = ownerSavesEdits(this.app, this.draft.source)
				? `Created by ${owner}. Label, icon and colour are saved back to ${owner} too.`
				: `Created by ${owner}, which may overwrite these changes when it syncs.`;
			contentEl.createDiv({ cls: 'badge-editor-owner-note', text: note });
		}

		const others = settings.badges.filter((b) => b !== this.badge);
		basicFields(contentEl, this.draft, others, refresh, owner);
		prefixFields(contentEl, this.draft, refresh, owner);
		new Setting(contentEl).setName('Style').setHeading();
		styleFields(contentEl, this.draft, refresh);
		new Setting(contentEl).setName('Inserting').setHeading();
		placeholderFields(contentEl, this.draft, settings, refresh);

		new Setting(contentEl)
			.addButton((b) => b.setButtonText('Cancel').onClick(() => this.close()))
			.addButton((b) => b.setButtonText(this.badge ? 'Save' : 'Create').setCta().onClick(() => void this.save()));
	}

	// Writes the draft into settings; a key is required.
	private async save(): Promise<void> {
		if (!this.draft.key) {
			new Notice('Give the badge a key first.');
			return;
		}
		if (this.badge) Object.assign(this.badge, this.draft);
		else this.ctx.plugin.settings.badges.push(this.draft);
		this.close();
		await this.ctx.plugin.saveSettings();
		await sendEditToOwner(this.app, this.draft); // owner re-syncs before the list redraws
		await this.ctx.saveAndRedraw();
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
