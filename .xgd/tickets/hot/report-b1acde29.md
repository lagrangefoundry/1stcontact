---
uid: report-b1acde29
id: REPORT-5140
type: report
title: 'Resync resolve conflicts: d7587990b588ef6c03b752fe16afa93745aa9da3'
created_by: xgd
created_at: '2026-09-26T21:39:01.787711+00:00'
updated_at: '2026-09-26T21:39:01.787711+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-18a48d63.md` — **AA** (both added), intent/bookkeeping ticket
  (`request-*`), resolved under **STEP 2e** per-fact later-intent rule. Materialized on disk
  with real conflict markers despite living under `.xgd/tickets/` (outside the sparse cone),
  so resolved via `git checkout --ours` + `git add --sparse`.

  Bodies are **byte-identical** on both sides (verified: `git diff <ours-blob> <theirs-blob>`
  shows changes confined to YAML frontmatter; the 268-line prose body is unchanged). The
  conflict is entirely lifecycle bookkeeping. On **every** differing fact, OURS (HEAD) holds
  the strictly later state, and THEIRS contributes no fact OURS lacks:

  | Fact | OURS (HEAD) | THEIRS (incoming) | Taken |
  |---|---|---|---|
  | `updated_at` | `2026-08-31T14:22:42` | `2026-08-17T20:06:08` | OURS (later) |
  | `completed_at` | `2026-08-31T14:22:42` | `null` | OURS (advanced) |
  | `status` | `free_and_reconciled` | `ready_to_reconcile` | OURS (advanced) |
  | `fields.commits` | one entry; `7ebc721b` folded into `working_sha_history` | two entries; `7ebc721b` still a separate pending entry | OURS (post-reconcile normalized form) |
  | `fields.bundled_in` | `bundle-b3b7c399` | *absent* | OURS (present only here) |

  Corroborated by commit timeline rather than `updated_at` alone: the incoming commit
  `fb1d4d62` is dated **Sun Aug 23 12:41:55 2026**, while HEAD's most recent touch to this
  ticket is `ecd40fbc` **Mon Aug 31 07:22:42 2026** (`xgd(ticket): update`), preceded by
  `209bea11` Aug 30 (`seed_local_overlay`). The resync branch's overlay has already advanced
  this ticket's lifecycle past the incoming side.

  Taking incoming here would have been a **regression**, not an integration: it would roll
  `status` back `free_and_reconciled` → `ready_to_reconcile`, null out `completed_at`, drop
  `bundled_in: bundle-b3b7c399`, and un-fold `7ebc721b` back into a pending commits entry.
  Because OURS is later on every differing fact, the per-fact 2e resolution and taking OURS
  wholesale coincide.

## Incoming changes preserved

No code/implementation files were in conflict — `fb1d4d62` is a ticket-only commit
(`git show --stat`: 1 file changed, `.xgd/tickets/hot/request-18a48d63.md` only), so there is
no developer source to discard and the BUG-1301 precedence exception was not invoked.

The incoming side's sole substantive content — the 268-line ticket body — is present verbatim
in the resolved version (the two blobs differ only in frontmatter). The one incoming *datum*
not carried as a distinct list element, `working_sha: 7ebc721b83ab6202fdec600cd0493b69964bac39`,
**is** preserved in the resolved file: HEAD retains it inside
`fields.commits[0].working_sha_history`, which is where the reconcile step normalizes a
superseded working sha. No information from the incoming side is lost.

## Staging state

`git ls-files -u` and `git status --porcelain` are both empty; no `UU`/`AA`/`DU`/`UD` entries
remain. Staged blob for the resolved path is `9a0a98ce5d32dff4318f6a93a049d3921c65aad1` — the
OURS blob exactly — so `git diff --cached HEAD` is empty. Per STEP 4, `--skip` was **not**
invoked; the finalize step will detect the clean staged diff and skip the commit.
`CHERRY_PICK_HEAD` is intact at `fb1d4d621e89fd00a44a8a73e114b2bf7de35bb2`.
