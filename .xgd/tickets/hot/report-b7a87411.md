---
uid: report-b7a87411
id: REPORT-1896
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-12T21:16:35.455240+00:00'
updated_at: '2026-08-12T21:16:35.455240+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: request-8a132869
  plan_item_index: '1'
---

All mutations applied and verified against the code, not just the plan.

**Scope declared:**
- *In scope (changed):* STORY-83 `story-d0a8cfad` body; AC-802; AC-725; five new ACs on STORY-83.
- *Out of scope (untouched, verified):* STORY-100 / STORY-84 / STORY-98 (plan items 2–4), STORY-101, every other STORY-83 AC (AC-683, AC-832, AC-849, AC-686, AC-723, AC-803, AC-684, AC-851, AC-831), all runtime code, all UATs. The diff since `7f355d280` is exactly 8 ticket files.

**One deviation from the plan, deliberate.** The plan listed only AC-802 as a `modify`. AC-725 needed the same treatment and I applied it: its text *enumerates* the shared surface group by name ("…drop shadow, backdrop blur, opacity and blend mode") and states "an image adds `objectFit`", and its structured-forms sentence read "a mask is a named shape (circular, elliptical, or a feathered edge) plus an optional feather width". All three enumerations were made factually incomplete by this commit — the same staleness the plan cites as its reason for touching AC-802. Leaving it would have left the matrix asserting a closed list that the code has since widened. The plan's own "area of uncertainty" note anticipated the AC-725 boundary; the resolution was to correct its enumerations rather than to let the new ACs restate it, so the added ACs carry only order, per-function identity, determinism and the bound.

**Code checks that changed or confirmed the wording:**
- `filter` is on `surfaceAxesShape`, which is spread into `interactionStateShape` (hover/focus) as well as every kind — and `checkSurface` is called from both `node.axes` and each interaction state. The envelope AC's "a state is not a route around the ceiling" is verified, not assumed.
- `objectPosition` sits on `l1ImageAxesSchema` only, and every axes object is `.strict()`, so "refused as an unknown key on every other kind" is a real, testable claim.
- Schema violations route through `projectIssues`, which emits path-located errors — so the ACs' "with the offending field located in the returned error list" holds for the bounds too.
- The renderer clamps as defence in depth beyond the envelope (`Math.min(1, v)` on the greyscale family, `±45` on the lean, `0..1` on roughness). I recorded that as saturation-not-refusal in Technical Context, matching AC-832's existing precedent, rather than writing it into a criterion where it would contradict "refused, never clamped".

```
Upgrade mutations applied for plan item 1 of 4

Target Stories: story-d0a8cfad
Primary Story UID: story-d0a8cfad
Stories Modified: 1
ACs Modified: 2
ACs Added: 5
ACs Removed: 0

tickets_modified:
  stories:
    - "story-d0a8cfad"          # STORY-83
  acceptance_criteria:
    modified:
      - "acceptance_criterion-5bf9f162"   # AC-802 (planned)
      - "acceptance_criterion-3320bbf9"   # AC-725 (deviation, justified above)
    added:
      - "acceptance_criterion-b4dec3fc"   # AC-1124 which part of itself a picture shows
      - "acceptance_criterion-db84cd2e"   # AC-1125 one declaration, renderer-fixed order
      - "acceptance_criterion-bef6df17"   # AC-1126 identity emits nothing, per-function
      - "acceptance_criterion-1c0e88b1"   # AC-1127 typed shape, seed-deterministic
      - "acceptance_criterion-a6b197b2"   # AC-1128 envelope via shared surface check
    removed: []

Progress: 1 of 4 plan items complete
```

Two things the next call should know: the intent ticket has **no comments** (I checked — the body is the whole spec, so nothing in the chain of authority was missed), and STORY-83's body now carries a REQ-136 Technical Context block that already records the deferred bytes-on-the-wire cost and the phase-2 exclusions, so items 2–4 need not restate them.
