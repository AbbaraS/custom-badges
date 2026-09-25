import type { BadgeDefinition } from './BadgeDefinition';

// Numbers only; anything else (missing, "", NaN) means "use the default".
const numberOrNull = (v: unknown): number | null =>
	typeof v === 'number' && Number.isFinite(v) ? v : null;

// Fills in fields added in later versions so older saved badges stay valid.
export function normaliseBadge(raw: Partial<BadgeDefinition>): BadgeDefinition {
	return {
		key: (raw.key ?? '').trim().toLowerCase(),
		label: raw.label ?? '',
		icon: (raw.icon ?? '').trim(),
		prefixIcon: (raw.prefixIcon ?? '').trim(),
		prefixLabel: raw.prefixLabel ?? '',
		color: raw.color ?? '',
		textColor: raw.textColor ?? '',
		backgroundColor: raw.backgroundColor ?? '',
		borderRadius: numberOrNull(raw.borderRadius),
		fontSize: numberOrNull(raw.fontSize),
		placeholder: raw.placeholder ?? 'default',
		placeholderText: raw.placeholderText ?? '',
		source: (raw.source ?? '').trim(),
	};
}

// A badge with nothing filled in (left over from older versions' inline rows).
export function isBlankBadge(b: BadgeDefinition): boolean {
	return !b.key.trim() && !b.label.trim() && !b.icon.trim() && !b.color.trim();
}
