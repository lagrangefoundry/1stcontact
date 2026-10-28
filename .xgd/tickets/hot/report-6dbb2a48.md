---
uid: report-6dbb2a48
id: REPORT-6835
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-10-28T20:42:18.463979+00:00'
updated_at: '2026-10-28T20:42:18.463979+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-a58a0974
  parent_report_uid: report-9df9a171
  batch_index: '0'
---

All 21 failures in this batch now pass. The full scope passes too, including the dependency suites (AC1404–1410, AC1456, AC1651–1653, AC1792–1794, AC2022–2035): 52 tests across 11 files. `tsc --noEmit` reports no errors in the changed files. I couldn't run a linter: ESLint isn't installed locally and the sandbox blocks fetching it from the npm registry.

**Fixes (planner's instructions, ported from the tip):**
1. **`tools/generate/src/cli/ai/host.ts`**: I replaced `logDir: path.join(dir, 'live')` with `junctions: lib.fileJunctions(path.join(dir, 'live'))` in `nodeDeps`, with the tip's comment. Before this, every Node session failed to open with `unknown option logDir`, which caused every failure except AC2057. I brought over only that line, none of the tip's other `nodeDeps` additions.
2. **AC2057 leftovers of the old role name**, so that `roles.ts` is now the only file carrying it:
   - `apps/control-app/src/system-knowledge.ts`: a comment now says "the role purpose".
   - `tests/reconciliation-assistant-arrival-notice-budget.test.ts`: a comment now names `consultantReminder`.
   - `tests/reconciliation-assistant-conversation-continuity.workers.test.ts`: a comment now says "consultant's".
   - `tests/reconciliation-assistant-conversation.test.ts`: the AC1405 deployed-header fixture now uses `role: 'consultant'`. AC2056's legacy fixture is unchanged.

**One test fix beyond the planner's list:** once sessions could open, AC2054 failed on `expect(typeof system).toBe('string')`. The host sends `system` as a list of `{type:'text', text}` blocks, and the shared scripted-model-client type allows either form. I changed `tests/reconciliation-assistant-consultant-role.test.ts` to join the blocks before checking them, as the deployed-knowledge and knowledge suites already do. Every content assertion (consultant, no old name, judgement, "would make the site worse", "never build past an open question", closed vocabulary, client) still runs against the text the model actually received. That file is a test, not code under `code_frozen`.

No AC or story changes were needed: AC2054's verification already says "capture the system text" and doesn't require it to be a string. Nothing is committed; the changes are in the working tree for the outer workflow.

```yaml
## Assessment
status: fixed
blocked_by: null
files_changed:
  - tools/generate/src/cli/ai/host.ts                     # authorised exception: logDir -> junctions
  - apps/control-app/src/system-knowledge.ts              # authorised exception: comment straggler
  - tests/reconciliation-assistant-arrival-notice-budget.test.ts
  - tests/reconciliation-assistant-conversation-continuity.workers.test.ts
  - tests/reconciliation-assistant-conversation.test.ts
  - tests/reconciliation-assistant-consultant-role.test.ts  # test fix: system may be text blocks
evidence: "vitest -t <full PYTEST SCOPE>: 11 files, 52 passed, 0 failed"
upstream_changes: none
```
