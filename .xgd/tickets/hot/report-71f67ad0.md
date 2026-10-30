---
uid: report-71f67ad0
id: REPORT-4568
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T23:18:11.429351+00:00'
updated_at: '2026-09-20T23:18:11.429351+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

Incoming commit is `0fe586d1f67c` — *chore(control-app): retain invocation logs
[FREE-CODED]* (BUG-37), authored 2026-08-24T14:55:11-0700.

- **`apps/control-app/wrangler.toml`** — **UU**, config file (§2g) with the
  enrichment rule in force (intent unknown on one side → take the more recent
  commit by timestamp). Resolved **OURS**.

  OURS last touched by `936c9edc1ba6` (*Merge branch 'free-REQ-159' into
  xgd-working*, 2026-09-11T03:00:07) — **18 days more recent** than incoming, so
  the timestamp rule selects OURS.

  This is not a contested resolution: **HEAD already contains the whole of the
  incoming change.** Both `[observability]` (L35–37) and
  `[env.production.observability]` (L217–219) are present with `enabled = true`
  and `head_sampling_rate = 1`, under the same explanatory comments the incoming
  commit writes. The conflict is **context drift, not a content disagreement** —
  HEAD gained a later comment block (`# THE DEPLOYED GATE'S CONFIGURATION…`,
  heading `[env.production.vars]`) *between* the two incoming hunks, so the
  incoming diff's trailing context no longer anchored. The marked region held
  only that comment on the HEAD side and **nothing** on the incoming side; git
  was asking whether to delete a comment the incoming commit predates.

- **`package.json`** — **UU**, config file (§2g) under the same enrichment rule.
  Resolved **OURS**.

  Single scalar in conflict: `version`. Incoming bumps `0.2.11 → 0.2.12`; HEAD is
  at `0.2.40`. OURS last touched by `80c9342ac1f4` (*Merge branch 'free-BUG-43'
  into xgd-working*, 2026-09-14T03:15:55) — **21 days more recent** than incoming,
  so the timestamp rule selects OURS. Taking incoming here would roll the release
  version back 28 increments. Same call REPORT-4566 made for `fields.version` on
  this run. The incoming commit touches nothing else in this file.

No UAT test function was deleted, on either side, so §2f is not implicated and the
BUG-1301 precedence exception was not invoked.

## Incoming changes preserved

**`apps/control-app/wrangler.toml` — fully preserved, verified by inspection of
the resolved file, not inferred.** Both blocks the incoming commit adds are
present verbatim:

```
 35:[observability]
 36:enabled = true
 37:head_sampling_rate = 1
217:[env.production.observability]
218:enabled = true
219:head_sampling_rate = 1
```

Zero residual conflict markers in either file (`grep -c` → 0, 0).

**`package.json`** — the only incoming change is the `version` scalar, which is
deliberately superseded per the timestamp rule above. This is a rule-directed
supersession of a single version integer, not a discarded developer change.

**Behavioural verification.** Because resolving to OURS leaves an empty staged
diff, preservation was confirmed against behaviour rather than inferred from the
absence of a delta: the incoming commit's own acceptance test was run against the
resolved tree —

```
npx vitest run tests/test_UAT_FC_BUG-37_observability.test.ts
Test Files  1 passed (1)
     Tests  4 passed (4)
```

All four pass: `observability_is_declared_at_both_levels`,
`every_invocation_is_sampled`, `the_production_route_survives_the_new_table`, and
`observability_declares_no_binding`. The third is the load-bearing one — it
*parses* the TOML rather than text-matching it and asserts `routes` is still a
bare key of `[env.production]`, which is precisely the silent breakage the
incoming commit's message records as having been made and caught during the
original change. BUG-37's intent is satisfied on HEAD without this commit.

(That test run also emitted `EPERM` noise from wrangler attempting to write
`~/Library/Preferences/.wrangler/logs/…`, which this sandbox blocks. It originates
in the config parser's import, is unrelated to every assertion above, and did not
affect the result. Flagging it because the UAT does touch a path outside the
sandbox, which may matter in a stricter environment.)

## State left for the next step

- `git status --porcelain` — empty; no UU/AA/DU/UD remain.
- `git diff --cached HEAD` — empty. The commit is a genuine no-op against HEAD;
  the finalize step should detect the clean staged diff and skip the commit.
- `CHERRY_PICK_HEAD` — **present and untouched**. No `--continue/--skip/--quit/
  --abort` was issued by this step.

## Note on the prior attempt (slot 61/0)

This same commit was dispatched to slot `61/0`. That attempt resolved the two
files identically and correctly, but then overstepped by running
`xgd cherry-pick-skip report-7b4182de`, which issues `git cherry-pick --skip`
internally — ending the cherry-pick the finalize step was supposed to own. The
workflow has since re-queued `0fe586d1f67c`, which is why this slot saw the same
two conflicts again.

**Consequence worth checking downstream:** `0fe586d1f67c` was already written into
the anchor's `fields.skipped_commits` by that earlier call. If the finalize step
now skips it a second time, that SHA may be double-recorded. The resolution itself
is unaffected; this is a bookkeeping artefact of the premature skip. Prior report
for that attempt is REPORT-4567, with the deviation recorded as COMMENT-3373.
