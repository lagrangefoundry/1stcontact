---
uid: report-cffce9ef
id: REPORT-3489
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-09-04T04:13:16.957591+00:00'
updated_at: '2026-09-04T04:13:16.957591+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-203b1dc2
  plan_item_index: '8'
---

Story and all ten acceptance criteria are created and attached under CAP-108, beside STORY-132 (item 7's pipeline story).

**Grounding**: read REQ-163's section of the bundle body — original brief, the "Decisions from implementation review", the "What was built, and where it departs" corrections (six status values, fonts parsed not modelled, WOFF/WOFF2 unsupported), and the 2026-08-31 resolutions — then `describe.ts`, the describe wiring in `material.ts`, and the landed UATs in `tests/test_UAT_FC_REQ-163_material_pipeline.test.ts`.

**Scope split from item 7**: STORY-132 owns arrival, kind, rights, ordering, ceiling, fetch guard, promotion gate. STORY-133 owns only step 3 — what the file *says*, and the honest degradation when it cannot be read. All six outcome values are covered by a distinct AC (real / nothing-configured / nothing-to-extract / unreadable / too-large-to-look / reached-and-failed).

**Four reconciliation decisions recorded** where intent was silent, each with rationale in the story body: title derivation order, the bounded description with its stated truncation, unreadable-kind material (capture bundles included) marked rather than refused, and degraded descriptions always being written prose rather than an empty body. No intent/code contradiction found to flag — the "OCR or refuse" question the brief left open was settled in the ticket's own decisions section, and the code follows it.

One operational note: each `ticket create` reported `Push failed (may be offline): This proxy requires authentication`. The commits landed locally; nothing was pushed.

```
Story #8 created for reconciliation bundle-203b1dc2

Story UID: story-724e4e8c (STORY-133)
Title: The description: material is found by what it says or shows, and says honestly when it cannot be read
Type: feature
Acceptance Criteria: 10 created (AC-1548 … AC-1557)

Progress: 8 of 15 plan items complete
```
