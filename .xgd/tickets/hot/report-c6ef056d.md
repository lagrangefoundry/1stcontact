---
uid: report-c6ef056d
id: REPORT-3410
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-03T23:48:58.707586+00:00'
updated_at: '2026-09-03T23:48:58.707586+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-119dd4af.md` — **UU**, intent/bookkeeping ticket
  (rule **2e**; a `request-*` ticket, not a spec ticket, so 2d's ledger-replay
  does not apply). Resolved to the **ours/HEAD** blob `353324f1de`.

  Sparse-checkout case (DOC-986 §2/§4.1): `.xgd/tickets/` is outside the cone —
  the worktree reports 13% of tracked files present — so the conflict existed
  only in the index, with the file absent from disk and no working-tree markers.
  Materialised the winning blob byte-exact with
  `git cat-file blob 353324f1de > <path>` (11926 bytes, matching
  `git cat-file -s`, preserving the file's missing final newline) and staged it
  with `git add --sparse`, each as the sole content of its own call per BUG-1294.

### Per-fact application of 2e

The incoming commit `db39fce0f8` touches exactly three frontmatter lines:

| Fact | Ours (HEAD) | Theirs (incoming) | Resolution |
|---|---|---|---|
| `last_field_updated` | `status` | `status` | identical — no conflict |
| `status` | `bundled` | `free_coding` | ours (see below) |
| `updated_at` | `2026-09-02T17:48:26` | `2026-08-31T21:56:04` | ours (later) |

`status` is the only genuinely contested fact. Ours is a **strict superset** on
2e's terms: `free_coding` and `bundled` are two positions on one lifecycle, and
HEAD holds the later one together with the whole free-coded record the incoming
side never had — `commits[0].working_sha: 115f0d39ec`, `version: 0.2.23`,
`bundled_in: bundle-203b1dc2`, `chat_comment: comment-733e844c`, and the
appended "What landed" body. Ours changes every field theirs changes, in the
same direction, and further along. Nothing on the incoming side is disjoint from
ours, so there is nothing to combine.

### Timestamp rule (per the auto-enriched metadata)

The enrichment classified intent as unknown on one or both sides and directed
"take the more recent commit by timestamp." Both sides confirm ours:

- ours — `1856968a43`, **2026-09-02 10:50:06 -0700**, `xgd(ticket): seed_local_overlay request request-119dd4af`
- theirs — `db39fce0f8`, **2026-08-31 14:56:04 -0700**, `xgd(ticket): update request request-119dd4af`

Ours is two days later. `xgd ticket history` on both sides returns bare
`seed_local_overlay` / `update` subjects with no free-text `--commit-message`
narrative on either, so there was no operation narrative to compose (BUG-1030) —
which is consistent with the enrichment's "intent unknown" classification.

## Incoming changes preserved

**Redundant, not discarded — STEP 4 / BUG-1109, not a STEP 3 @fail.**

The staged tree nets to no diff against HEAD. Per STEP 3, the question is
whether the incoming commit's key change is *present in HEAD via a different
route* (redundant) or *simply absent* (discarded). It is present.

The incoming commit's entire intent is to move this ticket off `draft` and into
the coding lifecycle (`status: draft → free_coding`). The HEAD-side commit
`1856968a43` is a `seed_local_overlay` that re-seeded the ticket wholesale from
the working timeline, taking `status: draft → bundled` in one step and carrying
the full free-coded record with it. A ticket cannot hold
`commits[0].working_sha`, `version: 0.2.23` and `bundled_in: bundle-203b1dc2`
without having passed through `free_coding` — the overlay seeded the terminal
state of exactly the lifecycle the incoming commit was starting. So the incoming
change arrived in HEAD by the overlay route rather than by this commit, and
re-applying `free_coding` on top of `bundled` would *regress* the ticket.

No code or implementation files were in conflict, so STEP 3's per-file
verification of incoming code hunks does not arise, and the BUG-1301 precedence
exception was not invoked — no hunk was dropped on refactor grounds and no test
function was touched.

## Flagged for post-merge review

Per the enrichment's resolution rule, this file is flagged: the ticket's
`status` was decided by commit timestamp rather than by a declared intent
narrative. The substantive check a reviewer should make is that
`request-119dd4af` (REQ-159) is correctly at `status: bundled` in
`bundle-203b1dc2` with `working_sha: 115f0d39ec` and `version: 0.2.23`, and has
not been left stranded at `free_coding`.

## Notes

- The cherry-pick sequencer was left untouched — `CHERRY_PICK_HEAD` is still
  `db39fce0f8`. No `--continue`, `--skip`, `--quit`, `--abort`, `git reset` or
  branch checkout was run; the finalize step will detect the clean staged diff.
- No test suites were run — no code files were in conflict, so there was nothing
  to spot-check. `--all-tests` was not invoked.
- Side effect worth knowing: resolving an out-of-cone path materialised
  `.xgd/tickets/hot/request-119dd4af.md` in the working tree. It is staged at
  stage 0 identical to HEAD, so `git status --porcelain` is clean for it; a
  `git sparse-checkout reapply` will remove it again.

## Verification

- `git ls-files -u` — empty; no unmerged index entries remain.
- `git status --porcelain <path>` — empty (resolution is byte-identical to HEAD,
  which STEP 4 states is correct and is not itself a @fail).
- `git rev-parse --verify CHERRY_PICK_HEAD` — `db39fce0f87b935fb530062d15b37882b93aec60`, still paused as required.
