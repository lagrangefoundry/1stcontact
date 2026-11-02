---
uid: report-1b1188cb
id: REPORT-9005
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-02T19:11:48.437318+00:00'
updated_at: '2026-11-02T19:11:48.437318+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-c4f329d3
  parent_report_uid: report-15de9048
  batch_index: '0'
---

I added a vitest globalSetup to the node test project. The two test files that weren't loading now load, and all 19 orphaned ACs (AC-1291–1305, 1632, 1633, 2235, 2236) pass. No production code, tests, ACs or stories were changed.

**Cause:** both test files import the control app, which imports from `apps/control-app/src/generated/`. That folder is gitignored and only `1c assets` writes it. On a checkout where nobody has run it, both files failed to import before any test ran, so their ACs showed as orphaned rather than failing.

**Changes:**
- **`tests/global-setup-generated.ts` (new):** before tests are collected, it checks that the six generated modules the control app imports are present. If any are missing, it checks the shared component store with `assertSharedStore()` and then runs the real generator, `buildControlAppAssets(repoRoot)`, which is what `1c assets` calls. If the generator can't run, the whole run fails, with the generator's own error and the out-of-band install command (`cd ../lagrange-framework && bin/install --lang js --component all`). It does not skip anything.
- **`vitest.node.config.mts`:** one setting added to register that file as the node project's `globalSetup`.

**Verification:**
- With `generated/` moved out of the tree, running the two files regenerated it: both files loaded and 20/20 tests passed.
- The regenerated folder is still ignored by git (AC-1427), and `git status` shows only my two files.
- The full scoped filter across both test projects ran 32 tests: all passed, and AC-1427 was among them.
- One file in the workers test project failed to load. It's unrelated: the file reads `../db/migrations/0005_operator_membership.sql`, which doesn't exist. It wasn't in this batch and I left it alone.
- `tsc --noEmit` reports nothing for the new file. I couldn't run eslint: it isn't installed locally, and fetching it with `npx` was blocked by the sandbox.

**Two side effects:**
- When files are missing, the setup runs the full asset build, so it also rebuilds `dist-assets/`. It also refuses to continue if the built knowledge base is out of sync with its index, which is the existing packing check. I used the full build because the individual writer functions aren't exported, and exporting them would have meant changing frozen code.
- The original `generated/` folder is still sitting in `$TMPDIR` because my cleanup `rm` was denied. It's a harmless temporary copy.

I haven't committed anything; that's left to the outer reconcile workflow.

```yaml
## Assessment
blocked_by: null
status: fixed
summary: >
  Added a node-project vitest globalSetup (tests/global-setup-generated.ts, registered in
  vitest.node.config.mts) that regenerates the gitignored control-app shims via the real
  buildControlAppAssets generator when absent, failing loudly with the shared-store install
  command if it cannot. Verified from a deleted generated/ dir: both files collect, 20/20 pass,
  the scoped filter passes 32/32 tests including AC-1427, and generated/ stays ignored. No production code changed.
```
