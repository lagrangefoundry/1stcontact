---
uid: report-3a00b106
id: REPORT-3403
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-03T23:30:58.041788+00:00'
updated_at: '2026-09-03T23:30:58.041788+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` (REQ-162) — class **UU**, rule **2e**
  (intent/bookkeeping ticket, per-fact resolution). Incoming commit
  `d86269421c` (working timeline, free_coded, 2026-08-31T21:41:19Z); HEAD
  `9a464ce01d`.

  The path is outside this branch's sparse-checkout cone
  (`!/.xgd/tickets/**`, DOC-986 §2/§4.1), so the conflict existed only in the
  index with no working-tree markers. Resolved by composing from the index
  stages and staging with `git add --sparse`.

  Resolution: **HEAD's frontmatter block + the incoming commit's body,
  byte-exact on both halves.** Per fact:

  | Fact | Incoming (`d86269421c`) | HEAD | Kept |
  |---|---|---|---|
  | `status` | `free_coded` | `free_and_reconciled` | HEAD — strictly downstream of `free_coded` |
  | `last_field_updated` | `status` | `result` | HEAD |
  | `updated_at` | 2026-08-31T21:41:19Z | 2026-09-02T01:34:36Z | HEAD |
  | `completed_at` | `null` | 2026-09-02T01:34:00Z | HEAD |
  | `fields.version` | `0.2.20` | `0.2.20` | identical — incoming value preserved |
  | `fields.commits` | 3 entries, `working_sha` set / `main_sha` null | 1 entry, `working_sha` null / `main_sha: 4b43dd9a5c` | HEAD (see below) |
  | blank line after frontmatter fence | removed | present | **incoming** |
  | trailing newline at EOF | removed | present | **incoming** |

  The four frontmatter facts are the *same* fields written differently by two
  stages of the same ticket's lifecycle, so 2e's genuine-conflict branch
  applies: keep the later-positioned side. HEAD is later on every one — it
  additionally carries `result: pass`, `merged_at_commit: 4b43dd9a5c`, and 257
  `orphan_commits` remap entries that the incoming side never had. Result
  verified to parse as valid YAML after composition.

## Incoming changes preserved

The incoming commit is pure bookkeeping — a `free_coding` → `free_coded`
status promotion plus a commit-sha ledger. It contains no code, no tests, and
no prose. Its body is byte-identical to HEAD's body apart from the two
whitespace facts, both of which were taken from the incoming side; verified
mechanically, not by inspection: the resolved file's body is a byte-exact match
for the incoming stage's body (15231 chars), and its frontmatter is a byte-exact
match for HEAD's.

- `fields.version: 0.2.20` — the one incoming field HEAD did not already
  differ on — is present in the resolution.
- The blank-line and trailing-newline removals are applied as the developer
  authored them (this commit reverts a blank line its own predecessor
  `40765e3d6b` added 79 seconds earlier).

**Flagged for post-merge review** (the enrichment metadata asked for this):
the incoming `fields.commits` records three working-timeline SHAs —
`fc117f1d3595` (`[FREE-CODED] REQ-162 — the product ticket store`),
`2284bf4bbd62`, `bc36b2cce9bd` — that do not appear anywhere in HEAD's
frontmatter, including its 257-entry `orphan_commits` map. HEAD's `commits`
instead holds a single post-merge entry keyed by `main_sha` with `working_sha:
null`. These are two renderings of the same field by different workflow stages,
not disjoint additions, so they were not combined: a 4-entry list, or a hybrid
entry back-filling `working_sha` into HEAD's, is state neither side authored and
2e prohibits inventing it. The later side (HEAD, the post-merge rendering that
also set `result: pass` and `merged_at_commit`) was kept intact. If those
working SHAs are wanted on the reconciled ticket, that is an
`xgd ticket`-mediated edit for the operator, not a conflict resolution.

No hunks were dropped under the BUG-1301 precedence exception; none applied. No
code, test, or spec-ticket files were involved.

Staged diff vs HEAD is the two whitespace facts only (1 insertion, 2 deletions).
`--skip` was not called and the cherry-pick sequencer state (CHERRY_PICK_HEAD
= `d86269421c`) is left intact for `cherry_pick_finalize_resolution`.
