import { App, debounce, PluginSettingTab } from 'obsidian';
import type BadgesPlugin from '../main';
import { groupBadges } from '../models/badgeGroups';
import type { SettingsContext } from './context';
import { badgesIntroSection } from './sections/badgesIntroSection';
import { defaultGroupSection } from './sections/defaultGroupSection';
import { placeholderSection } from './sections/placeholderSection';
import { pluginGroupSection } from './sections/pluginGroupSection';
import { userGroupSection } from './sections/userGroupSection';

// Settings tab shell: builds the shared context and lays out the sections.
export class BadgesSettingTab extends PluginSettingTab {
	private ctx: SettingsContext;

	constructor(app: App, private plugin: BadgesPlugin) {
		super(app, plugin);
		const save = debounce(() => void plugin.saveSettings(), 400, true);
		this.ctx = {
			app, plugin, save,
			saveAndRedraw: async () => {
				await plugin.saveSettings();
				this.display();
			},
		};
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		placeholderSection(containerEl, this.ctx);
		badgesIntroSection(containerEl);

		// Default, then one group per plugin, then yours.
		const groups = groupBadges(this.plugin.settings.badges);
		defaultGroupSection(containerEl, this.ctx, groups.defaults);
		userGroupSection(containerEl, this.ctx, groups.user);
		groups.plugins.forEach((badges, id) => pluginGroupSection(containerEl, this.ctx, id, badges));
	}
}
