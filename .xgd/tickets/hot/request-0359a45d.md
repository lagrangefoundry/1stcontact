---
uid: request-0359a45d
id: REQ-319
type: request
title: bin/dev up, down and reap, and 1c ps to see what is running
created_by: EPIC-16
created_at: '2026-09-25T02:04:22.932236+00:00'
updated_at: '2026-09-25T04:12:05.102081+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  needs_review: false
  auto_merge_back: true
  story_points: 3
  epic_parent: epic-96d8aca6
  chat_comment: comment-be8a438f
---

Parent: [[EPIC-16]]. Scoped in [[EPIC-16]] §K4–§K6; `1c ps` asked for by the operator
on 2026-09-24 and scoped in §M3. Sibling of [[REQ-318]], which builds the deploy
target these commands start and stop.

## What was measured

A sweep of every listener in the dev port band on the operator's machine on
2026-09-23, attributed by each process's working directory:

| port | proc | cwd | |
|---|---|---|---|
| 8788 | workerd | `1stcontact/apps/control-app` | builder |
| 8790 | node | `1stcontact` | filing server |
| 8799 | node | `1stcontact` | access-sim |
| 8712, 8722, 8733 | node | `1stcontact` | **orphans** |
| 8711, 8719, 8723 | node | `.xgd/worktrees/…/free-REQ-254` | **orphans, worktree gone** |
| 8795 | node | `.xgd/worktrees/…/free-BUG-124` | **orphan, worktree gone** |
| 8889 | python | `/private/tmp/…/test_UAT_FC_REQ_706_stop_port_3` | **orphan, dir deleted** |
| 8766/67/91/93/94, 8888 | python | sibling repos | not this repo's to reap |

**Three** listeners were the dev environment. **Eight** were this repo's zombies.
Nothing has ever reclaimed them and they had plainly been accumulating for a long
time. Note also that `filing.ts:116` chose 8790 over 8711 and 8712 because those are
*"routinely taken on a working machine"* — they were taken by this repo's own strays.

## `1c ps`

**The ask: list every server this project has running, with its PID and port.** There
is no such view today; `lsof` by hand was how the table above was built.

**Built on `lsof`, not `ps`.** Measured, not assumed: `ps aux` returns **zero lines**
under the agent sandbox, while `lsof -nP -iTCP -sTCP:LISTEN` works and `lsof -a -p
<pid> -d cwd -Fn` returns a usable working directory. A `ps`-based implementation
would serve the operator and be unusable by the agent that produced four of the eight
zombies — which is the condition that created them.

**The cwd is the identity key, and that answers an existing objection rather than
walking past it.** `reset.ts:131` deliberately rejects this mechanism: *"A CONNECT, NOT
A PID FILE OR A PROCESS SCAN. … A pid file can be stale; a process scan matches another
checkout's server, which is a different store entirely."* That reasoning is correct for
the question **reset** asks — "is something holding my store open" — and a connect is
the right test for it. `1c ps` asks a different question — "what is running here, and
what would I stop" — which a connect cannot answer at all, because it yields no PID.
Keying rows on cwd answers the objection: a listener whose working directory is another
checkout is reported as *that* checkout's, never as this one's. **`1c reset`'s refusal
test is unchanged by this ticket**; the two probes coexist and neither replaces the
other.

**It returns a value; rendering is separate.** Following `filingStatus`
(`filing.ts:471`) and its stated reason — the old filing signal was a `console.log`
from the command that in the failing case was never run, so returning the state lets a
banner render it, a UAT assert it, and a future surface read it without three
descriptions of one fact. `bin/dev down` and `bin/dev reap` are this table's other
readers, which is why it cannot be print-only.

**An unrecognised port is still a row.** Four of the eight zombies held ports no
constant names (8712, 8722, 8733, 8795). A row must stay legible without a known
service — naming the cwd and saying the service is unrecognised — rather than being
omitted, because an unnamed listener inside this repo's tree is precisely what the
operator has never been able to see. The known band today is 8710 (repro console),
8787 (public-site), 8788 (builder), 8790 (filing), 8799 (access-sim), 24678 (Vite HMR),
plus whatever ports [[REQ-318]] assigns the dev environment.

**Each row is classified**, because the classification is what decides whether a row is
safe to stop: **this checkout** / **an `.xgd` worktree of this repo** / **a sibling
project** / **undeterminable**. The sweep found eleven of this repo's own against six
belonging to sibling repos; conflating those is how a reaper becomes dangerous.

**It reports what it could not determine.** `lsof` will not return a cwd for a process
owned by another user. A survey that silently omits what it cannot see reads as "that
is everything" when it is not.

## `bin/dev up` / `down` / `reap`

**`bin/dev up`** — build the snapshot, run the migrate hook against the local store,
start builder, public-site, filing and access-sim, and write a pidfile per service.

**`bin/dev down`** — stop everything named in the pidfile, then **verify the ports are
free** via `1c ps` rather than assuming the signal landed.

**`bin/dev reap`** — the backstop. Every listener in the band whose cwd is under this
repo **or under an `.xgd` worktree of it**, and which is not in the current pidfile, is
listed and killed. `--dry-run` first, per this repo's convention.

**`reap` is not redundant with `down`.** `down` will always be incomplete: a worktree
torn down mid-session takes its pidfile with it, so `down` can never be run there —
four of the eight zombies arrived exactly that way. That is a permanent condition to
have a backstop for, not a bug to fix.

**`reap` reports what it could not kill.** A detached listener started from an agent
sandbox survives `kill -9` from inside that sandbox; only the operator can stop those,
and a reaper that claimed success would be lying.

## Acceptance

- `1c ps` run against the situation above lists all eleven of this repo's listeners
  with PID, port and cwd, classifies the three live services separately from the eight
  strays, names the four whose ports no constant knows, and does **not** list the six
  belonging to sibling projects as this repo's.
- `1c ps` returns its table as a value that a test asserts on, without parsing printed
  output.
- `bin/dev down` reports failure when a port it was asked to free is still answering.
- `bin/dev reap --dry-run` kills nothing and lists exactly what `reap` would kill.
- `reap` distinguishes "killed" from "could not kill" in its output.
- Run under the agent sandbox, where `ps aux` is empty, all of the above still work.

## Boundaries

- **No retirement.** `pnpm dev`, `pnpm dev:control` and `1c builder` as an operator
  entry point survive this ticket, per §L1 — the deletion is a separate step, filed
  once the replacement is proved. `bin/dev up` becoming the *only* way to run the dev
  environment is the outcome of that later step, not of this one.
- **No process supervision beyond this repo.** Sibling projects' listeners are
  reported for legibility and never killed, however clearly stray they look.
- **No new port allocations policy.** `1c ps` reads the band; deciding the dev
  environment's ports is [[REQ-318]]'s.
- **`1c reset` is not changed.** Its connect-based refusal stays as written.