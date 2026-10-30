---
uid: report-fd29dd2e
id: REPORT-5305
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T06:52:08.072585+00:00'
updated_at: '2026-09-28T06:52:08.072585+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bundle-8eef3846.md` — **AA** (both added), intent/bookkeeping
  ticket (STEP 2e) reinforced by the enrichment rule for this file ("take the
  more recent commit by timestamp, flag for post-merge review").
  Resolution: **ours**, wholesale. Staged blob `fb4a6e56`, zero conflict markers.

  The file materialized in the working tree with two real hunks despite
  `.xgd/tickets/` being outside the sparse-checkout cone (DOC-986 §2/§4.1);
  `git checkout --ours` refused the index update on the sparse path, so staging
  went through `git add --sparse`.

  Diffing the two index stages, the entire disagreement is frontmatter plus a
  trailing-newline difference — the 369-line body is byte-identical on both
  sides, so there is no per-fact composition to do:

  | field | ours (HEAD) | incoming (`c2efcb99`) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `updated_at` | `2026-09-01T00:00:07Z` | `2026-08-31T05:05:09Z` |
  | `completed_at` | `2026-08-31T23:59:50Z` | `null` |
  | `last_field_updated` | `result` | `created_at` |
  | `commits` | one entry, `main_sha: 90527353` | two entries, raw `working_sha`s |
  | extras | `orphan_commits` (~110 old→new pairs), `merged_at_commit`, `result: pass` | — |

  Incoming is the ticket's *creation* state (`xgd(ticket): create bundle
  bundle-8eef3846`); ours is the same ticket after it was bundled, reconciled
  and merged. Ours is strictly later on every field that differs and is a
  superset of incoming's content, so 2e's "keep the superset" applies and the
  timestamp tie-break points the same way. Taking incoming would have regressed
  `free_and_reconciled` → `ready_to_reconcile` and dropped `result`,
  `completed_at` and the whole orphan map.

  The two `working_sha` values that appear only on the incoming side are not
  lost: they are the `old_sha` half of ours' `orphan_commits` remap
  (`759cd874…` → `2df64a7f…`, `29c0e86d…` → `6330d77b…`), and
  `main_sha: 90527353` records where they landed.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket, so STEP 3's `git show $CPHEAD -- <file>` verification has no
code target and no hunk was dropped under the BUG-1301 precedence exception.

For the ticket itself, every fact carried by the incoming side is represented in
the resolved file, either verbatim (`uid`, `id`, `type`, `title`, `created_by`,
`created_at`, `auto_merge_back`, `priority`, and the full 369-line body) or in
its post-reconcile form (the two `working_sha`s via `orphan_commits` +
`main_sha`). Nothing from `c2efcb99` is discarded.

## Note for the sequencer

The resolved tree matches HEAD exactly, so this cherry-pick is **empty** — ours
is a strict superset of the incoming create state. Per the brief I have staged
and stopped; `CHERRY_PICK_HEAD` (`c2efcb99`) is intact and the `--skip` /
`--continue` decision is left to the finalize step.
