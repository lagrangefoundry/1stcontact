---
uid: comment-d91c9ef1
id: COMMENT-777
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-07T17:53:39.205396+00:00'
updated_at: '2026-08-07T17:53:39.205396+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-bf993aa0
  kind: note
---

**REPORT-1597** (`report-bf993aa0`) — **PASS**: 0 violations, 0 warnings, 0 needs_review.

## Both prior findings verified fixed

I checked the diffs and re-ran the tests rather than trusting REPORT-1596's claims. The capability's four owning files went **33 passed / 5 skipped → 37 passed / 1 skipped, 0 failed**.

- **Finding 1 (violation)** — the over-broad `describe.skipIf(!WEBUI_INSTALLED)` is gone from the REQ-118 origin suite, along with the dead import, plus a comment recording the real boundary (`GET /` → `chromeHtml()`) and the rule for future tests. `test_UAT_AC1028_the_modal_reads_its_picker_from_the_same_copy_transport` now runs and passes.
- **Finding 2 (warning)** — AC-954 now iterates `registry` instead of the `SEAM_CASES` literal, and `seamCaseFor()` throws for a seam-exposing module with no case. The guard is self-proving: the test fabricates a module the catalog could hold tomorrow and asserts it throws. A third module can no longer pass AC-954 by never being iterated.

Both were fixed at the right altitude — test-only, no production file touched.

## The fix report's escalation is false

REPORT-1596 forwarded a `needs_review` asserting AC-1028 doesn't exist, that STORY-101 has 14 ACs, and the capability 27. All three are wrong:

- `xgd ticket get acceptance_criterion-26ffac6d` → **AC-1028, active, story_uid `story-3bf94bd4`**
- the story-filtered list returns **15** ACs including it; 13 + 15 = **28**, as I originally reported

**Root cause is an XGD tooling defect worth your attention:** `xgd ticket get AC-1028` fails `TICKET_ID_NOT_FOUND` while the UID resolves fine. The same shape hit `REPORT-1594` earlier in this session. The human-ID index is silently incomplete, and that's how a careful, specific, well-argued escalation came out wrong. I didn't file a todo — this check is read-only — but it's flagged prominently in the report, with the guidance to resolve ACs by UID or story filter and treat an ID-keyed miss as unproven rather than as absence.

I also checked the escalation's secondary claim: AC-1020–1027 are real and do carry REQ-118 criteria, but under the asset-store and write-path capabilities, each with its own tests. That's the division this capability's own "Out of scope" declares — AC-1028 owns the gesture clause. Not duplication.

AC-1002 remains the single skip, correctly gated and environmental (the webui packages exist at `/Users/martin/lagrangefoundry/node_modules/`, which isn't an ancestor of this worktree, so `WEBUI_INSTALLED` is false here).
