import type { App, Plugin } from 'obsidian';

// The private bits of app.plugins we use: installed manifests and loaded plugins.
interface PluginsApi {
	manifests?: Record<string, { name?: string } | undefined>;
	getPlugin?(id: string): Plugin | null;
}

const pluginsApi = (app: App) => (app as unknown as { plugins?: PluginsApi }).plugins;

// Display name of an installed plugin, falling back to its id.
export function pluginName(app: App, id: string): string {
	return pluginsApi(app)?.manifests?.[id]?.name ?? id;
}

// A loaded (enabled) plugin by id, or null.
export function getPlugin(app: App, id: string): Plugin | null {
	return pluginsApi(app)?.getPlugin?.(id) ?? null;
}
