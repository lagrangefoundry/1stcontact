---
uid: report-f5165d96
id: REPORT-3069
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T20:54:26.549435+00:00'
updated_at: '2026-08-31T20:54:26.549435+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `bin/access-token` — **AA (both added)**, rule **2b (superset wins)**.
  HEAD's version is a strict superset of the incoming one. The incoming
  file is byte-identical to the version already on this branch from
  free-coded commit `f84d4a46c7` ("fix(control-app): register the
  configured tenant so a fresh builder boots [FREE-CODED]",
  2026-08-31 08:52) — verified by `diff` returning no differences.
  Reconcile commit `89570426c1` (2026-08-31 11:07) then added the
  `CLOUDFLARE_API_BASE` seam on top. Kept HEAD (`--ours`): all 250
  incoming lines retained, plus the later seam. The enrichment's
  "more recent commit by timestamp" rule agrees — both HEAD-side
  commits (2026-08-31) postdate the incoming merge (2026-08-23).

- `package.json` — **UU**, scalar version conflict. Both sides are
  `free_coded`, so the working-timeline exception applies: HEAD's
  `0.2.14` comes from `97f4e4e55c` (2026-08-31 09:27, FREE-CODED),
  the incoming `0.2.10` from the 2026-08-23 merge. Kept HEAD's
  `0.2.14`. The incoming commit's ONLY package.json change was the
  bookkeeping bump `0.2.9` → `0.2.10` (confirmed by diffing the merge
  against both parents); reverting to it would regress the version.

## Incoming changes preserved

- `bin/access-token`: the entire incoming file content is present in
  the resolved version. `diff` of the incoming blob against the staged
  blob shows only additions on the HEAD side (the `CLOUDFLARE_API_BASE`
  docs block and the `CLOUDFLARE_API` constant + overridable `API`
  seam). Default behavior is unchanged when the env var is unset. No
  incoming line was dropped.

- `package.json`: the incoming intent (advance the version) is present
  and superseded — HEAD is at `0.2.14`, ahead of the incoming `0.2.10`.

No hunks were dropped under the BUG-1301 precedence exception; no test
functions were touched.

## Note: cherry-pick nets to no diff vs HEAD

`git diff --cached HEAD` is empty. The other 11 files in the incoming
commit (`apps/control-app/**`, `bin/publish`, `tools/generate/**`, and
the three UAT test files) merged to content identical to HEAD — a
post-watermark sync already landed this free-coded work. This is the
redundant-commit case of STEP 4, not a discard: STEP 3's check passes
because the incoming commit's changes are demonstrably present in HEAD
(byte-identical for `bin/access-token`, superseded for `package.json`).
Per STEP 4 no `--skip` was issued; the finalize step should detect the
clean staged diff.

## Post-merge review flag

Per the enrichment's "flag for post-merge review" instruction, both
files were resolved toward HEAD. `bin/access-token` in particular
carries a reconcile-authored change (`CLOUDFLARE_API_BASE` test seam)
that the developer's incoming version predates.
