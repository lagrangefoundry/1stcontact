---
uid: report-0be3b879
id: REPORT-575
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-6'
created_by: xgd
created_at: '2026-07-19T01:29:05.923756+00:00'
updated_at: '2026-07-19T01:29:05.923756+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-6
---

## Files resolved

- `package.json` — class UU (both modified), version-line conflict only.
  Rule applied: version scalar. Ours (HEAD, `sync_working_to_main`) = `0.0.155`;
  theirs (incoming free_coded `fix(values-diff)`) = `0.0.120`. Kept HEAD `0.0.155`
  (higher/monotonic version; incoming `0.0.120` is a stale bump superseded by the
  branch). This is the only conflicted region.
- `tools/generate/src/cli/capture/values-diff.ts` — applied non-conflicting (incoming).
- `tests/req58-wrapper-treatments.test.ts` — applied non-conflicting (incoming).

## Incoming changes preserved

The incoming commit `6543bc60` (values-diff: pair duplicate text by nearest
position, not FIFO order) is fully present in the resulting commit `1e4bee05`:
- `values-diff.ts` +29 lines including the NEAREST-rendered-position pairing logic
  (verified: `// ... pair by NEAREST rendered position rather ...`).
- `req58-wrapper-treatments.test.ts` +27 lines (UAT for duplicate-text nearest pairing).
Only the version scalar was resolved in favor of HEAD; no developer code was discarded.

## State note

At invocation the worktree was already clean (`git status --porcelain` empty) with
no conflict markers and no paused cherry-pick (no CHERRY_PICK_HEAD). The package.json
conflict had already been resolved and the incoming commit applied as `1e4bee05`.
No `add`/`rm`/`checkout` was required this pass. The tree is ready; the cherry-pick
sequencer state is no longer present because the pick already completed.
