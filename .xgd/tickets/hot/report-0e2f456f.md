---
uid: report-0e2f456f
id: REPORT-3189
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T02:45:08.314312+00:00'
updated_at: '2026-09-01T02:45:08.314312+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `apps/control-app/wrangler.toml` — UU, code/config file. Rule 2c.2 (non-overlapping changes: combine, keep BOTH sides). Git had already auto-merged the incoming commit's two additions (`[observability]` and `[env.production.observability]`). The only residual marker was a HEAD-side documentation comment ("THE DEPLOYED GATE'S CONFIGURATION…", added by `1213d247` / the Browser Rendering seam line of work) sitting at the same insertion point, against an empty incoming side. Kept the HEAD comment block AND the incoming observability blocks. Incoming's ordering constraint is preserved: `[env.production.observability]` remains after `routes` and last among that environment's bare keys, which is what the UAT pins.
- `package.json` — UU, single-fact conflict on `version`. HEAD `0.2.16` vs incoming `0.2.12` (bumped from `0.2.11`). Kept HEAD's `0.2.16`. See below — this is a superset-via-different-route, not a discard.

## Incoming changes preserved

Both incoming changes are present in the resolved tree. No hunk was dropped, and the BUG-1301 precedence exception was not needed or used.

**This cherry-pick is redundant, not discarded (STEP 4, BUG-1109/BUG-1122).** The incoming commit `0fe586d1f6` "chore(control-app): retain invocation logs [FREE-CODED]" has already landed on HEAD via a separate route as `a82ced7619`, same subject, same 3-file/29+/2±/78+ shape. STEP 3's redundant-vs-discarded test resolves to *redundant* on the evidence:

- `apps/control-app/wrangler.toml`: `git show HEAD:apps/control-app/wrangler.toml` contains `[observability]` (line 35) and `[env.production.observability]` (line 166), both with `enabled = true` / `head_sampling_rate = 1`, plus the incoming commit's explanatory comments. The incoming diff's key changes are all present.
- `tests/test_UAT_FC_BUG-37_observability.test.ts`: `git diff a82ced7619:<path> 0fe586d1f6:<path>` is empty — HEAD's copy is byte-identical to the incoming commit's 78-line version. No UAT function on either side of this conflict was deleted.
- `package.json`: the incoming intent is the `0.2.11 → 0.2.12` bump. HEAD's history already passed through `0.2.12` (set by `a82ced7619`) and has since advanced through `0.2.13`–`0.2.16`. Writing `0.2.12` here would not apply the incoming intent, it would *regress* four subsequent bumps already integrated into HEAD. Per 2c.3.a read in the preserving direction, HEAD's value is the extension of incoming's, so HEAD wins on this fact.

Consequence: `git diff HEAD` on both resolved files is empty, so the staged result nets to no change vs HEAD. Per STEP 4 this is expected for a genuinely redundant commit and is NOT a @fail; `--skip` was deliberately not called, and `CHERRY_PICK_HEAD` (`0fe586d1f6`) is left intact for `cherry_pick_finalize_resolution` to detect the clean staged diff and skip the commit itself.

Note for post-merge review (both sides were `[FREE-CODED]`, so the auto-enrichment's "intent unknown" flag applies): the `wrangler.toml` resolution keeps a HEAD-side comment that the incoming side does not have. That is additive documentation only — no key, table, or value differs from HEAD.
