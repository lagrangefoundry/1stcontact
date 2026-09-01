---
uid: report-6aa52baf
id: REPORT-3269
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T23:37:52.111028+00:00'
updated_at: '2026-09-01T23:37:52.111028+00:00'
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

  Incoming is 76cd837f38 (2026-08-31 14:18:30 -0700). 3 insertions, 3 deletions.

## The commit message is misleading — read the diff, not the subject

76cd837f38 carries the body message:

    content edit: correct the prerequisite — REQ-104 is on xgd-working; only the
    shared artifact store is stale, so bin/install is the whole fix

but it contains NO body edit. Its complete diff vs its base 9bff7c4d1c is:

- `last_field_updated: status` -> `last_field_updated: body`
- `updated_at` bumped to 2026-08-31T21:18:30.309311+00:00
- restoration of the file's trailing newline

The prerequisite correction the message describes is in a DIFFERENT commit:
1e28c676bf (2026-08-31 14:18:42 -0700, 14 insertions / 21 deletions), which
`git log` confirms is the direct child of 76cd837f38 — same message, twelve
seconds later, and that one carries the actual prose replacement. The ticket
update evidently wrote frontmatter and body as two commits sharing one message.

This matters for STEP 3: judged on its subject alone, 76cd837f38 looks like a
substantive content edit whose absence would be a discard. Judged on its actual
diff, it is frontmatter-only. Nothing in this commit's body was dropped, because
this commit changes no body.

## Incoming changes preserved

Per-fact resolution of the frontmatter, which is all this commit touches:

- `last_field_updated`: incoming says `body`, ours says `status`. Ours is later
  (2026-09-01T00:01:02Z vs 2026-08-31T21:18:30Z) and is self-consistent: ours'
  own last change WAS the status transition into `reconciling`. Taking incoming's
  `body` would mislabel ours' current state, describing an edit ours did not make.
- `updated_at`: ours is later.
- `status`: unchanged by this commit (`free_coding` on both its sides); ours holds
  `reconciling`, downstream, as resolved in the preceding invocation.
- Trailing newline: whitespace churn, no counterpart in ours.

## Body content: inherited retracted section, not authored here

Diffing stage :3: against stage :2: shows the only body content in theirs absent
from ours is again "## Prerequisite: the installed component predates REQ-104",
inherited unchanged from 6caee0c5d1 and already handled two invocations ago. Its
replacement — the corrected "## Prerequisite: refresh the installed component" —
is in HEAD via seed overlay 8b5aa7c1ec, which `git branch --contains` places on
reconcile-REQ-162.

Note the pleasing consistency: the very correction this commit's message
advertises is already the text HEAD carries. Keeping ours honours this commit's
stated intent more faithfully than applying its literal diff would.

No BUG-1301 precedence exception was needed.

## Note for the finalize step

The staged tree nets to no diff vs HEAD (`git diff --cached --stat HEAD` is
empty), the fifth consecutive commit in this bundle to do so. HEAD's tip for this
file is still a9260691cc, unchanged across all five invocations. Per STEP 3 this
is redundant rather than discarded. Per STEP 4, --skip was not called; finalize
will detect the clean staged diff. CHERRY_PICK_HEAD left intact.

Expect 1e28c676bf next: it is the direct child, and it is the commit that
actually carries the prerequisite correction.
