---
uid: comment-1c134180
id: COMMENT-2602
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T20:58:22.389210+00:00'
updated_at: '2026-09-10T20:58:22.389210+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-7c608777
  kind: note
---

All three findings from REPORT-3795 are resolved in one `ticket update` on STORY-103 (`story-a58a0974`). Completion report: **REPORT-3796** (`report-7c608777`) — `progress_made: true`, `needs_more_work: false`, `violations_remaining: 0`.

**Finding 1 (violation, tenancy).** Confirmed false before editing: `apps/control-app/src/ai.ts:77,81,145,197,210` partitions this story's own transcripts and audit by tenant. Narrowed the claim to the corpus — deleted "and this repo has no tenancy yet" and "nothing tenant-scoped is claimed or built by this story", kept REQ-123's live reason (why per-tenant KBs can be added later), and added the contrast the report suggested: the conversation is account-scoped and its transcript/audit tenant-partitioned (REQ-143 / REQ-146 / BUG-38), while only the corpus is scope-invariant.

**Finding 2 (warning, wrong human ID).** Verified by ticket lookup: `capability-f753cecd` is CAP-86 "Structured Copy Editing" (owner of `story-37a3921b`); `capability-12fee326` is CAP-87 "In-Page Copy Editing". Corrected both sites to CAP-86, individually rather than by find-and-replace, so the correctly-used "tenant" paragraphs nearby were not swept up.

**Finding 3 (warning, single-shape drift).** Dropped "how a failure is reported" from the things that are "the same either way" and replaced it with what actually holds on both — reported honestly, never dressed as the assistant having tried, in the shape each origin's answer takes — with a pointer to the BUNDLE-21 decision that carries the per-origin detail.

Verified post-write: `CAP-87` and "no tenancy" are gone from the body, the old unqualified clause is gone, all six sections intact. Scanned the story's ACs for the same two defects — zero occurrences, so no parallel AC edit was needed, matching the report's instruction not to open ACs.

No code or tests changed (`ai.ts` was read as evidence only), so no test run applied. One item worth flagging for whoever picks up REQ-159: it makes the corpus tenant-scoped, which will invalidate the "does not vary by account" claim I just narrowed the paragraph to — noted in the report rather than pre-empted here, since REQ-159 is still `draft`.
