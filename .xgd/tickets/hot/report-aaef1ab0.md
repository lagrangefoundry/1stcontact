---
uid: report-aaef1ab0
id: REPORT-2442
type: report
title: 'Fix L1 Reproduction Pipeline: Fold & Acceptance Gate (ac) — attempt 8 (cont.)'
created_by: xgd
created_at: '2026-08-20T12:57:42.637694+00:00'
updated_at: '2026-08-20T12:57:42.637694+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-2049c9ec
  level: ac
  fixes_applied: 3
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — L1 Reproduction Pipeline: Fold & Acceptance Gate (ac)

**Attempt**: 8 (continuation — second call in this level's loop)
**Fixes applied this call**: 3
**Violations remaining**: 0
**Needs more work**: false

This call closed the two findings held back last call — the three the report itself flagged
as "the substantial ones". Together with the previous call's 8 mutations, **all 12
violations and the 1 warning in `report-af76ac2a` are now addressed**.

Finding 5 was authored as **two** ACs, as the report suggested: the story body gives it two
full paragraphs and the code gives it 200 lines, and the fit and the anchoring have
different failure modes and different refusal rules.

## Actions Taken — by Resolution Category

| # | Category | Element | Finding | Action |
|---|---|---|---|---|
| 1 | ac-add | AC-1350 (acceptance_criterion-2d1d275c) | 5 (a) | **The content-column fit.** Evidence is content boxes only (a full-bleed band is excluded, `fold.ts:363-367`); the origin is the **modal** left edge, not the minimum (`:369-374`); the extent is measured among that column's own runs (`:375-378`); inset from the narrowest width, container from any risen width with all estimates agreeing within a pixel (`:385-391`); the content cap is the smallest stopped extent (`:393-395`); and the whole fit is **rejected** unless it reproduces every sampled origin *and* extent within a pixel (`:400-404`), with a ≥3-width / ≥1-risen-width evidence floor (`:383`, `:388`). The column lands on the document only when a node actually anchors to it (`:2310`). |
| 2 | ac-add | AC-1351 (acceptance_criterion-186df008) | 5 (b) | **Per-axis column anchoring** and its three refusal rules. Left edge and extent fit independently, either may anchor alone (`fold.ts:517-538`); each axis is affine in the column extent, admitted only on an all-sample fit (`:490-499`), needing ≥2 distinct extents (`:465-468`) and a plausible column fraction (`:434-442`). Refusals: cap on the **extent only** and only on an **over-determined** fit (`:500-512`, `:515-516`); no closed form → keyframed residual inset **inheriting the node's geometry segments** (`:519-533`); full-bleed element **never anchored** (`:523` guard). |
| 3 | ac-add | AC-1352 (acceptance_criterion-87e0402d) | 3 | **Viewport-height probe pair and the measured height response.** The keyframe ladder skips the probe (`fold.ts:160-168`); the pair joins at the same width **and** the same engine, and a zero height difference contributes nothing (`:188-199`); the pair folds to `{yFactor, heightFactor}` (`:249-258`) with eighth-snapping and an inert-response-emits-nothing rule (`:242-247`); elements join by identity + document-order FIFO (`:266-288`). Both attribution rules: a **band** takes its response from its section edges, requiring every width to agree (`:301-333`, `:1552-1579`), and a **reconstructed card** inherits its representative row's (`:1687-1688`); a text leaf takes its own (`:1813-1814`). |

All three created under `story-8acc338d` (STORY-84) with `kind=behavior`,
`uat_coverage=fail`, and promoted from the create-time `pending` status to `active` to
match every other AC in the capability.

## Cumulative Position Across Both Calls

| Finding | Severity | Status |
|---|---|---|
| 1 scrim | violation | closed — AC-1345 |
| 2 per-side padding + track | violation | closed — AC-1346 |
| 3 viewport-height probe | violation | **closed this call — AC-1352** |
| 4 no-wrap threshold | violation | closed — AC-1347 |
| 5 content column (fit + anchoring) | violation | **closed this call — AC-1350, AC-1351** |
| 6 materialization | violation | closed — AC-1349 |
| 7 derived form config + gap channel | violation | closed — AC-1348 |
| 8 captured surface-bearing rect | violation | closed — AC-731 rewritten |
| 9 full-bleed bar seeding path | violation | closed — AC-731 |
| 10 `mounted` channel | violation | closed — AC-705 |
| 11 synthesized-surface exclusion | violation | closed — AC-705 |
| 12 width-ladder-only oracle | violation | closed — AC-705 |
| 13 slot clip retention | warning | closed — AC-736 |
| 14, 15 exclusivity | info | no action required (assessor: "No action") |

STORY-84 goes from 18 ACs to 26; STORY-86's 16 are unchanged in count, with AC-705 and
AC-736 rewritten.

## Code Edits (if any)

None, in either call. Consistent with the validation report's own note: every behaviour was
located in shipped code and cited by file:line before being written up as a matrix gap.

## Observation Forwarded (not acted on)

`tools/generate/src/l1/fold.ts:451-459` — `fitAnchor`'s JSDoc still claims an anchor is
"Returned only when the fit reproduces every sample to within a pixel **on both axes**.
Both, because the renderer takes `x` and `width` from the anchor together". Its own function
body contradicts that at `:535-538` (`if (!x && !width) return undefined` — either axis may
anchor alone), as does the story body's "A column anchor is fitted per axis, not as one
undivided thing", which passed its alignment check one cycle ago. The **behaviour** is
per-axis and AC-1351 documents the behaviour, not the stale comment.

This is a stale doc comment, not a behavioural defect — no test would catch it and no
matrix element depends on it. Flagging rather than editing: it is a code change outside the
ac-level scope, and the constraints call for named-evidence code edits only.

## needs_review Items Forwarded

None. Every finding carried an explicit resolution category and traced to an **In scope**
clause in a story body that passed its own alignment check one cycle ago.

## Handing Back

`needs_more_work=false` — every violation and the warning have been addressed. The
assessor should re-run the ac level. The eight new ACs (AC-1345 … AC-1352) carry
`uat_coverage=fail` by design: this is level=ac, and their Verification sections were
written as concrete executable test plans — fixture shape, the discriminating assertion,
and the counter-case that would fail without the rule — so the uat phase has a
specification rather than a restatement of the criterion.
