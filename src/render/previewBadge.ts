import type { BadgeDefinition } from '../models/BadgeDefinition';
import { getBadge } from '../models/badgeIndex';
import { normaliseBadge } from '../models/normaliseBadge';
import { definedOnly } from '../utils/definedOnly';
import { buildBadge } from './buildBadge';

// Badge for `key` with unsaved `changes` over the saved one; shows `text`, else the label.
export function previewBadge(key: string, changes: Partial<BadgeDefinition>, text?: string): HTMLElement {
	const def = normaliseBadge({ ...getBadge(key), ...definedOnly(changes), key });
	const content = (text ?? (def.label.trim() || def.key)).replace(/[\]`]/g, '');
	return buildBadge(`[!!${def.key}:${content}]`, def);
}
