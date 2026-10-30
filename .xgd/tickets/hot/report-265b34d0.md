---
uid: report-265b34d0
id: REPORT-5449
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T04:12:22.012162+00:00'
updated_at: '2026-09-29T04:12:22.012162+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-01ea4eec.md` — **UU**, intent/bookkeeping ticket (REQ-155, `request-*` kind → STEP 2e; lives in `hot/` rather than `open/`, but it is user-authored intent, not a matrix-defining spec ticket, so 2e governs rather than 2d). Resolved **per fact**, not wholesale.
  - **Only the four-line frontmatter block was genuinely in conflict** (`updated_at`, `completed_at`, `last_field_updated`, `status`). Everything else merged cleanly because both sides carry it identically.
  - **Body: non-overlapping/identical — both sides kept.** `diff` of stage `:2` against stage `:3` over the body is empty. The entire elaborated body the incoming commit contributed is present in the resolution: the `## The shape of the port` rewrite (`ReferenceBundle` / `ReferenceStore` / `ReferenceStoreRoot`, the three adapters), all five `## Design decisions taken here` entries, `## Non-determinism, stated rather than discovered (AC3)`, `## Blast radius`, the tightened AC1–AC6, the whole `## Test plan`, the seventeen-vs-fourteen `mkdirSync` correction, and the reworded `## Deliberately not here`. Nothing was dropped.
  - **Frontmatter: same fields changed differently on both sides → genuine conflict → later-positioned intent wins, per fact.** Ours is later on both clocks: commit date `2026-09-19 08:15:32 -0700` (`7278f30c41`) vs incoming `2026-09-01 11:36:24 -0700` (`ffce0148a9`); ticket `updated_at` `2026-09-19T15:15:32Z` vs `2026-09-01T18:36:24Z`. This also matches the auto-enrichment rule supplied for this file (*"Intent unknown on one or both sides. Take the more recent commit by timestamp and flag this file for post-merge review."*).
  - **Trailing newline:** the incoming side's EOF-newline fix was kept. It is the entire net delta of this pick against HEAD.

## Incoming changes preserved

Confirmed. Nothing from the incoming side was discarded, and the BUG-1301 precedence exception was **not** needed — no hunk was dropped.

- **Body hunks — present verbatim.** Stages `:2` and `:3` are byte-identical across the body; every incoming prose addition survives in the resolved file.
- **EOF newline — present.** Carried through from `:3`.
- **Status transition — superseded, not discarded.** The incoming commit's only frontmatter delta against the merge base is `draft → free_coding` (plus its `updated_at` / `last_field_updated` bookkeeping). `free_coding` is an **upstream intermediate** of the state ours already holds. Ours records the completion of exactly that free-coding pass: `fields.commits.working_sha = ab467d6ce36618c333604d6b1587cfb6d19557ff`, `fields.version = 0.2.32`, `fields.bundled_in = bundle-8e1807f6`, `completed_at = 2026-09-14T10:29:15Z`.
- **Verified monotonic on HEAD's own history for this path** — HEAD reached its state without replaying this commit, so the incoming change is *redundant*, not dropped:
  - `2a21e34677` (2026-09-11, `seed_local_overlay`) — `status: bundled`, `completed_at: null`
  - `389bcc385c` (2026-09-17, `seed_local_overlay`) — `status: bundled`, `completed_at: 2026-09-14T10:29:15Z`
  - `7278f30c41` (2026-09-19, `update request`) — `status: free_and_reconciled`
- **Taking the incoming side would have been a regression**, not a preservation: `free_and_reconciled → free_coding`, `completed_at` back to `null`, and loss of `commits` / `version` / `bundled_in` — for zero body gain, since the bodies match.

No UAT test file was involved, so the 2f / BUG-1301 tension was never reached.

## Post-merge review flag

Per the enrichment rule, this file is **flagged for post-merge review**. The open question is not the body (both sides agree) but whether REQ-155's `free_and_reconciled` / `bundle-8e1807f6` / `version 0.2.32` state is the one this resync should land on `9ac98712a708888db67f8aff21f22b16bd98094e`.

## Staging state

- `git ls-files -u` — empty; no unmerged stages.
- `git status --porcelain` — `M  .xgd/tickets/hot/request-01ea4eec.md` (staged, clean worktree).
- `git ls-files -s` — stage `0`, blob `e2c2f78b19d4ffa3c41db515bec7f70fcaf01121`.
- No conflict markers remain (grep for `<<<<<<<` / `=======` / `>>>>>>>` returns nothing).
- `CHERRY_PICK_HEAD` still present at `ffce0148a9745889f1aa37ab3376b61617b86bec`. No `--continue` / `--skip` / `--quit` / `--abort` was run; the only git write was `add --sparse` on the single conflicted path.
- Staged diff vs HEAD is **non-empty** (one hunk: the EOF newline), so finalize will commit this pick rather than skip it as empty.

## Note on invocation

`.xgd/tickets/` is outside this worktree's sparse-checkout cone (11% of tracked files present), so plain `git add` refused the path; `git add --sparse` was required, as DOC-986 §2/§4.1 and this prompt's STEP 4 anticipate.
