---
uid: comment-8cc16f65
id: COMMENT-1102
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-16T10:05:49.727024+00:00'
updated_at: '2026-08-16T10:05:49.727024+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-97969c20
  kind: note
---

Assessment complete. **Result: FAIL** — REPORT-2103 (`report-97969c20`), 2 violations / 3 warnings / 0 needs_review.

## Verdicts written

- **30 ACs → `pass`.** All active per cumulative intent (nothing in the ledger retires anything; REQ-145/REQ-147 are still `draft`, so the "origin outside the edge Worker" clause and the REQ-119 AC-1 deviation remain current). Every one has at least one AC-traceable UAT driving real entry points — real HTTP over `startBuilder`/`unstable_dev`, jsdom over the actually-installed components, git-made fixture checkouts running the shipped resolver in a real `node`. No trivial, over-mocked or structural evidence: the two source-reading tests read source because that *is* the criterion's subject (AC-960's scope scan) or to enumerate routes that are then probed over HTTP (AC-977).
- **STORY-99 → `fail`**, **CAP-85 → `fail`.**

## The two violations — one drift, one root cause

CAP-85 scopes two REQ-117 seams to this capability, and STORY-99 describes neither, so no AC and no UAT under this capability evidences them:

1. **`/framework/edit-client.js`** — "served from the same source the renderer is built from, so the two cannot drift". The story's single-origin enumeration stops at "its own browser code"; the bridge appears here only as a row in AC-977's cache-header sweep.
2. **`/api/copy` read/apply** — "a thin transport that adds no semantics of its own". The story names only the listing and publish as the origin's operations.

Both were built by REQ-117, which sits inside STORY-99's *own* `intent_uid` (`bundle-15c1f647`). Both are proven elsewhere — under the editing capability by `test_UAT_AC1006_…` and `test_UAT_AC999_…` — so this is an ownership defect, not missing system evidence. **Narrowing CAP-85 is a legitimate and cheaper fix than authoring ACs**; the editor should pick one direction, since doing both trades a coverage gap for duplicate evidence across capabilities.

## Warnings (non-gating)

- **AC-973** — the AC's Verification names a divider *drag* and a rendered *rail*; the test drives `setSplit()`/`isCollapsed()` instead, so an unwired divider would pass. jsdom does dispatch events (the AC-970 test already fires a real `change` on the selector), so this is reachable.
- **AC-964** — its criterion names "its browser source" as part of the one-origin guarantee, but the verbatim-forwarding comparison covers four routes not including `/builder/*`.
- **AC-966** — substantive but a strict subset of AC-1032/AC-1031; deliberately deferred, because the ac-level check holds AC-966 itself stale against REQ-119 and editing the test against known-stale AC text would have to be undone.

One caveat I recorded in the report rather than papering over: this session's Bash permissions don't reach outside the repository, so unlike REPORT-2102 I could not confirm the out-of-band component install is present on this machine. It changes no verdict — coverage is a property of the tests — but the ten mount-gated AC halves would not execute without it, which is exactly what AC-961/AC-963's unconditional `WEBUI_INSTALLED` assertions exist to make loud.
