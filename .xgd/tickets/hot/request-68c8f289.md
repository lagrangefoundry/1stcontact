---
uid: request-68c8f289
id: REQ-315
type: request
title: bin/deploy --fonts, and a dev target the font mirror never had
created_by: EPIC-21
created_at: '2026-09-23T23:45:02.265998+00:00'
updated_at: '2026-09-24T01:51:36.463295+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  epic_parent: epic-b9b27697
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-e562ef0f
---

## The tools the font mirror shipped without

[[REQ-312]] built the mirror and [[REQ-313]] taught the assistant to use it, and between
them they left the operator with three separate commands to remember and **no way at all to
reach a local dev environment**.

`1c fonts publish` writes the **cloud** bucket over the R2 REST API. `1c builder` defaults to
local `wrangler dev`, where `env.SITES` is miniflare's own R2 under
`apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/`, which publish never touches. So
after a full mirror and publish, **local builder previews still 404 every platform font** —
the operator is shown a fallback face while the builder tells them they chose Roboto, which
is the exact failure REQ-312's same-origin work existed to prevent, surviving in the one
environment the work is done in.

`bin/deploy` has no fonts step either, so publishing is a remembered command rather than a
deploy target.

## What is asked for

**`bin/deploy --fonts`**, deploying the staged mirror to **dev or production as directed**.

### It is a repo-level target, not a per-app hook

`bin/deploy` iterates apps and there are two that serve `_fonts/…` — control-app and
public-site — but there is **one bucket** and the mirror is not per-app. Running it as a hook
would publish the same 1.35 GB twice; publish is digest-checked so the second pass would
transfer nothing, but it would still re-read and re-hash the whole corpus. `--fonts` runs
once per invocation, before or independently of the app deploys.

### Production is the existing path

`--fonts` at `--env production` is `1c fonts publish` as it stands: the R2 REST API, the
`CLOUDFLARE_API_TOKEN` the release toolset already uses, incremental and resumable. Nothing
about that mechanism changes — this gives it a door in the place an operator already looks.

### Dev is the part that does not exist yet

A local target must land the same objects, under the same `platform/fonts/` prefix and the
same key function, in **miniflare's local R2 state** so that a `wrangler dev` builder serves
them. That state is a SQLite metadata store plus a `blobs/` directory under
`.wrangler/state/v3/r2/<bucket>/`, written directly rather than over a network.

**The local state is per app directory.** `apps/control-app/.wrangler/state` and
`apps/public-site/.wrangler/state` are separate stores, so "the local bucket" is two
locations, not one. Whichever the local target writes, it must be honest about which
surfaces will then answer — seeding control-app alone leaves a locally-served published site
404ing the same fonts the preview beside it renders.

### Shape

- Default `--env production`, matching what the rest of `bin/deploy` already defaults to. The
  local target is selected explicitly; a command that silently wrote a local store when the
  operator meant the cloud would be the wrong way round for a deploy script.
- `--dry-run` reports what would move and moves nothing, on both targets — `bin/deploy`
  guarantees this of every hook and `runPublish` already takes `dryRun`.
- An unstaged or partial mirror refuses and says which objects are missing, rather than
  publishing a mirror that is not one. `PublishReport.missing` already carries this.
- The run reports objects sent, objects already current and bytes — the existing
  `formatPublishReport`, on whichever target ran.

## Why the mirror's cost belongs in the ticket

Measured on this machine, because the numbers decide whether the operator runs this at all
and they are not guessable from the corpus size:

| | |
|---|---|
| Upstream OFL tree | 3,808 files, **2.45 GB** of TTF (REQ-312's own measurement) |
| `sfntToWoff2` at `BROTLI_QUALITY = 11` | **~0.65 MB/s**, single-threaded, consistent across a 1.4 MB and a 15 MB sample |
| So a cold `1c fonts mirror` | **~65 min of brotli**, ~75–90 min wall clock with parse, round-trip verification, hashing and writes |

Brotli's quality cliff sits between 10 and 9, and it is severe — on a 15 MB sample, q11 took
23.6 s, q10 took 10.7 s and q9 took 1.2 s, for output of 4.56 / 4.63 / 4.97 MB. **q9 is
roughly 20× faster for ~9% more bytes**, which for a local dev seed is obviously the right
trade and for a production publish is obviously not.

`--quality` already exists on `1c fonts mirror` for exactly this reason. What is missing is
that nothing tells an operator the cliff is there, so the default silently costs an hour and
a quarter when a dev seed wanted four minutes. Whatever `--fonts` does for dev should not
leave that discovery to the operator.

The mirror is incremental and digest-checked, so this is a one-time cost and a re-run is
near-free — but only if the first run is allowed to finish.

## Out of scope

Mirroring, conversion, the manifest, the projection and the serving paths are all
[[REQ-312]] and [[REQ-313]] and are not reopened here. This is the operator's door onto work
that already exists, plus the one target that was never built.


## "Dev" is local, and that is not a preference — it is the only thing it can mean

> **⚠️ SUPERSEDED IN PART — see "Amendment: §K gives dev a real deploy target" at the
> foot of this ticket.** The verification in this section is correct as of the date it
> was written and should be kept: `bin/deploy --env dev` did fail, and `[env.dev]` did
> not exist. What no longer holds is the conclusion drawn from it — that a dev target
> can only ever be a local seed rather than a deploy. EPIC-16 §K commits to declaring
> `[env.dev]` and giving `bin/deploy` a local target, which is precisely the ticket
> this section hedged against. Read the amendment before acting on the framing or the
> explicit-flag argument below.

Checked against wrangler rather than assumed. `bin/deploy --env dev` **fails**:

```
✘ [ERROR] Processing wrangler.toml configuration:
    - No environment found in configuration with name "dev".
      The available configured environment names are: ["production"]
```

`bin/deploy`'s `worker_name()` greps `wrangler.toml` for `[env.<name>]`, so an undefined
environment resolves to an empty worker name and the step announces `app → (--env dev)`
before wrangler refuses it. `--env staging` — named in `bin/deploy`'s own usage comment at
line 59 — has the same problem: the comment documents a shape the configuration has never
had.

**There is exactly one deployed environment, `production`, and both apps define it with the
same worker name as their top-level config.** So this repo's dev environment is not a
deployment at all: it is `1c builder` — `wrangler dev` reading the top-level config, against
miniflare's own D1 and R2 under `.wrangler/state`.

That settles the target and it also makes the naming honest: **`--fonts` at the dev target is
a local seed, not a deploy.** Nothing is uploaded, no worker is published, and the bytes land
in a SQLite store on the operator's disk. The flag lives on `bin/deploy` because that is
where an operator looks for "get this to an environment", and the help text should say
plainly which of the two things each target does rather than let "deploy" cover both.

If a `[env.dev]` Worker is ever wanted, it is its own ticket and this one does not presume
it: a dev target added here must keep working when it arrives, which is an argument for
selecting the local seed by an explicit flag rather than by the absence of `--env`.


## The state of the world once `1c fonts mirror` has completed

Framed against the run actually finishing with the full corpus at the default quality,
because that is when this ticket's absence starts to cost something rather than merely
being missing.

### Nothing in the product asks what environment it is in, and nothing should

Verified, because it is the premise the rest of this rests on:

- **The browser never knows.** A page's font `src` is root-relative `/_fonts/…` and the
  renderer reduces it to a document-relative reference (`relativizeUrl`, REQ-109). It names
  no host and carries no environment. [[REQ-312]] settled this and it is correct.
- **The assistant never knows.** `use_font` calls `resolveFont(fonts, …)` against the
  projection this bundle carries. There is no environment in the call, no branch on one, and
  nothing it could read to find one.
- **The router never knows.** `r2PlatformFonts(env.SITES)` is one line for both runtimes.
  Under `wrangler dev`, `env.SITES` *is* miniflare's local R2. The code is already identical.

**One thing is environment-specific and it is the wrong one: the delivery of the bytes.**
`1c fonts publish` speaks only the cloud R2 REST API, so production is given a mirror and
local dev is not. Every consumer is correctly blind; the supply is not.

### And the projection makes that gap actively harmful

`cmdFontsIndex` builds the projection from **`fonts/platform.json` — the STAGED manifest** —
and `use_font` resolves against it with **no runtime check that any byte exists**. The
`ENVIRONMENT` refusal fires on one condition only: `idx.families.length === 0`.

So the moment the mirror finishes:

| | before the mirror | after the mirror |
|---|---|---|
| projection | empty | 1,940 families, in **every** environment |
| `use_font` in local dev | refuses honestly — *"this deployment serves no platform fonts"* | **succeeds**, and binds `/_fonts/roboto/…` |
| the browser | shows a fallback face, and was told why | shows a fallback face, and **nothing anywhere says so** |

**Local dev gets worse, not better, when the mirror completes.** It trades an honest refusal
for a confident bind that 404s — which is precisely the silent fallback-face failure
[[REQ-312]] was written to prevent, surviving in the one environment the work is done in.

The projection is a build-time global; the bytes are per-environment. That mismatch is the
whole defect, and it cannot be closed at the consumer end without teaching somebody where
they are — which is the thing that must not happen.

### So the requirement is the supply side, and it is one movement

The staged mirror at `fonts/mirror/` must reach the local miniflare R2 that `env.SITES`
resolves to, under the same `platform/fonts/` prefix and the same key function
`1c fonts publish` writes. Local disk to local disk — no network, no compression, no
conversion; the expensive work is already done and on disk by then.

### It should not be a step anybody has to remember

`1c fonts mirror` already decided this question once, for the projection: `cmdFontsIndex`
runs at the end of a mirror run precisely so that a refreshed corpus cannot leave the
assistant binding paths that are no longer served. **The local bytes are the same class of
follow-on and deserve the same treatment** — a mirror run that leaves the operator's own dev
environment unable to serve what it just spent ninety minutes converting has not finished.

Whether that lands as a final step of `1c fonts mirror`, as a seed on `1c builder` startup,
or as an explicit target reachable from `bin/deploy --fonts`, the acceptance is the same:
**after a mirror completes, the operator starts the builder and fonts work, having typed
nothing extra and having chosen no environment.** An explicit target may still exist for
re-seeding, but it is not how the ordinary case is reached.


## Decision: the interface is fixed, the implementation is not

**Settled by the operator: any delivery is acceptable so long as it is the same interface.**
That interface is `PlatformFontReader` — `read(path): Promise<Uint8Array | null>` — already
declared in both `apps/control-app/src/platform-fonts.ts` and injected through
`RouterDeps.platformFonts`. Nothing above it may learn which environment it is in, which is
the constraint the rest of this ticket exists to hold.

### One shape is ruled out, and it must not be re-attempted

**The Worker cannot read the filesystem, so a disk-backed reader cannot run under
`wrangler dev`.** `compatibility_flags = ["nodejs_compat"]` shims Node APIs inside workerd;
it does not open the host disk. This repo already settled the same question the same way:
the system KB is inlined into `src/generated/kb.js` ([[REQ-158]]) *because* the Worker cannot
read `kb/system/`, and `1c assets` writes that file unconditionally so a static import
resolves on a machine that never built one.

`readStagedPlatformFont` therefore works **only** in the Node builder transport
(`tools/generate/src/cli/builder.ts`), which its own header calls test infrastructure and not
a hosting path. Reaching for it from the `wrangler dev` builder is a dead end.

### The two shapes that are buildable

**The choice is now made: take shape 1, seed the store.** Both remain buildable and the
reasoning below is unchanged and worth reading, but the implementing session no longer
picks between them — EPIC-16 §K supplies context that reverses the cost comparison. See
the amendment at the foot of this ticket for why.

1. **Seed miniflare's local R2.** The staged mirror is written into
   `.wrangler/state/v3/r2/1stcontact-sites/` under the same `platform/fonts/` prefix and the
   same `platformFontKey`. `r2PlatformFonts(env.SITES)` then serves dev **unchanged** — not
   merely the same interface but the same implementation, and therefore the strongest
   possible statement that dev and production agree. Costs a second copy of the corpus on
   disk (~1.35 GB) and a seeding step whose freshness has to be reasoned about.

2. **A loopback origin beside the builder.** `1c builder` serves `fonts/mirror/` on a local
   port and injects a fetch-backed `PlatformFontReader`. No copy and no staleness — the
   staged bytes are read where they already are — at the cost of a second process the builder
   owns, and a second implementation of the interface that must be held to the same
   behaviour, including `null` for an absent object.

### What is not negotiable either way

- The reader is selected by **wiring**, not by a branch inside a route or inside the
  assistant. `RouterDeps.platformFonts` is that wiring and already exists.
- `use_font`, the renderer, the page's `src`, the toolbox manual and the browser are
  untouched. If any of them gains knowledge of an environment, the change is wrong.
- Absent bytes return `null` and 404 identically in both, so a missing family fails the same
  way everywhere rather than one environment throwing and another going quiet.


## Amendment: §K gives dev a real deploy target (2026-09-23)

Recorded from [[EPIC-16]] §K/§L, after the operator asked for an isolated local
environment reached by `bin/deploy --env dev`. This ticket **anticipated** that request
and hedged against it explicitly; the hedge was well-judged, and the arrival of the
thing it hedged against makes this ticket **simpler**, not harder. Nothing here enlarges
the scope.

### What EPIC-16 §K commits to

A **local deployment target**: `[env.dev]` declared in both apps, `bin/deploy` gaining a
target table so `--env dev` ships through the same hooks, the same ordering and the same
capability report as production, and a `bin/dev up/down/reap` supervisor that owns the
processes. The distinguishing property is that the dev environment runs a **snapshot**
— the bundle `bin/build` already produces and currently discards — rather than watching
the working tree. It is frozen at the moment of deploy by construction.

It is a separate ticket and this one does not depend on it.

### 1. The "seed, not a deploy" framing dissolves

Under §K a local seed *is* a deploy. `bin/deploy --fonts --env dev` reads literally and
means what it says.

Two consequences for what this ticket builds:

- **Drop the explicit-flag hedge.** The argument for "selecting the local seed by an
  explicit flag rather than by the absence of `--env`" existed only to survive the
  arrival of a `[env.dev]` Worker. `--env dev` selects the dev target, the same way
  `--env production` selects production, and that keeps working when §K lands.
- **Do not invest in help text explaining that the dev target is not really a deploy.**
  The asymmetry the help text was asked to apologise for is being removed. Describe both
  targets in the same voice.

### 2. The open implementation choice is closed — against the cheaper-looking option

"The two shapes that are buildable" offers store-seeding and a loopback origin, and
leaves the choice open. §K settles it, and it is worth recording *why*, because the
decision reverses on context this ticket could not have had:

| this ticket's cost argument | what §K does to it |
|---|---|
| loopback origin: *"no copy and no staleness"* | it reads `fonts/mirror/` **live out of the working tree**, making the fonts the one part of the environment that is not frozen — the exact property §K exists to abolish |
| loopback origin: costs a second process | stops being a cost; `bin/dev up/down/reap` owns processes by design |
| store-seeding: *"a seeding step whose freshness has to be reasoned about"* | stops being a worry; **deploying is when freshness is decided**, which is what a deploy target means |
| store-seeding: ~1.35 GB second copy on disk | unchanged, and now the price of the property the environment is being built to have |

**Take shape 1 — seed miniflare's local R2 under the same `platform/fonts/` prefix and
the same `platformFontKey`.** `r2PlatformFonts(env.SITES)` then serves dev unchanged:
not merely the same interface but the same implementation, which is the strongest
available statement that dev and production agree.

### 3. The acceptance criterion gains an implementation site

This ticket asks that *"after a mirror completes, the operator starts the builder and
fonts work, having typed nothing extra and having chosen no environment"*, and is openly
unsure where that belongs — "a final step of `1c fonts mirror`, a seed on `1c builder`
startup, or an explicit target".

Under §K the answer is no longer open in principle: **fonts are part of what
`bin/deploy --env dev` puts into the environment**, and `bin/dev up` becomes the single
start command.

But §K is not built yet and this ticket must not wait for it (see sequencing below), so
the acceptance is unchanged and the landing site stays the implementing session's call.
What §K adds is a direction: whatever is built now should be a **callable seeding
operation** that `bin/deploy --env dev` can later invoke as one step among its others,
rather than logic buried in `1c builder`'s startup or in `1c fonts mirror`'s tail where
a deploy target cannot reach it.

### 4. An open question §K may close for free — not verified

This ticket flags that `.wrangler/state` is **per app directory**, so "the local bucket"
is two stores, and seeding control-app alone leaves a locally-served published site
404ing the fonts the preview beside it renders.

If §K points both `wrangler dev` processes at a single `--persist-to` directory, that
problem disappears as a side effect. **Whether two `wrangler dev` processes can safely
share one persist directory is NOT verified.** Do not rely on it. Until it is
established, this ticket's existing requirement stands in full: whichever store the
local target writes, it must be honest about which surfaces will then answer.

### 5. Sequencing: this ticket does not wait

**Implement this now, as if §K is coming.** It has a live driver §K does not: the moment
`1c fonts mirror` completes, the projection fills in every environment while local bytes
exist in none, so local dev trades an honest refusal for a confident bind that 404s —
[[REQ-312]]'s own failure mode, surviving in the one environment the work is done in.
That cost is incurred on mirror completion, not on §K's schedule.

### What this amendment does not change

The `PlatformFontReader` interface decision; the finding that the Worker cannot read the
host disk under `nodejs_compat` and that `readStagedPlatformFont` is therefore a dead end
under `wrangler dev`; the brotli quality cliff and the mirror's cost; the production
publish path; and everything under "What is not negotiable either way".