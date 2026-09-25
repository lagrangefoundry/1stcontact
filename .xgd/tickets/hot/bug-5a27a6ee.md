---
uid: bug-5a27a6ee
id: BUG-147
type: bug
title: 'bin/dev down cannot stop the builder: up records the wrapper''s pid, not the
  listener''s'
created_by: EPIC-16
created_at: '2026-09-25T21:46:45.739941+00:00'
updated_at: '2026-09-25T23:00:28.227047+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-2a55bc9f
---

## What happens

`bin/dev down` does not stop the builder. It reports the failure — `formatDown` prints
*"The dev environment is NOT fully down"* and lists the port — but the only remedy it
offers is `bin/dev reap`, which is SIGKILL against every unmanaged listener in the
project and therefore cannot be used to restart one service.

`1c ps` shows the same fault from the other side: a builder `bin/dev up` started three
minutes ago reads `started -`, as though nobody owned it.

## Why — `up` records the wrapper's pid, not the listener's

`devUp` records `child.pid`: the pid of the process it spawned. For two of the four
services that process is not the one that ends up holding the socket.

- `builder` spawns `bin/1c builder`, which starts `wrangler dev`, which forks `workerd`.
  The listener is the **grandchild**.
- `public-site` spawns `pnpm --filter @1stcontact/public-site dev` — same shape, with
  `pnpm` as the wrapper.
- `filing` (`bin/1c filing`) and `access-sim` (`bin/access-sim`) are single node
  processes that ARE their own listener.

Measured on one `bin/dev up` run, all four started within 7 seconds of each other:

| service | pidfile pid | pid listening (`lsof -ti tcp:<port>`) | `1c ps` started |
|---|---|---|---|
| filing | 52987 | 52987 | `bin/dev` |
| **builder** | **53215** | **53613** | **`-`** |
| **public-site** | **53634** | **53763** | **`-`** |
| access-sim | 53781 | 53781 | `bin/dev` |

Both mismatched services are the workerd pair and both matched services are the node
pair, so this is structural and not a race. 53215 was confirmed alive and a `node`
process with cwd at the repo root — the wrapper — while 53613 is the `workerd` holding
8788. Two live processes; the pidfile names the one that is not serving.

## Three consequences, all observed

1. **`bin/dev down` SIGTERMs the wrapper.** Whether `workerd` dies is then wrangler's
   signal propagation, which `down` neither controls nor verifies. `up` spawns with
   `detached: true`, making the wrapper a process-group leader, and `kill(rec.pid,
   'SIGTERM')` signals that leader alone — not the group that contains the listener.

2. **`1c ps` mislabels a managed service as unmanaged.** `devTable` passes
   `managedPids: readDevPidfiles(...).map(r => r.pid)` and `devProcessTable` matches the
   LISTENER's pid against it. The builder's listener pid is in no pidfile, so the
   `started` column reads `-` for a service `up` started. That is the signal an operator
   uses to decide whether a process is theirs to stop, and it is wrong.

3. **`down` removes the pidfile even when the port is still answering** —
   `removeDevPidfile` sits outside the if/else, deliberately, to hand the process to
   `reap`. So after a `down` that failed, nothing records the builder at all and `reap`
   is the only route left. That escalation is correct when a service is ignoring SIGTERM;
   it is the wrong answer when the service never received one.

## Why this matters beyond tidiness

An operator who cannot stop one service cannot restart one service, and an env-file
change only takes effect on a process started after it. This is what made [[BUG-146]]'s
workaround un-testable: the secrets file was edited, `down && up` was run, and the
builder carried the old environment across — silently, because `up` reported it as
`already answering, left alone` and `ps` reported it as nobody's.

`reap` is not a substitute. It targets `ours && !managed`, so it also takes the public
site and any unrecognised project listener — in this environment a long-lived node
process on 8712 that has survived every restart. Reaching one stale builder should not
cost the operator everything else they have running.

## What a fix has to establish

- **The pidfile identifies the process that holds the port.** Either resolve the
  listener after the port answers (`up` already waits for exactly that moment, so the
  pid is available there) and record it, or record the wrapper AND the listener and let
  `down` and `ps` use each for what it is good for.
- **`down` stops the service, not just the pid it happens to hold.** Signalling the
  process group is the obvious route given `detached: true` already creates one;
  whatever the mechanism, `down`'s existing port verification is what proves it worked
  and should stay.
- **`ps` calls a service `up` started `bin/dev`.** Same fix as the first point; worth
  stating separately because it is the signal the operator reads before deciding whether
  to reach for `reap`.
- **A single service can be restarted.** Whether that is `bin/dev down <name>` / `up
  <name>` or falls out of the above is open, but "the environment changed, restart what
  reads it" has no spelling today and that is the operator's actual need.

Not in scope: `up`'s "already answering, so it was left alone" policy, which is correct
and stated in `devUp`'s own header. The defect is that `up` cannot later stop what it
did start.