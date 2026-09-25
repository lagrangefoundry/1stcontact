---
uid: request-0359a45d
id: REQ-319
type: request
title: bin/dev up, down and reap, and 1c ps to see what is running
created_by: EPIC-16
created_at: '2026-09-25T02:04:22.932236+00:00'
updated_at: '2026-09-25T04:31:34.811868+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: high
  needs_review: false
  auto_merge_back: true
  story_points: 5
  epic_parent: epic-96d8aca6
  chat_comment: comment-be8a438f
  commits:
  - working_sha: 55e4fca6c3088b13f50c2e215570542812428587
    reconcile_sha: null
    main_sha: null
  - working_sha: 1ebf31ff19e445f4a4e746768a279ef34480aa1a
    reconcile_sha: null
    main_sha: null
  version: 0.2.354
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


## What was built

**`1c ps`** (`tools/generate/src/cli/ps.ts`) is the survey. It returns a
`DevProcessTable` — one row per listening socket, each carrying pid, port, `lsof`'s
command name, the bound address, the working directory, the classification, whether
a constant names the port, and whether a pidfile claims it. `formatProcessTable`
renders it and `1c ps --json` emits it; nothing parses printed output.

**`1c dev up | down | reap`** (`tools/generate/src/cli/dev.ts`) are the three verbs,
and **`bin/dev` is a thin launcher for them** in the shape of `bin/1c` and
`bin/repro-console`. They are a `1c` subcommand rather than a script of their own
because all three READ the table above: written in bash they would have had to parse
the output of a command they could have called, which is the arrangement returning a
value exists to avoid. `bin/dev <verb>` and `1c dev <verb>` are therefore one
implementation, not two.

**Pidfiles live at `storage/tmp/dev/<service>.pid`**, one JSON object each
(`name`, `pid`, `port`, `startedAt`, `log`), beside a `<service>.log` holding that
service's output. `storage/tmp/` is already gitignored and already this repository's
scratch tree, so no new top-level directory and no new ignore rule. A bare pid would
not have said which port the service was started on, and `down` verifies THAT port
rather than re-deriving it from a table that may have moved since.

**`dev up` joins `WORKERD_GATED_COMMANDS`**, keyed with its subcommand the way
`fonts seed` is: `up` starts the builder, which opens `.wrangler/state`, so
[[REQ-316]]'s one-workerd check has to fire before it does. `down` and `reap` send
signals and read `lsof`, open no store, and are deliberately NOT gated — refusing to
STOP a dev environment on a tree with a runtime skew would block the one action that
is most useful at that moment.

**The known ports are declared once.** `KNOWN_SERVICES` in `ps.ts` is the table, and
`DEV_SERVICES` reads its four ports out of it through `knownPort(name)` rather than
restating them, so a port cannot mean one thing to `1c ps` and another to `bin/dev
up`. `DEFAULT_FILING_PORT` is imported from `filing.ts` for the same reason. The
other three (8787, 8788, 8799, 8710) have no constant to import and are still
written at their original call sites; hoisting those four call sites into this table
is a separate change and was not made here.

## Decisions taken during implementation

**The band is the whole filter, including for our own processes.** An earlier version
also reported every listener whose cwd was this checkout at ANY port, on the grounds
that "a server of mine I cannot see" is the complaint. Measured, that is unusable: a
live `wrangler dev` holds a dozen ephemeral control sockets in the 49000–62000 range
with the app directory as their cwd, so the answer arrived buried under twenty rows
of one server's own plumbing — and `reap` offered to kill each of them. The band is
8700–8899 plus 24678, which covers every listener in the measured sweep. A service
that binds outside it is [[REQ-318]]'s to add to the table.

**A checkout's strays are this repository's from any checkout.** The classification
still has the four classes, but `worktree` means *another checkout of this
repository* — an `.xgd` worktree of it, or the main checkout when the question is
asked from a worktree — and renders as such. A stray left behind in one checkout is
ours to reclaim from any of them; the reverse would have made an agent working in a
worktree unable to reap exactly the strays it is most likely to have caused.

**The checkout topology is learned from `git`, not guessed.** `git worktree list
--porcelain` gives the registered worktrees and the PARENT of those paths is the base
XGD provisions into; keying on the base rather than the paths is what still
recognises a worktree that has been torn down. `--git-common-dir` identifies the main
checkout, which must NOT be reduced to its parent: doing so yielded
`/Users/martin/lagrangefoundry`, the directory the operator keeps every project in,
so the survey claimed each sibling repository's server as this repo's own and `reap`
would have killed them. An origin-URL-derived fallback base covers the checkout with
no other worktree registered at that moment. Every path on both sides is resolved
through `realpath` first, because `lsof` answers in real paths and a symlinked
checkout (or macOS's `/var` → `/private/var`) otherwise reads as a stranger's.

**The eleventh listener is reported as not attributable to this repository.** The
measured table counts `8889 | python | /private/tmp/…/test_UAT_FC_REQ_706_stop_port_3`
among this repo's eight zombies. It is reported, with its pid, port and cwd, in the
"belongs elsewhere" section rather than as ours: its working directory is under
`/private/tmp` and no longer exists, and `REQ-706` is a sibling project's ticket id.
Classifying a deleted temp directory as ours would mean a reaper that kills anything
whose cwd it cannot recognise, which is the dangerous version this ticket's own
"eleven of ours against six of theirs" warning is about. `1c ps` therefore reports
**ten** of this repository's own and seven in the band belonging elsewhere. Run
against the machine today it lists exactly those ten with pid, port and cwd, names
the seven whose ports no constant knows, and puts the six belonging to sibling
repositories (8766, 8767, 8791, 8793, 8794, 8888) outside them.

**`up` owns none of the deploy.** The snapshot and the migrate hook are
`bin/deploy --env dev`, which is [[REQ-318]]'s, and the whole of `up`'s deploy step is
to call it. While `apps/control-app/wrangler.toml` has no `[env.dev]` that target
does not resolve, so the step is SKIPPED with one line naming REQ-318 as its owner
and the services are started against the store they already read. The condition is
the presence of the environment, so nothing here changes when REQ-318 lands.

**`up` leaves an already-answering service alone** and writes no pidfile for it,
following `1c filing`'s reason: two of them would fight over one port and the second
would lose, so the useful thing to say is that the first is doing the job. `up` did
not start it and cannot claim to know how to stop it — a listener nothing owns is
`reap`'s. A service that was spawned and never answered is reported as a failure
naming its log file, because the reason is already written there.

**`up`'s start order is a dependency order.** filing, then the builder (which starts
a filing listener of its own only when none is answering, so it finds this one
instead of forking a second whose lifetime nothing records), then the public site,
then access-sim, which proxies to the builder. `down` reverses it.

**`down` sends SIGTERM and does not escalate; `reap` escalates.** If `down` sent
SIGKILL there would be no state in which the backstop was reachable and the split
between the two would be decoration. `down` removes the pidfile for everything it
signalled — including what it could not stop — which is the handoff: that process
becomes an unmanaged stray, and an unmanaged stray is the one thing `reap` is
guaranteed to act on. A pidfile naming a process that has already gone is a
successful `down`, not a failure.

**`reap` never signals its own process or its parent.** `1c ps` runs from inside the
repository it is surveying, and a reaper whose first act is suicide reports nothing
at all.

**`reap` targets a recognised service that no pidfile claims**, which includes an
operator's own `pnpm dev`. That is the rule the ticket asks for and the only rule that
can reclaim the four zombies whose worktrees are gone. Every row names its service, so
a recognised one is obvious in `--dry-run`.

**`1c ps` distinguishes "nothing is running" from "I could not look."** An `lsof`
that cannot be run at all returns `probed: false`, an empty table, a warning, and
exit 6 — because the answer is then unknown rather than empty, and a caller that read
silence as calm would be wrong. A `lsof` that exits 1 having matched nothing is the
answer "no such listener" and is not a failure. A second `lsof` failing after the
first succeeded degrades every row to `undeterminable` with a warning rather than
discarding a real table.

## Test plan

`tests/test_UAT_FC_REQ-319_dev_processes.test.ts` — 16 UATs.

`lsof` and `kill` are injected in the legs that need them, and they are the only
things stubbed: both are the operating system, which this repository does not own.
Where `kill` is stubbed (the could-not-kill case, which cannot be manufactured) the
stub only REFUSES TO SIGNAL — the evidence that the process is still there afterwards
comes from a real `lsof` sweep. Everything else is real: real detached children
holding real listening sockets, real pidfiles on disk, the real `lsof` reading them
back, and `1c help` run as a real subprocess.

Every process test runs against a TEMPORARY repo root, deliberately: `reap` kills
every listener whose cwd is the checkout it was asked about, so a reap test rooted at
the real repository would kill the operator's own running builder. Rooted at a temp
directory, this file's children are that root's and every real listener on the machine
classifies as somebody else's — so the sparing rule is exercised for real, against
real processes, and cannot reach anything that matters.

- `ps_attributes_every_listener_in_the_measured_sweep` — the sweep from this ticket
  replayed as `lsof` output: the ten rows attributable to this repo, the three live
  services recognised by name, the seven strays saying "unrecognised service", the
  four from `.xgd` worktrees kept distinct, the sibling projects' rows present and not
  ours, and the machine's unrelated furniture absent.
- `ps_never_claims_a_sibling_project_as_this_repo` — pins the `dirname`-of-the-main-
  checkout failure that actually happened.
- `ps_reports_what_it_could_not_determine` / `ps_reports_rather_than_fails_when_lsof_is_absent`.
- `ps_is_a_value_not_printed_output` — nothing injected: a real socket on a real
  in-band port, read back by the real `lsof`, attributed to this real checkout, and
  asserted on as a value.
- `ps_works_where_ps_aux_is_empty` — neither module invokes `ps` (asserted about the
  source, because it is a fact about the source) and the real survey still answers.
- `known_ports_are_declared_once`.
- `up_starts_a_service_records_it_and_does_not_start_it_twice` — a real detached
  listener, its pidfile, `managed` following from it, the second `up` reporting
  already-up, and `down`'s happy path end to end.
- `up_reports_a_service_that_never_answered` / `up_delegates_the_deploy_to_bin_deploy_env_dev`.
- `down_reports_failure_when_a_port_is_still_answering` — a real child that really
  ignores SIGTERM; `ok` is false, the port is named, and the handoff to `reap` is
  asserted. `down_forgets_a_stale_pidfile`.
- `reap_dry_run_kills_nothing_and_lists_what_reap_would_kill` — two real children:
  the preview lists both and both are still alive, a pidfile spares one, real
  listeners belonging elsewhere are spared, and the real run kills exactly what the
  preview listed. `reap_distinguishes_killed_from_could_not_kill`.
  `reap_never_kills_its_own_process`.
- `bin_dev_is_a_launcher_for_the_three_verbs` — and `1c help` documents all four.