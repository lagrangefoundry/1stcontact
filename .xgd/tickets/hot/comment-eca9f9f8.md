---
uid: comment-eca9f9f8
id: COMMENT-2686
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-11T02:11:21.979539+00:00'
updated_at: '2026-09-11T02:11:21.979539+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-e281cdc6
  kind: note
---

**PASS** — REPORT-3866 (`report-e281cdc6`), 0 violations, 0 warnings, 0 needs_review.

## What I found

CAP-93 has exactly one story (STORY-106, `story-189fc1ac`), governed by REQ-129 inside BUNDLE-17. The last pass (REPORT-3864) failed on one violation: the story body asserted a refusal-specificity limit the shipped system no longer had. The fix (REPORT-3865) rewrote that bullet, and **the repair is correct** — I re-verified the whole chain independently rather than trusting the fix report, because the previous assessor explicitly flagged its evidence as living in an unpinned package:

1. `edit.ts:215-226` — `validateOrThrow` throws `SCHEMA_INVALID` carrying the JSON pointer
2. `l1-surface.json:124-126` — this surface declares no `host_detail`, so it doesn't opt out
3. `declaration.js:463` — upstream, `host_detail` is opt-*out*, defaulting true
4. `runtime.js:487-493`, `549-557` — the renderer appends the detail, and `usableDetail` returns the bare path even when the message adds nothing

Every other body claim was re-checked against the working tree this cycle — the widened map (`segments.ts:72-118`, emits every node, no axes), verbatim `get_l1` (`edit.ts:772-787`), the single `AuthorPages`/`set_l1` operation and its grant, the two declared absences, the retired copy pair, and the still-vestigial `nav` key (`schema.ts:990`, no reader).

Three things worth surfacing beyond the report:

- **AC-1090 is the last stale copy** of the closed limit (unchanged since 2026-08-16). That's an `ac-edit` for the ac-level cycle, correctly routed there by the previous pass — not a story-level violation, because the story body now explicitly says the AC lags. The strengthened criterion would pass today, but needs its `uat-edit` in the same breath or `uat_coverage: pass` overstates the test.
- **A number collision that could mislead a later pass**: the upstream fix was *@lagrangefoundry/ai*'s own BUG-39; this repo's BUG-39 (`bug-23d1ec27`, `bundled`) is an unrelated chat-host test-double repair in CAP-92's suites. Recorded in the ledger.
- **This capability drifts from outside the repo.** `@lagrangefoundry/ai` is unpinned and its installed copy declares `version: 0.0.0`, so upstream changes land with no commit and no failing test here. A future pass must re-read `runtime.js`/`declaration.js` rather than trust my report.

Method note: static analysis only — the test runner is denied in don't-ask mode, so the one executed result I quote (the 13/13 probe) is attributed to REPORT-3865, not re-claimed as mine.
