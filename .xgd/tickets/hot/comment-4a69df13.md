---
uid: comment-4a69df13
id: COMMENT-1238
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T03:12:45.136682+00:00'
updated_at: '2026-08-20T03:12:45.136682+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f924eef4
  kind: note
---

**Result: FAIL** — 4 violations, 4 warnings, 0 needs_review. Report `REPORT-2341` (`report-f924eef4`) created against `capability-aa030c83`, level=story.

## What drove the verdict

One root cause behind all four violations: **`bundle-4ff83a8b` (BUNDLE-10, `free_and_reconciled` 2026-07-29) is referenced by no ticket in the matrix** — not as `intent_uid`, not in any `updated_by`, across all 30 stories. It reconciled the same day as BUNDLE-8, which *is* attributed, so this is a single skipped intent rather than a genesis boundary.

Five of its members are CAP-63-scoped and all are live in production code today, with nothing in any story describing them:

| Intent | Behaviour | Live at |
|---|---|---|
| BUG-22 | capture records *which box paints the surface* (`SurfaceShape`); diff resolves a split text+box control against it | `capture/types.ts:282`, `capture/values-diff.ts:146,712` |
| BUG-15 | zero-band fallback to a body-spanning band — the only reason `values-diff` can read an L1-rendered flat DOM at all | `capture/extract.ts:1397-1403` |
| BUG-25 | per-text-node run geometry when an element holds multiple runs (was: two runs sharing one box) | `capture/extract.ts:666, 1097` |
| BUG-16 | capture-side web-font barrier + offline re-extraction mirror rewrite (STORY-75 §7 carries only the *diff-direction* half) | `capture/playwright-driver.ts:22-66`, `capture/reextract.ts:50` |
| BUG-24 | scrim captured through the browser-accepted-colour probe (the `rgba()` regex silently skipped every `color-mix`/`oklab` scrim) — warning, since the fold half is CAP-70/71's | `capture/extract.ts:1047,1425` |

I verified absence as substance, not just attribution: grepped all 30 story bodies for each behaviour's distinguishing terms and confirmed each is live at the cited line.

Warnings: STORY-79 and STORY-75 both under-report `updated_by` (STORY-79 carries bundle-31e474b9 §3 and bundle-cceaba25 §2/§4; STORY-75 §7 is REQ-79 from bundle-31e474b9 — the production comment at `values-diff.ts:2477` names it); and BUNDLE-19 (`reconciling`, imminent) adds a `1c preflight` verb that by this capability's own ownership rule belongs on STORY-79 — correctly not yet enforced, the file doesn't exist on this branch.

## What checked out clean

Every axis STORY-75→79 *does* describe is live; STORY-79's gated/ungated verb sets match `cli/preflight.ts:60-72` verb-for-verb; STORY-76's legacy authoring half (`resolveSurfaceGradient`, the `gradient` content-field) is still present, so the overlap-cluster-4 ownership decision holds. No story describes behaviour intent retired.

Two notes: the report body flags that a parallel check on CAP-70/CAP-71 is worth running, since the same skipped intent likely left gaps there. And the ticket-store `git push` failed (`Broken pipe` — offline); the report is committed locally and will need a push when connectivity returns.
