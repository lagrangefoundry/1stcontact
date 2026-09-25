---
uid: request-0d0644d6
id: REQ-322
type: request
title: bin/dev up starts the deployed environment, and bin/build builds the KB
created_by: EPIC-16
created_at: '2026-09-25T20:40:56.921470+00:00'
updated_at: '2026-09-25T22:34:49.419301+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-82c5521c
---

## What the operator asked for

> "ok so I want to simplify further can you create me a ticket so that: 1) dev up starts
> everything except the repro console 2) build builds the kb too. I don't want to have to
> remember any more steps than I need to :-)"

Two changes, one subject: **a step you have to remember is a step that will eventually be
forgotten, and both of these have already cost something when they were.** They are one
ticket because they are the same repair applied to the two commands the operator types
most, and splitting them would mean two branches touching the two scripts that sit either
side of `bin/deploy`.

## 1 — `bin/dev up` starts the deployed environment

`DEV_SERVICES` (`tools/generate/src/cli/dev.ts`) starts `1c builder` on 8788 and has no
row for `1c dev serve` on 8789, so the deployed dev environment — the thing [[REQ-318]]
built — is the one part of the dev environment `up` does not start.

**Nothing decided this; it fell between two tickets** (see [[EPIC-16]] §N2). [[REQ-319]]
landed first and named the builder because 8789 did not yet exist, deferring port
decisions to [[REQ-318]]; [[REQ-318]] created 8789 and deferred supervision back, its
Boundaries reading *"No process supervision for `dev serve` — `bin/dev up/down/reap` is
the sibling ticket's subject."* Each names the other as the owner of the line "and `up`
starts it". The line was never written.

**§L1 does not forbid it.** §L1 requires the old path to keep working until the
replacement is proved, which means both servers up at once — `up` starting 8788 **and**
8789 is that requirement met more fully, not less. What §L1 forbids is `serve` replacing
`builder` in the list, which is the retirement step and is not this ticket.

**What is asked for:** `bin/dev up` starts filing, the builder, the public site,
access-sim **and `1c dev serve`**, in dependency order, each with a pidfile, exactly as
the existing four are started. `down` and `reap` then cover it with no further change,
because both read `1c ps` and 8789 is already in the known-service table.

### The consequence that must move with it: access-sim's origin

`bin/access-sim` defaults `BUILDER` to `http://127.0.0.1:8788` and `up` starts it with no
argument, so the simulator `up` starts fronts the **old watch builder**. Leaving that
while `up` also starts 8789 would deliver the worst version of both: two servers running
and the one you reach through Access is the one being retired.

This is not cosmetic. `[env.dev.vars]` sets `ACCESS_DEV_OPEN = "1"`, so a direct
connection to 8789 resolves every request to `TENANT_ID` and can only ever reach *1st
Contact* — §I13's finding, restated at a new port. **Work on any other business must
arrive through access-sim**, so if access-sim does not front 8789, the deployed
environment cannot be used for most of what the operator does.

So `up` starts access-sim against **8789**, and reaching the old path through Access
becomes the thing that takes an argument (`--builder http://127.0.0.1:8788`). That is the
correct direction of inconvenience: the retiring path carries it.

### Two things to settle while building, neither blocking

- **`serve`'s refusals become a log line.** `1c dev serve` refuses when the local D1 is
  behind `db/migrations/` and when more than one `workerd` resolves. Started detached,
  those become *"spawned as pid N but nothing answered on 8789 — see …/dev/serve.log"*.
  Largely moot in practice — `up` runs `bin/deploy --env dev` first, which runs the
  workerd guard on entry and the migrate hook, so both conditions have already been
  tested and reported before any service starts — but **`up` must not report a refusal as
  a timeout.** If the two are hard to tell apart, the deploy step's own report is where
  the reason belongs.
- **Two `workerd` processes on one `.wrangler/state`.** §K2 and §L1 both assume the old
  and new paths run side by side against the same bytes, and §M2's invariant concerns two
  *versions*, which this is not. But this store holds the only copy of the dev data
  (§M1), so if concurrent access by two processes turns out to corrupt or lock it, that is
  a finding to report rather than to work around, and it changes §L1's "prove it first"
  into "retire it now".

The pidfile mechanics need no invention: `1c dev serve` is a node wrapper that spawns
`npx wrangler`, exactly as `1c builder` is, so `down`'s SIGTERM-then-verify-the-port is
already built for that shape.

## 2 — `bin/build` builds the knowledge base

`bin/build` is `1c preflight`, `1c assets`, then typecheck and package builds. It does not
build the KB; `bin/kb-release` does (`1c kb build`, then `1c assets`). So "build the
thing" is two commands, and which one you need depends on whether you happen to have
edited a `system_kb` document — which is exactly the kind of thing that is not remembered.

**The repository already knows this is a trap.** [[BUG-48]] is the same lesson one level
down: `1c kb export` wrote documents the index never covered, producing *"text the
assistant carried all session and could not retrieve, and then reported the subject as one
its knowledge base did not cover — which was true of the corpus it could search and false
of the corpus it was holding."* The fix was to stop making the operator remember an
ordering between two commands and make it one command. `bin/kb-release` **is** that fix;
it just was not applied to the command the operator actually types.

**What is asked for:** `bin/build` builds the KB before `1c assets`, which is BUG-48's
ordering and the only ordering that works — `1c assets` reads the corpus as a directory
listing and the two manifests as build artefacts.

### It must not make every build need a cloud credential

`1c kb build` needs `CLOUDFLARE_API_TOKEN` for the Workers AI embedder, and it is network
work. A `bin/build` that unconditionally required a token and a round trip would be a
real regression for every build that touches no KB document — which is nearly all of them.

**So the stage is conditional on staleness, not on the operator's memory.** `1c assets`
already computes exactly this: `requireCoherentKb` compares the corpus against the index
and refuses a bundle holding documents the index does not cover. That comparison is the
trigger:

- **Index covers the corpus** → the stage says so in one line and does nothing. No token
  is read, no request is made, and a build of unrelated code costs nothing new.
- **Index is behind** → run `1c kb build`, then continue into `1c assets`.
- **Index is behind and there is no usable token** → fail **here**, naming
  `CLOUDFLARE_API_TOKEN` and the reason, rather than letting the build reach `1c assets`
  and refuse there. Same refusal, one stage earlier, with the fix named. BUG-48's
  position holds unchanged: *producing* a stale tree is legitimate, *shipping* one never
  is.

**The coherence check must not be a second implementation.** `requireCoherentKb` is the
one place that decides whether the corpus and the index agree; this stage calls it or
calls what it calls. A second opinion about staleness is free to disagree with the one
that gates the inline, and then the build passes and the ship refuses.

### `bin/kb-release` stays, as a caller and not a copy

It remains the KB-only path — rebuilding the index without a full preflight and typecheck
is a real thing to want, and it is what an operator with a token but no interest in a
10-minute build should type. But it must become a **caller of the same stage**, not a
second spelling of it, on the argument `bin/deploy` already makes about `--dry-run`: *"a
rehearsal that took a different route would prove nothing about the real thing."* One
implementation, two entry points.

## Acceptance

- `bin/dev up` on a clean tree starts five services — filing, builder, public-site,
  access-sim, `dev serve` — each with a pidfile under `storage/tmp/dev`, and `1c ps`
  shows all five as recognised and managed.
- `bin/dev down` afterwards frees all five ports, and reports failure if any is still
  answering.
- The access-sim `up` starts proxies to 8789. Fetching a page through 127.0.0.1:8799
  reaches the deployed snapshot, not the watch builder.
- A service that **refuses** at startup is distinguishable in `up`'s report from one that
  merely never answered.
- `bin/build` with a coherent KB makes no Workers AI request, reads no
  `CLOUDFLARE_API_TOKEN`, and says in one line that the index is current.
- `bin/build` with a `system_kb` document newer than the index rebuilds the index and
  then inlines it, and the resulting `kb.js` covers that document.
- `bin/build` with a stale index and no usable token fails in the KB stage, names
  `CLOUDFLARE_API_TOKEN`, and leaves the previously built `dist-assets` untouched.
- `bin/kb-release` and `bin/build`'s KB stage run the same code, asserted rather than
  observed.

## Boundaries

- **No retirement.** `pnpm dev`, `pnpm dev:control` and `1c builder` survive on 8788, per
  §L1. This ticket makes `up` start both paths; deleting one is the separate step
  [[EPIC-16]] §M4 leaves deliberately unfiled.
- **The repro console is not started by `up`**, as asked. `bin/repro-console` boots its
  own Vite server and runs each step as a fresh `1c` process; it needs nothing in the dev
  environment and nothing there needs it. It stays in `1c ps`'s known-port table, so
  `down` and `reap` still see it.
- **The public site is not served from its snapshot.** `bin/deploy --env dev` writes one
  for it, but `1c dev serve` names `control-app` literally and `up` starts the public site
  via `pnpm dev` (§N4). That is a freeze gap, not a remembered step — `up` already starts
  it — so it belongs with retirement rather than here.
- **`bin/dev up` does not run `bin/build`.** Open for the operator to overrule: it would
  make the whole environment one command, but `up` is also how you restart after a crash,
  and paying a full preflight-and-typecheck to get a port back is the wrong trade. The
  deploy step already refuses with a named fix when `dist-assets` is missing.
- **No change to what `1c kb build` does.** Its stages, its ordering and its credentials
  are BUG-48's and stay as written; this ticket decides only *when it is called*.