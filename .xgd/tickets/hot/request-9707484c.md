---
uid: request-9707484c
id: REQ-121
type: request
title: 'The copy-edit modal, made elegant: themed chrome, app typeface, page-faithful
  editing box'
created_by: xgd
created_at: '2026-08-07T23:18:19.851596+00:00'
updated_at: '2026-08-10T11:00:56.450999+00:00'
completed_at: '2026-08-10T11:00:56.450999+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: 86dce8ffe14501c0aad8568f4ef1002045ef7790
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - 3173e3985dba157676d0608bb85442974d891fbc
    - 7dc0ea8ba25b6b7f9bda4f1191623272e36a5d89
  version: 0.1.28
  bundled_in: bundle-e59210c5
  chat_comment: comment-505b98c5
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


---

# As built

Every item above landed. The decisions and discoveries that changed the shape of
it, recorded because the reasons are not recoverable from the diff:

## The typeface

**IBM Plex Sans**, self-hosted from the builder origin — two weights, latin +
latin-ext, four `.woff2` files totalling ~59KB in
`apps/control-app/src/builder/fonts/`. Served by the existing `/builder/` route,
so no routing change was needed; `serve.ts`'s MIME map gained `.woff2`/`.woff`/
`.ttf`, which it had no entry for. No CDN: nothing to be offline for, and no
third party told which sites the operator is editing.

Applied once, as `tokens: { font: APP_FONT }` on `mountShell` — the shell's own
token path (upstream REQ-68), never a stylesheet override of `.shell`.

## The background is NOT an ancestor walk

The first implementation climbed `parentElement` until something painted. That
is the textbook answer and it is **wrong for this renderer**: an L1 fold emits
absolutely positioned boxes (REQ-88), so a hero photograph is routinely a
*sibling* layer beneath the copy rather than an ancestor of it. On
`gigabytealchemy/home` the walk sailed past the photograph and landed on a
neutral wrapper carrying a cream fill — gold copy over a dark photograph
previewed as **gold on cream**, which is both wrong and unreadable. A preview
whose purpose is showing contrast must never produce that.

It now uses `document.elementsFromPoint` at the run's centre, which asks the
question actually being asked — *what is under this pixel* — and answers it in
paint order. The stack is collected down to the first opaque fill and rendered
as one absolutely-positioned layer per painting element, bottom-most first, each
at its own element's dimensions and offset back by the text's position within
it, clipped by the box.

Sizing each layer to its *source* element (rather than copying the shorthand
onto a differently-sized box) is what makes it exact: every layer resolves
against the dimensions it resolved against on the page, so a `cover` photo's
crop and a gradient's stops are the real ones, with no intrinsic-size maths and
correct for layer stacks this code never has to understand. Verified in Chrome
against `gigabytealchemy/home`: two layers — an opaque `rgb(3,7,23)` base, then
a `linear-gradient(...) , url(...)` scrim-over-photograph — composited in the
page's own order.

The ancestor walk survives as the fallback, which is correct when nothing is
absolutely positioned and is the only thing available with no layout at all (a
headless run measures every rect as zero).

## The form opens ready to type

`mountFields` renders a view that becomes a control on click. For a one-field
editing dialog that is a wasted click, and — more to the point — it undercuts
the reason the heading could go: a box you can obviously type in needs no label
saying "Edit text", and until the control exists the box is not one. The modal
now fires the component's own click-to-edit gesture on a lone field. Guarded to
exactly one field: with two (an image's `src`/`alt`) there is no "the" field.

## Known gap — upstream REQ-70 (filed, not blocking)

`.fields` flips to a two-column grid at 44rem, and REQ-69's `stacked` drops only
the *label* column. So in an 880px box a single field lays out at 409px with
425px of nothing beside it (measured). The modal is otherwise complete; the box
will fill its width when that lands. REQ-70 also carries the `autoEdit` ask that
would retire the synthetic click above.

## Incidental fixes made here

- `reconciliation-copy-edit-gesture-modal.test.ts` (REQ-117) was failing all
  five criteria on `main` before this ticket, in isolation and under load. Cause:
  `settle()` waited one macrotask for what is a real HTTP round trip, and late
  dialogs then leaked into the next test (AC-1001 read AC-994's form). Replaced
  with a bounded poll for the dialog. AC-994's "shows the words" assertion now
  reads the control's value rather than the dialog's `textContent`, because those
  words are a form value now instead of a span — the criterion is unchanged.
- `serve.ts` MIME map: `.woff2`, `.woff`, `.ttf`.

## Not fixed here (pre-existing, unrelated, reported)

- `req115-builder-composition.test.ts` →
  `test_UAT_FC_REQ-115_open_in_new_tab_matches_the_iframe_exactly` fails on
  `main` and still fails: the toolbar link does not follow `panel.setSite()`.
  Different surface, different ticket.
- `GET /preview/1stcontact/draft/` answers 500 in the running builder. A data or
  render problem in that site, not the editor.

## Verification

`tests/req121-copy-modal-elegance.test.ts` — 9 UATs against real rendered bytes,
a real builder origin and the installed components. Plus a real-browser pass
(Chrome via Playwright) against `gigabytealchemy`, which is where the ancestor-walk
defect and the two-column defect were both found — neither is visible headlessly,
because jsdom lays nothing out.