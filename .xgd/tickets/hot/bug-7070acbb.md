---
uid: bug-7070acbb
id: BUG-124
type: bug
title: 'Local dev: Access identity and defect filing are mutually exclusive, so the
  consultant silently has no filing tools'
created_by: EPIC-19
created_at: '2026-09-20T18:54:46.840610+00:00'
updated_at: '2026-09-20T19:00:32.482483+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  severity: high
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-7abc093a
---

## Symptom

The consultant cannot file a defect against this product. Asked to do it directly, it re-read its own tool definitions and reported that it holds `TicketQuery`, `TicketGet`, `TicketComments`, `TicketBacklinks`, `TicketHistory` — the CLIENT's five read operations ([[REQ-228]]) — and no create of any kind. [[REQ-273]]'s `ReportBug` / `RequestCapability` / `AddTicketDetail` are absent entirely.

REQ-273 is built and wired correctly. The surface simply was not composed, because the service it needs was never started.

## The one real constraint, and the accident built on top of it

The Worker runs in workerd. workerd has no `node:child_process`. So the Worker cannot run `xgd` itself, and some Node process has to do it on the Worker's behalf. That is the whole of the genuine difficulty.

`xgd ticket create` needs no identity, no credential and no session. Filing is a local subprocess call. Everything beyond "a Node process must make it" is a choice we made, and the choice was wrong:

- the Node process was hung off **`1c builder`**, so it exists only when that command is the thing running the dev server;
- it listens on a **random port** (`port 0`) and mints a **fresh bearer per run**;
- both values are therefore only knowable at launch, so they are handed to wrangler as `--var` on the command line.

The consequence is that **filing is a property of how the dev server was launched**, not a property of the deployment. Launch wrangler any other way and filing is silently off.

`filing.ts` justifies the per-run values with *"a committed value would be a stale one, and a developer running `wrangler dev` by hand gets an assistant with no filing surface rather than one pointed at a listener that is not there."* That argument is circular: a value is only stale because it was randomised in the first place, and "a developer running wrangler by hand gets no filing" is stated as the safe outcome when it is in fact the defect.

## How it actually bit

`bin/access-sim` is the only way to get a real identity locally, and its documented recipe (`bin/access-sim:52`) launches `npx wrangler dev` by hand with a third `--env-file`. `1c builder` cannot be used instead, because `devEnvLayering` (`dev-env.ts:86`) emits exactly two `--env-file` arguments and has no slot for the simulator's output.

So the operator had to choose between a signed-in session and a consultant that can file, and Access is not the cause — it is just the thing that forced a hand launch. Any other reason to launch wrangler differently would break filing identically.

Verified rather than reasoned: `.dev.vars.local` was written at 11:43 and the wrangler tmp dirs at 11:44–11:45, and a full loopback port sweep (1024–65535) finds no filing listener anywhere on the machine. Not an install fault — importing `@lagrangefoundry/ai-ticketing/node` and constructing `XgdProject` both succeed, so `startFilingService` would not have thrown had it been called.

## What it costs

Every defect the consultant found that session — `create_image` silently ignoring `transparency: true`, `edit_image` failing with `this.store.get is not a function`, the per-turn state summary lagging its own writes by a turn — reached us only because the operator happened to be reading. A session where the client is not also the author loses all of it.

## Fix — make the address a setting, not a launch artefact

**Fixed port, token in `.dev.vars`, started independently of the dev server.** A fixed loopback address is never stale, so it can live in configuration like every other value the Worker reads, and the Worker stops caring how wrangler was started. The security argument survives intact: loopback still keeps other machines out, and a fixed token in `.dev.vars` closes the browser-CSRF hole exactly as well as a random one — the threat is a page in the operator's own browser POSTing blind, which cannot read a token either way.

That removes the coupling rather than patching it:

1. **The service gets a fixed default port and a token read from `.dev.vars`**, both overridable. `filingVars()` and the `--var` handoff go away.
2. **It can be started on its own** — `1c filing` — and `1c builder` may still start one for convenience, but nothing depends on it doing so. Two checkouts wanting different ports is what the override is for.
3. **An absent filing surface is legible.** Today the only signal is a `filing: on/off` banner printed by the command that was not run. The Worker composing no surface is correct, and the model never hearing about an ungranted capability is correct — but the two compose into an operator who cannot tell a missing capability from a mis-launched dev server. Surface it where it can be seen: the builder's UI, or a line the consultant itself can read.

`bin/access-sim`'s usage block stops needing a warning, because there is no longer a launch path that disables filing.

## Workaround until then

Every value `bin/access-sim --print-env` emits is deterministic at defaults — `ISS` is `http://127.0.0.1:8799`, `AUD` is `local-dev-aud`, the service pair is the fixed `local-dev.access` / `local-dev-secret`. Those three lines can be pasted once into the secrets file (`$HOME/Documents/secrets/1c.dev.env`, or `$SECRETS_ENV_VAR`), which `devEnvLayering` already layers after `.dev.vars` and which therefore wins. Then `bin/access-sim &` plus `1c builder` as normal, browsing at `127.0.0.1:8799`, gives identity and filing together.

## Test plan

- The filing service binds its fixed default port, and an override changes it.
- A Worker reading the filing address and token from `.dev.vars` composes the `development` surface and projects `ReportBug` into the consultant's tool list; with the address absent, it projects none. (Extends `tests/test_UAT_FC_REQ-273_report_a_defect.workers.test.ts`.)
- A `ReportBug` call through the running service creates a ticket in this project's store.
- Filing is on for a dev server started by `1c builder` AND for one started by a bare `wrangler dev` — the same assertion both ways round, which is the behaviour this ticket exists to create.
- A wrong token is refused, and whatever surfaces the absence in item 3 is asserted on directly rather than inferred from the banner.