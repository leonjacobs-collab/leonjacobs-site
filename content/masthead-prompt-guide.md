# Masthead ASCII Art — LLM Prompt Guide

Use this guide to ask an LLM (Claude, GPT, etc.) to generate custom ASCII art mastheads for leonmay.be. The output can be pasted directly into the Masthead Editor textarea at `localhost:4444/masthead`.

---

## The Brief

The masthead always spells **LEON JACOBS** in two stacked lines — "LEON" on top, "JACOBS" below. The canonical version uses a heavy box-drawing style. Custom variants can modify the letterforms, add decorative elements, frames, or structural additions — but must always remain legible as "LEON JACOBS".

The art renders in **Departure Mono** (a monospaced font) with a scramble-reveal animation. Every character matters — each one individually animates from a block fill through random box-drawing glyphs before settling into its final form.

---

## Constraints

| Rule | Value |
|------|-------|
| **Must spell** | LEON (line 1) / JACOBS (line 2) |
| **Max width** | ~52 characters (wider breaks mobile) |
| **Ideal height** | 10–16 lines total |
| **Font** | Monospaced (every character = same width) |
| **Allowed characters** | See character palette below |
| **No trailing spaces** | Lines should not have trailing whitespace |
| **Alignment** | Left-aligned or centred with leading spaces |

## Character Palette

Use **only** these characters. They are all present in Departure Mono and look native to the aesthetic:

```
Box-drawing:  ║ ═ ╔ ╗ ╚ ╝ ╬ ╣ ╠ ╦ ╩ ┼ ─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴
Blocks:       █ ▀ ▄ ░ ▒ ▓
Standard:     space, letters, digits, punctuation
```

Characters **not** in this set will look wrong in the scramble animation (the animation cycles through box-drawing glyphs, so the art should feel like it belongs to that family).

---

## Canonical Base Art

This is the default. Use it as a starting point for modifications:

```
██╗     ███████╗ ██████╗ ███╗   ██╗
██║     ██╔════╝██╔═══██╗████╗  ██║
██║     █████╗  ██║   ██║██╔██╗ ██║
██║     ██╔══╝  ██║   ██║██║╚██╗██║
███████╗███████╗╚██████╔╝██║ ╚████║
╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝
     ██╗ █████╗  ██████╗ ██████╗ ██████╗ ███████╗
     ██║██╔══██╗██╔════╝██╔═══██╗██╔══██╗██╔════╝
     ██║███████║██║     ██║   ██║██████╔╝███████╗
██   ██║██╔══██║██║     ██║   ██║██╔══██╗╚════██║
╚█████╔╝██║  ██║╚██████╗╚██████╔╝██████╔╝███████║
 ╚════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝
```

---

## Colour Regions

After pasting art into the editor, you can paint colour onto line ranges. This is done in the editor UI (not in the text itself). Common patterns:

- **Flag**: paint lines 1–4 one colour, 5–8 another, 9–12 a third
- **Gradient fade**: use progressively lighter hex values across line groups
- **Highlight**: paint only the "LEON" lines (1–6) in one colour, leave "JACOBS" default

Colours are hex strings like `#FFD700` (gold), `#EF4135` (red), `#111111` (black). Lines without a colour use the site's theme default (amber in dark mode).

---

## Example Prompts

### Basic style variant

> Generate ASCII art spelling "LEON" on the first block and "JACOBS" on the second block, using Unicode box-drawing characters (║═╔╗╚╝─│┌┐└┘├┤┬┴) and block characters (█▀▄░▒▓). Use a thin single-line style instead of the heavy double-line style. Keep it under 52 characters wide and around 12 lines tall. Output only the raw art, no code fences or explanation.

### Decorative frame

> Take the following base art and add a decorative border around it using box-drawing characters. The border should be a single-line frame (┌─┐│└┘) with small corner flourishes. Keep the total width under 52 characters. Output only the raw art:
>
> [paste canonical base art here]

### Themed modification

> Generate ASCII art spelling "LEON JACOBS" in two stacked blocks (LEON on top, JACOBS below) using Unicode box-drawing and block characters. Add small star/sparkle decorations (using ░ and ▒ characters) scattered around the letters to give it a festive feel. Keep it under 52 characters wide. The letters should be clearly legible. Output only the raw art.

### Structural addition

> Take this base art and add a small ASCII element below it — a simple horizontal line made of ═ characters with a small diamond (using ╬) in the centre, like a divider. Keep the same width. Output only the complete art including the addition:
>
> [paste canonical base art here]

---

## JSON Schema (for programmatic use)

If generating masthead data as JSON (to PUT directly to `/api/masthead`):

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["active", "defaults"],
  "properties": {
    "active": {
      "oneOf": [
        { "type": "null" },
        {
          "type": "object",
          "required": ["id", "lines", "caption"],
          "properties": {
            "id": {
              "type": "string",
              "description": "Unique identifier for this customisation"
            },
            "lines": { "$ref": "#/$defs/lines" },
            "caption": {
              "type": "string",
              "description": "Text shown below the art (lowercase, monospace)"
            },
            "captionLink": {
              "type": "string",
              "format": "uri",
              "description": "Optional URL the caption links to"
            },
            "activeUntil": {
              "type": "string",
              "format": "date",
              "description": "ISO date (YYYY-MM-DD). After this date, site reverts to default. Omit for no expiry."
            }
          }
        }
      ]
    },
    "defaults": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "lines"],
        "properties": {
          "id": { "type": "string" },
          "lines": { "$ref": "#/$defs/lines" }
        }
      }
    }
  },
  "$defs": {
    "lines": {
      "type": "array",
      "description": "Each element is one line of the ASCII art",
      "items": {
        "type": "object",
        "required": ["spans"],
        "properties": {
          "spans": {
            "type": "array",
            "description": "Ordered left-to-right segments. Concatenated text = full line.",
            "items": {
              "type": "object",
              "required": ["text", "color"],
              "properties": {
                "text": {
                  "type": "string",
                  "description": "The ASCII art text for this segment"
                },
                "color": {
                  "oneOf": [
                    { "type": "null" },
                    { "type": "string", "pattern": "^#[0-9a-fA-F]{6}$" }
                  ],
                  "description": "Hex colour for this segment, or null for theme default (amber)"
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### Example: Belgian flag masthead as JSON

```json
{
  "active": {
    "id": "belgian-flag",
    "lines": [
      { "spans": [{ "text": "██╗     ███████╗ ██████╗ ███╗   ██╗", "color": "#111111" }] },
      { "spans": [{ "text": "██║     ██╔════╝██╔═══██╗████╗  ██║", "color": "#111111" }] },
      { "spans": [{ "text": "██║     █████╗  ██║   ██║██╔██╗ ██║", "color": "#111111" }] },
      { "spans": [{ "text": "██║     ██╔══╝  ██║   ██║██║╚██╗██║", "color": "#111111" }] },
      { "spans": [{ "text": "███████╗███████╗╚██████╔╝██║ ╚████║", "color": "#FFD700" }] },
      { "spans": [{ "text": "╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝", "color": "#FFD700" }] },
      { "spans": [{ "text": "     ██╗ █████╗  ██████╗ ██████╗ ██████╗ ███████╗", "color": "#FFD700" }] },
      { "spans": [{ "text": "     ██║██╔══██╗██╔════╝██╔═══██╗██╔══██╗██╔════╝", "color": "#FFD700" }] },
      { "spans": [{ "text": "     ██║███████║██║     ██║   ██║██████╔╝███████╗", "color": "#EF4135" }] },
      { "spans": [{ "text": "██   ██║██╔══██║██║     ██║   ██║██╔══██╗╚════██║", "color": "#EF4135" }] },
      { "spans": [{ "text": "╚█████╔╝██║  ██║╚██████╗╚██████╔╝██████╔╝███████║", "color": "#EF4135" }] },
      { "spans": [{ "text": " ╚════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝", "color": "#EF4135" }] }
    ],
    "caption": "happy belgian national day",
    "activeUntil": "2026-07-22"
  },
  "defaults": [
    {
      "id": "block-heavy",
      "lines": [
        { "spans": [{ "text": "██╗     ███████╗ ██████╗ ███╗   ██╗", "color": null }] },
        { "spans": [{ "text": "██║     ██╔════╝██╔═══██╗████╗  ██║", "color": null }] },
        { "spans": [{ "text": "██║     █████╗  ██║   ██║██╔██╗ ██║", "color": null }] },
        { "spans": [{ "text": "██║     ██╔══╝  ██║   ██║██║╚██╗██║", "color": null }] },
        { "spans": [{ "text": "███████╗███████╗╚██████╔╝██║ ╚████║", "color": null }] },
        { "spans": [{ "text": "╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝", "color": null }] },
        { "spans": [{ "text": "     ██╗ █████╗  ██████╗ ██████╗ ██████╗ ███████╗", "color": null }] },
        { "spans": [{ "text": "     ██║██╔══██╗██╔════╝██╔═══██╗██╔══██╗██╔════╝", "color": null }] },
        { "spans": [{ "text": "     ██║███████║██║     ██║   ██║██████╔╝███████╗", "color": null }] },
        { "spans": [{ "text": "██   ██║██╔══██║██║     ██║   ██║██╔══██╗╚════██║", "color": null }] },
        { "spans": [{ "text": "╚█████╔╝██║  ██║╚██████╗╚██████╔╝██████╔╝███████║", "color": null }] },
        { "spans": [{ "text": " ╚════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝", "color": null }] }
      ]
    }
  ]
}
```

---

## Quick-Paste Workflow

1. Copy one of the example prompts above
2. Paste into Claude / ChatGPT / any LLM
3. Copy the raw ASCII art output
4. Open `localhost:4444/masthead`
5. Click **Customise**
6. Paste into the art textarea (or click "Reset to Base" first)
7. Optionally paint colour regions
8. Add a caption if desired
9. Set an expiry date if it's for an event
10. Click **Save** to preview locally, **Publish** to push live
