---
uid: report-c13f49d2
id: REPORT-3568
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-09T23:08:04.204061+00:00'
updated_at: '2026-09-09T23:08:04.204061+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — UU, intent/bookkeeping ticket (STEP 2 rule
  2e). Resolved by keeping the HEAD side in full (`git checkout --ours` +
  `git add --sparse`).

  Both sides diverge from the merge base only in the frontmatter scalars
  (`updated_at`, `completed_at`, `last_field_updated`, `status`) and in the
  `fields:` block. The body addition — the whole `# Implementation — the tenant
  fix` section plus the `## Status` rewrite — is byte-identical on both sides.

  Per-fact resolution:
  - `status`: HEAD `free_and_reconciled` (2026-08-31T19:19:38Z) vs incoming
    `draft` (2026-08-24T01:48:23Z). HEAD is the later-positioned side, and
    taking incoming would demote an operator-owned status back to draft and
    null out `completed_at`. HEAD kept.
  - `fields.story_points`, `fields.commits`, `fields.version`,
    `fields.bundled_in`: present only on HEAD, never touched by incoming.
    HEAD is a strict superset here. HEAD kept.
  - Body: identical on both sides, so no choice to make.

  The only content the incoming side carries that HEAD does not is the older
  values of those same scalars, plus a trailing newline. Nothing authored by the
  developer is lost.

## Incoming changes preserved

The incoming commit `5af1ff949d4069fada2d2f0b4e17871aec5980c6`
("xgd(ticket): update bug bug-db356ff8", 2026-08-23) touches exactly one file
and makes exactly two content changes:

1. `## Status` — "Scope drafted, awaiting operator confirmation before coding."
   replaced with the "Both halves landed and verified (2026-08-23)…" paragraph.
2. Appended the 110-line `# Implementation — the tenant fix` section
   (What changed / Why `reason` had to be exposed / Scope / Tests /
   Supersession / Verified / Still open).

`git diff <base> <ours>` shows both hunks already present on the HEAD side,
character for character. Verified by diffing ours against theirs
(`git diff e3e27e2c 8f92f712`): the resulting diff contains no body hunk other
than the trailing-newline difference on the final line.

The incoming commit's effect therefore already landed in HEAD through the
earlier sync, so the staged tree nets to no diff vs HEAD
(`git diff --cached --stat HEAD` is empty). This is the redundant-commit case of
STEP 4 / BUG-1109, not a discard: STEP 3's test — are the incoming commit's key
changes present in HEAD? — answers yes for both hunks. `--skip` was not called;
the finalize step will detect the clean staged diff.

No code, implementation, or UAT files were in conflict. No hunks were dropped
under the BUG-1301 precedence exception.

## State

`CHERRY_PICK_HEAD` (5af1ff949d4069fada2d2f0b4e17871aec5980c6) left intact.
`git status --porcelain` reports no remaining conflict-class entries.
