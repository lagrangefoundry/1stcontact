---
uid: report-5a9c920c
id: REPORT-3779
type: report
title: 'Fix Structured Copy Editing: One Validated, Atomic Write Path (uat) — attempt
  4'
created_by: xgd
created_at: '2026-09-10T19:00:14.485538+00:00'
updated_at: '2026-09-10T19:00:14.485538+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-f753cecd
  level: uat
  fixes_applied: 5
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Structured Copy Editing: One Validated, Atomic Write Path (uat)

**Attempt**: 4
**Fixes applied this call**: 5
**Violations remaining**: 0
**Needs more work**: false

All three violations (F1, F2, F3) and both warnings (F4, F5) from report-0cde712b
are addressed. Every one was a `uat-edit`: a clause of an AC's own
`## Verification` naming a second case the fixture never supplied. As the report
predicted, **no production code was suspected or changed** — each behaviour was
already implemented correctly and is now covered.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | AC-1045 / `background-selection.test.ts:284` | Seeded `site.palette` in `seedSite`; assert `got.data!.palette` equals it, and that the origin's `/api/copy` answer carries it too |
| 2 | uat-edit | AC-1117 / `typography.test.ts` | Added a Satoshi run declaring **no** `fontWeight` (`A_UNWEIGHTED`, appended last so no address moved); assert its reported weight is the seeded `'400'`, then re-post that seed with new words and assert `changed === ['text']` and that no weight was written into the node |
| 3 | uat-edit | AC-1130 / `image-framing.test.ts:344` | Extended the change map with `hueRotateDeg: 90` / `blurPx: 4`; assert they are stored **un-converted** beside the converted fractions and rendered as `hue-rotate(90deg)` / `blur(4px)`; added `contrastPct`, `hueRotateDeg`, `blurPx` to the return-to-identity sweep and asserted the at-identity `contrastPct` is not reported as changed |
| 4 | uat-edit | AC-1049 / `background-selection.test.ts` | Appended a panel declaring **no** fill; assert a `{ref:'moss'}` fill written into it lands, renders, and that `null` / `''` are refused **at the field** (`path === '0.5/surfaceFill'`) with the panel untouched |
| 5 | uat-edit | AC-1269 / `colour-and-availability.test.ts:566` | After the shaded reference is stored, assert the re-rendered page carries `shadeHex(PALETTE.ink.value, -0.25)` and that this hex differs from the entry's own |

## Detail on F1 — the fixture was the obstacle, as reported

`cmdNew`'s scaffold declares no palette, so AC-1045's palette clause was not
merely unasserted but unverifiable. `seedSite` now declares a three-entry
palette, which also makes F4's fill write expressible (a fill must be a palette
reference; a free hex is refused by design).

## Detail on F4 — test ordering, not a behaviour change

The empty-handle panel this test appends fails the L1 envelope's URL allowlist,
so once it exists **every** write in the test refuses on the ambient page fault
rather than on its own merits — which is why the first attempt at the fill write
returned `SCHEMA_INVALID` naming `children/5/axes/backgroundImageUrl`. The test
now appends the no-fill panel **first** (`0.5`), runs the write and clear-refusal
assertions against a clean envelope, and appends the empty handle
(`0.6`) afterwards for its read assertion. That is what lets the clear-refusal
assert `error.path === '0.5/surfaceFill'` — proving the refusal is the field's,
not the page's. The pre-existing back-door assertion
(`AC-1049`'s `backgroundImageUrl` write against `A_FILL_ONLY`) still runs after
the empty handle exists, exactly as before, so its meaning is unchanged.

## Scope discipline

Per the report's "do not widen the fix" note, no relaxed count
(`toBeGreaterThan(0)`, `.slice(0, 2)`) was re-pinned, and no AC's
absence-assertions were touched. `uat_coverage` was not set on any ticket — that
field belongs to check/fix_uat_coverage.

## Code Edits

None this call.

## Verification

`npm test -- <the 7 in-scope files>` → **7 files passed**, all 53+ tests green:

- `reconciliation-copy-edit-write-path.test.ts`
- `reconciliation-copy-edit-image-selection.test.ts`
- `reconciliation-copy-edit-background-selection.test.ts` (5/5)
- `reconciliation-copy-edit-field-format.test.ts`
- `reconciliation-copy-edit-typography.test.ts`
- `reconciliation-copy-edit-image-framing.test.ts`
- `reconciliation-copy-edit-colour-and-availability.test.ts`

Neighbouring suites also run: `colour-row`, `control-availability`, `gesture`,
`req117-copy-editing` all pass.

## Pre-existing failure observed (NOT a regression, out of scope)

`tests/reconciliation-copy-edit-parameter-sheet.test.ts` →
`test_UAT_AC1123_...` fails: it asserts the sheet's control-shape set is
`{integer, enum, boolean}` and receives `{integer, enum, boolean, color}`. That
is REQ-140's fifth control shape, which the in-scope files already record as a
deliberate widening (`typography.test.ts` `CONTROL_SHAPES`). The suite belongs to
**story-3bf94bd4** (the browser-gesture/chrome capability CAP-86's body places out
of scope), imports nothing this call touched, and `git status` shows only the four
in-scope test files modified — so the failure predates this call. Flagging for
that story's own owner; not fixed here to stay inside scope.

## needs_review Items Forwarded

None. No finding in report-0cde712b was categorised `needs_review`; F6 and F7 are
`info` rows explicitly recording deliberate re-assertion rather than duplication,
and require no action.
