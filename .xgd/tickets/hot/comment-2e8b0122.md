---
uid: comment-2e8b0122
id: COMMENT-2589
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T19:42:18.365398+00:00'
updated_at: '2026-09-10T19:42:18.365398+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-e5fd0e6a
  kind: note
---

**Result: FAIL** — 3 violations, 1 warning, 0 needs_review. Report `REPORT-3784` (`report-e5fd0e6a`), schema verified.

## The headline

Two of the three violations are **carried over verbatim from the previous story-level check** (`report-375af0aa`, 2026-08-16). Three fix attempts have been recorded since and **neither story body was edited**. Proof: `story-86c7c21b` and `story-c46abfa6` both show `updated_at` 2026-08-16T06:14 with `last_field_updated: uat_coverage` — a field write from the UAT-coverage check at 06:16, not a body edit — and neither has been touched in the 25 days since. The offending sentences are byte-identical to what the prior report quoted.

## Violations

1. **STORY-102** (`story-c46abfa6`) — "Known upstream limitation" paragraph still claims the chooser "shows the handle rather than a friendly name or a thumbnail" under a rule that gaps are "closed upstream and never wrapped locally". REQ-132 (free_and_reconciled, `6cb3942f`) made both clauses false and did so *locally*: `apps/control-app/src/builder/image-picker.js` header reads "drawn as thumbnails with their file names" and "WHY IT IS HERE AND NOT IN `mountFields`".

2. **STORY-93** (`story-86c7c21b`) — closing bullet still says "the theme-sourced colours" while the story's own first bullet says the theme has no colour surface. `scaffold.ts:47-48` seeds hex literals; `tokens/defaults.ts:9-10` states "REQ-114 — no colour defaults". A whole-body sweep confirms this is the only remaining stale occurrence.

3. **STORY-97 title** (new) — REQ-137 moved from `bundled` to **free_and_reconciled** since the last check, and its code landed (`SHADE_FIT_TOLERANCE = 8`, `colors.ts:372`). The body was correctly rewritten on 2026-08-16 ("supersedes the pixel-identity guarantee", "worst per-channel movement Δ5/Δ8") but the title still promises "without moving a pixel". This is exactly the coordinated rewrite the prior check's warning predicted, applied to the body only.

## What I re-checked rather than assumed

The prior report named REQ-143 landing as the trigger to re-examine STORY-102 and STORY-92. REQ-142/143/145 have all reconciled since. The effect is smaller than allowed for: `1c fonts check` still scans `storage/` with `node:fs` (STORY-92 unaffected), and `/api/assets` survived the origin move to `router.ts:421` (STORY-102's reachability claim holds). The only residue is the **warning** — `listSiteAssets` now reads `opts.store.listAssets()`, so the story's "draft asset directory" phrasing is adapter-specific where the intent is adapter-neutral. Not a violation, since REQ-142 declares "no behaviour change at all" and the fs adapter is still live.

All three violations are single-phrase repairs — no AC needs adding, editing or deprecating, and no `code-issue` is implicated.
