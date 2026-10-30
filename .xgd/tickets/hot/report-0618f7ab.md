---
uid: report-0618f7ab
id: REPORT-4863
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T19:13:57.372753+00:00'
updated_at: '2026-09-23T19:13:57.372753+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-26dafd83.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), STEP 2e. Resolved per-fact in favour of the later-positioned
  intent.

## Analysis

Bodies are byte-identical on both sides (`git diff :2:<path> :3:<path>` shows
frontmatter-only changes). Git auto-merged `fields.bundled_in:
bundle-87be4669` cleanly; the sole conflicting hunk was a three-line block
carrying one lifecycle fact:

| fact | ours (HEAD) | theirs (CHERRY_PICK_HEAD `e9fb50b148`) |
|---|---|---|
| `status` | `bundled` | `ready_to_reconcile` |
| `updated_at` | `2026-09-09T21:32:49Z` | `2026-09-01T23:10:06Z` |

Both ledgers were replayed:

- **Incoming** (`xgd ticket history request-26dafd83 --rev e9fb50b148`):
  `create`→draft (08-31) → free_coding → body edit → free_coded (adds
  `commits`, `version`) → story_points → **`ready_to_reconcile` (09-01)**.
- **HEAD** (`xgd ticket history request-26dafd83`): `create`→draft (08-31) →
  `seed_local_overlay` (09-09) → **`bundled`, `bundled_in: bundle-87be4669`**.

These are not disjoint edits to different aspects — both sides set the same
field (`last_field_updated: status` on each), so this is a genuine single-fact
conflict, and 2e's later-positioned rule applies. HEAD is strictly downstream:
`ready_to_reconcile` → `bundled` is a forward lifecycle transition, HEAD's
`updated_at` is 8 days later, and `bundled_in` is information the incoming side
does not yet have. Taking the incoming side would have regressed the ticket to
a pre-bundle state and orphaned `bundled_in` from its `status`.

No facts were dropped: every field the incoming side contributed earlier in its
ledger (`fields.commits` with all three `working_sha` entries, `fields.version:
0.2.31`, and the full body including the `## What landed` section) is present
in the resolved file, having already been carried into HEAD.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is a
bookkeeping ticket, so there is no developer code to preserve or discard, and
the BUG-1301 precedence exception was not invoked.

The two incoming frontmatter values (`status: ready_to_reconcile`,
`updated_at: 2026-09-01T23:10:06Z`) are intentionally absent from the
resolution. That is the 2e per-fact outcome for a genuine same-field conflict,
not a discarded change: the incoming ticket body and every other incoming field
appear verbatim in the resolved version, and the superseding value
(`bundled`) is the same fact at a later point in the same ticket's life.

## Staging

`git ls-files -u` is empty and no conflict markers remain. The resolved content
is identical to HEAD, so the file shows no entry in `git status --porcelain`
(the remaining `??` entries are pre-existing untracked cold tickets, unrelated
to this conflict). Per the workflow contract, no `--continue`/`--skip` was
issued; `CHERRY_PICK_HEAD` (`e9fb50b148`) is intact for the finalize step,
which will detect the empty staged diff.
