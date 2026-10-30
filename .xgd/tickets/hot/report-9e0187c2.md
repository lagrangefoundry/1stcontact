---
uid: report-9e0187c2
id: REPORT-5507
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T07:55:44.866094+00:00'
updated_at: '2026-09-29T07:55:44.866094+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-bbff35c7.md` — **UU**, class 2e (intent/bookkeeping ticket, `request-*` kind). Conflict confined to four frontmatter lines (`updated_at`, `completed_at`, `last_field_updated`, `status`); ticket body identical on both sides. Both sides changed the same three facts differently, so per 2e the later-positioned intent wins per fact — which is HEAD on all three:

  | fact | HEAD (taken) | incoming `87041ccbc9` |
  |---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `completed_at` | `2026-09-14T10:29:11.537297+00:00` | `null` |
  | `updated_at` | `2026-09-19T15:15:30.957486+00:00` | `2026-09-01T23:10:22.567446+00:00` |

  HEAD is 18 days later and strictly downstream in the lifecycle: it has already passed *through* `ready_to_reconcile` on its way to `free_and_reconciled`, and carries a `completed_at`. Taking the incoming side would roll the ticket backwards and clear a completion timestamp. This matches the auto-enriched resolution rule for this file ("take the more recent commit by timestamp").

  Staged with `git add --sparse` — the path sits outside the sparse-checkout cone on this resync branch (DOC-986 §2/§4.1), so the conflict existed only in the index.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted file is a bookkeeping `request-*` ticket, resolved under 2e's per-fact timeline rule rather than 2c's incoming-authoritative rule. The BUG-1301 precedence exception was not invoked and no test function was touched.

The incoming hunk (`free_coded → ready_to_reconcile`, `updated_at` bumped to `2026-09-01T23:10:22`) is intentionally *not* present in the resolved file. This is not a discarded developer change: it is a stale lifecycle transition that HEAD has already superseded via the same field, and 2e assigns that fact to the later side. Verified against `git show 87041ccbc9 -- .xgd/tickets/hot/request-bbff35c7.md` — the commit's entire diff is those two lines, both of which are facts HEAD holds a newer value for.

## Staging state

`git status --porcelain` is empty; the conflict class line is gone. The resolution is byte-identical to HEAD, so the staged diff for this cherry-pick is empty — left for the finalize step to skip. `CHERRY_PICK_HEAD` (`87041ccbc91b77d8fb860f626f49accc8438d254`) is intact; no `--continue`/`--skip`/`--quit`/`--abort` was issued.
