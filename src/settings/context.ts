import type { App } from 'obsidian';
import type BadgesPlugin from '../main';

// Shared by every settings section and the badge editor.
export interface SettingsContext {
	app: App;
	plugin: BadgesPlugin;
	save: () => void;                    // debounced, for typing
	saveAndRedraw: () => Promise<void>;  // for structural changes (add, delete, reset)
}
