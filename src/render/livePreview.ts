import { editorLivePreviewField } from 'obsidian';
import { RangeSetBuilder } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { badgeIndexVersion } from '../models/badgeIndex';
import { buildBadge } from './buildBadge';

// `[!!…]` wrapped in backticks.
const BADGE_CODE = /(`\[!!(.*?)\]`)/gm;

// One rendered badge in live preview.
class BadgeWidget extends WidgetType {
	// `version` makes widgets redraw after a badge's style changes in settings.
	constructor(readonly text: string, readonly version: number) {
		super();
	}

	eq(other: BadgeWidget): boolean {
		return this.text === other.text && this.version === other.version;
	}

	toDOM(_view: EditorView): HTMLElement {
		return buildBadge(this.text);
	}
}

// Replaces badge code with widgets, except where the cursor or selection touches it.
function buildDecorations(view: EditorView): DecorationSet {
	if (!view.state.field(editorLivePreviewField)) return Decoration.none;
	const builder = new RangeSetBuilder<Decoration>();
	const selections = view.state.selection.ranges;
	const version = badgeIndexVersion();

	for (let n = 1; n <= view.state.doc.lines && view.state.doc.length > 0; n++) {
		const line = view.state.doc.line(n);
		for (const match of line.text.matchAll(BADGE_CODE)) {
			const from = (match.index ?? 0) + line.from;
			const to = from + match[0].length;
			if (to - from === 6) continue; // empty `[!!]`
			if (selections.some((r) => r.to >= from && r.from <= to)) continue;
			// inclusiveStart gives a negative startSide. Without it, reconfiguring a live
			// view (toggling a plugin) redraws from inside the span and leaves a blank gap.
			const text = match[0].slice(1, -1);
			builder.add(from, to, Decoration.replace({ widget: new BadgeWidget(text, version), inclusiveStart: true }));
		}
	}
	return builder.finish();
}

// Live preview plugin. Rebuilds on every update: gating on docChanged etc. misses the
// update where Obsidian turns live preview on, leaving badges stuck as inline code.
export const livePreviewPlugin = ViewPlugin.fromClass(class {
	decorations: DecorationSet;

	constructor(view: EditorView) {
		this.decorations = buildDecorations(view);
	}

	update(update: ViewUpdate) {
		this.decorations = buildDecorations(update.view);
	}
}, { decorations: (v) => v.decorations });
