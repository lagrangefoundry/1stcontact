---
uid: comment-dc7b05a3
id: COMMENT-2687
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-11T02:16:49.551339+00:00'
updated_at: '2026-09-11T02:16:49.551339+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-cac55785
  kind: note
---

AC-level alignment check complete. **REPORT-3870 (`report-cac55785`) — FAIL: 1 violation, 1 warning, 0 needs_review.**

## What I checked

CAP-93 has one story (STORY-106, `feature`) with 12 active ACs (AC-1083 … AC-1094). Governing intent is **REQ-129** inside BUNDLE-17; I re-read the statuses of every intent touching this surface (REQ-126/127/129/130/131/137/139 all `free_and_reconciled`; REQ-134 `abandoned`; REQ-160 `draft`) rather than carrying them from the story-level pass.

## The violation — AC-1090

The story body was edited **today** by the story-level fix cycle to record that the upstream refusal-specificity gap **has closed**; the 12 ACs were last touched 2026-08-16. AC-1090 still carries a *"Known limit, deliberately recorded"* paragraph saying this caller never sees the offending field, and is deliberately weakened because of it. That is now false. Verified independently in the tree:

- `node_modules/@lagrangefoundry/ai/src/toolbox/declaration.js:463` — `host_detail` is opt-**out**, default `true`
- `runtime.js:487-496` — appends `The host reports: <detail>` to the declared meaning
- `runtime.js:549-558` — `usableDetail` returns the JSON pointer even when it judges the message text redundant
- `tools/generate/src/cli/ai/l1-surface.json:124-126` — `SCHEMA_INVALID` does not opt out
- `tools/generate/src/cli/edit.ts:800-816` — already rewritten to `UPSTREAM FINDING, CLOSED`

Resolution: `ac-edit` — delete the known-limit paragraph and strengthen the criterion to assert the pointer **as well as** the recovery strategy (the two are complementary; the declared message must keep the strategy).

The warning is the direct cascade: `tests/test_UAT_FC_REQ-129_l1_authoring.test.ts:374-400` asserts only the three strategy strings, and its own comment already says "when it is, assert it here." The test is green — it just stops being the strongest assertion once the AC is strengthened.

Coverage and exclusivity were clean: every in-scope story bullet maps to at least one AC with no residue, and the near-neighbour AC pairs (1086/1087, 1089/1090/1091, 1093/1094) each assert genuinely different things. Four infos record why REQ-131, REQ-137 and REQ-139 need no AC edit here, so a future cycle doesn't re-derive them.

Static analysis only — the runner is denied in don't-ask mode, so no test outcome is claimed beyond what the source shows. Nothing was modified.
