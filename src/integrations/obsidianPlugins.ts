import type { App } from 'obsidian';

// The private bit of app.plugins we read: installed plugin manifests.
interface PluginsApi {
	manifests?: Record<string, { name?: string } | undefined>;
}

// Display name of an installed plugin, falling back to its id.
export function pluginName(app: App, id: string): string {
	const plugins = (app as unknown as { plugins?: PluginsApi }).plugins;
	return plugins?.manifests?.[id]?.name ?? id;
}
