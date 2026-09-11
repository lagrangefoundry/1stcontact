---
uid: report-4a18649d
id: REPORT-3821
type: report
title: 'Fix In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture
  (uat) — attempt 6'
created_by: xgd
created_at: '2026-09-11T00:25:06.064884+00:00'
updated_at: '2026-09-11T00:25:06.064884+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-12fee326
  level: uat
  fixes_applied: 9
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture (uat)

**Attempt**: 6 (the loop's fifth fixer call; REPORT-3820 was attempt 5)
**Fixes applied this call**: 9
**Violations remaining**: 0
**Warnings remaining**: 0
**Needs more work**: false

Every actionable finding in report-6885f18e is now closed. The three violations
(1, 2, 3) and info 10 were closed at attempt 5 (REPORT-3820, committed as
`2b33084458`). This call closes the two remaining warnings, **Finding 5**
(AC-1040) and **Finding 6** (AC-1050). Findings 7, 8 and 9 carry resolution
category `—` and asked for no edit.

No AC body was edited, no AC created or deprecated, and **no production code was
changed** — `git status` shows two modified test files and nothing else.

## Finding 6 — AC-1050's two unreached clauses

Both clauses the AC's own Verification names are now driven at the AC that
claims them, in `tests/reconciliation-copy-edit-gesture-modal.test.ts`.

**"a colour chosen there lands on that panel."** The test proved the fill-only
panel's field list and that its dialog opens without "Background image", then
pressed Escape. It now drives the row: clicks the swatch, asserts the palette was
asked with `null` (the panel holds a hex literal, so there is no entry to
pre-select), asserts the pick is *staged* and not committed, Saves, and asserts
`surfaceFill` on that panel becomes the palette **reference** `{ref:'brand'}`
rather than a resolved hex — and that the panel next door, which also paints a
fill, is untouched. A row wired to the wrong address would be invisible without
that last one. One POST, `/api/copy`, and the served rendering repaints with the
entry's value.

This needed a fixture addition: the suite's site had **no palette**, so there was
nothing to choose. `seedPage` now writes a two-entry palette whose values collide
with neither fill the page paints — otherwise "the panel is now painted from the
palette" could not be told from "it was already that colour". Every node keeps
its hex literal, which is the state a folded site is really in and the one the
existing "reported rather than resolved to an entry it never named" assertion
depends on.

**"a box or container that paints nothing at all is not offered as a region."**
Anchored to the **element** rather than to a selector miss: `document.getElementById('root')`
is the unpainted root container, and the test asserts it is rendered, carries
neither `data-l1-path` nor `data-l1-segment`, and contains a painted container
that *is* addressable. A bare "no element matches `[data-l1-path="0"]`" would
have been satisfied by a page that never rendered at all.

## Finding 5 — AC-1040's backstop, now AC-traceable

The AC scopes *"A foreground that paints nothing is not a foreground"* as a
backstop over the whole mirroring rule, and its Verification asks for a run whose
resolved colour is fully transparent **and which carries no glyph paint**. That
case was real but lived only under `test_UAT_FC_BUG-34_…`, traceable to the
intent rather than to the AC.

`seedPage` in `reconciliation-copy-edit-form-presentation.test.ts` gains one
region — `[0.9]`, a run carrying the page's own family and weight with
`color: '#00000000'` — **appended last, so no existing address moves**
(`PATH.seam` stays `0.8`; nothing in the suite asserts a region count). Inside
`test_UAT_AC1040_…` the form is opened over it and asserts `--preview-color` is
empty, `--preview-text-image` is empty, **and** that family and weight *are* still
mirrored — so the box degraded because there was no paint, not because the
dressing failed. Per Finding 8 the BUG-34 copy is left in place.

This reaches the backstop by the **other** route — an author-set transparent
colour rather than a gradient — which is what makes it a backstop rather than the
gradient case wearing a different hat.

## Each new clause was proven to bite

Three more mutation probes, each applied to production code, confirmed failing,
and reverted (all three files `diff`-identical to their backups afterwards):

| Clause | Probe | Result |
|---|---|---|
| AC-1050 colour lands | `editor.js`: drop `colors` from the staged-values merge | **failed** — `'#101822'` vs `{ref:'brand'}` |
| AC-1050 unpainted container | `render.ts` `segmentKind`: return `'container'` by kind instead of `l1PaintsSurface(node) ? … : null` | **failed** — the root was stamped |
| AC-1040 backstop | `page-style.js`: `put('--preview-color', cs.color)` unconditionally | **failed** — `'rgba(0, 0, 0, 0)'` vs `''` |

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | AC-1050 / `gesture-modal.test.ts` | Added a two-entry `PALETTE` and wrote it to the seeded site's `site.json`, so the colour row has something to pick. |
| 2 | uat-edit | AC-1050 | Imported `shadeHex`; wired `colors: { shadeHex, open }` into the test's `mountEditor`, recording what the row asks the palette with. |
| 3 | uat-edit | AC-1050 | Drove the fill-only panel's colour row end to end: asked-with-`null`, staged-not-committed, Saved, landed as a palette reference on that panel and no other, one POST, page repaints. |
| 4 | uat-edit | AC-1050 | Asserted the unpainted root container is rendered, carries neither edit attribute, and contains an addressable painted container. Also asserted the fill-only dialog is not a dead end (no "Nothing to edit", no picker, no box). |
| 5 | uat-edit | AC-1050 (supporting) | Added `draftNodeAxes(index)`; made both POST-count assertions relative to a local baseline so the new Save does not turn a per-dialog claim into a running total. |
| 6 | uat-edit | AC-1040 / `form-presentation.test.ts` | Added `INVISIBLE` / `INVISIBLE_COLOR` constants and region `[0.9]` — appended last so no address shifts. |
| 7 | uat-edit | AC-1040 | Added `PATH.invisible`. |
| 8 | uat-edit | AC-1040 | Asserted the backstop inside `test_UAT_AC1040_…`: no `--preview-color`, no `--preview-text-image`, family and weight still mirrored. |
| 9 | verification | three production files | Three mutation probes applied, confirmed failing, reverted; all verified byte-identical. |

## Code Edits

None. Three temporary probes were applied to `apps/control-app/src/builder/editor.js`,
`packages/framework/src/l1/render.ts` and `apps/control-app/src/builder/page-style.js`,
and fully reverted. All three verified identical to backup.

## Verification

| Suites | Result |
|---|---|
| both edited suites + image-picker, parameter-sheet, live-preview, gesture, req121, `FC_BUG-34` | 8 files, **49 passed** |
| colour-row, control-availability, glyph-paint, tracking, typography, field-format, image-framing, background-selection, write-path, image-selection, colour-and-availability | 11 files, **60 passed** |
| edit-render-channel, edit-render-paint-parity, req117, req118, `FC_REQ-138` | 5 files, **41 passed** |

**150 tests, no failures.** Both fixture changes — a new region on the
form-presentation page and a palette on the gesture-modal site — were swept for
regressions across every suite in the capability and caused none.

## A standing caveat on how to read any green run here

Repeated from REPORT-3820 because it governs whether this evidence means
anything. The `@lagrangefoundry/webui-*` store is reachable from the main
checkout but **not from a worktree**, and every suite in this capability *passes*
when it is missing (`it.skipIf(!WEBUI_INSTALLED)`, or an early `return` after a
`console.warn`). One gitignored symlink repairs it:

```
ln -s /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry node_modules/@lagrangefoundry
```

It is in place for this session, and every number above was produced with it.
Without it these same suites report ~10 trivially-passing tests. The
chromium-gated clauses remain genuinely unverifiable here (Mach bootstrap), and
those still print `NOT VERIFIED` as designed.

## `uat_coverage` deliberately not touched

AC-1039 still reads `fail`; AC-1143 and AC-1279…AC-1284 still carry nothing. That
field belongs to `check_uat_coverage`, as report-6885f18e's own Notes state, and
setting it here would be manufacturing progress. A coverage check run *with the
symlink in place* should now be able to earn real stamps.

## needs_review Items Forwarded

None. Every finding in report-6885f18e carried a resolution category, and all six
actionable ones are closed.
