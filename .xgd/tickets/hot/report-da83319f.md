---
uid: report-da83319f
id: REPORT-3346
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T20:17:29.869305+00:00'
updated_at: '2026-09-02T20:17:29.869305+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — UU, intent/bookkeeping ticket (STEP 2 §2e).
  Resolved toward HEAD (`git checkout --ours` + `git add --sparse`).

  Incoming commit: `2759e5b507` "xgd(ticket): update bug bug-6612c4b7"
  (2026-08-24T21:31:48Z, `last_field_updated: body`) — the large BUG-37 body
  rewrite that replaced the original "leading hypothesis" narrative with the
  confirmed root cause (Workers Free plan 10 ms CPU ceiling vs a ~78 ms preview
  request), the `## What this ticket fixes in code` section, `## Result`, and
  `## Superseded — the original hypothesis, recorded because it was wrong`.

  Most of that rewrite merged **cleanly** — HEAD carries it byte-identical.
  Three hunks conflicted, all of them HEAD-later on the same fact:
  1. Timestamp/status block — incoming `updated_at` 2026-08-24T21:31:48Z,
     `completed_at: null`, `last_field_updated: body`, `status: draft`; HEAD
     2026-08-31T19:19:36Z, `completed_at` set, `last_field_updated: status`,
     `status: free_and_reconciled`. HEAD kept.
  2. Observability section — incoming still says
     `## Still outstanding (not in this ticket)` ("no `[observability]` block …
     worth adding; config-only, no code"); HEAD has the work done and rewritten
     as `## Observability — added here` plus a `## Deployment` section,
     describing the block now declared in both places, the
     `[env.production.observability]`-before-`routes` trap, the pinning UAT
     `test_UAT_FC_BUG-37_the_production_route_survives_the_new_table`, and the
     `wrangler deploy --dry-run` verification. HEAD is the later state of the
     same paragraph — this is the incoming's own "outstanding" item, completed.
     HEAD kept.
  3. Closing BUG-36 paragraph — line rewrapping only, same sentence both sides.
     HEAD kept.

  Confirmed by diffing the two blobs directly
  (`git diff bc8406e525 f3b9d25bf1`): HEAD is the incoming body plus later
  refinements, with no incoming paragraph dropped.

## Incoming changes preserved

Every section this commit introduced is present in the resolved file:

- `## Root cause — CONFIRMED` (line 40)
- `## What this ticket fixes in code` (line 58)
- `## Result` (line 106)
- `## Superseded — the original hypothesis, recorded because it was wrong`
  (line 112)
- `## Reproduction (historical)` (line 171)

plus the `## Symptom` past-tense rewrite. The only incoming text not carried
forward is `## Still outstanding (not in this ticket)`, which HEAD replaced with
the completed `## Observability — added here` — the same subject at a later
timeline position, not a dropped fact. `updated_at` / `last_field_updated` are
likewise superseded by HEAD's later values per §2e's per-fact timeline rule.

No code/implementation files were conflicted, so no BUG-1301 precedence
exception was invoked and no UAT test function was touched.

Net effect: the staged tree is byte-identical to HEAD (`git diff --cached` is
empty). This is the BUG-1109/BUG-1122 redundant-commit case, not a discard —
STEP 3's distinguishing test passes: the incoming commit's key changes are
present in HEAD (verified section by section above), not merely absent. Per
STEP 4 the resolution is staged and left for `cherry_pick_finalize_resolution`
to skip; `CHERRY_PICK_HEAD` (`2759e5b5077faf531087d339c35b29c62cc1c6cc`) is
intact and no sequencer command was run.
