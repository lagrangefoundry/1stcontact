---
uid: report-84c21d91
id: REPORT-4497
type: report
title: 'Resync resolve conflicts: 18ffaec45665d29545db8bfd323ee4bf6d1f8678'
created_by: xgd
created_at: '2026-09-20T19:11:43.036788+00:00'
updated_at: '2026-09-20T19:11:43.036788+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-18a48d63.md` — **AA** (both added), intent/bookkeeping ticket
  (`request-*`), rule **2e**: later-positioned intent wins per fact. Resolved to the **ours/HEAD**
  side via `git checkout --ours` + `git add --sparse`.

  Both conflict hunks were confined to YAML frontmatter; the document body was byte-identical on
  both sides. The full ours-vs-theirs diff was four facts, and HEAD is later and strictly more
  informed on every one:

  | Fact | Incoming (`fb1d4d621e`, 2026-08-17) | HEAD (2026-08-31) | Resolution |
  |---|---|---|---|
  | `updated_at` | `2026-08-17T20:06:08` | `2026-08-31T14:22:42` | HEAD (later) |
  | `status` | `ready_to_reconcile` | `free_and_reconciled` | HEAD (forward lifecycle progress) |
  | `completed_at` | `null` | `2026-08-31T14:22:42` | HEAD |
  | `fields.bundled_in` | *(absent)* | `bundle-b3b7c399` | HEAD (incoming lacks it entirely) |
  | `fields.commits` | `7ebc721b…` as a separate entry | `7ebc721b…` folded into the first entry's `working_sha_history` | HEAD (consolidated; no sha lost) |

  Taking the incoming side here would have **regressed** the ticket's status from
  `free_and_reconciled` back to `ready_to_reconcile`, nulled `completed_at`, and dropped the
  `bundled_in: bundle-b3b7c399` linkage — i.e. discarded post-watermark reconciliation bookkeeping
  that the resync branch already carries.

## Incoming changes preserved

No code or implementation files were in conflict — the sole conflicted path is a bookkeeping
(`request-*`) ticket, so there is no developer source to discard.

The only structurally distinct content on the incoming side was commit
`7ebc721b83ab6202fdec600cd0493b69964bac39` recorded as its own `fields.commits[]` entry. That sha
is **preserved** in the resolved file, as an element of the first commit entry's
`working_sha_history` — HEAD's shape is the later, consolidated representation of the same fact,
not a deletion of it. Every sha present on the incoming side
(`b71a8641…`, `7ebc721b…`, `761b7fbd…`, `96118c32…`) appears in the resolved version.

No hunks were dropped under the BUG-1301 precedence exception; it did not apply to this conflict.

## Staging state

`git status --porcelain` is empty: the conflict is resolved in the index and the staged content
equals HEAD, so this cherry-pick carries no net change. Per the resolver contract, the tree was
staged and left as-is — `--continue`/`--skip`/`--quit`/`--abort` were **not** invoked, and
`CHERRY_PICK_HEAD` remains present for the finalize step, which will detect the clean staged diff
and skip the commit.
