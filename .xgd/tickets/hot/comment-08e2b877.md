---
uid: comment-08e2b877
id: COMMENT-2540
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T14:11:25.387796+00:00'
updated_at: '2026-09-10T14:11:25.387796+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-19812dd8
  kind: note
---

Done — the seven-cycle stall is broken. **9 mutations**, all findings resolved.

**Story-body edits**
- **STORY-84** (`story-8acc338d`) — full rewrite covering findings 1–5:
  - *Finding 1* — new paragraph on responsive tracks: a numeric axis that differs across sampled widths folds to a per-width keyframe track; a constant one stays a scalar. `padding` went 0 → 12 occurrences; `height probe`, `yFactor`/`heightFactor`, `self-painting`, `captured surface rect` all now present.
  - *Finding 2* — padding named on the text/image/box leaf bullets, given the border-box rationale ("folds inward, never outward"), added to In scope and Technical Context.
  - *Finding 3* — the "reconstructed run surfaces" bullet no longer states the retired rule: a run whose own border box spans its surface is self-painting and emits **no** backing box; a backing box's edges/radius/grouping come from the captured surface rect, runs' union only as fallback.
  - *Finding 4* — new paragraph on the viewport-height axis: probe pairs, response as measured finite difference (no probe → no response), probe as evidence never a keyframe, card inheriting its representative row's response.
  - *Finding 5* — `1c repro` scoped into STORY-84 (the report's first-listed resolution, on the `refold` precedent): verbatim copy, idempotence, asset localization, hard failure on an unmirrored handle, unreferenced-asset report.
- **STORY-86** — `(CAP-72)` → `(CAP-63, STORY-75)`. Verified: CAP-72 now 0 occurrences.

**AC edits** — AC-691's widest-sample rule scoped to axes constant across the ladder; AC-731 rewritten for self-painting runs and the captured surface rect. These were the two the report identified as most likely to be manufacturing the downstream `uat_coverage: fail`, since a faithful UAT would pin superseded behaviour.

**ACs added** — AC-1625 (responsive tracks), AC-1626 (padding), AC-1627 (viewport-height response), AC-1628 (materialization).

I read REQ-88 past its opening section as the report instructed and spot-read every cited code site before writing, so the bodies describe the implementation rather than the report's paraphrase. No code edits, no `needs_review` items.

Report: **REPORT-3741** (`report-19812dd8`) — `progress_made: true`, `needs_more_work: false`, `violations_remaining: 0`. The four new ACs deliberately carry no `uat_coverage` (that field belongs to the uat-level cycle); they're the expected work for the next phase.
