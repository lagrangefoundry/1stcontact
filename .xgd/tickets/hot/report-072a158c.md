---
uid: report-072a158c
id: REPORT-5146
type: report
title: 'Resync resolve conflicts: d7587990b588ef6c03b752fe16afa93745aa9da3'
created_by: xgd
created_at: '2026-09-26T21:49:27.600946+00:00'
updated_at: '2026-09-26T21:49:27.600946+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-b474390f.md` — **AA** (both added; sparse-checkout path under `.xgd/tickets/`, resolved via `--sparse`). Intent/bookkeeping ticket (`request-*`), so §2e applies, not the §2d ledger-replay rule.
  - Full diff between the two stages is 25 lines and confined entirely to lifecycle frontmatter. The ticket body is byte-identical on both sides.
  - OURS (stage 2, `0d01e4a8`): `status: free_and_reconciled`, `completed_at: 2026-08-31T14:22:40Z`, `updated_at: 2026-08-31T14:22:40Z`, plus `fields.bundled_in: bundle-b3b7c399`.
  - THEIRS (stage 3, `9c802367`, from CHERRY_PICK_HEAD `9ef799f9`, authored 2026-08-23): `status: ready_to_reconcile`, `completed_at: null`, `updated_at: 2026-08-20T21:15:50Z`, no `bundled_in`.
  - Both sides touch the *same* facts (`status`, `completed_at`, `updated_at`) differently → genuine conflict, so the later-positioned intent wins per fact. HEAD is later on every contested fact (2026-08-31 vs 2026-08-20/23) and is additionally a strict superset (`bundled_in` exists only on HEAD).
  - Resolution: `git checkout --ours` + `git add --sparse`. Taking incoming would have regressed the lifecycle `free_and_reconciled` → `ready_to_reconcile` and dropped `bundled_in: bundle-b3b7c399`.

No code files (`xgd_source/**`, `tests/**`, `bin/**`), no UAT test files, no spec tickets
(`story-*`/`acceptance_criterion-*`/`capability-*`), no config files and no DU/UD deletion
conflicts were present in this cherry-pick.

## Incoming changes preserved

No incoming *code* changes were in scope — the conflict was a single intent ticket.

For the one conflicted file, the incoming side's frontmatter values are intentionally not
present in the resolved version, and this is not a §2c/§3 discard of developer work:

- The incoming commit `9ef799f9` (`xgd(ticket): update request request-b474390f`) carries
  no free-text operation narrative; its only effect on this file is the older lifecycle
  state (`ready_to_reconcile`, `completed_at: null`).
- HEAD's state is the *forward* continuation of that same lifecycle for the same ticket
  (`ready_to_reconcile` → `free_and_reconciled`, with `bundled_in` recorded). Applying
  incoming would rewind an already-completed lifecycle transition and drop a bundle
  linkage, which is data loss rather than preservation.
- Consequently the resolved tree is byte-identical to HEAD for this path; the staged diff
  against HEAD is empty. Per the workflow contract this is left for Python's finalize step
  to detect and skip — `--skip` was not invoked here, and `CHERRY_PICK_HEAD`
  (`9ef799f917e7fd8927b2f42c30b307fb87c59ffc`) remains present.

`git status --porcelain` is empty and `git ls-files -u` reports 0 unmerged entries.
