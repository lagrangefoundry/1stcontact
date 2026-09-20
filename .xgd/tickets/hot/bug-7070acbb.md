---
uid: bug-7070acbb
id: BUG-124
type: bug
title: 'Local dev: Access identity and defect filing are mutually exclusive, so the
  consultant silently has no filing tools'
created_by: EPIC-19
created_at: '2026-09-20T18:54:46.840610+00:00'
updated_at: '2026-09-20T18:54:46.840610+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  severity: high
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## Symptom

The consultant cannot file a defect against this product. Asked directly — *"Now see if you can create that bug please?"* — it re-read its own tool definitions and reported:

> I tried properly rather than going from memory — pulled the full definitions of every ticket tool I have. The answer is unchanged: **there is no create.** What I hold is `TicketQuery`, `TicketGet`, `TicketComments`, `TicketBacklinks`, `TicketHistory` — five read operations and nothing else.

Those five are the *client's* ticket surface ([[REQ-228]]). The `development` surface's `ReportBug` / `RequestCapability` / `AddTicketDetail` ([[REQ-273]]) are absent entirely.

The cost is the point: every defect found in that session — `create_image` silently ignoring `transparency: true`, `edit_image` failing with `this.store.get is not a function`, the per-turn state summary lagging its own writes by a turn — reached us only because the operator happened to be reading. A session where the client is not also the author loses all of it.

## Root cause — the two local-dev capabilities are mutually exclusive by construction

Each link verified against the running tree:

1. `developmentFor` (`apps/control-app/src/development.ts:305`) composes the surface **only** when `DEVELOPMENT_TICKETS_URL` is set. Absent → `null` → no surface → the model is correctly never told the tools exist.
2. That var is set in exactly one place: `filingVars()` (`tools/generate/src/cli/filing.ts:90`), pushed onto the wrangler argv by `1c builder` (`tools/generate/src/cli/index.ts:997`). It is deliberately never in `[vars]` or `.dev.vars`, because port and bearer are minted per run.
3. Getting a real identity locally — the business switcher, the Users tab, the portal, the terms gate — requires `bin/access-sim`, and its documented recipe (`bin/access-sim:52-55`) launches wrangler **by hand**:

   ```
   ./bin/access-sim --print-env > .dev.vars.local
   ./bin/access-sim &
   cd apps/control-app && npx wrangler dev --port 8788 \
     --env-file .dev.vars --env-file ../../.dev.vars.local
   ```

   That path never starts a filing service and passes no `--var`.
4. `1c builder` cannot be used instead, because `devEnvLayering` (`tools/generate/src/cli/dev-env.ts:86-110`) emits exactly two `--env-file` arguments — `.dev.vars` and the secrets file — with no third slot, no flag, and no knowledge of `.dev.vars.local`.

So an operator gets **identity or filing, never both**. The operator has identity, so the consultant has no filing tools.

## Evidence this is what happened, not a theory

- `/.dev.vars.local` written **2026-09-20 11:43** (the `--print-env` output); `apps/control-app/.wrangler/tmp/dev-*` created **11:44–11:45**. The hand-launched recipe, in order.
- A full loopback port sweep (1024–65535) finds **no filing listener**. The service answers `405 {"ok":false,"error":"POST only"}` to a GET; nothing on the machine does. Port 8788 answers `401 Cloudflare Access rejected this request`, 8799 answers `302` — both dev processes are up; the filing one was never started.
- Not an install fault: importing `@lagrangefoundry/ai-ticketing/node` by file URL and constructing `XgdProject` both succeed, so `startFilingService` would not have thrown had it been called.

## Why it is silent, which is the part that needs fixing

`1c builder` prints `filing: on` / `filing: off` in its banner — good, but only on the path that is not being used. On the hand-launched path nothing anywhere says filing is off:

- the Worker composes no surface, which is correct and by design;
- the model is never told about a capability it was not granted, which is also correct and by design;
- so the assistant concludes, truthfully and unhelpfully, *"I cannot create tickets of any kind."*

Two correct behaviours compose into an operator who cannot tell a missing capability from a mis-launched dev server. Absence must be legible somewhere the operator or the consultant can see it.

## Immediate workaround (no code change)

Every value `--print-env` emits is deterministic at defaults — `ISS` is `http://127.0.0.1:8799`, `AUD` is `local-dev-aud`, the service-token pair is the fixed `local-dev.access` / `local-dev-secret` — so the three lines can be pasted once into the secrets file (`$HOME/Documents/secrets/1c.dev.env`, or `$SECRETS_ENV_VAR`), which `devEnvLayering` already layers **after** `.dev.vars` and therefore wins. Then run `bin/access-sim &` and `1c builder` as normal, and browse at `127.0.0.1:8799`. Identity and filing together, today.

That this workaround exists and is undocumented is itself part of the defect.

## Fix

1. **Let `1c builder` layer an extra env file.** A repeatable `--env-file <path>` appended after the two `devEnvLayering` already emits, so the sim's output can be layered in without abandoning the command that owns the filing service's lifetime. Smallest change that makes the two capabilities composable at all.
2. **Make the recipe one command.** `1c builder --access-sim` starts the simulator in the same Node process that already owns the filing service and the dev server — same lifetime, same argument for why it belongs there — mints its env, layers it, and prints the address to browse. The three-command dance is what made these mutually exclusive in the first place; removing it is what stops them drifting apart again.
3. **Never silent again.** Absence of the filing surface must be visible without reading source: `bin/access-sim`'s usage block must stop recommending a launch that disables filing, and a deployment with no filing surface should say so where it can be seen — the builder's own UI, or a line the consultant can read, rather than only in a banner printed by the command that was not run.

Items 1 and 3 are the ones that unblock; 2 is the one that keeps it unblocked.

## Test plan

- `1c builder --env-file <path>` lands the file's values in the Worker's env, after `.dev.vars` and the secrets file, and the two existing arguments are unchanged when the flag is absent.
- A Worker built with `DEVELOPMENT_TICKETS_URL` present composes the `development` surface and projects `ReportBug` into the consultant's tool list; absent, it projects none. (Extends the composition assertions in `tests/test_UAT_FC_REQ-273_report_a_defect.workers.test.ts`.)
- The filing service started by `1c builder` is reachable at the address handed to wrangler, and a `ReportBug` call through it creates a ticket in this project's store.
- Whatever surfaces the absence in item 3 is asserted on directly — a UI assertion or a rendered line — not inferred from the banner.

## Why free-coded

Small, diagnosed, and blocking a capability the operator has called critical. No design work outstanding beyond the choice between items 1 and 2, which the ticket states rather than defers.
