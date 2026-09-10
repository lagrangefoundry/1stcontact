---
uid: comment-727d4fc9
id: COMMENT-2567
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T17:27:04.114681+00:00'
updated_at: '2026-09-10T17:27:04.114681+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-a0142017
  kind: note
---

AC-level alignment check complete. **REPORT-3766 (`report-a0142017`) — FAIL: 3 violations, 7 warnings, 0 needs_review.**

## What drifted

The story body absorbed the colour phase on 2026-08-20 and carries REQ-119's request-time render model. Ten ACs were rewritten in that pass; **27 of the 43 have not been touched since 2026-08-16**, and two of those still describe the pre-colour / pre-REQ-119 surface. In all three violations the implementation and the shipped UATs agree with the **story**, not with the AC — nothing here is a code issue.

**Violations (block this level):**

1. **AC-1117** — says "Nothing else about the run is exposed. **Not its colour**", asserts the fields are "the words followed by size, weight, italic and capitalisation", asserts "no colour … field is offered", and counts "**four** control shapes". `copyFieldsOf` returns `fields: [text, ...colour.fields, ...type.fields]` (`packages/site-schema/src/l1/edit.ts:975-984`), and sibling **AC-1269** asserts the colour field sits between the words and the typography controls. Two active ACs of the same story now claim contradictory field lists.
2. **AC-992** — "re-renders both … **before reporting success**" / "assert both … outputs **on disk**". REQ-119 removed that step: `/api/copy` POST writes the draft and returns (`apps/control-app/src/router.ts:545-571`, comment cites REQ-119). Its own UAT already reads served bytes instead.
3. **AC-1026** — same stale on-disk observable in the image AC.

**Warnings:** the origin-parity duplication is on its **fourth unrepaired cycle** and has grown from two ACs to six (AC-1273 joined it with the colour batch); atomicity (AC-983/AC-1026) and the multi-line rule (AC-980/AC-990) likewise fourth cycle; AC-1122 now lags the story bullet repaired today; AC-1045/AC-1270 duplicate the every-painted-panel rule; the story body still has no parent bullet for overflow (fourth cycle); and once findings 2–3 are fixed, the CLI's *both channels* claim (`tools/generate/src/cli/index.ts:1347-1354`) is left unowned unless AC-982 picks it up.

Confirmed repaired since REPORT-2081: both prior violations (AC-988 and AC-1120 now refuse a *change* to an unavailable field while a re-posted status quo passes).
