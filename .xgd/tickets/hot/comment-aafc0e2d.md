---
uid: comment-aafc0e2d
id: COMMENT-829
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-07T23:28:19.128000+00:00'
updated_at: '2026-08-07T23:28:19.128000+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-4c402cb8
  kind: note
---

Report created: **REPORT-1657** (`report-4c402cb8`) — **FAIL**, 7 violations, 1 warning, 0 needs_review. Schema fields verified as required.

## Verdict

**STORY-86 (the gate) is aligned.** Every reconciled gate intent traces to a live AC — BUG-5→AC-705/724, BUG-7→AC-734, BUG-8→AC-735, BUG-9→AC-709, REQ-94/BUG-27→AC-852–856.

**STORY-84 (the fold) has drifted behind BUNDLE-10** (`bundle-4ff83a8b`, 2026-08-05) — the fold-fidelity wave from the first real reproductions. Neither story records that bundle in its attribution chain (`intent_uid: bundle-31e474b9` → `updated_by: bundle-ee56a66e`, skipping BUNDLE-8 and BUNDLE-10). BUNDLE-11's reconciliation updated the story for its own intents without back-filling BUNDLE-10's.

Six fold behaviours ship in code but are unexpressed or contradicted:

| Intent | Shipped as | Matrix says |
|---|---|---|
| BUG-18 | `responsiveTextTracks` `fold.ts:621/1745` | AC-691: axes from "widest present sample" — **the bug's root cause verbatim** |
| BUG-14 | `buildSolidBands`/`buildCards` `fold.ts:1939` | AC-731: per-run backing boxes — **the model BUG-14 retired** |
| BUG-17 | `foldPadding` `fold.ts:550`, `responsivePaddingTracks:655` | "padding" appears nowhere |
| BUG-20 | `chipAxes`/`isSelfPaintingRun` `fold.ts:939` | AC-730 covers only *text-free* surfaces |
| BUG-19 | `barBandFills` `fold.ts:1276` | AC-731 states only the dominant-fill rule |
| BUG-23 | `localizeAssets` `assets.ts:58` | AC-729: source "resolved at capture time" |

The two contradictions matter most: a UAT written faithfully against AC-691 or AC-731 would assert pre-fix behaviour and fail against current code.

**Separately, REQ-88's `1c repro` is expressed by no story in the matrix.** Its siblings are covered (`cmdRefold`→AC-814, `cmdL1Gate`→AC-708), but `cmdRepro` (`cli/repro.ts:95`) — bundle→servable site, asset mirroring, REQ-93 seam-consistency refusal — has no home across all 25 stories. I filed it as a violation since REQ-88 is reconciled and explicitly asks for it, but flagged the *placement* as an editor judgement call rather than guessing.

Two things worth noting on process: ACs in this tree carry no `intent_uid`/`updated_by`, so attribution had to be resolved at story level via bundles plus intent-body scope statements. And I verified every finding against code in this worktree rather than trusting ticket text — which is how findings 1 and 5 surfaced as contradictions rather than mere omissions.

CAP-73 is correctly `deprecated` with `merged_into` set and zero stories; no exclusivity conflict between the two stories.
