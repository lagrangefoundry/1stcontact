---
uid: report-1f098a0c
id: REPORT-3194
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T02:54:43.513658+00:00'
updated_at: '2026-09-01T02:54:43.513658+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — UU, intent/bookkeeping ticket (rule 2e).
  Incoming: `82518d6099` "xgd(ticket): update bug bug-a98fb3b0" (2026-08-24
  15:16:15 -0700), 70 insertions — it fills in the draft: title, `severity:
  high`, `status: draft -> free_coding`, and the full Symptom/Root cause/Fix/
  Test plan body.
  Ours: `cbdfed2e2d` "xgd(ticket): seed_local_overlay bug bug-a98fb3b0"
  (2026-08-31 07:24:25 -0700) — the bundle branch's seeded final state.

  `git diff :2: :3:` shows the two sides differ ONLY in lifecycle/bundling
  fields; the entire substantive payload (title, `severity: high`, and every
  line of the body) is byte-identical on both sides. The real per-fact
  differences are:
    - `status`: ours `bundled` vs theirs `free_coding`
    - `updated_at`: ours 2026-08-26T17:36:27 vs theirs 2026-08-24T22:16:14
    - ours additionally carries `commits` (working_sha 63df97c9), `version:
      0.2.14`, `story_points: 2`, `bundled_in: bundle-78f4e2fe`
    - theirs has a trailing newline, ours does not

  Per 2e's per-fact rule, ours wins the `status`/`updated_at` facts: it is later
  by commit timestamp (2026-08-31 vs 2026-08-24 — which also matches the
  enrichment block's own stated fallback, "take the more recent commit by
  timestamp"), later by ticket lifecycle position (free_coding precedes
  bundled), and it carries the bundling metadata belonging to THIS reconcile run
  (`bundled_in: bundle-78f4e2fe`). Regressing `status` to `free_coding` and
  dropping `bundled_in`/`commits` would corrupt the bundle state currently being
  reconciled. On every other fact the two sides agree, so nothing from the
  incoming side is lost by taking ours.

  Resolved with `git checkout --ours` (verified `:2:` is byte-identical to the
  HEAD blob — empty diff), staged with `git add --sparse` (path is outside the
  sparse-checkout cone, DOC-986 §2/§4.1). Working-tree markers at lines 9/14/19,
  26/34/35, 101/103/105 are gone (0 remaining).

## Incoming changes preserved

- `.xgd/tickets/hot/bug-a98fb3b0.md`: every substantive change from `82518d6099`
  is PRESENT in the resolved file — title (line 5), `severity: high` (line 18),
  and the full body, confirmed by grepping the resolved file for `## Root
  cause`, `## Fix`, `## Test plan`, `SiteStore.hasDraft`, and
  `test_UAT_FC_BUG-38_chat_session_survives_isolate_churn` (5/5 present). The
  incoming `status: free_coding` is not present *as such* because HEAD has
  advanced that same field further along the same lifecycle to `bundled`; that
  is a superseded fact, not a discarded one.

No BUG-1301 precedence exception was invoked; no hunk was dropped.

## Flagged for post-merge review

The enrichment block classified this file as "intent unknown on one or both
sides ... flag this file for post-merge review". Flagging accordingly, though
the divergence turned out to be benign: ours is the seeded post-bundling state
of the same ticket the incoming commit authored, not a competing edit.

## Net-diff note (BUG-1109/BUG-1122)

The resolution nets to no diff vs HEAD — HEAD's seed_local_overlay already
carries this commit's content. Per STEP 4 this is the redundant-commit case, NOT
the discarded-changes case: STEP 3's check passes because the incoming commit's
key changes are present in HEAD rather than absent. `--skip` was not called; the
sequencer state (`CHERRY_PICK_HEAD` =
`82518d609902d85715f6f34a28eae4e1aa7ae781`) is intact for
`cherry_pick_finalize_resolution`.

This is the second consecutive commit in this bundle to net redundant against
the same seeded ticket (previous attempt: `1c5985f87d`, REPORT-3193) — expected,
since the bundle branch seeded bug-a98fb3b0's final state and the cherry-picks
are replaying the working-branch updates that produced it.
