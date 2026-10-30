---
uid: report-174b28c9
id: REPORT-4729
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T14:17:22.959843+00:00'
updated_at: '2026-09-21T14:17:22.959843+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-78370159.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), STEP 2e + enrichment rule "take the more recent commit by
  timestamp and flag for post-merge review". Resolved to the **ours** side in
  full; staged with `git add --sparse` (path is outside the sparse-checkout
  cone, so the conflict existed only in the index with no working-tree
  markers — DOC-986 §2/§4.1).

  Both sides edited the *same three facts* off a common base of
  `status: free_coded`:

  | fact | ours (HEAD) | theirs (`0bba66b7fd`) |
  |---|---|---|
  | `status` | `bundled` | `ready_to_reconcile` |
  | `updated_at` | `2026-09-09T21:32:50Z` | `2026-09-01T18:09:24Z` |
  | `last_field_updated` | `status` | `status` |
  | `fields.bundled_in` | `bundle-87be4669` | *(absent)* |

  There are **no disjoint fields** to compose — theirs touches a strict subset
  of the frontmatter keys ours touches, and no body text differs on either
  side. So 2e's "apply BOTH" branch does not apply; this is the genuine
  same-fact conflict branch, decided per fact by later-positioned intent.

  Both independent timestamp signals agree that ours is later:
  the ticket's own `updated_at` (09-09 vs 09-01) and the commit date
  (`ae2ceafd` 2026-09-21 vs `0bba66b7` 2026-09-01). `xgd working-timeline`
  was not applicable here — it compares two *distinct* uids, and both sides
  are the same uid.

  Ours is additionally a strict superset: it carries
  `fields.bundled_in: bundle-87be4669`. Taking theirs would both regress the
  lifecycle (`ready_to_reconcile` is a state this ticket has already passed
  through en route to `bundled`) and orphan the ticket from its bundle with
  nothing left pointing at it.

  Ours also fixes a missing trailing newline at EOF present in the base; that
  came along with the whole-side take.

**Flagged for post-merge review** per the enrichment rule: the intent metadata
reported *unknown* intent on both sides (identical generic subjects,
`xgd(ticket): update request request-78370159`), so this resolution rests on
timestamp ordering plus the superset/lifecycle argument above rather than on a
stated operation narrative.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket, so STEP 3's `git show $CPHEAD -- <file>` verification of
preserved developer code does not apply.

The incoming side's only substantive change — `status: ready_to_reconcile` — is
deliberately **not** present in the resolved file. This is not a dropped
developer change and does not invoke the BUG-1301 precedence exception; it is
2e's same-fact conflict resolved in favour of the later intent. The incoming
value is an *earlier* point on the same lifecycle path that HEAD has already
advanced past (`free_coded` → `ready_to_reconcile` → … → `bundled`), so
carrying it forward would move the ticket backwards.

The resolved tree is byte-identical to HEAD for this path, so the staged diff
for this cherry-pick is empty. Left staged and unmodified as instructed —
`--continue`/`--skip` not invoked; the finalize step owns detecting the empty
diff and skipping the commit.
