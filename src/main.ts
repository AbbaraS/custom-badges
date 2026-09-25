import { Editor, Plugin } from 'obsidian';
import type { BadgeDefinition } from './models/BadgeDefinition';
import type { BadgesSettings } from './models/BadgesSettings';
import { copyDefaultBadges } from './defaults/defaultBadges';
import { DEFAULT_SETTINGS } from './defaults/defaultSettings';
import { refreshBadgeIndex } from './models/badgeIndex';
import { sortBadges } from './models/badgeGroups';
import { isBlankBadge, normaliseBadge } from './models/normaliseBadge';
import { replacePluginBadges } from './models/pluginBadges';
import { BadgePickerModal } from './picker/BadgePickerModal';
import { livePreviewPlugin } from './render/livePreview';
import { badgePostProcessor } from './render/postProcessor';
import { previewBadge } from './render/previewBadge';
import { BadgesSettingTab } from './settings/SettingsTab';
import { refreshOpenNotes } from './utils/refreshViews';

// Entry point: loads settings and wires the renderer, command and settings tab.
export default class BadgesPlugin extends Plugin {
	settings!: BadgesSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new BadgesSettingTab(this.app, this));
		this.registerMarkdownPostProcessor(badgePostProcessor);
		this.registerEditorExtension(livePreviewPlugin);
		this.addCommand({
			id: 'insert-badge',
			name: 'Insert badge',
			editorCallback: (editor: Editor) => new BadgePickerModal(this.app, editor, this.settings).open(),
		});
	}

	async loadSettings() {
		type Saved = Partial<BadgesSettings> & { customBadges?: Partial<BadgeDefinition>[] };
		const data = ((await this.loadData()) ?? {}) as Saved;
		const { customBadges: legacy, badges, ...rest } = data;
		this.settings = { ...DEFAULT_SETTINGS, ...rest, badges: [] };

		if (Array.isArray(badges)) {
			this.settings.badges = badges.map(normaliseBadge).filter((b) => !isBlankBadge(b));
		} else {
			// First run: the defaults, with older "customBadges" merged in (same key replaces).
			const list = copyDefaultBadges();
			for (const raw of legacy ?? []) {
				const badge = normaliseBadge(raw);
				if (isBlankBadge(badge)) continue;
				const i = badge.key ? list.findIndex((b) => b.key === badge.key) : -1;
				if (i >= 0) list[i] = badge;
				else list.push(badge);
			}
			this.settings.badges = list;
		}
		sortBadges(this.settings.badges);
		refreshBadgeIndex(this.settings.badges);
	}

	// Also called by other plugins after they edit settings.badges directly.
	async saveSettings() {
		// Fill missing fields in place, so open settings rows keep their references.
		this.settings.badges.forEach((b) => Object.assign(b, normaliseBadge(b)));
		sortBadges(this.settings.badges);
		await this.saveData(this.settings);
		refreshBadgeIndex(this.settings.badges);
		refreshOpenNotes(this.app);
	}

	// Public API: replace every badge owned by `pluginId` with `badges`.
	// Other plugins call app.plugins.getPlugin('custom-badges').setPluginBadges(...).
	async setPluginBadges(pluginId: string, badges: Partial<BadgeDefinition>[]): Promise<string[]> {
		this.settings.badges = replacePluginBadges(this.settings.badges, pluginId, badges);
		await this.saveSettings();
		return this.settings.badges.filter((b) => b.source === pluginId).map((b) => b.key);
	}

	// Public API: a badge element exactly as notes show it, for live previews in other plugins' settings.
	// `changes` are unsaved edits laid over the saved badge (styling set here is kept).
	renderBadge(key: string, changes: Partial<BadgeDefinition> = {}, text?: string): HTMLElement {
		return previewBadge(key, changes, text);
	}
}
