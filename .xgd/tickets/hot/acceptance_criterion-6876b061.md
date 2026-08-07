---
uid: acceptance_criterion-6876b061
id: AC-1014
type: acceptance_criterion
title: An install that lags the committed lockfile is reported even when every dependency
  still resolves
created_by: xgd
created_at: '2026-08-07T03:12:53.439318+00:00'
updated_at: '2026-08-07T23:11:09.283020+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

Lockfile drift is a fault in its own right, reported independently of whether the
command's dependencies currently resolve.

A gated command refuses when the committed `pnpm-lock.yaml` differs from the
verbatim copy the package manager writes into the installed tree at install time
— even when every package the command needs still resolves. That state is
precisely the one the next prune turns into a missing declared package, so it is
reported while the commands still work rather than after they stop.

The comparison is an exact oracle, not a timestamp heuristic: byte-inequality of
the two files is the fault, so a merely touched file does not raise it.

Two boundary shapes:
- An installed tree carrying no such snapshot at all has never been installed
  here, and counts as drift.
- A project with no committed lockfile is a different project shape, not a
  drifted install, and does **not** count as drift.

## Verification
Run a gated command against three synthetic trees, with every required package
resolvable in all three: committed lockfile differing from the installed
snapshot (refuses); no installed snapshot present (refuses); no committed
lockfile at all (passes).