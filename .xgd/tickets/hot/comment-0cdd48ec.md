---
uid: comment-0cdd48ec
id: COMMENT-5997
type: comment
title: Claude response for batch_fix_assessment report
created_by: xgd
created_at: '2026-11-01T03:39:25.869290+00:00'
updated_at: '2026-11-01T03:39:25.869290+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-b1c1e83d
  kind: note
---

The AC2097 production fix was already committed, and the one remaining failure was a test bug, which I've fixed. All 48 tests across the 6 scoped test files now pass.

**What was already fixed:** an earlier pass in this run (commit `92a9f54c11`) made the change the planner asked for in `apps/control-app/src/ai.ts`. `sessionTextDescriber` now builds its `Role` with `priming: [new lib.Entry({ name: 'digest-system', text: DOCUMENT_DIGEST_SYSTEM })]`, and the doc comment says the digest instruction is the only priming. I made no further edits to `ai.ts`.

**Why the test still failed:** with that fix, the library sends the system prompt as a list of text blocks instead of a plain string. The failing test checked `expect(system).toContain(DOCUMENT_DIGEST_SYSTEM)` on the raw value. On a list, `toContain` asks whether one item *equals* the string, so it fails even though the prompt is there. The AC2097 test passed because it joins the blocks into text before comparing.

**What I changed:** only `tests/test_UAT_FC_REQ-173_describer_session.test.ts`.
- Added a local `systemText()` helper that joins the blocks into text, the same logic the AC2097 file uses. I left shared test support untouched.
- Made the assertion stricter, not weaker: `expect(systemText(req).trim()).toBe(DOCUMENT_DIGEST_SYSTEM)`. It now fails if the system prompt is empty (the original defect) or has anything added to it. The existing "no landscape / no knowledge base" checks stay.
- Fixed the file header's out-of-date "No corpus and no priming" line.

**Checks not run:**
- ESLint isn't installed locally, and the sandbox blocks the npm registry, so `npx eslint` couldn't fetch it.
- Running the local `tsc` typecheck was denied by the permission mode, so the change isn't typechecked. The helper copies code that already compiles in `reconciliation-material-description-digest.workers.test.ts`, with the same import from `./support/scripted-model-client`.

I made no AC or story changes: the test was wrong about the shape of the data, and the AC already says what the code does. The test edit is uncommitted, left for the workflow to commit.

```yaml
## Assessment
status: fixed
blocked_by: null
files_changed:
  - tests/test_UAT_FC_REQ-173_describer_session.test.ts
production_changes: none this pass (ai.ts priming fix already present from commit 92a9f54c11, within the authorised exception)
verification: "vitest run on the 6 describer/REQ-173 files -> 6 files, 48 tests passed (AC2097, AC1688/1689/1699 and all FC_REQ_173 green)"
not_run: "eslint (not installed; npm registry blocked by sandbox); local tsc (permission denied)"
```
