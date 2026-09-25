---
uid: bug-5a27a6ee
id: BUG-147
type: bug
title: 'bin/dev down cannot stop the builder: up records the wrapper''s pid, not the
  listener''s'
created_by: EPIC-16
created_at: '2026-09-25T21:46:45.739941+00:00'
updated_at: '2026-09-25T23:17:57.818622+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-2a55bc9f
  commits:
  - working_sha: c0ea850b13dc3a4524a4f3db319d941438813ce7
    reconcile_sha: null
    main_sha: null
  - working_sha: 7eb13614b210b6366d139338da3b9abeab77bda5
    reconcile_sha: null
    main_sha: null
  version: 0.2.366
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

---

## What was built

Both pids are recorded, and each is used for what it is good for. The four points above
are taken in order.

### 1. The pidfile names the process that holds the port

`DevPidfile` gains `listenerPid: number | null` beside the existing `pid`. `up` still
writes the pidfile the moment the child exists — so a service that never answers still
leaves the spawned pid behind for `reap` — and **rewrites it once the port answers**,
which is the only moment the listener can be asked for and a moment `up` was already
waiting for.

Who holds a port is a new question for `lsof`, so it is answered in `ps.ts` where every
other `lsof` call lives: `listenerPidsOnPort(port)` runs one focused
`lsof -iTCP:<port> -sTCP:LISTEN` and parses it through the module's existing
`parseLsofSockets` / `splitListenName`. It is a focused call rather than the band-wide
sweep because the question is about one port, and it returns an empty list rather than
throwing — the caller is recording a fact about a service that has already started
successfully, and failing the start over the bookkeeping would turn a degraded answer
into a lost service.

Which pid to record: prefer one that is **not** the wrapper — that is the whole point —
and otherwise record the wrapper explicitly, because "the service is its own listener"
(filing, access-sim) is a different fact from `null`'s "nobody could be asked". Readers
must fall back to `pid` on `null` rather than conclude anything from it, which also
makes a pidfile written by the previous version read correctly.

### 2. `down` stops the service

`down` signals the **process group** — `kill(-pid, 'SIGTERM')` — which reaches the
grandchild that `kill(pid, …)` never did. A group's id is its leader's pid, so a
negative pid can only ever find the group led by that process or nothing at all; it
cannot land on an unrelated group even from a stale pidfile. When the group call throws
(the leader has gone and taken the group's identity with it) each live recorded pid is
signalled individually, and the recorded listener gets its own SIGTERM when it is not
the leader — a descendant that called `setsid` for itself would be outside the group and
nothing here can ask which. A second SIGTERM is not an escalation, so `down` stays
polite and `reap` remains the only thing that escalates.

`down`'s port verification is unchanged and is still what proves it worked. So is the
pidfile removal of consequence 3: that hand-off to `reap` is correct when a service
ignores SIGTERM, and with the group signal landing, "the service never received one" is
no longer a state the code can be in.

### 3. `ps` calls a service `up` started `bin/dev`

`devTable` passes **every** pid a pidfile names — `readDevPidfiles(...).flatMap(devPidfilePids)`
— so `devProcessTable`, which matches the LISTENER's pid, recognises the builder's
`workerd` as managed and the `started` column reads `bin/dev`. `devPidfilePids` is
written once because `down` needs the same answer for its liveness test.

### 4. A single service can be restarted

`bin/dev up|down|restart [<service>…]`. `DevContext` gains `only?: readonly string[]`,
applied through one `devSelection(ctx)` helper that both verbs read.

- `up <service>` starts only those, and **skips the deploy** — rebuilding the whole
  local target to start one process is not what was asked for, and the deploy is what
  `bin/dev up` with no argument is for.
- `down <service>` verifies that service's port **whether or not a pidfile claimed it**.
  Because `down` already removes the pidfile of what it could not stop, the second
  `down` of a retry has nothing recorded to read, and "nothing was recorded as running"
  would otherwise be a successful exit with the port still held. Unnamed, the behaviour
  is unchanged: nothing recorded means nothing to verify and no `lsof` runs.
- `restart <service>` is `down` then `up`, composed from the two verbs and owning no
  mechanism of its own — the need is not a third behaviour, it is *"the environment
  changed, restart what reads it"*, which had no spelling. It deploys nothing, and it
  **starts nothing when `down` left a port answering**: `up`'s rule for a live port is
  to leave it alone, so starting anyway would report the process that would not stop as
  `already answering, left alone` — the exact silent carry-over that hid this defect.
- An unrecognised service name is a `NOT_FOUND` failure naming the services that exist.
  A typo would otherwise restrict the call to nothing and report a successful no-op,
  which is the same class of silence this ticket is about.
- `dev restart` joins `dev up` in `WORKERD_GATED_COMMANDS`: it starts the builder again,
  so it opens `.wrangler/state` for the same one-way-migration reason, and restarting
  one service is the moment an operator is least likely to be thinking about runtime
  skew. `down` and `reap` stay ungated — refusing to STOP a dev environment on a skewed
  tree is the one moment stopping it is most useful.

Both reports name both pids when they differ (`pid 53215 → listener 53613`), because one
number could not show the defect, and `formatDown`'s failure text now offers
`bin/dev down <service>` before the project-wide `reap`.

## Test plan

`tests/test_UAT_FC_BUG-147_dev_stops_the_listener.test.ts`, 11 legs. The wrapper shape
is built for real rather than simulated: a detached wrapper spawns a child that holds a
real port and does not die when its parent does, with `lsof` reading the pids back —
nothing about the wrapper/grandchild relationship is stubbed, because the defect was a
wrong assumption about that relationship. `lsof`, the pidfiles, the sockets, the signals
and the process groups are all real; every leg runs against a temporary repo root so a
`devTable` read can never reach the operator's own builder, and the suite draws ports
from the low half of the band (skipping every `KNOWN_SERVICES` port) because the REQ-319
suite draws from 8800 up and runs in parallel.

- `up` records the listener and not only the wrapper, and the pidfile carries both
- `up` records one pid for a service that is its own listener
- `ps` calls a service `up` started `bin/dev` — pins consequence 2
- `down` stops a listener that is a grandchild of what `up` spawned — the central leg
- `down` names one service and leaves the other running and recorded
- `down` of a named service verifies its port with no pidfile, and is unchanged unnamed
- `restart` replaces one service (a *different* pid serving afterwards) and leaves the
  others, deploying nothing
- `restart` starts nothing when `down` left the port answering
- an unknown service name is refused through the real CLI entry point and names the ones
  that exist
- `bin/dev` and the CLI both spell `restart`
- `restart` is workerd-gated like `up`, and `down` / `reap` are not

Confirmed adversarially: reverting the group signal to the pre-fix pid signal fails 3
legs; reverting `managedPids` to `.map(r => r.pid)` fails the `ps` leg.

Regression scope run: `test_UAT_FC_REQ-319_dev_processes` (16 pass, unchanged),
`test_UAT_FC_REQ-316_one_workerd`, `test_UAT_FC_REQ-290_file_backed_authoring_tier_retired`,
`req89-astro-lazy`, `req177-discontinue-raw-server`, `test_UAT_FC_REQ-254_reproduction_console`,
`test_UAT_FC_REQ-292_turn_price` — all pass. `test_UAT_FC_REQ-318_local_dev_deploy_target`
has 2 failures that reproduce on a clean tree in this worktree, unrelated to this change.