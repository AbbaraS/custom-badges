import type { BadgeDefinition } from '../../models/BadgeDefinition';
import { pluginName } from '../../integrations/obsidianPlugins';
import { ownerSavesEdits } from '../../integrations/badgeOwners';
import type { SettingsContext } from '../context';
import { badgeRow } from './badgeRow';
import { groupHeading } from './groupHeading';

// Badges another plugin created, under that plugin's name.
export function pluginGroupSection(el: HTMLElement, ctx: SettingsContext, pluginId: string, badges: BadgeDefinition[]): void {
	const name = pluginName(ctx.app, pluginId);
	groupHeading(el, name, ownerSavesEdits(ctx.app, pluginId)
		? `Created by ${name}. Edits here are saved back to ${name}.`
		: `Created by ${name}. It may overwrite changes here the next time it syncs.`);
	badges.forEach((b) => badgeRow(el, ctx, b));
}
