---
uid: report-3c3052f5
id: REPORT-4107
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T19:05:53.291733+00:00'
updated_at: '2026-09-12T19:05:53.291733+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `apps/control-app/wrangler.toml` — UU, code/config file (rule 2c step 2, non-overlapping
  changes combined). HEAD added a prose paragraph ("THE DEPLOYED GATE'S CONFIGURATION…")
  documenting `[env.production.vars]`; the incoming commit inserted
  `[env.production.observability]` immediately after `routes`. The two hunks land in the same
  region but express disjoint intents, so BOTH were kept. Ordering preserved per the incoming
  commit's own stated constraint: the observability table stays directly after `routes`
  (a TOML table header ends the table above it, so placing it earlier would capture `routes`
  and silently undeclare the production route). HEAD's prose block follows the table, still
  glued to the `[env.production.vars]` comment head it describes. `git log -S` confirms the
  prose block was added by a HEAD-side commit (`1450d679d4`) and was never touched — let alone
  retracted — by the incoming commit.

- `package.json` — UU, single scalar conflict on `version`: HEAD `0.2.31` vs incoming `0.2.12`.
  Both sides are `free_coded`, so the working-timeline exception applies rather than
  "incoming wins": HEAD's bump (`2fbb0f5f02`, "chore: bump version to 0.2.31 for REQ-165
  [FREE-CODED]", 2026-09-01) is later than the incoming commit (2026-08-24). Kept `0.2.31`.
  The version counter is monotonic, so the incoming intent — advance past `0.2.11` — is
  satisfied by `0.2.31`; reverting to `0.2.12` would roll the counter backwards.

## Incoming changes preserved

The incoming commit `0fe586d1f6` ("chore(control-app): retain invocation logs [FREE-CODED]",
BUG-37) touched three files. All of its key changes are present in the resolved tree:

- `apps/control-app/wrangler.toml` — both hunks present and verified by grep: top-level
  `[observability]` (line 35, with its full explanatory comment block) and
  `[env.production.observability]` (line 217), each `enabled = true` /
  `head_sampling_rate = 1`.
- `tests/test_UAT_FC_BUG-37_observability.test.ts` — already present in HEAD, byte-identical;
  it never entered the conflict set. No UAT function was deleted on either side.
- `package.json` — version advanced past `0.2.11` (to `0.2.31` rather than `0.2.12`), see above.

NOTE — redundant commit (BUG-1109/BUG-1122), not a discard. The resolved tree is byte-identical
to HEAD (`git diff HEAD` over both files is empty), because an equivalent commit with the same
subject — `a82ced7619` "chore(control-app): retain invocation logs [FREE-CODED]" — already
landed in HEAD's history through a different route, carrying both observability blocks and the
UAT test file. This is STEP 3's "present via a different route" case, not "genuinely absent":
`git show HEAD:apps/control-app/wrangler.toml` independently confirms both observability
declarations are already in HEAD. Staged as normal; `--skip` was NOT called — the finalize step
will detect the empty staged diff and skip the commit itself.

No hunk was dropped under the BUG-1301 precedence exception.

## Post-merge review flag

The enrichment metadata classified both files as "intent unknown on one or both sides" and asked
that they be flagged for post-merge review. Flagging both accordingly, though neither resolution
was decided by the fallback recency rule alone: `wrangler.toml` combined disjoint hunks with no
side discarded, and `package.json` was decided by the both-sides-`free_coded` working-timeline
rule.
