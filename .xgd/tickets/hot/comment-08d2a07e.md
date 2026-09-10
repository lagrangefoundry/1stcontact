---
uid: comment-08d2a07e
id: COMMENT-2582
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T19:00:31.704382+00:00'
updated_at: '2026-09-10T19:00:31.704382+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-5a9c920c
  kind: note
---

All five findings from report-0cde712b are fixed and verified. Report filed as **REPORT-3779** (`report-5a9c920c`).

## What changed — 5 `uat-edit` mutations, no production code

| # | Finding | Fix |
|---|---|---|
| F1 | **AC-1045** — palette clause unverifiable (scaffold declares no palette) | Seeded `site.palette` in `seedSite`; assert the panel's answer carries it, and that the origin's `/api/copy` answer does too |
| F2 | **AC-1117** — no run declaring no weight | Added a Satoshi (faced-family) run with no `fontWeight`, appended last so no address moved; assert the seeded `'400'` is reported, and that re-posting it with new words gives `changed === ['text']` and writes no weight into the node |
| F3 | **AC-1130** — hue/blur no-conversion untested | Change map now carries `hueRotateDeg: 90` / `blurPx: 4`; assert they store un-converted (`{hueRotateDeg: 90, blurPx: 4}`) beside the converted fractions and render as `hue-rotate(90deg)` / `blur(4px)`; identity sweep extended to `contrastPct`, `hueRotateDeg`, `blurPx` |
| F4 | **AC-1049** — no panel declaring no fill; no clear-refusal | Appended a fill-less panel; a `{ref:'moss'}` fill lands and renders, and `null`/`''` are refused **at the field** (`path === '0.5/surfaceFill'`) |
| F5 | **AC-1269** — shade resolution never render-asserted | Assert the re-rendered page carries `shadeHex(PALETTE.ink.value, -0.25)`, and that it differs from the entry's own hex |

F4 needed a reordering, not just an addition: the empty-handle panel the test appends fails the L1 envelope's URL allowlist, so once it exists every write refuses on the ambient page fault. The no-fill panel now goes in first (`0.5`), the write assertions run against a clean envelope, and the empty handle is appended after (`0.6`) for its read. That is what makes the field-scoped `error.path` assertion possible.

## Verification

All 7 in-scope evidence files pass, plus the neighbouring `colour-row`, `control-availability`, `gesture`, and `req117-copy-editing` suites.

One pre-existing failure surfaced and is **not** a regression: `reconciliation-copy-edit-parameter-sheet.test.ts::test_UAT_AC1123` expects control shapes `{integer, enum, boolean}` and gets `{…, color}` — REQ-140's fifth shape, which the in-scope files already record as a deliberate widening. It belongs to story-3bf94bd4 (the browser-gesture capability CAP-86 places out of scope), imports nothing this call touched, and `git status` shows only the four in-scope test files modified. Flagged in the report for that story's owner rather than fixed here.

`uat_coverage` was left alone on every ticket — that field belongs to check/fix_uat_coverage. Declared `needs_more_work: false`, `progress_made: true`, `violations_remaining: 0`.
