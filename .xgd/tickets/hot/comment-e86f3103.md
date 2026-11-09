---
uid: comment-e86f3103
id: COMMENT-8055
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T01:37:16.898189+00:00'
updated_at: '2026-11-09T01:37:16.898189+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-44dcbef8
  kind: note
---

I've filed the fix plan as REPORT-11648 (`report-44dcbef8`). There were no failing tests: scoped quality was 269/269 (REPORT-11647). The run came back here because REPORT-11646, a `code_frozen` handoff, was blocking the gate. The plan rules on it with one batch and one override, decided at rung 1 of the ladder.

**Granted (`code_frozen`, rung 1, flagged as touching a trust boundary):**
- **Oversized body.** `apps/public-site/src/lead.ts:257-265` reads the whole body with `request.arrayBuffer()` before checking the 8 KiB cap. REQ-223 §6 says a large body "must be rejected rather than read". The builder replaces this with a read that counts bytes as they arrive and cancels past the cap, and corrects the comment that wrongly says the read is bounded.
- **Drawing caption.** `DRAWING_RASTER_NOTE` in `tools/generate/src/cli/picture.ts:329-332` (and its copy in `fidelity-surface.json`) doesn't warn that letter widths and line breaks in a drawing are not evidence. EPIC-1's 2026-09-11 answer requires that warning, and AC-2486 already asks for it.
- **Tests first.** The AC-2509 test gains a body that never ends and must be refused with 413 and cancelled near the cap. The AC-2486 test gains an assertion on the new caption wording. Both should fail before the code changes.
- **Regression set.** The tests for AC-2500..2516, AC-903..912 and the picture/fidelity ACs must stay green.

**Spec change I made:** I updated AC-2509 back to REQ-223's intent: a body with no declared length must be cancelled once it passes 8 KiB, not read in full. The fix pass had narrowed it to describe the current code.

**Left out of the override, still recorded as divergences in STORY-177:**
- **Multipart parsing.** No ticket in this bundle mentions multipart, and every shipped form posts urlencoded or JSON.
- **Bounce/complaint suppression across all tenants.** This would be a new cross-tenant store and needs your decision on privacy and scope.

**Other notes:**
- AC-2486's "divergence and code issue" note will be out of date once the caption lands; the review should mark it resolved.
- `tests/test_UAT_FC_REQ-223_internal_seam.test.ts` will be flagged by the orphan check, since AC-2513's test now covers its behaviour.
- The sandbox blocked an outbound connection to `github.com:22` during the report command, probably a push of the ticket commit. The report and the AC update are saved in the local ticket store but may not have been pushed.