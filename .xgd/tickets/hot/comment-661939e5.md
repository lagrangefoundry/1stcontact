---
uid: comment-661939e5
id: COMMENT-2684
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-11T02:00:56.656305+00:00'
updated_at: '2026-09-11T02:00:56.656305+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-491a72d5
  kind: note
---

**Result: FAIL** — REPORT-3864 (`report-491a72d5`), 1 violation, 0 warnings, 0 needs_review. Schema verified: `result=fail`, `report_kind=capability_validation`, `subject_uid=capability-fe236246`, `level=story`.

## The finding

STORY-106 (`story-189fc1ac`, the capability's only story) records a divergence that the shipped system no longer has:

> "Refusal specificity is degraded for this caller … the assistant's tool layer renders only the declared meaning of the error code and drops the detail … The acceptance criterion below asserts the mitigation that exists, not the fix that does not."

The upstream tool layer was fixed (its own BUG-39) and now appends the host's account to a declared refusal. Traced end to end in read source rather than inferred from one line:

- `tools/generate/src/cli/edit.ts:215-226` — `validateOrThrow` throws `CommandError{code:'SCHEMA_INVALID', path:<JSON-pointer>, message:'<pointer>: <reason>'}`
- `node_modules/@lagrangefoundry/ai/src/toolbox/runtime.js:454-460` — `describeFailure` reads `path`/`message` verbatim
- `.../toolbox/declaration.js:445-464` — `host_detail` is **opt-out, defaulting to true**
- `tools/generate/src/cli/ai/l1-surface.json:124-126` — this surface's `SCHEMA_INVALID` does not opt out
- `.../toolbox/runtime.js:487-495` — renders `… (SCHEMA_INVALID). <meaning> The host reports: <pointer>: <reason>`

A refused `set_l1` now names the offending field. Nothing in this repo changed — `@lagrangefoundry/ai` isn't lockfile-pinned, so the fix arrived with no commit, no intent ticket, and no red test. The stale claim sits in four places that should move together: the story body, AC-1090 (`acceptance_criterion-4bd36a69`, an `ac-edit` cascade for the ac-level cycle), the `UPSTREAM FINDING` comment at `edit.ts:800-808`, and the comment at `tests/test_UAT_FC_REQ-129_l1_authoring.test.ts:381-385`. The UAT still passes as written — its assertion has just stopped being the strongest one available.

## What did *not* drift

The prior pass (REPORT-2048, 2026-08-16) flagged two imminent intents; both have since reconciled and neither produced drift. REQ-131's returned draft count is expressed in STORY-115 (CAP-99), which claims it for *every* write on the path — restating it in CAP-93 would duplicate a cross-cutting claim. REQ-137's `steps`→`shade` needs no edit because the verbatim guarantee is worded model-agnostically. REQ-139's locked modal controls preserve STORY-106's "untouched gesture" invariant: locks never hide a row, and a lock refuses a change rather than the status quo. Exclusivity was independently re-confirmed by this anchor's own overlap resolution (`report-f56df596`, cluster 5, confirm/no change).

Method was static analysis — don't-ask mode denies the test runner, so no claim is made about whether CAP-93's UATs currently pass. The decisive evidence lives in an unpinned dependency whose `package.json` reads `"version": "0.0.0"`; a future run should re-read `runtime.js` rather than trust this report.
