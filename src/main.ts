import { App, Editor, FuzzySuggestModal, FuzzyMatch, PluginSettingTab, Setting, Plugin, MarkdownPostProcessor, setIcon, editorLivePreviewField } from 'obsidian'
import { RangeSetBuilder } from "@codemirror/state"
import { ViewPlugin, WidgetType, EditorView, ViewUpdate, Decoration, DecorationSet } from '@codemirror/view'
import { BADGE_TYPES } from './constants';

const REGEXP = /(`\[!!(.*?)\]`)/gm;

interface BadgeDefinition {
  key: string;    // what you type: [!!key:...]
  label: string;  // default display text for shorthand [!!key]
  icon: string;   // Lucide icon name
  color: string;  // e.g. "144,144,144" or "var(--color-red-rgb)"; empty = default
}

interface BadgesSettings {
  customBadges: BadgeDefinition[];
}

const DEFAULT_SETTINGS: BadgesSettings = {
  customBadges: [],
};

let mergedBadgeTypes: [string, string, string][] = [...BADGE_TYPES];

function refreshBadgeTypes(customBadges: BadgeDefinition[]): void {
  const customTriples: [string, string, string][] = customBadges
    .filter((b) => b.key.trim().length > 0)
    .map((b) => [b.key.trim().toLowerCase(), b.label || b.key, b.icon || 'hash']);
  mergedBadgeTypes = [...customTriples, ...BADGE_TYPES];

  customBadgeColors = new Map<string, string>();
  for (const b of customBadges) {
    const key = b.key.trim().toLowerCase();
    const color = cssColorValue(b.color);
    if (key && color) customBadgeColors.set(key, color);
  }
}

// Accepts #f00, #ff0000, "255,0,0" or "rgb(255, 0, 0)". Returns null for
// anything else (including var(--…), handled separately by cssColorValue).
function parseColorToRgb(input: string): { r: number; g: number; b: number } | null {
  const value = input.trim();
  if (!value) return null;
  const hex = value.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  const rgb = value.match(/^(?:rgb\()?\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)?$/);
  if (rgb) {
    const parts = [rgb[1], rgb[2], rgb[3]].map(Number);
    if (parts.every((n) => n >= 0 && n <= 255)) {
      return { r: parts[0], g: parts[1], b: parts[2] };
    }
  }
  return null;
}

// Normalises any accepted colour input into something usable as the first
// argument of rgba(): either "r, g, b" or a var(--…) reference. null = unusable.
function cssColorValue(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (value.startsWith('var(')) return value;
  const rgb = parseColorToRgb(value);
  return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : null;
}

// badge key -> normalised colour, rebuilt whenever settings change.
let customBadgeColors = new Map<string, string>();

export default class BadgesPlugin extends Plugin {
  settings!: BadgesSettings;
  async onload() {
    await this.loadSettings();
    refreshBadgeTypes(this.settings.customBadges);
    this.addSettingTab(new BadgesSettingTab(this.app, this));
    this.registerMarkdownPostProcessor(
			buildPostProcessor()
		);
    this.registerEditorExtension(viewPlugin)
    this.addCommand({
      id: 'insert-badge',
      name: 'Insert badge',
      editorCallback: (editor: Editor) => {
        new BadgePickerModal(this.app, editor).open();
        }
    });
  }
  async loadSettings() {
    const data = (await this.loadData()) as Partial<BadgesSettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
  }
  async saveSettings() {
    await this.saveData(this.settings);
    refreshBadgeTypes(this.settings.customBadges);
  }
  onunload() {
  }
}

function buildPostProcessor(): MarkdownPostProcessor {
	return (el) => {
    el.findAll("code").forEach(
			(code) => {
				const text = code.innerText.trim();
				if (text.startsWith('[!!') && text.endsWith(']')) {
          code.replaceWith(buildBadge(text));
				}
			}
		)
	}
}

class BadgeWidget extends WidgetType {
  readonly text: string;

  constructor(badge: string[]) {
    super()
    this.text = badge[0].substring(1).substring(badge[0].length-2,0);
  }

  eq(other: BadgeWidget): boolean {
    return this.text === other.text;
  }

  toDOM(_view: EditorView): HTMLElement {
    return buildBadge(this.text);
  }
}

const viewPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
  }

  update(update: ViewUpdate) {
    // Rebuild unconditionally. Gating on docChanged/viewportChanged/selectionSet
    // misses the update where Obsidian turns live preview on, and once this
    // plugin has reported Decoration.none for those ranges CodeMirror never
    // redraws them — badges stay stuck as plain inline code. Widget churn is
    // handled by BadgeWidget.eq() instead.
    this.decorations = this.buildDecorations(update.view);
  }

  buildDecorations(view: EditorView): DecorationSet {
    if (!view.state.field(editorLivePreviewField)) {
      return Decoration.none;
    }
    let builder = new RangeSetBuilder<Decoration>();
    let lines: number[] = [];
    if (view.state.doc.length > 0) {
      lines = Array.from(
        { length: view.state.doc.lines },
        (_, i) => i + 1,
      );
    }

    const currentSelections = [...view.state.selection.ranges];

    for (let n of lines) {
      const line = view.state.doc.line(n);
      let matches = Array.from(line.text.matchAll(REGEXP))
      for (const match of matches) {
        let add = true
        const from = match.index != undefined ? match.index + line.from : -1
        const to = from + match[0].length
        if ((to-from) === 6) {
          add = false
        }
        currentSelections.forEach((r) => {
          if (r.to >= from && r.from <= to) {
            add = false
          }
        })
        if (add) {
          // inclusiveStart gives the decoration a negative startSide. Without it,
          // when the editor is reconfigured on a live view (enabling/disabling a
          // plugin), CodeMirror's redraw range starts inside the replaced span and
          // it emits a continueWidget placeholder instead of the badge, leaving a
          // blank gap. Decoration.widget used to avoid this via its -1e8 startSide.
          builder.add(from, to, Decoration.replace({ widget: new BadgeWidget(match), inclusiveStart: true }))
        }
      }
    }
    return builder.finish();
  }
}, {
  decorations: (v) => v.decorations,
})

function buildBadge(text: string): HTMLSpanElement | HTMLAnchorElement {
  const newEl = createSpan();
  const iconEl = createSpan();
  const titleEl = createSpan();
  const textEl = createSpan();
  let attrType = "";
  const part = text.substring(2);
  // Support escaped pipes (\|) for use inside Markdown tables
  let content = part.substring(part.length-1,1).trim().replace(/\\\|/g, '|');
  if (!content.length) {
    newEl.setText("Badges syntax error");
    return newEl;
  }
  // Parse optional link syntax: >>[[wikilink]] or >>https://...
  let linkTarget: string | null = null;
  let isWikilink = false;
  const linkMatch = content.match(/>>(\[\[.+?\]\]|.+)$/);
  if (linkMatch) {
    const rawLink = linkMatch[1].trim();
    if (rawLink.startsWith('[[') && rawLink.endsWith(']]')) {
      linkTarget = rawLink.slice(2, -2);
      isWikilink = true;
    } else {
      linkTarget = rawLink;
    }
    content = content.slice(0, content.lastIndexOf('>>')).trim();
  }
  const parts = content.split(':');
  const badgeType = parts[0].trim();
  let badgeContent: string;
  // Support shorthand syntax for known types: [!!success] instead of [!!success:Success]
  if (parts.length < 2) {
    const knownType = mergedBadgeTypes.find((el) => el[0] === badgeType.toLowerCase());
    if (knownType) {
      badgeContent = knownType[1];
    } else {
      newEl.setText("❌ Badges syntax error");
      newEl.setAttr("style", "color:var(--text-error)")
      return newEl;
    }
  } else {
    badgeContent = parts[1].trim();
  }
  const extras = badgeType.split("|");
  const hasExtra = extras.length > 1;
  if (extras.length == 3) {
    iconEl.addClass("inline-badge-icon");
    attrType = 'customized';
    setIcon(iconEl, extras[1]);
    iconEl.setAttr("aria-label", extras[2]);
    const details = parts[1].split("|");
    const title = details[0].trim();
    titleEl.addClass("inline-badge-title-inner");
    titleEl.setText(title);
    newEl.addClass('inline-badge');
    newEl.setAttr("data-inline-badge", attrType.toLowerCase());
    let color = 'currentColor';
    if (details[1]) {
      color = details[1].trim();
    }
    newEl.setAttr("style", "--customize-badge-color: "+color+";");
    newEl.appendChild(iconEl);
    if (textEl.getText() != "") {
      newEl.appendChild(textEl);
    }
    newEl.appendChild(titleEl);
  } else {
    if (hasExtra) {
      if (extras[1].startsWith('ghb>') || extras[1].startsWith('ghs>')) {
        const ghType = extras[1].split('>')[1].trim();
        setIcon(iconEl, "github");
        iconEl.addClass("inline-badge-icon");
        iconEl.setAttr("aria-label", "Github");
        textEl.addClass("gh-type");
        textEl.setText(ghType);
        attrType = (extras[1].startsWith('ghb>')) ? 'github' : 'github-success';
      } else {
        iconEl.addClass("inline-badge-extra");
        const badgeTypeText = badgeType.split("|")[1].trim();
        iconEl.setText(badgeTypeText);
        iconEl.dataset.badgeType = badgeTypeText;
        attrType = 'text';
      }
    } else {
      iconEl.addClass("inline-badge-icon");
      attrType = badgeType.trim();
      const knownType = mergedBadgeTypes.find((el) => el[0] === badgeType.toLowerCase() && el[2].length > 0);
      if (knownType) {
        setIcon(iconEl, knownType[2]);
      } else {
        setIcon(iconEl, badgeType.trim());
      }
      iconEl.setAttr("aria-label", badgeType.trim());
    }
    titleEl.addClass("inline-badge-title-inner");
    titleEl.setText(badgeContent);
    newEl.addClass('inline-badge');
    newEl.setAttr("data-inline-badge", attrType.toLowerCase());
    newEl.appendChild(iconEl);
    if (textEl.getText() != "") {
      newEl.appendChild(textEl);
    }
    newEl.appendChild(titleEl);
  }
  // Apply a custom colour from settings, if one is defined for this key.
  // Set as an inline custom property rather than an injected stylesheet, which
  // Obsidian's plugin guidelines disallow.
  const customColor = customBadgeColors.get(badgeType.trim().toLowerCase());
  if (customColor) {
    newEl.addClass('inline-badge-custom-color');
    newEl.style.setProperty('--badge-color', customColor);
  }
  // Wrap in anchor if link was specified
  if (linkTarget) {
    const anchor = createEl('a');
    anchor.addClass('badge-link');
    if (isWikilink) {
      anchor.addClass('internal-link');
      anchor.setAttr('data-href', linkTarget);
      anchor.setAttr('href', linkTarget);
      anchor.setAttr('data-tooltip-position', 'top');
    } else {
      anchor.addClass('external-link');
      anchor.setAttr('href', linkTarget);
      anchor.setAttr('target', '_blank');
      anchor.setAttr('rel', 'noopener');
      anchor.setAttr('aria-label', linkTarget);
      anchor.setAttr('data-tooltip-position', 'top');
    }
    anchor.appendChild(newEl);
    return anchor;
  }
  return newEl;
}

class BadgesSettingTab extends PluginSettingTab {
  plugin: BadgesPlugin;
  constructor(app: App, plugin: BadgesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    new Setting(containerEl).setName('Custom types').setHeading();
    this.plugin.settings.customBadges.forEach((badge, index) => {
      const row = new Setting(containerEl);
      row.settingEl.addClass('badge-setting-row');
      const renderPreview = () => {
        row.nameEl.empty();
        const key = badge.key.trim().toLowerCase();
        if (!key) {
          row.nameEl.setText('(No key)'); 
          return;
        }
        row.nameEl.appendChild(buildBadge(`[!!${key}:${badge.label.trim() || key}]`));
      };
      renderPreview();
      
      let renderSwatch = () => { /* replaced once the swatch exists */ };

      const commit = async () => {
        await this.plugin.saveSettings();
        renderPreview();
        renderSwatch();
      };
      // Placeholders vanish once a field is filled, so each input also carries a
      // persistent label for hover and screen readers.
      const label = (el: HTMLInputElement, text: string) => {
        el.setAttribute('aria-label', text);
        el.setAttribute('title', text);
      };

      row.addText((text) => {
        text.setPlaceholder('Key')
          .setValue(badge.key)
          .onChange(async (value) => {
            badge.key = value.trim().toLowerCase();
            await commit();
          });
        label(text.inputEl, 'Key, used as [!!key:value]');
      })
      row.addText((text) => {
        text.setPlaceholder('Label')
          .setValue(badge.label)
          .onChange(async (value) => {
            badge.label = value;
            await commit();
          });
        label(text.inputEl, 'Label shown for the shorthand [!!key]');
      })
      row.addText((text) => {
        text.setPlaceholder('Icon name')
          .setValue(badge.icon)
          .onChange(async (value) => {
            badge.icon = value.trim();
            await commit();
          });
        label(text.inputEl, 'Lucide icon name, e.g. smile-plus');
      })
      // Colour accepts hex, "r,g,b", rgb(...) or a var(--…) reference. The
      // swatch beside it previews whatever is currently parseable.
      row.addText((text) => {
        text.setPlaceholder('Colour')
          .setValue(badge.color)
          .onChange(async (value) => {
            badge.color = value.trim();
            await commit();
          });
        label(text.inputEl, 'Colour: #hex, R,G,B, rgb(…) or var(--…)');
      })
      const swatchEl = row.controlEl.createSpan({ cls: 'badge-color-swatch' });
      renderSwatch = () => {
        const color = cssColorValue(badge.color);
        swatchEl.toggleClass('is-empty', color === null);
        swatchEl.style.setProperty('--swatch-color', color ?? 'transparent');
      };
      renderSwatch();
      row.addExtraButton((btn) => {
        btn.setIcon('trash')
          .onClick(async () => {
            this.plugin.settings.customBadges.splice(index, 1);
            await this.plugin.saveSettings();
            this.display();
          });
        btn.extraSettingsEl.setAttribute('aria-label', 'Delete badge');
      });
    });
    
    new Setting(containerEl)
    .addButton((btn) => btn
      .setButtonText('Add badge')
      .setCta()
      .onClick(async () => {
        this.plugin.settings.customBadges.push({ key: '', label: '', icon: '', color: '' });
        await this.plugin.saveSettings();
        this.display();
      }));
  }
}

// Modal for inserting badges 
class BadgePickerModal extends FuzzySuggestModal<[string, string, string]> {
  editor: Editor;
  
  renderSuggestion(match: FuzzyMatch<[string, string, string]>, el: HTMLElement): void {
    el.addClass('badge-picker-suggestion');
    const iconEl = el.createSpan({ cls: 'badge-picker-icon' });
    setIcon(iconEl, match.item[2]);
    const textEl = el.createSpan();
    super.renderSuggestion(match, textEl);
  }

  constructor(app: App, editor: Editor) {
    super(app);
    this.editor = editor;
    this.setPlaceholder('Choose a badge type…');
  }

  getItems(): [string, string, string][] {
    // mergedBadgeTypes, not BADGE_TYPES, so user-defined badges appear in the picker.
    return mergedBadgeTypes;
  }

  getItemText(item: [string, string, string]): string {
    return item[0];
  }

  onChooseItem(item: [string, string, string]): void {
    const key = item[0];
    const selected = this.editor.getSelection().replace(/\s*\n\s*/g, ' ').trim(); // minor limitation: the parser treats ':' and '|' as delimiters, so a selection containing those will produce odd results. suggested-todo: strip or escape ':' and '|' 
    const placeholder = ' '; // this could be changed to 'text' or item[1] as default value 
    const value = selected || placeholder;
    const start = this.editor.getCursor('from');
    this.editor.replaceSelection(`\`[!!${key}:${value}]\``);
    if (!selected) {
      const chStart = start.ch + 5 + key.length;
      this.editor.setSelection(
        { line: start.line, ch: chStart + placeholder.length + 2 }, // this could be { line: start.line, ch: chStart } to select the placeholder text when inserting a badge instead of placing the cursor after it. 
        { line: start.line, ch: chStart + placeholder.length + 2 }
      );
    }
  }
}

