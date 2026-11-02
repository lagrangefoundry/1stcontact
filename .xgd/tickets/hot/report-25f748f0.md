---
uid: report-25f748f0
id: REPORT-8036
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:38:44.168930+00:00'
updated_at: '2026-11-02T00:38:44.168930+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

Cherry-pick of 0a813d2d8f ("Merge branch 'free-REQ-189' into xgd-working", 2026-09-05).

- `apps/control-app/src/builder/builder.css` — UU, code file (2c). The enrichment rule was "take the more recent commit by timestamp" because intent was unknown. HEAD side kept in all 6 hunks. HEAD = aacdc97d5a (REQ-188, FREE-CODED, 2026-11-01). Flagged for post-merge review.
- `apps/control-app/src/builder/people.js` — UU, code file (2c). Same rule. HEAD side kept in all 6 hunks. HEAD = 7b03da96e5 / aacdc97d5a (2026-11-01). Flagged for post-merge review.
- `tests/test_UAT_FC_REQ-189_users_tab_presentation.test.ts` — AA, UAT test (2b/2f). There was one conflicting hunk inside `test_UAT_FC_REQ-189_no_rule_here_branches_on_what_a_state_is_called`. HEAD's version is a superset: its regex adds `lead` and its comment reflects REQ-188 having landed. No test function was removed. All 15 test functions from both sides are present.

## Incoming changes preserved

The resolution has no net diff against HEAD: incoming commit 0a813d2d8f is redundant on this branch (the BUG-1109/BUG-1122 shape).
- All non-conflicting incoming hunks merged cleanly and produced no change, so HEAD already contains them. This covers `joinBusinesses`, `NO_NAME_YET`, the one-table-per-business detail pane, every `.builder-people__*` rule, the `people.ts` grant `businessName` join, and the workers REQ-189 test.
- In every conflicting hunk, the incoming side is the pre-REQ-188 draft of the same code. HEAD holds the later rewrite of that same region:
  - `stateOf(person)` and `.builder-people__state` became `stageOf`/`accessOf` with `.builder-people__stage` and `.builder-people__access`.
  - `.builder-people__states` became `.builder-people__facet`.
  - Literal paddings became the `--builder-control-font-size` and `--builder-control-padding` tokens.
  - The grant Withdraw control is now gated on `canFulfil`, per REQ-183 §6.
- Spot check: `npx vitest run tests/test_UAT_FC_REQ-189_users_tab_presentation.test.ts` gives 15/15 passing on the resolved tree.

## Arbitration of last resort (BUG-1460)

- Files: `builder.css` and `people.js` (conflict hunks only).
- Tier 1 applied: a later intent supersedes the incoming change. aacdc97d5a ("a contact sits on two axes, and the pipeline starts at Lead", REQ-188, FREE-CODED, 2026-11-01) rewrote exactly these regions after the incoming commit (2026-09-05).
- The incoming code's own comment says "REQ-188 turns Member/Contact into three states", in future tense, which confirms it predates that change.
- Applying the incoming side would break the build: it calls `stateOf`, which no longer exists anywhere in `apps/control-app/src/builder/`. It would also drop the `canFulfil` gate.
- Side dropped: the incoming side of the conflict hunks only. This matches the enrichment's "more recent commit by timestamp" rule.
