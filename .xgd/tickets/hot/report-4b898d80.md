---
uid: report-4b898d80
id: REPORT-7246
type: report
title: 'Report: blocked_by_handoff for STORY-141'
created_by: xgd
created_at: '2026-11-01T03:29:37.794809+00:00'
updated_at: '2026-11-01T03:33:11.621860+00:00'
completed_at: null
last_field_updated: ruling
fields:
  report_kind: blocked_by_handoff
  subject_uid: STORY-141
  rule: code_frozen
  evidence: 'Ran vitest on tests/reconciliation-material-description-digest.workers.test.ts:
    AC2097 fails with systemText(req) === '''' where DOCUMENT_DIGEST_SYSTEM is expected.
    Read apps/control-app/src/ai.ts:159-165 — sessionTextDescriber constructs lib.Role({
    name, system: DOCUMENT_DIGEST_SYSTEM, source }). Read /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai/src/roles.js:711-731
    — Role''s constructor accepts only name/priming/reminders/tools/permissions/sandbox/cacheBoundary/session/talker,
    so `system` and `source` are silently dropped and the backend''s priming (system
    field) is empty. AC-2097 requires the digest instruction to be the only system
    content; the test is correct and the code does not satisfy it.'
  proposed_change: 'apps/control-app/src/ai.ts sessionTextDescriber: deliver DOCUMENT_DIGEST_SYSTEM
    through the Role''s `priming` entries (the shape the library''s priming assembly
    expects — e.g. a static-text priming entry/provider resolving to DOCUMENT_DIGEST_SYSTEM)
    instead of the unsupported `system`/`source` keys, so the ClaudeAPIBackend''s
    assembled system equals DOCUMENT_DIGEST_SYSTEM exactly. No test change needed;
    AC2097 then passes as written.'
  batch_index: 0
  parent_report_uid: report-afd0988b
  anchor_ticket: bundle-fd009b93
  ruling: granted
  ruling_reason: the planner granted an override in its plan
---

# Builder blocked by `code_frozen`

**Evidence**: Ran vitest on tests/reconciliation-material-description-digest.workers.test.ts: AC2097 fails with systemText(req) === '' where DOCUMENT_DIGEST_SYSTEM is expected. Read apps/control-app/src/ai.ts:159-165 — sessionTextDescriber constructs lib.Role({ name, system: DOCUMENT_DIGEST_SYSTEM, source }). Read /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai/src/roles.js:711-731 — Role's constructor accepts only name/priming/reminders/tools/permissions/sandbox/cacheBoundary/session/talker, so `system` and `source` are silently dropped and the backend's priming (system field) is empty. AC-2097 requires the digest instruction to be the only system content; the test is correct and the code does not satisfy it.

**Proposed change**: apps/control-app/src/ai.ts sessionTextDescriber: deliver DOCUMENT_DIGEST_SYSTEM through the Role's `priming` entries (the shape the library's priming assembly expects — e.g. a static-text priming entry/provider resolving to DOCUMENT_DIGEST_SYSTEM) instead of the unsupported `system`/`source` keys, so the ClaudeAPIBackend's assembled system equals DOCUMENT_DIGEST_SYSTEM exactly. No test change needed; AC2097 then passes as written.

## Ruling: granted

the planner granted an override in its plan
