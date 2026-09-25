## Custom Badges

### Introduction

A light-weight plugin for displaying inline "badges" in [Obsidian.md](https://github.com/obsidianmd), with support for user-defined badge types, icons and colors.

> Forked from [gapmiss/badges](https://github.com/gapmiss/badges) (MIT). Custom Badges is an independent plugin and is not affiliated with the original.

### Installation

**Via BRAT (early access):**

1. Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin
2. BRAT settings > Add Beta Plugin
3. Enter `AbbaraS/custom-badges`

**Manually:**

1. download `main.js`, `manifest.json` & `styles.css` from the latest [release](https://github.com/AbbaraS/custom-badges/releases/latest)
2. create a new folder `/path/to/vault/.obsidian/plugins/custom-badges`
3. move all 3 files into that folder
4. Settings > Community plugins > reload **Installed plugins**
5. enable plugin

### Commands

**Insert badge** — opens a fuzzy-search picker listing every badge defined in settings, each rendered exactly as it looks in a note. Choosing one inserts the badge at the cursor. If text is selected when you run the command, that text becomes the badge value; otherwise the badge gets a placeholder (see [Settings](#settings)).

Bind it to a hotkey under Settings > Hotkeys, or run it from the command palette.

### Settings

All badge types live in **Settings > Custom Badges**, in three groups:

- **Default** — the five built-ins (`note`, `info`, `success`, `warning`, `error`). Edit or delete them freely; the reset button restores one, and **Restore default badges** brings back deleted ones.
- **One group per plugin** — badges another plugin created (see [For plugin developers](#for-plugin-developers)), under that plugin's name.
- **Your badges** — ones you made with **Add badge**.

Add or edit a badge in the editor window; the preview at the top updates as you type. Each badge has:

| field | details |
| ----- | ------- |
| Key | what you type: `[!!key:text]` |
| Label | text shown for the shorthand `[!!key]`; leave empty for an icon-only badge |
| Icon | a [Lucide icon](https://lucide.dev/icons/) name, e.g. `smile-plus`, or an emoji, e.g. `🚀` |
| Badge colour | main tint: `#hex`, `R,G,B`, `rgb(…)` or a CSS variable such as `var(--color-red-rgb)` |
| Text colour | optional; defaults to the badge colour |
| Background colour | optional; defaults to a faint tint of the badge colour |
| Border radius | optional, in px |
| Font size | optional, in em (relative to the note text) |
| Placeholder | what **Insert badge** puts in the badge when nothing is selected: empty, the badge's label, or custom text. "Default" uses the global **Default placeholder** setting. |

> [!NOTE]
> Upgrading from 1.1.x: your existing custom badges are kept and added after the defaults. The old list of ~90 built-in types has been removed. Notes that use one of them still render, using the key as the icon name and label, but without the old colour. Add the key in settings to give it a colour again.

### Usage

#### default syntax

```markdown
`[!!KEY:VAL]`
```

| syntax | details                         |
| ------ | ------------------------------- |
| `KEY`  | the type and name of the `ICON` |
| `VAL`  | the value and text displayed    |

#### shorthand syntax

For badges defined in settings, you can omit the value and colon:

```markdown
`[!!KEY]`
```

For example, `[!!success]` displays as "Success" with a checkmark icon. A badge with no label shows just its icon. For a key that isn't in settings, the key itself is shown, e.g. `[!!rocket]` displays as "Rocket".

> [!TIP]
> In addition to the badges in settings, you can use any [Lucide icon](https://lucide.dev/icons/) name as the `KEY`. For example: `[!!rocket:launched]` or `[!!heart:favorite]`.

> [!IMPORTANT]
> the `VAL` cannot contain either the `|` pipe or the `:` colon symbols, as they are used as delimiters for the custom syntax. See [Usage in tables](#usage-in-tables) for using badges inside Markdown tables.

###### example

```markdown
`[!!note:note]`
`[!!info:info]`
`[!!success]`
`[!!warning:check this]`
`[!!error:failed]`
`[!!rocket:launched]`
```

#### Github

###### syntax

```markdown
`[!!|GHX>KEY:VAL]`
```

| syntax          | details                                                                             |
| --------------- | ----------------------------------------------------------------------------------- |
| <code>\|</code> | start pipe symbol                                                                   |
| `GHX`           | Github style, either `ghb` for the blue style or `ghs` for the green success style  |
| `>`             | greater than symbol (delimiter)                                                     |
| `KEY:VAL`       | `KEY` is the type or label, `VAL` is the value text displayed. e.g. `release:1.0.0` |

###### example

```markdown
`[!!|ghb>release:1.2.1]`
`[!!|ghb>issues:2]`
`[!!|ghb>open issues:0]`
`[!!|ghb>closed issues:2]`
`[!!|ghb>contributors:3]`
`[!!|ghb>license:MIT]`
`[!!|ghs>checks:success]`
`[!!|ghs>build:success]`
```

###### results

![](assets/Badges-demo-Obsidian-v1.3.7-20230709171043.png)

![](assets/Badges-demo-Obsidian-v1.3.7-20230709171053.png)

#### Plain-text

##### syntax

```markdown
`[!!|KEY:VAL]`
```

| syntax          | details                               |
| --------------- | ------------------------------------- |
| <code>\|</code> | start pipe symbol                     |
| `KEY:VAL`       | `KEY` is the type, `VAL` is the value |

###### example

```markdown
`[!!|foo:bar]`
```

###### results

![](assets/Badges-demo-Obsidian-v1.3.7-20230709171707.png)

![](assets/Badges-demo-Obsidian-v1.3.7-20230709171713.png)

#### custom

##### syntax

```markdown
`[!!|ICON|KEY:VAL|COLOR-RGB]`
```

| syntax                                               | details                                                                                                                |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| <code>\|</code>                                      | start pipe symbol                                                                                                      |
| `ICON`                                               | [Lucide icon](https://lucide.dev/icons/) name. e.g. `dice` or `lucide-dice`                                            |
| <code>\|</code>                                      | pipe symbol                                                                                                            |
| `KEY:VAL`                                            | `KEY` is the type or label, `VAL` is the value text displayed. e.g. `release:1.0.0`                                    |
| <code>\|</code>                                      | pipe symbol                                                                                                            |
| `COLOR-RGB` <br>(optional, defaults to currentColor) | 3 (R.G.B.) numeric (0-255) values, separated by commas. e.g. `144,144,144` or CSS variable e.g. `var(--color-red-rgb)` |

> [!NOTE]
> The `KEY` is used for the aria-label (accessibility) and is not displayed visually. Only the `VAL` text is shown. To display a label, include it in the `VAL`:
> ```markdown
> `[!!|tag|release:Release 1.2.1]`
> ```
> or simply:
> ```markdown
> `[!!|tag|:Release 1.2.1]`
> ```

> [!IMPORTANT]
> Custom syntax requires actual [Lucide icon](https://lucide.dev/icons/) names (e.g., `pen-tool`, `message-square`). Badge keys from settings like `note` or `success` only work with standard syntax. For example, use `[!!|pencil|note:text|color]` not `[!!|note|note:text|color]`.

###### example

```markdown
`[!!|message-square|comment:edited by j.d.|var(--color-cyan-rgb)]`
`[!!|dice|roll:eleven|120,82,238]`
`[!!|gem|mineral:emerald|var(--my-custom-rgb)]`
`[!!|apple|fruit:snack|var(--color-red-rgb)]`
`[!!|brain|brain:pkm|var(--color-purple-rgb)]`
`[!!|sun|weather:sunny|var(--color-yellow-rgb)]`
`[!!|cloudy|weather:cloudy|var(--mono-rgb-100)]`
`[!!|sunset|weather:8.44pm|var(--color-orange-rgb)]`
`[!!|dumbbell|reps:3 sets of 50|var(--mono-rgb-00)]`
`[!!|gift|event:wedding|var(--color-blue-rgb)]`
`[!!|plus-square|credit:$100|var(--color-green-rgb)]`
`[!!|minus-square|debit:$10|var(--color-pink-rgb)]`
```

###### results

![](assets/Badges-demo-Obsidian-v1.3.7-20230709171541.png)
![](assets/Badges-demo-Obsidian-v1.3.7-20230709171534.png)

#### Links

Badges can be made clickable by adding a link using the `>>` syntax.

##### syntax

```markdown
`[!!KEY:VAL>>LINK]`
```

| syntax | details |
| ------ | ------- |
| `>>` | link delimiter |
| `LINK` | wikilink `[[Note]]` or external URL `https://...` |

###### examples

```markdown
`[!!info:Documentation>>https://obsidian.md]`
`[!!note:See also>>[[My Note]]]`
`[!!tip:Jump to section>>[[My Note#Heading]]]`
```

> [!NOTE]
> Links work with all badge types including custom badges.

#### Usage in tables

When using badges inside Markdown tables, the `|` pipe character conflicts with the table cell separator. To work around this, use escaped pipes `\|` instead of `|` in your badge syntax.

##### syntax

```markdown
`[!!\|ICON\|KEY:VAL\|COLOR-RGB]`
```

###### example

```markdown
| Task | Status |
| ---- | ------ |
| Review code | `[!!\|snowflake\|comment:On Hold\|var(--color-cyan-rgb)]` |
| Write docs | `[!!success:Done]` |
```

> [!NOTE]
> Badges without pipes (e.g. `[!!success:Done]`) work in tables without any changes.

### CSS

Custom `CSS` styles can be applied via CSS snippets. All colors and styles can be over-written just the same.

See [CSS snippets - Obsidian Help](https://help.obsidian.md/Extending+Obsidian/CSS+snippets)

#### variables

```css
body {
	/* border */
	--inline-badge-border-color: transparent;
	--inline-badge-border-radius: var(--radius-s);
	--inline-badge-border: 1px solid var(--inline-badge-border-color);
	/* example custom color */
	--my-custom-rgb: var(--color-green-rgb);
}
/* example CSS customization */
.inline-badge[data-inline-badge^="vault"] {
	--badge-color: var(--my-custom-rgb);
	color: rgba(var(--badge-color), .88);
	background-color: rgba(var(--badge-color),.22);
}
```

#### Styling plain-text badges by type

Plain-text badges include a `data-badge-type` attribute containing the `KEY` value, enabling CSS targeting of specific badge types.

###### examples

```css
/* Style all "Status" badges */
.inline-badge-extra[data-badge-type="Status"] {
	background-color: rgba(var(--color-green-rgb), .22);
	color: rgba(var(--color-green-rgb), .88);
}

/* Style "Priority" badges differently */
.inline-badge-extra[data-badge-type="Priority"] {
	background-color: rgba(var(--color-red-rgb), .22);
	color: rgba(var(--color-red-rgb), .88);
}
```

### Dataview

Badges can act similarly to a key-value store(database) for querying via default search or [Dataview](https://github.com/blacksmithgu/obsidian-dataview) plugin.

View and copy example dataview queries: [badges-dataview](assets/badges-dataview.md)

### For plugin developers

Other plugins can add their own badges, listed in settings under the plugin's name:

```ts
const badges = app.plugins.getPlugin('custom-badges');
// Replaces every badge your plugin added before.
await badges?.setPluginBadges('your-plugin-id', [
	{ key: 'todo', label: 'To do', icon: 'circle', color: '#4caf50' },
]);
```

Optional `prefixIcon` and `prefixLabel` show a leading part before a `|` divider, e.g. a parent group: `{ key: 'phd-report', label: 'Report', icon: '📗', prefixIcon: '📚', prefixLabel: 'PhD' }` shows "📚 PhD | 📗 Report".

Send only the fields your plugin owns: anything you leave out (text colour, font size, placeholder…) keeps what the user set in Custom Badges.

To keep edits the user makes to your badges in Custom Badges settings, add this method to your plugin class. It's called after the user saves; update your own data, then sync again:

```ts
async onCustomBadgeEdited(badge: { key: string; label: string; icon: string; color: string }) {
	// e.g. find what `badge.key` belongs to, copy label/icon/colour onto it, save and re-sync.
}
```

To show a badge in your own settings exactly as notes will show it, with unsaved edits applied live:

```ts
const el = badges?.renderBadge('todo', { label: 'To do', color: '#ff9800' });
```

The key of a plugin's badge can't be changed in Custom Badges, since renaming it would break badges in notes.

Editing `settings.badges` directly and calling `saveSettings()` also works; set `source: 'your-plugin-id'` on each badge.

### Development

###### Clone this repo

```bash
cd /path/to/vault/.obsidian/plugins
git clone https://github.com/AbbaraS/custom-badges.git
cd badges
```

###### Install packages and run

```bash
npm i
npm run dev
```

###### Enable plugin

1.  open `Settings` → `Community plugins`
2.  enable the `Badges` plugin.

### Notes

Thanks to [Markdown Furigana Plugin](https://github.com/steven-kraft/obsidian-markdown-furigana) as an example implementation of Live Preview.

[Lucide](https://github.com/lucide-icons/lucide) Icons: https://lucide.dev

Lucide Icons LICENSE: https://lucide.dev/license
