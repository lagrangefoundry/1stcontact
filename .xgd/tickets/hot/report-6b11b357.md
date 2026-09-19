---
uid: report-6b11b357
id: REPORT-4375
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T10:12:01.148288+00:00'
updated_at: '2026-09-19T10:12:01.148288+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` — class **UU**, rule **2e** (intent/bookkeeping
  ticket; `request-*` is user-authored content, not matrix state). Resolved per fact,
  every fact landing on the HEAD side. Staged via `git checkout --ours` +
  `git add --sparse`.

Incoming commit: `d8626942` *xgd(ticket): update request request-13a5e206*
(free_coded, authored 2026-08-31 14:41:19 -0700). Both sides carry the identical
subject, so the auto-enrichment reported "intent unknown"; the per-fact comparison
below settles it without a whole-file timeline pick.

### The incoming commit is already integrated into HEAD

Decisive finding, established before resolving: `801f03a0` on HEAD is the replay of
this very commit — same author date (2026-08-31 14:41:19 -0700), same subject,
commit date 2026-09-14 (a remap, not an original). Its diff shows the reconcile
machinery already applied this commit's two content deltas and already declined its
frontmatter deltas, because HEAD's ticket had moved past them. `801f03a0`'s parent
blob `026822d1` already read `status: free_and_reconciled`,
`completed_at: 2026-09-02T01:34:00`, `commits: [main_sha 4b43dd9a]`, `version: 0.2.20`.

Taking `--ours` therefore reproduces an outcome the reconcile process itself already
reached for this commit, rather than substituting my own judgment for it.

### Per-fact ledger

Two conflict regions, six facts:

| fact | ours (HEAD) | incoming `d8626942` | kept |
|---|---|---|---|
| `updated_at` | 2026-09-02T01:34:36 | 2026-08-31T21:41:19 | ours — later |
| `completed_at` | 2026-09-02T01:34:00 | `null` | ours — later |
| `last_field_updated` | `result` | `status` | ours — later |
| `status` | `free_and_reconciled` | `free_coded` | ours — later; incoming is the earlier lifecycle stage of the same ticket |
| `fields.version` | `0.2.20` | `0.2.20` | identical — not a conflict |
| `fields.commits` | 1 entry, `main_sha 4b43dd9a` | 3 entries, `working_sha` only, `reconcile_sha`/`main_sha` null | ours — later; same field at a downstream lifecycle point |

`fields.commits` is the only fact where the two sides hold genuinely different data
rather than different points on one clock, so it got the closest look. The incoming
list records three xgd-working shas (`fc117f1d`, `2284bf4b`, `bc36b2cc`) with both
downstream shas still null — the shape written at `free_coded`. Ours records where
that work actually landed (`main_sha 4b43dd9a`) — the shape written at
`free_and_reconciled`, alongside a `fields.orphan_commits` list that is itself the
record of working-sha remapping across this reconcile. Writing three raw working shas
back into a ticket that has already been reconciled and merged would regress the
record to a pre-remap state. 2e's per-fact timeline rule keeps ours.

`fields.orphan_commits` exists only on ours and the incoming never touched it, so
nothing from either side was dropped.

## Incoming changes preserved

Verified by diffing all three index stages (base `914093b0`, ours `e909dcbb`, theirs
`2397005c`) rather than reading conflict markers alone.

Outside the frontmatter, the incoming commit made exactly two changes — and **both
are already present in the resolved file**, which is why neither appeared as a
conflict region this round:

- removal of the stray blank line after the frontmatter terminator — already applied
  to HEAD by `801f03a0`;
- removal of the trailing newline at EOF (`\ No newline at end of file`) — likewise
  already applied by `801f03a0`.

The incoming commit changed no body prose. The 109-line
`## What landed (free-coded, 2026-08-31)` section carried by its parent is present
verbatim in the resolved file (lines 733–836), unaffected by this resolution.

No hunk was dropped, so the BUG-1301 precedence exception was not invoked and is not
relied on anywhere here. No code, test, or UAT files were involved.

## Net result

The staged tree is identical to HEAD (`git diff --cached --stat HEAD` is empty). This
is the redundant-commit case, not the discarded-commit case, and unusually well
evidenced: STEP 3's discriminator asks whether the incoming commit's key changes are
present in HEAD via another route, and here the other route is named — `801f03a0`,
the remapped replay of this same commit. Per STEP 4 (BUG-1109 / BUG-1122) this is
staged and exited `@done` as normal; `--skip` was not called and the sequencer state
is untouched — `CHERRY_PICK_HEAD` still reads `d86269421c` for
`cherry_pick_finalize_resolution`.
