---
uid: bug-f3c725f3
id: BUG-70
type: bug
title: 'Builder chrome: unstyled text across the business selector, the Library filters,
  and the blank pane'
created_by: martin-github@westhead.me
created_at: '2026-09-10T17:50:57.027420+00:00'
updated_at: '2026-09-10T18:40:07.629112+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-b74ab55b
  severity: medium
  commits:
  - working_sha: 1cc729c08339b69f3deddc6a24c096bf3b991130
    reconcile_sha: null
    main_sha: null
  version: 0.2.147
  story_points: 3
---

## Symptom

Text on several builder surfaces is unstyled — it does not take the app's
typeface, its size, or both. Three were reported from the screen:

1. **The business selector** in the top bar.
2. **The filter row** at the top of the Library's item list.
3. **The blank pane's** "Pick something on the left, or drop a file here to add one."

An audit of every text-bearing surface the builder renders found the same three
defects in eleven more places. This ticket is the audit and the repair.

## Root cause

Three distinct causes, all of them the same underlying fact: **`.shell` declares
a font FAMILY and no SIZE**, and form controls do not inherit either by default.

### 1. `font: inherit` with nothing to inherit — resolves to 16px

The `font` shorthand resets `font-size` along with everything else. A control
that says `font: inherit` and no more inherits the family from `.shell` and then
walks up looking for a size, finds none declared anywhere, and lands on the
document default of 16px — three points above the 13px the chrome around it
runs at. This is exactly [[BUG-53]], whose fix named six controls; these were
missed by that pass and are the same defect:

| selector | surface |
|---|---|
| `.builder-business__select` | the business switcher — **reported (1)** |
| `.builder-library__search`, `.builder-library__role`, `.builder-library__kind` | the Library filter row — **reported (2)** |
| `.builder-palette__hex-text`, `.builder-palette__rename`, `.builder-palette__new-name` | the palette popup's text inputs |
| `.builder-people__invite-email`, `.builder-people__invite-name`, `.builder-people__add-email`, `.builder-people__add-name`, `.builder-people__fulfil-name` | the Contacts dialogs' inputs |
| `.builder-upload__area`, `.builder-upload__cancel` | the upload sheet's buttons |
| `.builder-signed-out-action` | the "Sign in again" button |

### 2. No font declaration at all — the wrong typeface, not just the wrong size

Worse than the above, because a control with no `font` rule takes the user
agent's own font: a system typeface at the UA's button size. It is not IBM Plex
at the wrong size, it is not IBM Plex at all. `builder.css` contains exactly one
`button` selector (`.shell-actions button`), so nothing reaches these:

- `.builder-toolbar__colors` ("Colors"), `.builder-toolbar__publish` ("Publish"),
  `.builder-toolbar__points` ("Mark Points")
- the mode-toggle buttons inside `.builder-toolbar__modes`, which carry no class
  of their own at all

The toolbar is where this reads worst, because its one non-button — the "Open in
new tab" link — is an `<a>`, which *does* inherit, so it renders at the document
default 16px directly beside system-font buttons at the UA's size. Three
typographies in one bar.

### 3. The blank pane's text is a bare text node

`mountListDetail`'s `emptyDetail` is documented as an `HTMLElement` and is handed
to `replaceChildren`. Both `library.js` and `people.js` pass a **string**, so what
lands in `.list-detail-detail-body` is a raw text node with no element around it:
no padding, no muted colour, no size, and not even the component's own
`.list-detail-empty` fallback, which the string displaces.

### Checked and deliberately not changed

- **Non-text controls** — the row checkbox (`.builder-people__check`), the image
  picker's radio (`.builder-modal__tile-input`), the palette's colour and range
  inputs (`.builder-palette__hex`, `__shade`, `__swatch-input`) and the upload
  file input (`.builder-upload__input`) also carry no font rule, but they render
  no text, so a font declaration on them is inert.
- **`.fc-point__btn`** and the rest of the Marked Points overlay live inside the
  preview iframe and are styled by that overlay's own sheet, deliberately with
  system fonts because the page's `@font-face` rules cannot reach into an
  isolated document.
- **`font: inherit` on container `<div>`s** (`.builder-banner`,
  `.builder-session-notice`, `.builder-signed-out`, `.builder-business`) is a
  no-op — a div inherits its font anyway — and those surfaces are prose, which
  the document default suits. Left alone.

## Fix

Follow the convention [[BUG-53]] established and this stylesheet documents at
length: **declare `font-size` immediately after the `font` shorthand that
clobbers it**, reading the one `--builder-control-font-size` token, so the
result is independent of source order and of any rule added later.

1. Add `font-size: var(--builder-control-font-size)` after the `font: inherit`
   in each of the fourteen rules in cause 1.
2. Give the toolbar a size, so its link takes the chrome's type rather than the
   document default, and give its buttons `font: inherit` plus the token, so
   they take IBM Plex at the chrome's size like every other control.
3. Wrap the empty-pane copy in an element with a class, in both `library.js` and
   `people.js`, and give that class a rule — centred, muted, padded, at the
   chrome's size — so the blank pane reads as a designed state rather than as
   text that fell out of a component.

## Test plan

`tests/test_UAT_FC_BUG-70_builder_text_is_styled.test.ts`, extending the
`winningFontDecl` resolution helper [[BUG-53]] introduced — the assertion is
which declaration WINS by source order, not that one exists, because a rule can
name a control and still lose to a later shorthand.

The audit is what is asserted, so the sweep is exhaustive rather than a named
list: every text-bearing control class the builder's modules actually create is
enumerated from source, and each must resolve to the control token. A control
added later with no size fails here rather than shipping.

- every control named in cause 1 resolves to `var(--builder-control-font-size)`
- the toolbar's buttons and its "Open in new tab" link are one size
- no text-bearing control the builder creates is left with no font declaration
- the Library and Contacts blank panes render an *element* carrying a class that
  the stylesheet has a rule for, not a bare text node