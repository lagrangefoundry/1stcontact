---
uid: report-33e3d65f
id: REPORT-7244
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-01T03:29:23.430577+00:00'
updated_at: '2026-11-01T03:29:23.430577+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: STORY-141
  parent_report_uid: report-afd0988b
  batch_index: '0'
---

I fixed three of the four failures. The fourth, AC2097, is a real production bug, and the frozen-code rule stops me fixing it.

**AC1688, AC1689, AC1699 — fixed.** `tests/reconciliation-material-description.workers.test.ts` held old, pre-REQ-173 versions of these three tests. They expected a document's body to be its own extracted text. Since REQ-173 the body is a summary written by a describer model, and the document's own text comes back in `fullText`. With no describer passed in, the code correctly returns `no_describer`, so the old tests could never pass. `tests/reconciliation-material-description-digest.workers.test.ts` already has updated versions under the same AC numbers, and they pass. Those versions check everything the old ones did, plus the summary body, `fullText` and the exact describer name. I deleted the old copies and left a comment pointing to the digest file. I also removed the fixture code that only they used (`textPdf` and its two constants) and the unused `MAX_BODY_CHARS` import. I didn't change any AC or story, because the criteria already describe the current behaviour.

After the change, 20 tests pass across the two files and AC2097 still fails. I couldn't run a linter: none is installed in the repo, and the sandbox blocked downloading eslint. The edit only removed code. Nothing is committed.

**AC2097 — blocked.** In `apps/control-app/src/ai.ts`, `sessionTextDescriber` builds its role as `new lib.Role({ name, system: DOCUMENT_DIGEST_SYSTEM, source: {...} })`. The shared AI library's `Role` constructor (`@lagrangefoundry/ai/src/roles.js:711`) takes `priming`, `reminders`, `tools`, `permissions`, `sandbox`, `cacheBoundary`, `session` and `talker`. It silently ignores `system` and `source`. So the digest instruction never reaches the model: the request's system content is empty. In production the model is never told what to write.

AC-2097 says the system instruction must be "the fixed document-digest instruction and nothing else", and the test checks exactly that. Changing the test to expect an empty system prompt would make the describer's missing instruction look intended. The correct fix is in production code.

```yaml
## Assessment
blocked_by:
  rule: code_frozen
  evidence: "Ran vitest on tests/reconciliation-material-description-digest.workers.test.ts: AC2097 fails with systemText(req) === '' where DOCUMENT_DIGEST_SYSTEM is expected. Read apps/control-app/src/ai.ts:159-165 — sessionTextDescriber constructs lib.Role({ name, system: DOCUMENT_DIGEST_SYSTEM, source }). Read /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai/src/roles.js:711-731 — Role's constructor accepts only name/priming/reminders/tools/permissions/sandbox/cacheBoundary/session/talker, so `system` and `source` are silently dropped and the backend's priming (system field) is empty. AC-2097 requires the digest instruction to be the only system content; the test is correct and the code does not satisfy it."
  proposed_change: "apps/control-app/src/ai.ts sessionTextDescriber: deliver DOCUMENT_DIGEST_SYSTEM through the Role's `priming` entries (the shape the library's priming assembly expects — e.g. a static-text priming entry/provider resolving to DOCUMENT_DIGEST_SYSTEM) instead of the unsupported `system`/`source` keys, so the ClaudeAPIBackend's assembled system equals DOCUMENT_DIGEST_SYSTEM exactly. No test change needed; AC2097 then passes as written."
```
