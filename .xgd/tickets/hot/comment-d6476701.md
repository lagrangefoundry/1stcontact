---
uid: comment-d6476701
id: COMMENT-1141
type: comment
title: Comment on request REQ-147
created_by: xgd
created_at: '2026-08-17T19:27:55.390354+00:00'
updated_at: '2026-08-17T19:47:14.344783+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-23fd6e61
  kind: chat_transcript
---

<!-- xgd-turn id="9fa03815-623f-4513-9b02-320ec81620f9-user" -->

<!-- xgd-chat role="user" ts="2026-08-17T19:27:50.877373+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="9fa03815-623f-4513-9b02-320ec81620f9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-17T19:47:14.182680+00:00" -->
#### Claude
I'll start by reading the ticket to see what's being asked.

Let me investigate the current state of the control-app Worker and related config.

I have what I need. Let me start the free-coding flow — ticket to `free_coding`, then cut a branch.

Now the Worker-side gate. Writing the verifier first:

Now wire it into the Worker and close the `workers.dev` door:

Now the deploy-time assertions in the smoke script:

Now the CLI surface for those two options:

Now the UATs:

All 26 pass. Now the regression scope — the tests that touch the same surfaces:

That `bug32` failure pre-exists on `xgd-working` — unrelated to this change. Now the two control-app ACs that my gate legitimately supersedes; they need to authenticate. Shared test support first:

Now AC-965's two `unstable_dev` instances:

The python patch landed in the wrong worktree. Reverting it there and applying it in the branch worktree:

Launching the full node suite in the background while I finish up:

Now updating the ticket body while the suite runs:

None of the 11 touch Access. Confirming they pre-exist on the base:

Identical 56 failures on the base — my change introduces zero regressions. Now merging back:

Done. REQ-147 is at `free_coded`, commit `1053270` merged into `xgd-working`, version `0.1.53`.

## What landed

The gate is stated **twice**, because a Cloudflare Access policy protects a *hostname* and nothing else:

1. **`workers_dev = false`** for control-app (top level and restated under `[env.production]`) — removes `1stcontact-control-app.<sub>.workers.dev`, the door no policy covers.
2. **`apps/control-app/src/access.ts`** — the Worker verifies the Access JWT itself before it proxies anything: RS256 against the team's JWKS (cached per isolate, refetched once on an unknown `kid` so key rotation doesn't become an outage), with `aud`, `iss`, `exp`/`nbf`/`iat` all checked, and the algorithm pinned **from the JWKS** rather than believed from the token header.

`aud` is not optional: every Access application in a team is signed by the same keys, so signature alone proves "someone in this team's Access", not "allowed into *this* application".

Everything fails closed — empty vars → 503 naming the missing var, unfetchable JWKS → 401, no token → 401, and nothing reaches the origin before the gate has run. The two refusal codes are deliberate: 503 sends you to `wrangler.toml`, 401 to the identity.

Also: `bin/smoke --control-origin/--workers-dev-origin` asserts both doors against a live deploy, and `apps/control-app/ACCESS.md` records the granted identities and why (AC6).

**Evidence**: 26 new UATs in `tests/test_UAT_FC_REQ-147_access_gate.test.ts`, driving the real handler with real minted RSA signatures — 8 distinct rejection cases (absent, malformed, forged signature, `alg: none`, wrong `aud`, wrong `iss`, expired, unknown `kid`), each also asserting the origin was never reached. `tests/support/access.ts` publishes a real loopback JWKS so the gate is provable through real `workerd`.

**Regression check**: full node suite — 56 failures across 11 files, all in assistant/chat/L1-authoring (REQ-122/126/127/129), **identical on the base branch**. Zero regressions from this change. Three existing ACs (`AC964`, `AC965`, `REQ-115` front) legitimately pinned pre-gate behaviour; their UATs now authenticate and each additionally asserts an unadmitted caller gets 401. Recorded as intent supersession in the ticket body.

## Three things I need from you

1. **The two values.** `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` **ship empty**, so the Worker is closed until you fill them in — correct for a builder not yet in use, but it does mean AC1/AC2 are Cloudflare-side and unproven until the Access application exists. `ACCESS.md` says exactly where both come from.
2. **The identity list.** I recorded `martin-github@westhead.me` (from git config) as sole operator. Is that the address Cloudflare will authenticate as, and is anyone else to be granted?
3. **Local `wrangler dev`.** I deliberately built **no** local bypass — a security control with an off switch isn't one. The cost: `pnpm dev:control` answers 503 until the vars are set, and needs a real token after. The local builder surface (`1c builder` on :8790) is unaffected. Say the word if you'd rather have a documented escape.

<!-- xgd-chat-end -->