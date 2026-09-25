import { App, Notice } from 'obsidian';
import type { BadgeDefinition } from '../models/BadgeDefinition';
import { getPlugin, pluginName } from './obsidianPlugins';

// What a plugin that creates badges can implement to receive edits made in our settings.
interface BadgeOwner {
	onCustomBadgeEdited?(badge: BadgeDefinition): unknown;
}

const ownerOf = (app: App, id: string) => getPlugin(app, id) as (BadgeOwner | null);

// True when the badge's plugin is loaded and saves edits back to its own settings.
export function ownerSavesEdits(app: App, pluginId: string): boolean {
	return typeof ownerOf(app, pluginId)?.onCustomBadgeEdited === 'function';
}

// Passes an edited badge to the plugin that created it, so its next sync keeps the change.
export async function sendEditToOwner(app: App, badge: BadgeDefinition): Promise<void> {
	if (!badge.source || !ownerSavesEdits(app, badge.source)) return;
	try {
		await ownerOf(app, badge.source)?.onCustomBadgeEdited?.(structuredClone(badge));
	} catch (err) {
		console.error(err);
		new Notice(`${pluginName(app, badge.source)} couldn't save the badge change.`);
	}
}
