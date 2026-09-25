import type { BadgeDefinition } from '../models/BadgeDefinition';
import { getBadge } from '../models/badgeIndex';
import { normaliseBadge } from '../models/normaliseBadge';
import { badgeTitle } from '../models/badgeTitle';
import { definedOnly } from '../utils/definedOnly';
import { buildBadge } from './buildBadge';

// Badge for `key` with unsaved `changes` over the saved one; shows `text`, else the label (none = icon only).
export function previewBadge(key: string, changes: Partial<BadgeDefinition>, text?: string): HTMLElement {
	const def = normaliseBadge({ ...getBadge(key), ...definedOnly(changes), key });
	const content = (text ?? badgeTitle(def)).replace(/[\]`]/g, '');
	return buildBadge(`[!!${def.key}:${content}]`, def);
}
