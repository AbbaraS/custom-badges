import { App, Editor, FuzzyMatch, FuzzySuggestModal } from 'obsidian';
import type { BadgeDefinition } from '../models/BadgeDefinition';
import type { BadgesSettings } from '../models/BadgesSettings';
import { allBadges } from '../models/badgeIndex';
import { resolvePlaceholder, resolvePlaceholderMode } from '../models/placeholder';
import { buildBadge } from '../render/buildBadge';

// "Insert badge" command: pick a badge, insert it at the cursor or around the selection.
export class BadgePickerModal extends FuzzySuggestModal<BadgeDefinition> {
	constructor(app: App, private editor: Editor, private settings: BadgesSettings) {
		super(app);
		this.setPlaceholder('Choose a badge type…');
	}

	getItems(): BadgeDefinition[] {
		return allBadges();
	}

	getItemText(item: BadgeDefinition): string {
		return item.key;
	}

	// Each option shows the badge exactly as it renders in a note, then its key.
	renderSuggestion(match: FuzzyMatch<BadgeDefinition>, el: HTMLElement): void {
		el.addClass('badge-picker-suggestion');
		el.appendChild(buildBadge(`[!!${match.item.key}]`));
		super.renderSuggestion(match, el.createSpan({ cls: 'badge-picker-key' }));
	}

	onChooseItem(item: BadgeDefinition): void {
		// ':' and '|' in the selection are read as separators (known limitation).
		const selected = this.editor.getSelection().replace(/\s*\n\s*/g, '').trim();
		const placeholder = resolvePlaceholder(item, this.settings);
		const mode = resolvePlaceholderMode(item, this.settings);
		const start = this.editor.getCursor('from');
		const badgeText = `\`[!!${item.key}:${selected || placeholder}]\``;
		this.editor.replaceSelection(badgeText);
		if (selected) return;

		const chStart = start.ch + 5 + item.key.length; // just after "`[!!key:"
		if (mode === 'label') {
			// Label: carry on typing after the badge.
			this.editor.setCursor({ line: start.line, ch: start.ch + badgeText.length + 1 });
		} else if (mode === 'custom' && placeholder) {
			// Custom text: select it so typing replaces it.
			this.editor.setSelection({ line: start.line, ch: chStart }, { line: start.line, ch: chStart + placeholder.length });
		} else {
			// Empty: cursor right after the badge.
			this.editor.setCursor({ line: start.line, ch: chStart + 2 });
		}
	}
}
