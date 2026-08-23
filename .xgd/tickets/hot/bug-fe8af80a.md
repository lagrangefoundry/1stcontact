---
uid: bug-fe8af80a
id: BUG-25
type: bug
title: A multi-line text element splits into runs that all share one box
created_by: xgd
created_at: '2026-07-25T21:13:52.591806+00:00'
updated_at: '2026-08-05T17:38:09.547989+00:00'
completed_at: '2026-08-05T17:38:09.547989+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 8496c28e4fd0a813b988263e438aa9ea46fd4508
    reconcile_sha: null
    main_sha: null
  version: 0.0.204
  story_points: 2
  bundled_in: bundle-4ff83a8b
  chat_comment: comment-ad8884dc
---

## Problem

A text element that wraps across lines is split into one run per line, but every
run is given the **same geometry** — the parent element's box *and* the parent's
glyph box. There is no per-line geometry anywhere in the capture, so a fold that
positions runs absolutely has no way to separate them, and they print on top of
each other.

Found on `joyfulculinarycreations.com`, where it lands on the hero `<h1>` — the
most prominent element on the site. Measured at 1280x800:

```
'Dreaming of healthier meals'  box={x:20, y:171.5, 1240x301.6}  glyphs={x:20, y:311.3, 815.2x172.4}
'on your dinner table?'        box={x:20, y:171.5, 1240x301.6}  glyphs={x:20, y:311.3, 815.2x172.4}
```

Identical `box` and identical `renderedTextBox`. The reproduction renders exactly
what that describes: two runs at one position, reading
`ONDYEOAUMRIDNIGNNEROATHAEBALLTEHIER MEALS`.

Scope check on that page: **exactly one** box is shared by more than one run — so
this is not endemic, but the one instance is the hero. `gigabytealchemy.ai` never
exposed it because its headings are single-run.

## Why it matters beyond the visual

The fold's REQ-88 `nowrapFromPx` axis derives a run's line count from
`renderedTextBox.height / lineHeightPx`. When two runs share one glyph box, that
ratio describes the *pair*, so both runs are classified as 2-line and neither is
pinned. A shared box therefore corrupts line-count reasoning as well as position.

## Direction (not prescriptive)

The browser already knows the per-line geometry — `Range.getClientRects()` returns
one rect per line box, which is how REQ-88's cross-engine UAT counts lines. The
capture has the mechanism; it is not being used to *split* geometry, only to
measure extent.

Two candidate shapes, to be decided in design:

1. **Per-line runs with real rects** — keep the split, give run *i* the *i*-th
   client rect. Faithful, and each line becomes independently positionable.
2. **One run with its line breaks** — do not split at all; carry the element's
   text with its natural wrapping and let the renderer re-wrap inside the box.
   Fewer nodes, but re-opens the wrap decision REQ-88 deliberately closed.

(1) is the better fit for a flat absolutely-positioned substrate; (2) trades a
correctness risk this project has already paid for once.

## Acceptance

- No two text runs in a capture manifest share an identical `renderedTextBox`
  unless the source elements genuinely occupy the same rect.
- The joyful hero renders as two stacked lines, not one overprint.
- Line-count classification (`nowrapFromPx`) is computed per line, not per pair.
- A single-line run is unchanged (no regression on `gigabytealchemy.ai`, whose
  values-diff and 3-probe gate must hold at their current numbers).

## Provenance

Found while importing joyfulculinarycreations into the sandbox during REQ-88
round 8. Independent of REQ-88's own changes — the column fit correctly declined
this page (`doc.column` undefined, 0 nodes anchored), so none of that work is
implicated.


Related: [[bug-2936cebf]] (BUG-27 — missing imagery on the same page), [[request-16253634]] (REQ-94 — the gate calibration that let both reach an operator via a screenshot).

-