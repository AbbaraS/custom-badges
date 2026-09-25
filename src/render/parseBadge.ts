// Splits badge text like "[!!type|extra:content>>link]" into parts. No DOM.

export interface BadgeLink {
	target: string;
	isWikilink: boolean;
}

export interface ParsedBadge {
	type: string;           // everything before ":", e.g. "note" or "note|icon|label"
	extras: string[];       // type split on "|"
	content: string | null; // text after ":"; null = shorthand [!!key]
	link: BadgeLink | null; // optional >>[[note]] or >>https://…
}

// null when the text is empty (a syntax error).
export function parseBadge(text: string): ParsedBadge | null {
	const part = text.substring(2);
	// Escaped pipes (\|) let badges sit inside Markdown tables.
	let body = part.substring(1, part.length - 1).trim().replace(/\\\|/g, '|');
	if (!body) return null;

	// Link.
	let link: BadgeLink | null = null;
	const linkMatch = body.match(/>>(\[\[.+?\]\]|.+)$/);
	if (linkMatch) {
		const raw = linkMatch[1].trim();
		const isWikilink = raw.startsWith('[[') && raw.endsWith(']]');
		link = { target: isWikilink ? raw.slice(2, -2) : raw, isWikilink };
		body = body.slice(0, body.lastIndexOf('>>')).trim();
	}

	// Type and content.
	const at = body.indexOf(':');
	const type = (at < 0 ? body : body.slice(0, at)).trim();
	const content = at < 0 ? null : body.slice(at + 1).trim();
	return { type, extras: type.split('|'), content, link };
}
