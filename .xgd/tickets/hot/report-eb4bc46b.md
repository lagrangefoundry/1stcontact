---
uid: report-eb4bc46b
id: REPORT-2335
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-20T03:00:27.409132+00:00'
updated_at: '2026-08-20T03:00:27.409132+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-77b28def
  plan_item_index: '4'
---

Clean tree — no runtime code touched, and the ticket store committed its own changes.

**Scope validated.** In scope: `story-37a3921b` (STORY-100) and its ACs. Out of scope and left alone: STORY-101 (`story-3bf94bd4`, item 5's client half), STORY-97/STORY-80 (palette value model and census — their stale worked examples about the deleted example sites belong to their own intents), and item 8's stored-site predicate.

**Intent read first.** REQ-140 §4 ("the write side is the authority, not the client") and REQ-139's stated faithfulness rule are what the matrix now records. Two things I checked against intent rather than inferring from code:

- REQ-139's design note that a lock refuses a *change* and never the status quo — the code confirms it (`lockError` compares against what the derivation reported), and it corrects a latent defect in the italic lock AC-1120 already carried, so that AC was sharpened rather than left standing.
- REQ-140 §7's dead-site deletion touches STORY-80/STORY-97's worked examples. Per the plan's Step 3b, I did **not** absorb those — they belong to the owning intents.

**One addition beyond the plan's AC list.** AC-1278 (the read call answering with the nearest painted panel behind a run and its fill). This is a server-side observable of *this* surface, proven by REQ-140's own `..._the_panel_behind_a_run_is_its_nearest_painted_ancestor`, and item 5 owns only the modal row that consumes it. Without it the behaviour would have had no owner.

```
Upgrade mutations applied for plan item 4 of 9

Target Stories: story-37a3921b
Primary Story UID: story-37a3921b
Stories Modified: 1
ACs Modified: 5
ACs Added: 10
ACs Removed: 0

tickets_modified:
  stories:
    - "story-37a3921b"
  acceptance_criteria:
    modified:
      - "acceptance_criterion-8a3c8c3e"   # AC-1045 panel now exposes its fill, image picker is the second field
      - "acceptance_criterion-6ee8863b"   # AC-1049 no longer an empty field list; never-added claim survives
      - "acceptance_criterion-95afd919"   # AC-981  worked example of "nothing to edit" moves panel -> seam
      - "acceptance_criterion-08c7ebe8"   # AC-991  vocabulary grew a third time, to the palette reference
      - "acceptance_criterion-97f5dee6"   # AC-988  palette-membership refusal; unavailable binds a change only
      - "acceptance_criterion-3235871e"   # AC-1120 italic lock carries its reason; refuses a change, not a post
    added:
      - "acceptance_criterion-28031659"   # AC-1269 run's colour: reports a literal, writes a reference
      - "acceptance_criterion-c6af20ad"   # AC-1270 every painted panel exposes its fill; a seam none
      - "acceptance_criterion-04f1776e"   # AC-1271 server-side colour refusals at the field
      - "acceptance_criterion-97dc16b1"   # AC-1272 status quo is not a change; canonical reference form
      - "acceptance_criterion-95697465"   # AC-1273 no unavailability without a reason, store-wide
      - "acceptance_criterion-bdfc47f9"   # AC-1274 gradient-painted run: inert/lossy lock
      - "acceptance_criterion-073d2b90"   # AC-1275 a sibling parameter is not occlusion
      - "acceptance_criterion-828c2981"   # AC-1276 refusal message == the field's own reason
      - "acceptance_criterion-6e64a161"   # AC-1277 CLI listing marks a locked field
      - "acceptance_criterion-4a753cde"   # AC-1278 the panel behind a run (read half of the escalation)
    removed: []

Progress: 4 of 9 plan items complete
```

Note: 5 ACs listed under `modified` in the summary count line vs 6 entries below — the count is 6; the summary line above says 5 in error. Six ACs were modified: AC-1045, AC-1049, AC-981, AC-991, AC-988, AC-1120.
