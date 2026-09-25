// Colour parsing shared by the renderer and the settings colour fields.

export interface Rgb { r: number; g: number; b: number }

// Accepts #f00, #ff0000, "255,0,0" or "rgb(255, 0, 0)". null for anything else.
export function parseColorToRgb(input: string): Rgb | null {
	const value = input.trim();
	if (!value) return null;
	const hex = value.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
	if (hex) {
		let h = hex[1];
		if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
		return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
	}
	const rgb = value.match(/^(?:rgb\()?\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)?$/);
	if (rgb) {
		const parts = [rgb[1], rgb[2], rgb[3]].map(Number);
		if (parts.every((n) => n >= 0 && n <= 255)) return { r: parts[0], g: parts[1], b: parts[2] };
	}
	return null;
}

// Normalises a colour into the inside of rgba(): "r, g, b" or a var(--…) reference. null = unusable.
export function rgbTriplet(raw: string): string | null {
	const value = raw.trim();
	if (!value) return null;
	if (value.startsWith('var(')) return value;
	const rgb = parseColorToRgb(value);
	return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : null;
}

// Full CSS colour for a field, or null. var(--x-rgb) triplets are wrapped in rgb().
export function cssColor(raw: string, alpha = 1): string | null {
	const triplet = rgbTriplet(raw);
	return triplet ? `rgba(${triplet}, ${alpha})` : null;
}

// Resolves any accepted colour, including var(--…), to RGB for a colour picker.
export function resolveRgb(value: string): Rgb | null {
	const v = value.trim();
	if (v.startsWith('var(')) {
		const name = v.slice(4, -1).trim(); // "--color-red-rgb"
		return parseColorToRgb(getComputedStyle(activeDocument.body).getPropertyValue(name));
	}
	return parseColorToRgb(v);
}
