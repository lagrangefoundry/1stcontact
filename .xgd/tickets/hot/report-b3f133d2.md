---
uid: report-b3f133d2
id: REPORT-4700
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T10:24:11.783250+00:00'
updated_at: '2026-09-21T10:24:11.783250+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-78370159.md` — **UU**, intent/bookkeeping ticket
  (kind=`request`) → STEP 2e. Resolved per-fact, not by whole-file winner.

  **Body section** (`## Depends on` preamble, the `[[REQ-163]]`/`[[REQ-162]]`
  blob-addressing restatement): both sides made the *byte-identical* edit to
  the same paragraph. Not a competing fact — no choice required. Kept.

  **Frontmatter**: HEAD is a strict superset of incoming on every field, so
  2e's "one side a strict superset: keep the superset" governs:

  | field | HEAD (kept) | incoming | note |
  |---|---|---|---|
  | `updated_at` | `2026-09-09T21:32:50` | `2026-09-01T00:47:45` | HEAD is 8 days later → later-positioned intent wins per-fact |
  | `status` | `bundled` | `free_coding` | incoming = unchanged base value |
  | `last_field_updated` | `status` | `body` | follows from the above |
  | `story_points` | `13` | `8` | incoming = unchanged base value |
  | `commits` / `version` / `bundled_in` | present (`bundle-87be4669`, 2 working SHAs) | absent | HEAD-only lifecycle state |

  Incoming contributed no field that HEAD lacks. Taking incoming's frontmatter
  would have reverted a bundled ticket to `free_coding` and dropped its commit
  records — a regression, not an integration.

  Staged as blob `9c6d321c` (stage 0). Sparse-checkout note: the file was never
  materialised in the working tree despite being unmerged (index flag `M`, not
  skip-worktree), so the three sides were read via `git cat-file -p` on the
  stage-1/2/3 blobs rather than from disk, and staged with `git add --sparse`.

## Incoming changes preserved

- `.xgd/tickets/hot/request-78370159.md` — **confirmed.** `git show
  4207df5246 -- <path>` shows exactly two hunks. The substantive one (the
  `[[REQ-163]]`/`[[REQ-162]]` restatement, +9/-5) is present verbatim in the
  staged blob at lines 238–246, verified by grep against
  `git cat-file -p 9c6d321c`. The other hunk is the `updated_at` bump alone,
  resolved to HEAD's later value under 2e's per-fact timeline rule — that is a
  fact HEAD won on the merits, not a discarded developer change.

No hunks were dropped under the BUG-1301 precedence exception; it did not
apply to this conflict. No code files, no UAT test files, no deletion
conflicts in this cherry-pick.

## Net effect

The staged tree is byte-identical to HEAD (`git diff --cached HEAD` is empty),
because HEAD already carried both the body edit and the newer frontmatter.
Per STEP 4 this is staged and exited normally — the finalize step will detect
the clean staged diff and skip the commit. `--skip`/`--continue` not invoked;
`CHERRY_PICK_HEAD` (`4207df5246`) left in place.
