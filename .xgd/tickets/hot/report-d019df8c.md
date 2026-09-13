---
uid: report-d019df8c
id: REPORT-4155
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T22:27:22.169173+00:00'
updated_at: '2026-09-13T22:27:22.169173+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` (REQ-162) — **UU**, intent/bookkeeping
  ticket (`type: request`), rule **2e**. Sparse-excluded on this branch
  (DOC-986 §2/§4.1): no working-tree file, conflict existed only in the index,
  so both sides were read via `git show :2:` / `git show :3:` and the resolution
  was composed and staged with `git add --sparse`.

  Incoming commit `d86269421c` (`xgd(ticket): update request request-13a5e206`,
  2026-08-31T21:41:19). Resolved per-fact:

  **Frontmatter — kept ours (HEAD).** Every field the incoming commit touches is
  the same fact HEAD also carries, in a strictly later and downstream form:

  | fact | incoming (2026-08-31) | ours (2026-09-02) |
  |---|---|---|
  | `updated_at` | `21:41:19.405843` | `2026-09-02T01:34:36.152341` |
  | `completed_at` | `null` | `2026-09-02T01:34:00.748431` |
  | `last_field_updated` | `status` | `result` |
  | `status` | `free_coded` | `free_and_reconciled` |
  | `fields.commits` | 3 raw `working_sha` entries, `reconcile_sha`/`main_sha` null | 1 entry, `working_sha: null`, `main_sha: 4b43dd9a5c` |
  | `fields.version` | `0.2.20` | `0.2.20` (identical) |

  Ours is later on wall-clock by two days *and* downstream in the ticket
  lifecycle (`free_coded` -> ... -> `free_and_reconciled`), and additionally
  carries `fields.orphan_commits`, `fields.merged_at_commit: 4b43dd9a5c` and
  `result: pass`, which the incoming side has no counterpart for. Per 2e's
  "same field changed differently -> later-positioned intent wins, per fact".

  **Body/formatting — kept theirs (incoming), byte for byte.** The incoming
  commit reverts two formatting changes its own immediate predecessor
  (`40765e3d6b`, cherry-picked into this bundle one step earlier as
  `00b8869575`) had introduced: it removes the extra blank line after the
  frontmatter fence, and removes the trailing newline. Verified the bodies are
  otherwise byte-identical (`diff` of ours' lines 541+ against theirs' lines
  30+ reports exactly those two differences and nothing else), and the resolved
  file's body `diff`s clean against the incoming side.

## Incoming changes preserved

Confirmed. `d86269421c` makes three kinds of change to this file; all are
accounted for, none discarded:

1. **Blank-line removal after the frontmatter fence** — **present**. The
   resolved body is byte-identical to the incoming side (`diff` rc=0).
2. **Trailing-newline removal** — **present**. Resolved file ends
   `Cloudflare does not.` with no newline, matching the incoming side
   (verified with `od -c`).
3. **Frontmatter field updates** — superseded, not discarded. These are xgd
   reconcile bookkeeping, not developer-authored prose or code. The three
   `working_sha` values the incoming commit records are the REQ-162 free-coded
   commits (`fc117f1d35` "the product ticket store: D1 schema, TypePack,
   material types", `2284bf4bbd` "version 0.2.19", `bc36b2cce9` "version
   0.2.20") — all three confirmed to exist as commit objects. Ours records the
   *outcome* of reconciling exactly those commits: a single `commits` entry with
   `main_sha: 4b43dd9a5c`, plus `merged_at_commit: 4b43dd9a5c` and
   `result: pass`. Taking the incoming values would regress the ticket to
   claiming it is unreconciled, with dangling working shas, no main sha and no
   result — a strictly worse and factually wrong state that the next reconcile
   step would have to undo.

No code or implementation files were involved. No hunk was dropped under the
BUG-1301 precedence exception; the only incoming hunks not reflected verbatim
are the frontmatter ones, resolved by 2e's per-fact timeline rule rather than
by any deletion.

Residual staged diff vs HEAD is exactly the two formatting reverts.
