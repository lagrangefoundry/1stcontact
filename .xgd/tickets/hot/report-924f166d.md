---
uid: report-924f166d
id: REPORT-3035
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T19:40:25.415940+00:00'
updated_at: '2026-08-31T19:40:25.415940+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `package.json` — UU (config file, rule 2g scalar + version-scalar timeline
  exception). Single conflict hunk, confined to the `"version"` scalar on
  line 3. Kept HEAD's `0.2.14`; dropped the incoming `0.2.3`.

  Both sides are `free_coded`, so the 2g "incoming wins" default yields to
  the both-sides-free-coded rule: take the later working-timeline position.
  - Incoming `27e08d3891` (`Merge branch 'free-REQ-151' into xgd-working`)
    — Fri Aug 21 13:30:30 2026.
  - HEAD `97f4e4e55c` (`fix(ai-host): resolve a session id against the
    store, not a per-isolate map [FREE-CODED]`) — Mon Aug 24 15:19:40 2026,
    three days later.

  HEAD is the later position, so HEAD's scalar wins. This also matches the
  version-claim protocol visible in this branch's own history (`07afe0840d`
  "0.2.8 was claimed at the working tip by this ticket's own auto-commit",
  `8d2552728e` "0.2.6 was claimed at the working tip"): the counter is
  monotonic and a number already claimed must not be re-issued. Rewinding
  0.2.14 to 0.2.3 would re-claim eleven already-consumed versions.

## Incoming changes preserved

The incoming commit is a merge. Against its mainline parent `0952a9b71f`
its ONLY effect on `package.json` is the release-counter bump
`0.2.2` -> `0.2.3`. There is no code, dependency, or script change in the
cherry-picked diff.

(For completeness: against its second parent `38e4a3cf22` the merge also
drops `"astro": "^7.0.4"` from devDependencies, but that removal originates
on the mainline parent side and is already integrated — it is not part of
what this cherry-pick applies, and `astro` is correctly absent from the
resolved file.)

No developer code was discarded. The incoming change's intent — advance the
release counter — is present in HEAD via a different and further-advanced
route (0.2.3 -> ... -> 0.2.14 through the documented free-coded bump chain
`8d2552728e`, `07afe0840d`, `b1d79b4fbf`, `97f4e4e55c`). This is the
redundant case, not the discarded case: the incoming key change is
superseded by, and subsumed in, what HEAD already carries.

Consequently the staged tree nets to no diff vs HEAD
(`git diff --cached HEAD --stat` is empty). Per STEP 4 this is expected for
a bookkeeping-only commit and is not a failure; `--skip` was NOT called and
`CHERRY_PICK_HEAD` (`27e08d3891...`) is left in place for
`cherry_pick_finalize_resolution` to act on.

No BUG-1301 precedence exception was invoked; no test functions were
touched.

## Flagged for post-merge review

Per the conflict-intent metadata's "flag this file for post-merge review"
instruction: `package.json` version scalar. Confirm 0.2.14 is the intended
release number at the reconciled tip and that no downstream artifact pinned
0.2.3 from the free-REQ-151 line.
