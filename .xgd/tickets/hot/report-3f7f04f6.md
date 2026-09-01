---
uid: report-3f7f04f6
id: REPORT-3141
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T00:26:53.301762+00:00'
updated_at: '2026-09-01T00:26:53.301762+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `package.json` — UU, config file (2g scalar) with per-file enrichment metadata governing.
  Sole difference between the two sides was the `"version"` scalar; `git diff` of stage `:2`
  vs stage `:3` reported exactly 1 changed line, and stage `:2` was byte-identical to
  `HEAD:package.json`, so no auto-merged incoming content existed outside the marker block.
  - base (`:1`) = 0.2.2
  - ours (`:2`) = 0.2.16, last set by 1213d247dd, 2026-08-28 09:38:31 -0700 [FREE-CODED]
  - theirs (`:3`) = 0.2.3, from merge commit 27e08d3891 ("Merge branch 'free-REQ-151' into
    xgd-working"), 2026-08-21 13:30:30 -0700
  - Rule applied: the enrichment block for this file declares intent unknown on one or both
    sides and directs "take the more recent commit by timestamp, flag for post-merge review."
    HEAD side is 7 days later (Aug 28 vs Aug 21). Both sides are additionally `free_coded`
    (ours is [FREE-CODED]; theirs merges a free-REQ-151 branch into xgd-working), which
    triggers 2c's both-free_coded exception — take the later working-timeline position.
    Both rules select ours. Resolved to **0.2.16**.
  - Note on 2g: 2g's "scalar conflicts: incoming wins" rests on incoming developer intent
    superseding *automated churn on main*. That premise does not hold here — the ours side
    is not automated churn but a later hand-authored [FREE-CODED] commit, and the file's own
    enrichment metadata supplies the governing rule.

## Incoming changes preserved

- `package.json` — preserved, via a different route (STEP 4 / BUG-1109 shape, not a STEP 3
  discard). The incoming merge commit's entire effect on this file was to move the version
  off the 0.2.2 base by adopting its second parent's claim of 0.2.3. That intent — "advance
  the version past the taken number" — is present in HEAD and has been carried well beyond
  it: `git log -- package.json` shows the number is a monotonic claim token, with bumps
  explicitly narrated as "0.2.4 was taken by REQ-152", "0.2.6 was claimed at the working
  tip", "0.2.8 was claimed at the working tip by this ticket's own auto-commit", through
  0.2.13 and on to 0.2.16. 0.2.3 is long consumed; writing it back would regress the version
  by thirteen patch claims and re-collide with an already-issued number.
- No code content was carried by the incoming hunk, so nothing executable was dropped. No
  hunk was dropped under the BUG-1301 precedence exception; that exception was not invoked.
- Resulting staged tree nets to no diff vs HEAD for this file. Per STEP 4 this is expected
  and is not a failure — finalize should detect the clean staged diff and skip the commit.
  CHERRY_PICK_HEAD (27e08d3891...) was left intact; no continue/skip/quit/abort/reset was run.

## Flagged for post-merge review

Per the enrichment rule, `package.json` is flagged: confirm 0.2.16 is still the intended
release number for this bundle and that dropping the 0.2.3 claim from free-REQ-151 loses no
publish/tag bookkeeping tied to that specific version string.
