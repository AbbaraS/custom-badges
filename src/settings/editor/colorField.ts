import { ColorComponent, Setting, TextComponent } from 'obsidian';
import { resolveRgb } from '../../utils/color';
import { tooltip } from '../../utils/tooltip';

// A colour setting: text box (hex, R,G,B, rgb() or var(--…)) + picker + clear button, kept in sync.
export function colorField(
	el: HTMLElement, name: string, desc: string, value: string, onChange: (value: string) => void,
): Setting {
	let text: TextComponent;
	let picker: ColorComponent;
	// Picker shows the resolved colour, or grey while the field is empty.
	const syncPicker = (v: string) => picker.setValueRgb(resolveRgb(v) ?? { r: 128, g: 128, b: 128 });

	return new Setting(el)
		.setName(name)
		.setDesc(desc)
		.addText((t) => {
			text = t;
			t.setPlaceholder('Default').setValue(value).onChange((v) => {
				syncPicker(v);
				onChange(v.trim());
			});
		})
		.addColorPicker((p) => {
			picker = p;
			syncPicker(value);
			p.onChange((hex) => {
				text.setValue(hex);
				onChange(hex);
			});
		})
		.addExtraButton((btn) => tooltip(btn, 'Use default').setIcon('rotate-ccw').onClick(() => {
			text.setValue('');
			syncPicker('');
			onChange('');
		}));
}
