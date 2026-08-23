---
uid: bug-1bde3bf9
id: BUG-35
type: bug
title: 'Copy modal: Capitalisation never previews — UA reset blocks text-transform
  on the text control'
created_by: xgd
created_at: '2026-08-13T21:16:02.231743+00:00'
updated_at: '2026-08-20T12:50:35.916163+00:00'
completed_at: '2026-08-20T12:50:35.916163+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  severity: medium
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: db9d259c1dbc4c9af1b91f71bafdcb770bcd479d
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - 90b762cf4ff88cc39e0cf43a742b9778d03ca5b6
  - working_sha: af9b8ab43f70ce0f44b736ebe92ca3491d9b0e0f
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  version: 0.1.44
  story_points: 2
  bundled_in: bundle-77b28def
  chat_comment: comment-7086db17
---

## Symptom

In the copy edit modal, the **Capitalisation** control does nothing visible.
Picking Uppercase / Lowercase / Capitalize leaves the words in the editing box
exactly as they were; the change only appears after Save → POST → iframe reload.
Size, Weight and Italic all preview correctly, so the control reads as broken
rather than as slow.

Reproduce: open the builder's Site tab in Edit mode, click a copy segment, change
Capitalisation in the parameter sheet under the box. Nothing moves.

## Root cause

**Not REQ-138's wiring.** `--preview-text-transform` *is* written to the box on
every change (`editor.js` → `previewVarFor`, `page-style.js`), and `builder.css`
consumes it:

```css
.builder-modal__box { text-transform: var(--preview-text-transform, none); }
```

The words, however, live in an `<input>`/`<textarea>` *inside* that box, and the
browser's UA stylesheet sets `text-transform: none` on form controls — which
beats inheritance from the box. The variable lands; it has no route to the glyphs.

Verified in Chromium (playwright), all three elements sharing one parent that
declares `text-transform: uppercase; letter-spacing: 4px; font-style: italic`:

```
input    {"tt":"none","ls":"normal","fs":"italic"}
textarea {"tt":"none","ls":"normal","fs":"italic"}
span     {"tt":"uppercase","ls":"4px","fs":"italic"}
```

This is also precisely why the other three axes work. `fields.css` carries the
host's typography into the control with `.fields-control { font: inherit }`, and
the `font` shorthand expands to family, size, weight and style — exactly the four
that preview. It does not expand to `text-transform` or `letter-spacing`, and
nothing else supplies them.

## Scope: `letter-spacing` is the same defect

`.builder-modal__box` also declares `letter-spacing: var(--preview-letter-spacing,
normal)`, one line above the transform, and it has never reached the words either
— same UA reset, same cause (`ls: "normal"` in the probe above).

That half predates REQ-138: it is REQ-121/REQ-135's "the box mirrors the page's
own typography" being quietly false for any tracked headline. Because
letter-spacing is not an editable parameter it surfaces as mis-mirroring rather
than as a dead control, which is why it has gone unreported.

Both are fixed together. Fixing only capitalisation would leave a known-false
declaration standing in the same CSS rule.

## Fix

Restore inheritance for the two properties the `font` shorthand cannot carry,
scoped to the preview box:

```css
.builder-modal__box .fields-control {
  text-transform: inherit;
  letter-spacing: inherit;
}
```

Confirmed in the same probe: `input` and `textarea` then compute `uppercase` /
`4px`.

This is a deliberate departure from the note at `builder.css:222` — feed the box's
seams rather than override `.fields-control`. The seam route is unavailable here:
there is no `--fields-*` variable for either property, and unlike colour and font
neither can arrive by inheritance at all while the UA rule stands. The override
stays confined to the preview box, which is the only host that wants the *page's*
capitalisation rather than the chrome's.

The general fix belongs upstream in `webui-fields` — `.fields-control` claiming
`font: inherit` while silently dropping two neighbouring inherited text properties
is a component-level gap. Out of scope here; recorded for whoever next touches
that package.

## Test plan

**jsdom cannot observe this defect.** It ships no UA stylesheet and does not
resolve inherited properties through the cascade, so a jsdom assertion would pass
identically before and after the fix and prove nothing. The UAT must drive a real
browser.

`tests/req117-builder-viewport-fill.test.ts` already establishes the pattern —
`loadChromium()` / `launchAnyChromium()` with a graceful `skip()` when no browser
build can be launched.

UATs named `test_UAT_FC_<TICKET-ID>_*`, asserting against the **shipped**
`builder.css` and `fields.css` rather than a hand-written stylesheet, so the test
tracks the real cascade:

- with `--preview-text-transform: uppercase` on the box, the copy control's
  computed `text-transform` is `uppercase` (before the fix: `none`)
- with `--preview-letter-spacing` set, the control's computed `letter-spacing`
  matches (before the fix: `normal`)
- an unset variable leaves the control at the box's default — no forced casing
- a control outside the box (the parameter sheet's own selects) is unaffected

Regression scope: `tests/test_UAT_FC_REQ-138_live_preview.test.ts`,
`tests/req121-copy-modal-elegance.test.ts`, builder suites.

-