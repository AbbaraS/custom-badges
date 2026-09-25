import { Setting, SliderComponent } from 'obsidian';
import { tooltip } from '../../utils/tooltip';

// Slider limits; `fallback` is where the slider sits while the value is "default".
export interface SliderRange { min: number; max: number; step: number; fallback: number }

// A number setting: slider + value readout + reset. null = theme default.
export function sliderField(
	el: HTMLElement, name: string, desc: string, value: number | null, range: SliderRange,
	unit: string, onChange: (value: number | null) => void,
): Setting {
	let slider: SliderComponent;
	const setting = new Setting(el).setName(name).setDesc(desc);
	const readout = setting.controlEl.createSpan({ cls: 'badge-slider-value' });
	const show = (v: number | null) => readout.setText(v == null ? 'Default' : `${+v.toFixed(2)}${unit}`);

	setting.addSlider((s) => {
		slider = s;
		s.setLimits(range.min, range.max, range.step)
			.setValue(value ?? range.fallback)
			.setDynamicTooltip()
			.onChange((v) => {
				show(v);
				onChange(v);
			});
	});
	setting.addExtraButton((btn) => tooltip(btn, 'Use default').setIcon('rotate-ccw').onClick(() => {
		slider.setValue(range.fallback); // fires onChange, so reset to null afterwards
		show(null);
		onChange(null);
	}));
	setting.controlEl.prepend(readout);
	show(value);
	return setting;
}
