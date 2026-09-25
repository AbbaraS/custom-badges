import { Setting } from 'obsidian';
import type { BadgeDefinition } from '../../models/BadgeDefinition';
import { BadgeEditorModal } from '../editor/BadgeEditorModal';
import type { SettingsContext } from '../context';
import { badgeRow } from './badgeRow';
import { groupHeading } from './groupHeading';

// Badges made in this plugin, and the "Add badge" button.
export function userGroupSection(el: HTMLElement, ctx: SettingsContext, badges: BadgeDefinition[]): void {
	groupHeading(el, 'Your badges', badges.length ? '' : 'No badges yet.');
	badges.forEach((b) => badgeRow(el, ctx, b));
	new Setting(el).addButton((btn) => btn
		.setButtonText('Add badge')
		.setCta()
		.onClick(() => new BadgeEditorModal(ctx, null).open()));
}
