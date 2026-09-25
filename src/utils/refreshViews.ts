import { App, MarkdownView } from 'obsidian';

// Redraws badges in open notes after a badge changes (reading view and live preview).
export function refreshOpenNotes(app: App): void {
	app.workspace.getLeavesOfType('markdown').forEach((leaf) => {
		if (leaf.view instanceof MarkdownView) leaf.view.previewMode.rerender(true);
	});
	app.workspace.updateOptions(); // makes CodeMirror re-run the live-preview plugin
}
