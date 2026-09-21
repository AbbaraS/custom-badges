import { App, Editor, FuzzySuggestModal, FuzzyMatch, PluginSettingTab, Setting, Plugin, MarkdownPostProcessor, setIcon, editorLivePreviewField } from 'obsidian'
import { RangeSetBuilder } from "@codemirror/state"
import { ViewPlugin, WidgetType, EditorView, ViewUpdate, Decoration, DecorationSet } from '@codemirror/view'
import { BadgeDefinition, DEFAULT_BADGES, LUCIDE_ICONS_URL, PlaceholderMode } from './constants';

const REGEXP = /(`\[!!(.*?)\]`)/gm;

interface BadgesSettings {
  badges: BadgeDefinition[];
  placeholderMode: PlaceholderMode;
  customPlaceholder: string;
}

const DEFAULT_SETTINGS: Omit<BadgesSettings, 'badges'> = {
  placeholderMode: 'selection',
  customPlaceholder: 'text',
};

function copyDefaultBadges(): BadgeDefinition[] {
  return DEFAULT_BADGES.map((b) => ({ ...b }));
}

// Fills in fields added in later versions so older saved badges stay valid.
function normaliseBadge(raw: Partial<BadgeDefinition>): BadgeDefinition {
  return {
    key: (raw.key ?? '').trim().toLowerCase(),
    label: raw.label ?? '',
    icon: raw.icon ?? '',
    color: raw.color ?? '',
    placeholder: raw.placeholder ?? 'default',
    placeholderText: raw.placeholderText ?? '',
  };
}

// key -> badge, rebuilt whenever settings change. Used by the renderer, which
// runs outside the plugin instance. If two badges share a key, the first wins.
let badgeIndex = new Map<string, BadgeDefinition>();
// key -> normalised colour for badges that have a usable colour set.
let badgeColors = new Map<string, string>();

function refreshBadgeTypes(badges: BadgeDefinition[]): void {
  badgeIndex = new Map();
  badgeColors = new Map();
  for (const b of badges) {
    const key = b.key.trim().toLowerCase();
    if (!key || badgeIndex.has(key)) continue;
    badgeIndex.set(key, b);
    const color = cssColorValue(b.color);
    if (color) badgeColors.set(key, color);
  }
}

// Sets a Lucide icon, accepting names with or without the "lucide-" prefix so
// both current names (from lucide.dev) and Obsidian's legacy ids work.
function setBadgeIcon(el: HTMLElement, name: string): void {
  const icon = name.trim();
  if (!icon) return;
  setIcon(el, icon);
  if (!el.querySelector('svg') && !icon.startsWith('lucide-')) {
    setIcon(el, `lucide-${icon}`);
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

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default class BadgesPlugin extends Plugin {
  settings!: BadgesSettings;
  async onload() {
    await this.loadSettings();
    refreshBadgeTypes(this.settings.badges);
    this.addSettingTab(new BadgesSettingTab(this.app, this));
    this.registerMarkdownPostProcessor(
			buildPostProcessor()
		);
    this.registerEditorExtension(viewPlugin)
    this.addCommand({
      id: 'insert-badge',
      name: 'Insert badge',
      editorCallback: (editor: Editor) => {
        new BadgePickerModal(this.app, editor, this.settings).open();
        }
    });
  }
  async loadSettings() {
    const data = ((await this.loadData()) ?? {}) as Partial<BadgesSettings> & { customBadges?: Partial<BadgeDefinition>[] };
    const { customBadges: legacyBadges, ...rest } = data;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, rest) as BadgesSettings;

    if (Array.isArray(data.badges)) {
      this.settings.badges = data.badges.map(normaliseBadge);
      return;
    }
    // First run, or upgrading from 1.1.x (which stored only user badges in
    // `customBadges`): start from the defaults and merge the user's badges in.
    // A user badge with the same key as a default replaces it, as it did before.
    const badges = copyDefaultBadges();
    for (const raw of legacyBadges ?? []) {
      const badge = normaliseBadge(raw);
      const i = badge.key ? badges.findIndex((b) => b.key === badge.key) : -1;
      if (i >= 0) badges[i] = badge;
      else badges.push(badge);
    }
    this.settings.badges = badges;
    await this.saveData(this.settings);
  }
  async saveSettings() {
    await this.saveData(this.settings);
    refreshBadgeTypes(this.settings.badges);
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
    this.text = badge[0].substring(1).substring(badge[0].length - 2, 0);
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
        if ((to - from) === 6) {
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
  let content = part.substring(part.length - 1, 1).trim().replace(/\\\|/g, '|');
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
  // Shorthand syntax: [!!success] instead of [!!success:Success]. Keys with no
  // badge defined in settings fall back to the capitalised key, e.g. [!!bug] -> "Bug".
  if (parts.length < 2) {
    const knownType = badgeIndex.get(badgeType.toLowerCase());
    if (knownType) {
      badgeContent = knownType.label.trim() || knownType.key;
    } else if (badgeType && !badgeType.includes('|')) {
      badgeContent = capitalise(badgeType);
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
    setBadgeIcon(iconEl, extras[1]);
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
    newEl.setAttr("style", "--customize-badge-color: " + color + ";");
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
      // Keys with no badge in settings are treated as a Lucide icon name.
      const knownType = badgeIndex.get(badgeType.trim().toLowerCase());
      setBadgeIcon(iconEl, knownType?.icon.trim() || badgeType.trim());
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
  // Apply the colour from settings, if one is defined for this key.
  // Set as an inline custom property that styles.css reads.
  const customColor = badgeColors.get(badgeType.trim().toLowerCase());
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

const PLACEHOLDER_OPTIONS: Record<PlaceholderMode, string> = {
  selection: 'Empty',
  label: 'Label',
  custom: 'Custom text',
};

class BadgesSettingTab extends PluginSettingTab {
  plugin: BadgesPlugin;
  constructor(app: App, plugin: BadgesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    const settings = this.plugin.settings;

    new Setting(containerEl).setName('Inserting badges').setHeading();
    new Setting(containerEl)
      .setName('Default placeholder')
      .setDesc('Text used when you insert a badge with nothing selected. Selected text is always used when there is some. Each badge below can override this.')
      .addDropdown((dd) => dd
        .addOptions(PLACEHOLDER_OPTIONS)
        .setValue(settings.placeholderMode)
        .onChange(async (value) => {
          settings.placeholderMode = value as PlaceholderMode;
          await this.plugin.saveSettings();
          this.display(); // show/hide the custom text field
        }));
    if (settings.placeholderMode === 'custom') {
      new Setting(containerEl)
        .setName('Default custom text')
        .setDesc('Avoid ":" and "|", which the badge syntax uses as separators.')
        .addText((text) => text
          .setPlaceholder('Text')
          .setValue(settings.customPlaceholder)
          .onChange(async (value) => {
            settings.customPlaceholder = value;
            await this.plugin.saveSettings();
          }));
    }

    new Setting(containerEl)
      .setName('Badges')
      .setDesc(createFragment((frag) => {
        frag.appendText('Type a badge as `[!!key:text]`, or `[!!key]` to show its label. Icon names come from ');
        frag.createEl('a', { text: 'Lucide icons', href: LUCIDE_ICONS_URL });
        frag.appendText(' — copy the name shown on an icon\'s page, e.g. "smile-plus". Icons added to Lucide very recently may not be in your version of Obsidian yet.');
      }))
      .setHeading();

    settings.badges.forEach((badge, index) => {
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
        const firstIndex = settings.badges.findIndex((b) => b.key === key);
        if (firstIndex !== index) {
          row.nameEl.createDiv({ cls: 'badge-setting-warning', text: 'Duplicate key, ignored' });
        }
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
      const label = (el: HTMLElement, text: string) => {
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
        label(text.inputEl, 'Lucide icon name from lucide.dev/icons, e.g. smile-plus');
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

      // Per-badge placeholder. The custom text box only shows for "Custom text".
      let placeholderTextEl: HTMLInputElement | null = null;
      row.addDropdown((dd) => {
        dd.addOption('default', `Default (${PLACEHOLDER_OPTIONS[settings.placeholderMode]})`)
          .addOptions(PLACEHOLDER_OPTIONS)
          .setValue(badge.placeholder)
          .onChange(async (value) => {
            badge.placeholder = value as BadgeDefinition['placeholder'];
            placeholderTextEl?.toggle(badge.placeholder === 'custom');
            await commit();
          });
        label(dd.selectEl, 'Placeholder when inserting this badge with nothing selected');
      });
      row.addText((text) => {
        text.setPlaceholder('Placeholder text')
          .setValue(badge.placeholderText)
          .onChange(async (value) => {
            badge.placeholderText = value;
            await commit();
          });
        label(text.inputEl, 'Placeholder text for this badge');
        placeholderTextEl = text.inputEl;
        text.inputEl.toggle(badge.placeholder === 'custom');
      });

      row.addExtraButton((btn) => {
        btn.setIcon('trash')
          .onClick(async () => {
            settings.badges.splice(index, 1);
            await this.plugin.saveSettings();
            this.display();
          });
        btn.extraSettingsEl.setAttribute('aria-label', 'Delete badge');
      });
    });

    const missingDefaults = DEFAULT_BADGES.filter(
      (d) => !settings.badges.some((b) => b.key === d.key),
    );
    new Setting(containerEl)
      .addButton((btn) => btn
        .setButtonText('Add badge')
        .setCta()
        .onClick(async () => {
          settings.badges.push(normaliseBadge({}));
          await this.plugin.saveSettings();
          this.display();
        }))
      .then((setting) => {
        // Only offered when some default badges have been deleted.
        if (!missingDefaults.length) return;
        setting.addButton((btn) => {
          btn.setButtonText('Restore default badges')
            .onClick(async () => {
              settings.badges.push(...missingDefaults.map((d) => ({ ...d })));
              await this.plugin.saveSettings();
              this.display();
            });
          btn.buttonEl.setAttribute('aria-label', `Adds back: ${missingDefaults.map((d) => d.key).join(', ')}`);
        });
      });
  }
}

// Modal for inserting badges
class BadgePickerModal extends FuzzySuggestModal<BadgeDefinition> {
  editor: Editor;
  settings: BadgesSettings;

  renderSuggestion(match: FuzzyMatch<BadgeDefinition>, el: HTMLElement): void {
    el.addClass('badge-picker-suggestion');
    const iconEl = el.createSpan({ cls: 'badge-picker-icon' });
    setBadgeIcon(iconEl, match.item.icon || match.item.key);
    const textEl = el.createSpan();
    super.renderSuggestion(match, textEl);
  }

  constructor(app: App, editor: Editor, settings: BadgesSettings) {
    super(app);
    this.editor = editor;
    this.settings = settings;
    this.setPlaceholder('Choose a badge type…');
  }

  getItems(): BadgeDefinition[] {
    return [...badgeIndex.values()];
  }

  getItemText(item: BadgeDefinition): string {
    return item.key;
  }

  // Placeholder used when the editor has no selection: the badge's own choice,
  // or the global default. Newlines are flattened because a badge must stay on
  // one line.
  getPlaceholder(item: BadgeDefinition): string {
    const useDefault = item.placeholder === 'default';
    const mode = useDefault ? this.settings.placeholderMode : item.placeholder;
    let text = '';
    if (mode === 'label') {
      text = item.label.trim() || item.key;
    } else if (mode === 'custom') {
      text = useDefault ? this.settings.customPlaceholder : item.placeholderText;
    }
    return text.replace(/\s*\n\s*/g, ' ').trim();
  }

  onChooseItem(item: BadgeDefinition): void {
    const key = item.key;
    const selected = this.editor.getSelection().replace(/\s*\n\s*/g, ' ').trim(); // minor limitation: the parser treats ':' and '|' as delimiters, so a selection containing those will produce odd results. suggested-todo: strip or escape ':' and '|'
    const placeholder = this.getPlaceholder(item);
    // An empty value would be a syntax error, so fall back to a single space.
    const value = selected || placeholder || ' ';
    const start = this.editor.getCursor('from');
    this.editor.replaceSelection(`\`[!!${key}:${value}]\``);
    if (selected) return;
    const chStart = start.ch + 5 + key.length; // just after "`[!!key:"
    if (placeholder) {
      // Select the placeholder so typing replaces it.
      this.editor.setSelection(
        { line: start.line, ch: chStart },
        { line: start.line, ch: chStart + placeholder.length }
      );
    } else {
      // Blank badge: put the cursor after it.
      const after = chStart + value.length + 2;
      this.editor.setCursor({ line: start.line, ch: after });
    }
  }
}
