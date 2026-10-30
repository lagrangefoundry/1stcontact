---
uid: report-87e83d20
id: REPORT-4689
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T09:59:46.497580+00:00'
updated_at: '2026-09-21T09:59:46.497580+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-439cd0c8.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e** (plus the enrichment block's "take the more
  recent commit by timestamp" fallback, which agrees). Resolved to the
  **ours/HEAD** blob (`a8c14c1e9b`).

  The file is outside the sparse-checkout cone (this worktree is an 11%
  sparse checkout; the conflict existed in the index with no working-tree
  markers), so it was materialised from the ours blob and staged with
  `git add --sparse`, per DOC-986 §2/§4.1.

  Per-fact resolution — the two sides are **not** competing on body
  content at all; they are byte-identical there. Only frontmatter and two
  cosmetic artefacts differ:

  | fact | ours (HEAD) | theirs (`1195a7b589`) | taken |
  |---|---|---|---|
  | `status` | `bundled` | `free_coded` | ours |
  | `bundled_in` | `bundle-87be4669` | *(absent)* | ours |
  | `updated_at` | `2026-09-09T21:32:49Z` | `2026-09-01T00:11:19Z` | ours |
  | `last_field_updated` | `status` | `body` | ours |
  | blank line after `---` | *(none)* | stray extra blank line | ours |
  | EOF | trailing newline | no trailing newline | ours |

  Every differing fact is later-positioned on the ours side: HEAD carries
  the `free_coded → bundled` transition (2026-09-09) that happened *after*
  the incoming commit's body edit (2026-09-01). Taking theirs on any of
  these would have reverted the ticket out of `bundled` and dropped
  `bundled_in`. The stray blank line and the missing trailing newline are
  formatting regressions with no intent behind them.

## Incoming changes preserved

Not a code file, but the incoming content was verified present regardless:

- `1195a7b589` ("xgd(ticket): update request request-439cd0c8" — commit
  message states *"Content edit only; no structural change"*) adds a
  `## Resolved after implementation (2026-08-31)` section and trims two
  now-answered items from `## Open questions`.
- `git diff --no-index` between the ours blob and the theirs blob shows
  **zero body-content hunks** — that entire section, and the trimmed
  `## Open questions` list, are already present in HEAD byte-for-byte
  (landed upstream of this resync branch's tip). The only hunks are the
  frontmatter table above plus the blank-line/EOF artefacts.

No hunk was dropped under the BUG-1301 precedence exception; none was
needed. Nothing from the incoming commit is lost.

## Note for the next step

The resolution is **empty relative to HEAD** — `git status --porcelain`
is clean and `git ls-files -u` reports no unmerged stages, because the
incoming commit's substantive effect was already integrated. Per STEP 4
this is staged and exited as normal; finalize should detect the clean
staged diff and skip the commit. `CHERRY_PICK_HEAD` was left untouched.
