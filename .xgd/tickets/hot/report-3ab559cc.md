---
uid: report-3ab559cc
id: REPORT-2424
type: report
title: 'Fix L1 Reproduction Pipeline: Fold & Acceptance Gate (story) — attempt 9'
created_by: xgd
created_at: '2026-08-20T11:32:17.312912+00:00'
updated_at: '2026-08-20T11:32:17.312912+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-2049c9ec
  level: story
  fixes_applied: 8
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — L1 Reproduction Pipeline: Fold & Acceptance Gate (story)

**Attempt**: 9
**Fixes applied this call**: 8
**Violations remaining**: 0
**Needs more work**: false

All four findings of `report-2e87dfd7` (2 violations + 2 warnings) are addressed by
story-body edits — the category the assessor assigned to every row. Each behaviour was
re-verified against the cited source lines before editing; none was taken on the
report's summary alone.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-84 | **Finding 1** — backdrop / section-background bullet: the box now also carries the band's **translucent scrim** (a colour with its own alpha, layered above the background image within that one box); a section folds when it paints an image **or** a scrim; each axis is read from the widest width carrying *it*, since a section may paint an image at some widths and only a scrim at others |
| 2 | story-body-edit | STORY-84 | **Finding 1** — corrected "full-bleed **opaque** panel fill" → "full-bleed panel fill, opaque or translucent", so the stated rule no longer excludes the exact case BUG-24 was filed for |
| 3 | story-body-edit | STORY-84 | **Finding 1** — In scope gains the scrim (fold condition + per-axis widest read); Out of scope now defers *detecting and projecting* the scrim to the capture-side values-diff capability (CAP-63), matching STORY-75's own Out-of-scope line; Technical Context gains a BUG-24 bullet naming both root causes and stating which half is this story's |
| 4 | story-body-edit | STORY-84 | **Finding 3** — reconstructed-run-surfaces bullet gains the second band-seeding path: a fill also seeds a band when its same-fill, untreated runs share a horizontal row spanning full content width whose largest internal gap dominates (a space-between footer/nav strip), with the dominant-gap test named as what keeps an evenly-tiled card grid as cards. In scope updated; Technical Context gains a BUG-19 bullet ordering the bar rule as additive to the majority rule |
| 5 | story-body-edit | STORY-86 | **Finding 2** — the sample-fidelity probe now reports **three** channels, not two: residuals, unmatched, and **mounted** (oracle text inside a behaviour slot rect, rendered by a mounted behavior module). Rationale stated: grading L1 on markup it does not emit would fail a correct reproduction; counting rather than dropping keeps a mounted region from becoming an ungraded hole. Explicitly distinguished from the classifier's control/empty exclusion, which is a different mechanism |
| 6 | story-body-edit | STORY-86 | **Finding 2** — the fold-residual channel sentence corrected from "distinct from the fidelity probe's residuals and unmatched entries" to distinct from all three channels; In scope gains the mounted-behaviour channel alongside the report shapes; Technical Context gains the centre-test / text-path-only / report-field-only mechanics |
| 7 | story-body-edit | STORY-86 | **Finding 4** — sample-fidelity paragraph now states the oracle admits the **width ladder only**: a height-probe re-shoot of a ladder width is deduped out, since admitting it drains the reproduced-leaf queues and reports the whole page as unmatched. Named as the gate-side counterpart of the fold's "keyframe ladder skips the probe" |
| 8 | story-body-edit | STORY-86 | **Finding 4** — In scope gains the width-ladder-only oracle; Technical Context records that the dedup is keyed `(width, state)` locally rather than through the capture package's `partitionProbes`, so `OracleSource` stays structural |

## Verification of the Cited Behaviours

Each edit was checked against the implementation before being written, not inferred
from the finding text:

| Finding | Source read | Confirms |
|---|---|---|
| 1 | `tools/generate/src/l1/fold.ts:1246-1252` (BUG-24 doc comment), `:1260` (`if (!sv.backgroundImageUrl && !sv.overlay) continue`), `:1281-1288` (per-axis widest read, `axes.overlay`) | The OR condition and the per-axis read are live exactly as the finding states |
| 3 | `fold.ts:1383-1396` (BUG-19 doc comment), `barBandFills` `:1397-1407` | Full-bleed bar detection is a distinct seeding path; `GAP = 0.2 * pageContentWidth` is the dominant-gap discriminator against a tile grid |
| 2 | `probes.ts:574-584` (field + rationale), `:621`, `:628-636` (`insideSlot`, centre test), `:656`, `:704-711` (returned) | `mounted` is live, populated on the text path only, and **excluded from `pass`** (`pass: residuals.length === 0 && unmatched.length === 0`) — which is why the body states it can neither fail nor rescue a run |
| 4 | `probes.ts:526-540` (`seenKey` on `${width}:${state}`) | The dedup is local to `oracleBoxes` and keyed as described |

## Tests

No code or test edits this call — all findings were `story-body-edit`. Ran the fold
UATs the report names as candidate evidence for the scrim, to confirm the behaviour I
documented is live and green:

```
npm test -- tests/bug24-scrim-alpha.test.ts
Test Files  1 passed (1)
     Tests  7 passed | 2 skipped (9)
```

## Code Edits (if any)

None this call.

## needs_review Items Forwarded

None. Both violations had settled ownership — finding 1's by STORY-75's own
Out-of-scope line, finding 2's by STORY-84's — so nothing required an operator
decision.

## Carried Forward to the Next Level (NOT actioned here, per the report's instruction)

The assessor's note that both violations imply `ac-add` work downstream is honoured —
no ACs were created this cycle:

| Behaviour | Downstream work | Candidate evidence |
|---|---|---|
| The fold-side scrim (STORY-84) | `ac-add` — STORY-84's 18 ACs cover the backdrop at AC-812 but carry no overlay/scrim axis | Four `test_UAT_FC_BUG-24_*` fold/render UATs already exist in `tests/bug24-scrim-alpha.test.ts` and pass; they are `FC`-named and need re-attribution to a new AC |
| The `mounted` fidelity channel (STORY-86) | `ac-add` **plus** `uat-add` | None — no test references `.mounted`; it is live and operator-visible (`cli/index.ts:636-640`) but untested |
| BUG-19 bar rule (STORY-84) | Likely `ac-add`, lower priority — a warning-severity seeding path within an already-expressed mechanism | Not surveyed this call |

## Matrix-Hygiene Item (unchanged, still not addressable at level=story)

Both stories carry a single scalar `updated_by` and all 34 ACs carry
`intent_uid: None`, so this capability's intent ledger must be rebuilt from the corpus
and the implementation's own attributions on every cycle. The assessor identifies this
as the root cause of the finding-per-attempt pattern across four cycles. It needs a
field-level fix (per-AC `intent_uid` backfill) that the story level cannot reach.
