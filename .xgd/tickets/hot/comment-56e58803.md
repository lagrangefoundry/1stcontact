---
uid: comment-56e58803
id: COMMENT-778
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-07T18:02:20.705467+00:00'
updated_at: '2026-08-07T18:02:20.705467+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-524e3cf7
  kind: note
---

**Result: PASS** — REPORT-1598 (`report-524e3cf7`), 0 violations, 2 warnings, 0 needs_review.

**Coverage**: 28 active ACs (STORY-98: 13, STORY-101: 15), every one carrying a substantive `test_UAT_AC<n>_*` test. Executed `npx vitest run` over the four owning files: **37 passed, 1 skipped, 0 failed**.

**Intent ledger** (all `free_and_reconciled`, nothing retired): BUNDLE-14/REQ-116 created STORY-98; BUNDLE-16/REQ-117 created STORY-101 and updated STORY-98 (page stamp, hover, vocabulary→schema, contact-form seam); REQ-118 added AC-1028. REQ-118 is the newest intent touching this capability, so no AC is stale or deprecated.

**Two warnings** (neither affects pass/fail):

1. **AC-1002** — its sole test is `it.skipIf(!WEBUI_INSTALLED)` and is the only AC here with no unconditionally-asserted core; on this machine (no `@gendevlabs/webui-*`) it has zero executed evidence. No fix available: `apps/control-app/src/builder/editor.js:1` imports `mountFields` at module scope, so the dismissal routes are structurally unreachable without the components. The gate is correct and loud; it's the ratified caveat in STORY-101's body.

2. **AC-951** — the AC claims paint is decided by asking the paint emitter "not by a separately maintained list", but the test seeds one painted container using `surfaceFill` alone, so it would pass equally against a hardcoded `axes.surfaceFill` check. The implementation is correct (`render.ts:1753` calls `surfaceDecls`); the test just doesn't discriminate. Concrete fix: seed a second container painted only by `surfaceGradient`/`backgroundImageUrl`/`pattern`/`overlay` and assert it is stamped.

**Two things worth your attention beyond the findings:**

- `.xgd/uat_index.json` is stale — it reports all 28 of these ACs as `status: "missing"` and has no entry at all for AC-1002 or AC-1028. Every test exists and runs; I judged from sources and the run, not the index.
- REQ-117's criterion 1 says clicking a fieldless segment "opens nothing"; the code opens a *Nothing to edit…* message and AC-1001/AC-1002 follow the code. I did **not** raise this as `needs_review` — STORY-101's Technical Context records the divergence deliberately with rationale, and the intent-alignment workflow already passed it at story (REPORT-1591) and AC (REPORT-1594) level. Escalating would re-litigate a settled ruling. It's documented in the report's notes instead.
