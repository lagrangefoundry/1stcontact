---
uid: request-9707484c
id: REQ-121
type: request
title: 'The copy-edit modal, made elegant: themed chrome, app typeface, page-faithful
  editing box'
created_by: xgd
created_at: '2026-08-07T23:18:19.851596+00:00'
updated_at: '2026-08-07T23:42:12.932088+00:00'
completed_at: null
last_field_updated: title
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

# REQ-121 — The copy-edit modal, made elegant

Builds on REQ-117 (copy editing end-to-end). REQ-117 proved the loop works;
this makes it something you would want to use. Everything below is one intent —
the modal is one surface, and items 1–5 share a single root-cause fix.

## The root cause behind half of it

`defaultModal` finishes with `document.body.append(host)`
(`apps/control-app/src/builder/editor.js`). The shell mounts into `#app`, and
**every** design token plus the font family live on `.shell`:

    .shell { --shell-bg: …; --shell-accent: …; font-family: system-ui, …; }

The modal is therefore a *sibling* of the themed subtree. It inherits no font
(hence the browser default serif) and resolves none of its `var(--shell-*)`
references, silently falling through to the hardcoded hex fallbacks in
`builder.css`. The modal is not themed today; it merely resembles the theme, and
it does not follow a theme switch. Mounting inside the shell root fixes the font
and the palette together.

## Behaviour

1. **The modal is inside the theme.** It mounts within the shell root, so it
   takes the theme's palette and the app font, and it re-colours when the theme
   changes. No `--shell-*` fallback hex is load-bearing any more.

2. **One app typeface, theme-independent.** A single `--1c-font-ui` constant set
   once at mount via the shell's `font` token (upstream lagrange-framework
   REQ-68). Colour stays a theme token (`--shell-fg`/`--shell-muted`); family
   does not — a theme swaps a palette, not a typeface. Self-hosted from the
   Worker, two weights (400/600).

3. **No redundant chrome.** The `Edit text` heading is dropped for the `fields`
   modal — the dialog keeps its `aria-label`, which is what the heading was
   really for. The heading survives for the `error` and `message` modals, where
   it *is* the content. The `Text` field label is suppressed for the same reason
   (the modal names the segment; the column consumed ~40% of the width to say
   `Text`). The label stays in the descriptor — the CLI and the AI surfaces read
   the same `label`, and it remains the control's accessible name.

4. **CTAs follow the theme.** Cancel and Save take the app font, the theme
   accent, `--shell-radius`, and real hover/focus/disabled states.

5. **The editing box shows the copy as it appears on the page.** The bridge
   already hands the host the live element (`hit.element` in `edit-client.ts`),
   and the preview iframe is same-origin by construction — so the modal reads
   the truth rather than inferring it:

   - **Typography** from `getComputedStyle(hit.element)`: family, weight, style,
     letter-spacing, colour. The site's `@font-face` rules live in the *iframe's*
     stylesheet, invisible to the parent document; same-origin lets us enumerate
     `doc.styleSheets` and copy **only** the `@font-face` rules into a parent
     `<style>` — precise, bounded, and no leakage of the site's layout rules into
     the chrome.
   - **Background** by walking ancestors for the first non-transparent
     `background-color`. If that ancestor also carries a `background-image`, the
     image, its `background-size` and an offset `background-position` are
     mirrored so the real background lines up behind the text. Computed `url()`
     resolves absolute and same-origin. Falls back to the colour, then to the
     document background.
   - **No contrast fallback.** If the text is readable on the page it is readable
     in the box; that is the whole argument for mirroring rather than choosing.
   - **Size is clamped, deliberately.** Family/weight/style/colour/background are
     reproduced exactly, but the rendered size is clamped into an editing range.
     A 72px display headline reproduced faithfully is unusable in a dialog. The
     box previews *style*, not layout — the page is right there behind it for
     layout.
   - **The box is a box.** A visible border in the theme accent, slightly
     rounded (less than the chat entry's 24px), generous padding, a focus ring.

6. **The modal is sized for copy.** Today's `min(520px, …)` is too small for any
   real chunk of text. The panel grows substantially and the editing area is
   tall and resizable, while still never outgrowing the window — the footer, and
   therefore Save, must stay reachable (the existing `max-height` guard holds).

## Dependencies (upstream, lagrange-framework)

Blocking, by the operator's decision — implementation waits on both:

- **REQ-68** — `webui-shell`: `font`/`fontMono` design tokens. The shell pins
  `font-family` in its stylesheet and its token vocabulary has no typographic
  entry, so a host cannot set its own application font through the component's
  own extension point.
- **REQ-69** — `webui-fields`: host-settable control typography
  (`font-size` is pinned at 13px on `.fields`, so `font: inherit` on the control
  can never deliver a size; control radius and textarea `min-height` are
  likewise literals) plus a `layout: 'stacked'` option to drop the label column.

Both are needed for items 2, 3, 5 and 6 to be done *through* the components
rather than by out-specifying their stylesheets. Per DOC-8 §9.4.1 a gap is
closed upstream, never worked around.

## Out of scope

- The image modal's picker behaviour (REQ-118) — it inherits the chrome, font
  and CTA treatment here, but page-typography preview is not applied to `src`
  or `alt`, neither of which is page copy.
- Any change to `copyFieldsOf` field derivation, beyond leaving `label` alone.
- `webui-chat` and the chat pane placeholder.

## Verification

UATs named `test_UAT_FC_REQ-121_*`, against a real edit render in jsdom:

- `..._modal_mounts_inside_shell_and_resolves_theme_tokens`
- `..._fields_modal_has_no_heading_and_no_label_column`
- `..._error_modal_keeps_its_heading`
- `..._control_mirrors_page_typography_and_background`
- `..._control_font_size_is_clamped_to_editing_range`
- `..._font_face_rules_are_copied_from_the_preview_document`
