import type { MarkdownPostProcessor } from 'obsidian';
import { buildBadge } from './buildBadge';

// Reading view: swaps inline code like `[!!note:Hi]` for a badge.
export const badgePostProcessor: MarkdownPostProcessor = (el) => {
	el.findAll('code').forEach((code) => {
		const text = code.innerText.trim();
		if (text.startsWith('[!!') && text.endsWith(']')) code.replaceWith(buildBadge(text));
	});
};
