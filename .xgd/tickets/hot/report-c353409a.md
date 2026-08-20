---
uid: report-c353409a
id: REPORT-2365
type: report
title: Fix 1c Capture & Diff Fidelity (ac) — attempt 7
created_by: xgd
created_at: '2026-08-20T04:37:01.232688+00:00'
updated_at: '2026-08-20T04:37:01.232688+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-aa030c83
  level: ac
  fixes_applied: 10
  progress_made: true
  needs_more_work: true
  violations_remaining: 3
  anchor_report_uid: report-2485c83c
---

# Fix Summary — 1c Capture & Diff Fidelity (ac)

**Attempt**: 7
**Fixes applied this call**: 10
**Violations remaining**: 3
**Needs more work**: true

Strategy this call followed the report's own Notes: STORY-76 was closed **entirely**
(findings 7, 8, 9, 10) because findings 8 and 9 are five cycles old and finding 9
regenerates unless the AC and the story body are edited in the same pass — both were.
Then the three STORY-75 findings whose code sites I could ground first-hand.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-638 (`acceptance_criterion-a657c39c`) | Stop colour narrowed to a `#hex` literal; the palette-role alias moved to the **rejected** side, cited to REQ-114 (`request-3cd338cd`, free_and_reconciled 2026-07-31). Direction clause left untouched (still a degrees number or a listed alias, per `validate.ts:117-125`). Verification gained a role-alias-rejected case and a bad-direction case. **Finding 9** |
| 2 | story-body-edit | STORY-76 (`story-82eb6908`) | Paired with #1 — the same stale clause lived in the body. Item 2's "Authored" bullet now reads "an absolute `#hex` literal", with the REQ-114 retirement stated. The Technical Context bullet that asserted stop colours "resolve literal-or-role identically to the value system's colour dial" was rewritten to the literal-only rule plus the drop-the-whole-gradient behaviour. Nothing else changed. **Finding 9** |
| 3 | ac-add | AC-1307 → STORY-76 item 3 | In-browser stop-colour resolution (REQ-72): modern-colour-space stops resolved to `#rrggbb` before `normalizeGradient`, positions/keywords/direction untouched, applied to **both** captured declarations, pre-REQ-72 bundle raises no delta. **Finding 7** |
| 4 | ac-add | AC-1308 → STORY-76 item 2, "Captured" | The four-clause selection rule: nearest painting ancestor wins; a `background-clip: text` gradient is skipped; the walk stops at the first opaque solid; no gradient ancestor records none. **Finding 8 — the five-cycle one** |
| 5 | ac-add | AC-1309 → STORY-76 item 2, "Authored" | Resolver-scoped, free of AC-637's module-render framing: `resolveSurfaceGradient` with ≥2 stops returns a `background-image: linear-gradient(...)` in painted order with authored-or-distributed positions; empty declaration for a single stop; a non-literal stop drops the whole gradient. **Finding 10** |
| 6 | ac-deprecate (durability repair) | AC-637 (`acceptance_criterion-377af866`) | Carried `lifecycle: deprecated` — a field not in the acceptance_criterion schema, which nothing reads and which leaves the AC `active` in the matrix. Set the durable top-level `status: deprecated` (verified: it now lists as `deprecated`). Body preserved. Its behaviour is carried forward by AC-1309 |
| 7 | ac-add | AC-1310 → STORY-75 item 2 | Per-text-node run geometry (BUG-25): the two-branch rule, plus both consequences — a fold cannot stack a split element's runs at one coordinate, and `nowrapFromPx` reads each run's own line count. **Finding 1** |
| 8 | ac-add | AC-1311 → STORY-75 item 5 | Surface-bearing box (BUG-22), both halves: the `surface` record (`self` discriminator, document-coordinate box, radius/shadow/border, tightest-first) and the diff resolving `shape`/`border`/geometry against it — with all four narrowness guards (self-paints-both-sides unchanged, no per-run band noise, a genuinely lost rounding still reports, a pre-`surface` bundle inert). **Finding 2** |
| 9 | ac-add | AC-1312 → STORY-75 item 15, the axis | Adjacent-gap axis (REQ-73): rows grouped by reference y-overlap, HIGH severity, 6px default / 16px `--tolerant`, overlapping rows skipped, one wrong gap = exactly one delta, `expected − actual` is the correction. **Finding 6** |
| 10 | ac-add | AC-1313 → STORY-75 item 15, the retirement | Band `paddingTopPx`/`paddingBottomPx` captured but not compared, scoped so band `textAlign` and per-element padding comparison stay live. **Finding 6** |

STORY-75: 14 → 18 ACs. STORY-76: 5 → 8 (one now durably deprecated).

## Grounding

Every AC authored above was written against the code read at HEAD this call, not
against the report's citations taken on trust:

| Claim | Verified at |
|---|---|
| `validateColor` is hex-only; the two stale comments are prose only | `packages/framework/src/modules/validate.ts:96-107`, `:130-134`; stale text at `:131`, `:167` |
| `resolveSurfaceGradient` live and exported; `''` under two stops; a non-literal stop drops the whole gradient | `packages/framework/src/modules/text-style.ts:195-207`, `:223-226`; `resolveColor` hex-only at `:165-167` |
| Surface-gradient selection walk (nearest / skip text-fill / stop at opaque) | `tools/generate/src/cli/capture/extract.ts:831-851` |
| `hexifyGradient` probe, applied to both declarations | `extract.ts:329-347`, called at `:846` and `:1132` |
| Two-pass run collection keyed on per-element run count | `extract.ts:1101-1115` |
| `surfaceOf` returns `self` + `box` + radius + shadow + border, tightest-first | `extract.ts:864-888` |
| Gap axis: row grouping by reference y-overlap, overlap skip, tolerance | `tools/generate/src/cli/capture/values-diff.ts:2493-2541`; `gapTol = tol(opts.gapTolerancePx, 6, 16)` at `:1955`; `gap: 'HIGH'` at `:1129` |
| Band vertical padding deliberately not compared; band `textAlign` still compared | `values-diff.ts:2575-2583` |

Note the report's file paths for the capture/diff sources are stale in one respect:
they read `extract.ts` / `fidelity.ts` bare, and the files live at
`tools/generate/src/cli/capture/extract.ts` and `tools/generate/src/cli/fidelity.ts`.
Line numbers matched.

## Code Edits (if any)

None this call. The two stale comments in `validate.ts` (`:131`, `:167`) that the
report flagged as out-of-scope remain untouched — still worth a free-coded cleanup,
since they are the most likely reason AC-638 survived five cycles.

## Remaining Violations (planned for next iteration)

| # | Element | Why not this call |
|---|---|---|
| 3 | STORY-75 item 9 — capture-time font settling (BUG-16) | Three distinct mechanisms (post-settle web-font barrier with a bound, offline mirrored-face URL rewrite + `text/css` mirror, real-painted-face `fontLoaded` probe). Needs its own grounding pass over `extract.ts:369`, `:389-395`, `:1152` before authoring, and must stay explicitly complementary to AC-715 rather than restating it |
| 4 | STORY-75 item 11, second rule — all-collapse body-spanning fallback (BUG-15) | `extract.ts:469`, `:1391`. Must assert the dormancy case on a semantic multi-band page as well as the fallback itself |
| 5 | STORY-75 item 12, colour-probe clause (BUG-24) | The four modern syntaxes with alpha preserved, plus the lossless-serialization-over-pixel-readback rule. AC-816's translucent-fill exclusion depends on it, so the two need reading together |

Warnings 12 (AC-656 / AC-1290 exclusivity) and 13 (STORY-116's JSON-shape clause)
also remain; both are warnings, and I will take them after the three violations.

## needs_review Items Forwarded

None. Finding 10 carried a flagged alternative resolution (retire the authoring half
from the story body instead of authoring an AC, since `resolveSurfaceGradient` has no
production callers). I followed the assessor's `ac-add` categorisation, as it does not
overturn the capability body's deliberate retention of the resolver — recording it here
so the choice is not re-litigated.
