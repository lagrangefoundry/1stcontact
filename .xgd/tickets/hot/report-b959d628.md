---
uid: report-b959d628
id: REPORT-5453
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T04:28:18.517545+00:00'
updated_at: '2026-09-29T04:28:18.517545+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-01ea4eec.md` (REQ-155) — **UU**, intent/bookkeeping ticket (`request-*`), resolved under **rule 2e**. Body text (177 lines) is byte-identical on both sides; the conflict is confined to YAML frontmatter fields. Resolved per-fact, not by picking a whole-file winner:
  - `commits` (`working_sha: ab467d6ce36618c333604d6b1587cfb6d19557ff`, `reconcile_sha: null`, `main_sha: null`) — present identically on both sides; kept.
  - `version: 0.2.32` — present identically on both sides; kept.
  - `status` — genuine per-fact conflict: HEAD `free_and_reconciled` vs incoming `free_coded`. HEAD is the later-positioned intent (HEAD `updated_at` 2026-09-19T15:15:32Z vs incoming 2026-09-01T18:57:55Z) **and** the later lifecycle state; HEAD wins for this fact.
  - `updated_at` — later-positioned intent (HEAD, 2026-09-19) wins.
  - `completed_at: 2026-09-14T10:29:15Z` and `fields.bundled_in: bundle-8e1807f6` — HEAD-only additions with no incoming counterpart; kept (non-overlapping).
  - Net: HEAD is a **strict superset** of the incoming field set, so 2e's "keep the superset" and the enrichment's "take the more recent commit by timestamp" agree. Flagged for post-merge review per the enrichment note, since its intent classification was unknown on one/both sides.
  - Trailing newline: incoming drops the file's final newline (`\ No newline at end of file`); the resolution keeps the newline-terminated form. Formatting artifact, not an intent.

Sparse-checkout note: `.xgd/tickets/**` is excluded from this worktree's sparse cone (`!/.xgd/tickets/`, `!/.xgd/tickets/**`), so the conflict existed only in the index with no working-tree markers — `git checkout --ours/--theirs` was not usable. Resolved by pointing the index entry at the stage-2 blob (`e2c2f78b19d4ffa3c41db515bec7f70fcaf01121`) via `git update-index --cacheinfo`, then restoring the `skip-worktree` bit (which `--cacheinfo` clears, making the file read as deleted ` D`) to match every sibling ticket's `S` flag.

No code files (`xgd_source/**`, `bin/**`), no test files, no UAT tests, no config files, and no deletion conflicts (DU/UD) were involved. No test function was deleted; the BUG-1301 precedence exception was not invoked.

## Incoming changes preserved

Verified against `git show e0795d9332b24701db6217dab55e2976424b613e -- .xgd/tickets/hot/request-01ea4eec.md`. The incoming commit contributes exactly three substantive facts over its base; all are accounted for in the staged resolution:

1. `commits` block (`working_sha: ab467d6ce36618c333604d6b1587cfb6d19557ff`) — **present, byte-identical**.
2. `version: 0.2.32` — **present, byte-identical**.
3. `status: free_coding` → `free_coded` — **superseded, not discarded**. HEAD had already advanced this same field past `free_coded` to `free_and_reconciled` (with `completed_at` set and `bundled_in: bundle-8e1807f6` recorded). Applying the incoming value would rewind the lifecycle and clear `completed_at`. This is 2e's per-fact later-intent rule, not a dropped developer change.

No incoming developer code was discarded — the incoming commit touches no code. Because HEAD already contained every field the incoming commit adds, the staged tree is identical to HEAD (`git diff --cached HEAD` is empty), i.e. this cherry-pick is now a no-op. Per STEP 4 that was left for the finalize step to detect: `--continue`/`--skip`/`--quit`/`--abort` were not invoked, and `CHERRY_PICK_HEAD` (`e0795d9332b24701db6217dab55e2976424b613e`) remains present.
