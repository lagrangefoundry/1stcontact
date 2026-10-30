---
uid: report-6697fe4a
id: REPORT-5388
type: report
title: 'Resync resolve conflicts: 6ba006de764d843fa7f4357df2b341e72f20e2f6'
created_by: xgd
created_at: '2026-09-28T22:28:14.660357+00:00'
updated_at: '2026-09-28T22:28:14.660357+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` — UU, class 2e (intent/bookkeeping
  ticket; `request-*` under `.xgd/tickets/hot/`, outside the sparse-checkout
  cone so the conflict existed in the index only). Both sides touched the
  SAME facts — the lifecycle block `updated_at` / `completed_at` /
  `last_field_updated` / `status` — so this is a genuine per-fact conflict
  and the later-positioned intent wins. Resolved by keeping HEAD's block
  verbatim and staging with `git add --sparse`.

  Timeline evidence:
  - Incoming (`0c7b4f9072`, authored Mon Aug 31 17:01:02 -0700 = 2026-09-01T00:01:02Z):
    `status: ready_to_reconcile → reconciling`, `updated_at: 2026-09-01T00:01:02.779719+00:00`,
    `completed_at: null`, `last_field_updated: status`. A 2-line frontmatter
    change; nothing else in the commit (1 file, +2/-2).
  - HEAD: `status: free_and_reconciled`, `updated_at: 2026-09-02T01:34:36.152341+00:00`,
    `completed_at: 2026-09-02T01:34:00.748431+00:00`, `last_field_updated: result`,
    plus `result: pass` already present in `fields:`.

  HEAD carries the terminal state of the same lifecycle the incoming commit
  was mid-way through; replaying the incoming intermediate transition would
  regress a completed, reconciled ticket (and would contradict the sibling
  `result: pass` / `completed_at` facts HEAD already holds). The ticket body
  below the frontmatter was untouched by both sides — no content was dropped
  from either side.

## Incoming changes preserved

No code/implementation files were in conflict — the cherry-picked commit
`0c7b4f9072` touches exactly one file, the bookkeeping ticket above, and
carries no `xgd_source/`, `tests/`, `bin/`, or config changes. So there are
no incoming code hunks to preserve, and the BUG-1301 precedence exception
was not invoked anywhere.

For the one conflicted file, the incoming change is deliberately NOT present
in the resolved version, per the class-2e per-fact timeline rule: its only
content is an earlier value for the same four lifecycle fields HEAD sets to
later values. This is superseded intent, not discarded work.

Net effect: the staged tree is byte-identical to HEAD (`git status
--porcelain` reports nothing, `git diff --cached HEAD` is empty), so this
patch is fully superseded. Staged and left for the finalize step —
`CHERRY_PICK_HEAD` is intact at `0c7b4f9072` and no
`--continue`/`--skip`/`--quit`/`--abort` was run.
