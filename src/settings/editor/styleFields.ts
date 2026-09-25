import type { BadgeDefinition } from '../../models/BadgeDefinition';
import { FONT_SIZE_RANGE, RADIUS_RANGE } from '../../defaults/defaultSettings';
import { colorField } from './colorField';
import { sliderField } from './sliderField';

// Colours, corner radius and font size. Every change redraws the preview.
export function styleFields(el: HTMLElement, draft: BadgeDefinition, refresh: () => void): void {
	// Sets one field and redraws.
	const set = <K extends keyof BadgeDefinition>(key: K) => (value: BadgeDefinition[K]) => {
		draft[key] = value;
		refresh();
	};

	colorField(el, 'Badge colour', 'Main tint. Text and background follow it unless set below.', draft.color, set('color'));
	colorField(el, 'Text colour', 'Text and icon. Empty = badge colour.', draft.textColor, set('textColor'));
	colorField(el, 'Background colour', 'Empty = a faint tint of the badge colour.', draft.backgroundColor, set('backgroundColor'));
	sliderField(el, 'Border radius', 'Corner roundness.', draft.borderRadius, RADIUS_RANGE, 'px', set('borderRadius'));
	sliderField(el, 'Font size', 'Relative to the note text.', draft.fontSize, FONT_SIZE_RANGE, 'em', set('fontSize'));
}
