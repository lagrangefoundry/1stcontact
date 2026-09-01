---
uid: report-e3d2902d
id: REPORT-3268
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T23:36:06.555110+00:00'
updated_at: '2026-09-01T23:36:06.555110+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` — UU, intent/bookkeeping ticket (rule 2e).
  Sparse-excluded on this branch (DOC-986 2/4.1), so the conflict existed only in
  the index with no working-tree copy; materialized with
  `git checkout --ignore-skip-worktree-bits --ours` (note: `git checkout` has no
  `--sparse` flag, contrary to the step spec) and staged with `git add --sparse`.
  Rule applied: 2e per-fact timeline. Flagged for post-merge review.

  Incoming is 8b6541d4b1 (2026-08-31 14:16:33 -0700), no commit body. Small:
  4 insertions, 4 deletions, and every one of them is frontmatter or whitespace.

## Incoming changes preserved

The incoming commit makes no body edit at all. Its complete diff vs its base
03909332c4 is:

- `status: draft` -> `status: free_coding`
- `last_field_updated: body` -> `last_field_updated: status`
- `updated_at` bumped to 2026-08-31T21:16:33.328225+00:00
- removal of the file's trailing newline

Per-fact resolution of the one real conflict, the `status` field:

- Incoming sets `free_coding` at 2026-08-31T21:16:33Z.
- Ours holds `reconciling` at 2026-09-01T00:01:02Z.

Ours wins on both tests that matter. It is later by timestamp, which is what the
enrichment's fallback rule selects. It is also lifecycle-downstream: `reconciling`
is the state this very reconcile run put the ticket into, and `free_coding` is the
state it left behind to get here. Taking incoming would walk the ticket backwards
into a state it has already exited, mid-run. `last_field_updated` is `status` on
both sides, so that field agrees regardless.

The trailing-newline removal is whitespace churn with no counterpart in ours,
whose body extends past the incoming version's final line.

## Body content: same retracted section as the previous commit, nothing new

Diffing stage :3: against stage :2: shows the only body content in theirs absent
from ours is, once again, "## Prerequisite: the installed component predates
REQ-104". This commit did not author that section — it inherits it unchanged from
its parent 6caee0c5d1, which the preceding invocation in this bundle already
handled.

For the record, unchanged from that finding: the section was retracted by
1e28c676bf (2026-08-31 14:18:42 -0700), "content edit: correct the prerequisite —
REQ-104 is on xgd-working; only the shared artifact store is stale, so bin/install
is the whole fix". That correction is in HEAD via seed overlay 8b5aa7c1ec, which
`git branch --contains` places on reconcile-REQ-162, and HEAD carries the
corrected "## Prerequisite: refresh the installed component" section in its place.
Not a discard; rule 2e per-fact timeline.

No BUG-1301 precedence exception was needed.

## Note for the finalize step

The staged tree nets to no diff vs HEAD (`git diff --cached --stat HEAD` is
empty), the fourth consecutive commit in this bundle to do so. HEAD's tip for this
file is still a9260691cc, unchanged across all four invocations, confirming the
preceding three were skipped as redundant. Per STEP 3 this is redundant rather
than discarded: the incoming commit's only substantive change is a status
transition that HEAD has already advanced past. Per STEP 4, --skip was not called;
finalize will detect the clean staged diff. CHERRY_PICK_HEAD left intact.
