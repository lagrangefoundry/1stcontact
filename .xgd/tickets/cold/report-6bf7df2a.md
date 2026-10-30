---
uid: report-6bf7df2a
id: REPORT-706
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-7'
created_by: xgd
created_at: '2026-07-22T19:14:16.804130+00:00'
updated_at: '2026-07-22T19:14:16.804130+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-7
---

## Files resolved

- `package.json` — class UU (config, scalar `version`). Only the `version` field conflicted: HEAD=`0.0.169` (sync_working_to_main, post-watermark) vs incoming=`0.0.165` (free-coded bump). `version` is a monotonic counter; main has already advanced past the incoming bump. Kept HEAD's higher `0.0.169` (never regress the version). The incoming intent — "a version was bumped" — is preserved and superseded. No other keys conflicted.

The four substantive incoming files (isolation dimension) merged cleanly without markers and were already staged by the cherry-pick:
- `tools/generate/src/conformance/harness.ts` — M
- `tools/generate/src/conformance/types.ts` — M
- `tests/req85-conformance.test.ts` — A
- `tests/fixtures/conformance/throws-on-render.astro` — A

## Incoming changes preserved

Verified each of the four code files staged in the tree is **byte-identical** to the incoming commit's blob (`git show <CHERRY_PICK_HEAD>:<file>` vs `git show :<file>` → empty diff). The `isolation` conformance dimension is present (harness.ts: 8 refs, types.ts: 1 ref). The only incoming change absent from the result is the `package.json` version bump to `0.0.165`, which is intentionally superseded by main's higher `0.0.169` — not a discarded developer change. All substantive developer code from the cherry-picked commit is present.

Staging clean: no UU/AA/DU/UD lines remain; no conflict markers in any file.
