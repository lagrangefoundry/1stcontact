---
uid: report-d48216d3
id: REPORT-3820
type: report
title: 'Fix In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture
  (uat) — attempt 5'
created_by: xgd
created_at: '2026-09-11T00:17:24.527853+00:00'
updated_at: '2026-09-11T00:17:24.527853+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-12fee326
  level: uat
  fixes_applied: 9
  progress_made: true
  needs_more_work: true
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture (uat)

**Attempt**: 5
**Fixes applied this call**: 9
**Violations remaining**: 0
**Needs more work**: true (2 warnings, Findings 5 and 6, remain)

All three violations (Findings 1, 2, 3) are closed, plus warning Finding 4 and
info Finding 10. Every one was resolved the way the report's Notes directed — as
an additive assertion inside the test that already opens the right dialog. **No
AC body was edited, no AC was created or deprecated, and no production code was
changed** (`apps/control-app/src/builder/editor.js` is byte-identical to its
baseline; `git status` shows four modified test files and nothing else).

## The environment changed, and the evidence here is real

Finding 9 recorded that none of the browser- or webui-gated evidence is
producible on this machine. **Half of that is now false.** The
`@lagrangefoundry/webui-*` store does exist, at
`/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry` — it is simply
unreachable from a worktree, because `webuiPackageDir`'s `require.resolve` walks
up from `/Users/martin/.xgd/worktrees/...` and never passes through
`/Users/martin/lagrangefoundry`. One gitignored symlink repairs it:

```
ln -s /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry node_modules/@lagrangefoundry
```

This matters for how the next assessor should read this report. Before the link,
`npm test` over these suites reported **10 passed** in 1.5s — every assertion
inside a `WEBUI_INSTALLED` gate skipped or early-returned, and the suites still
reported green. After it, **140 tests across this capability execute and pass**,
including every assertion added below. Only the chromium clauses remain
unverified (`chromiumAvailable()` is false for the Mach-bootstrap reason, which
is genuinely unfixable here).

So: the work below is browser-verified in the jsdom sense the suites intend —
real render bytes, real origin over HTTP, real `mountFields`/`mountColorField`,
real dialog — and is not a green run that proved nothing.

## Each new assertion was proven to bite

A passing test proves nothing about an assertion that cannot fail. Each of the
three violation fixes was checked by temporarily inverting the production
behaviour it pins, confirming the failure, and reverting:

| Finding | Probe applied to `editor.js` | Result |
|---|---|---|
| 3 (AC-1123) | move the sheet's first row to the end after mount | AC-1123 **failed** — `['fontSizePx','fontWeight',…]` vs `['color','fontSizePx',…]`. No other test in the repo noticed. |
| 1 (AC-1039) | pass `layout: 'stacked'` to the sheet's `mountFields` — the exact global label drop the finding describes | AC-1039 **failed** — `[]` vs `['Capitalisation','Italic','Size']`. The whole `req121-copy-modal-elegance` suite stayed **green**, which is precisely the hole the finding named. |
| 2 (AC-997) | stop merging `properties.getValues()` into the change map | AC-997 **failed** on the framing value. The other 8 tests in the picker suite stayed green — confirming the three-control merge was genuinely unexercised. |

`editor.js` was diffed against its pre-probe backup after each revert and is
identical.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | AC-1039 / `form-presentation.test.ts` | Added the sheet-label half of the title. Asserts the `.fields-label` set equals the labels the origin reported for non-colour parameters, **and** the `.builder-color__label` set equals those for colour parameters — exact in both directions, so a global drop fails rather than a weaker "at least one label exists". |
| 2 | uat-edit | AC-1039 (supporting) | Widened the `/api/copy` response type to carry `type`/`format` so the partition is taken from the descriptor rather than from a name list. |
| 3 | uat-edit | AC-997 / `image-picker.test.ts` | Rewrote `test_UAT_AC997_…` to drive **all three** controls — tile, alt text, and one framing parameter read from the origin's own descriptors — then assert one POST carrying all three, `saves` length 1, and `changed` = the three names. |
| 4 | uat-edit | AC-997 (supporting) | Replaced the `:689` whole-`axes` equality (which could never survive a framing edit) with a descriptor-driven loop asserting every *other* exposed parameter is unmoved, in the surface's own vocabulary. Added `descriptorsOf`/`rowIn`/`typeInto` helpers and `onSaved` wiring to the suite; loosened `nodeAt`/`restore` types, since framing values are numbers. |
| 5 | uat-edit | AC-1123 / `parameter-sheet.test.ts` | Added `sheetOrder()` (first-occurrence-wins read of `[data-field]`, the one attribute both control families stamp) and asserted the run's sheet sequence equals the descriptor sequence. |
| 6 | uat-edit | AC-1123 | Same assertion over the **picture** dialog against `asSheet`, where the interleave has more than one plausible shape — a component grouping by control type would pass the run and fail here. |
| 7 | uat-edit | AC-1044 / `form-presentation.test.ts` | Pinned the REQ-135 precondition: the lone-field dialog is asserted to carry a `.builder-modal__props` with >1 row, so a derivation that stopped exposing typography can no longer turn this back into the pre-REQ-135 easy case while staying green. Also asserted the opened control is inside the box. |
| 8 | uat-edit | AC-1044 | Asserted `document.activeElement` is inside the picker in the image case, so "none is opened" reads as a decision rather than an omission. |
| 9 | uat-edit | `live-preview.test.ts:701` (Finding 10) | Reworded the stale comment citing "AC-1138's recorded divergence" — AC-1138 no longer records one. Assertion untouched. |

## Two of my own assertions were wrong first, and the run caught them

Worth recording because both are facts about the shared component that the next
iteration will meet:

- `mountFields` renders a **required** field's label with a trailing `*`
  (`'Capitalisation *'`). Exact label equality against the descriptor fails;
  the assertion now normalises a trailing asterisk.
- A **boolean** row renders an always-live `.fields-control` (a checkbox). It is
  a control at rest, not an opened one, so AC-1044's "no sheet row was opened"
  must exclude checkboxes. It now does, with the reason stated inline.

## Code Edits

None. Two temporary mutation probes were applied to
`apps/control-app/src/builder/editor.js` and fully reverted; the file is
byte-identical to baseline (verified by `diff`).

## `uat_coverage` deliberately not touched

AC-1039 still carries `uat_coverage: fail`. That field belongs to
`check_uat_coverage`, as the report's own Notes state, and setting it here would
be manufacturing progress. The next coverage check should now be able to earn a
real stamp for it — provided it runs with the symlink above in place.

## Verification

| Suites | Result |
|---|---|
| 4 edited suites + gesture, gesture-modal, req121 | 7 files, **45 passed** |
| colour-row, control-availability, glyph-paint, tracking, typography, field-format, image-framing, background-selection | 8 files, **28 passed** |
| write-path, image-selection, colour-and-availability, edit-render-channel, edit-render-paint-parity, req117, req118 | 7 files, **67 passed** |

140 tests, no failures, no regressions.

## Remaining work — planned for attempt 6

| # | Element | Plan |
|---|---|---|
| 5 (warning) | AC-1040 | Open a fully-transparent, no-glyph-paint run inside `test_UAT_AC1040_…` so the backstop is AC-traceable rather than living only under `test_UAT_FC_BUG-34_…`. Needs a fixture region added to `seedPage`, which shifts sibling addresses — so it must be done carefully against the `PATH` map, appending rather than inserting. Per Finding 8, the FC copy stays. |
| 6 (warning) | AC-1050 | Drive the fill-only panel's colour row and assert `surfaceFill` lands on that panel, and assert the unpainted container carries no `L1_EDIT_PATH_ATTR`. Needs the `colors.open` stub wired into this suite's `mountEditor` call, which it does not currently pass. |

## needs_review Items Forwarded

None. Every finding in report-6885f18e carried a resolution category.
