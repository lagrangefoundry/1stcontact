---
uid: comment-d03c760e
id: COMMENT-7788
type: comment
title: Comment on bug BUG-346
created_by: xgd
created_at: '2026-11-04T20:30:19.401291+00:00'
updated_at: '2026-11-04T21:49:35.248588+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-00f418cf
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "fb73b0e7-bb3a-46c3-8393-4e106758c254",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-11-04T20:30:02Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-11-04T20:30:02Z" -->
#### You
bin/deploy --env dev now ends with: dev-worker (port 8786): http://127.0.0.1:8786/builder/main.js answered 401, not the snapshot's builder/main.js.

<!-- xgd-chat role="assistant" ts="2026-11-04T20:30:02Z" -->
#### Claude
All five dev services are running. The 401 is the Access gate refusing an unsigned request (the front's / gives the same 401). BUG-342's freshness check fetches /builder/main.js without credentials, but builder assets are deliberately served only after the gate, so the check can only pass in dev-open mode. It isn't resync damage. Fix: have the check send the dev service token rather than exempting the assets from Access. Hold BUG-342 and add to it, or file a separate bug?

<!-- xgd-chat role="user" ts="2026-11-04T20:30:02Z" -->
#### You
separate bug under EPIC-16 please

<!-- xgd-turn id="3f41eb94-017e-4297-9f95-53ba7f34134a-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T21:09:15.201134+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="3f41eb94-017e-4297-9f95-53ba7f34134a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T21:12:31.146823+00:00" -->
#### Claude
Reading the freshness check and how the deploy resolves Access env, before cutting the branch.

Checking how the gate verifies a service token locally (identity.ts) before deciding which credential the probe should send.

The local worker doesn't exchange service tokens itself; the access-sim does that. Checking what sits in front of 8786 and where the operator's ACCESS_TEAM_DOMAIN points.

I haven't changed anything yet. Before coding I checked the ticket's preferred fix against the gate code, and it won't work, so the approach needs your decision.

**Why sending the service token won't help:** the worker only accepts an Access credential on the operator paths: `/api/admin/*`, `/sign-in/access` and the copy routes (`apps/control-app/src/operator-paths.js:23`). Every other path, `/builder/main.js` included, gets through only with an app session cookie. Without one it answers the 401 "Sign in to continue." (`apps/control-app/src/index.ts:254`). Also, the local worker never reads `CF-Access-Client-Id`/`Secret` itself; only access-sim swaps that pair for a JWT. So whatever credential the probe sends, the gate still refuses it.

Three options that keep `/builder/*` gated:

- **A. The probe signs in like the operator.** It gets a token for the operator's address from access-sim's `/mint`, swaps it for a session at `/sign-in/access` (the recipe already in `ACCESS.md`), then fetches `/builder/main.js` with that cookie. This still compares the actual bytes. The costs: it only works when `ACCESS_TEAM_DOMAIN` points at access-sim (it does in your environment, `http://127.0.0.1:8799`); it writes a session row to the dev database on every deploy; and it needs that account to exist and to have accepted the terms.
- **B. Treat the gate's 401 as "not checked" rather than a failure.** When Access is on and the probe gets the 401, the deploy says so by name: "Access is on, so the served builder bytes were not compared." Wrong bytes, and any other non-200, still fail. The check that each service was started by this deploy still runs. This is simple and honest, but with Access on, which is your normal mode, nothing compares the bytes any more. That comparison is what caught BUG-334.
- **C. A + B:** try A, and fall back to B's named message when signing in isn't possible, for example when `ACCESS_TEAM_DOMAIN` is a real team domain or the account doesn't exist.

**I recommend C.** In your setup it keeps the byte comparison, and everywhere else it fails honestly instead of falsely. If you'd rather not have the deploy write a session row, B is the minimal fix.

Which do you want? I'll update the ticket's Fix and Test plan to match before I cut the branch.

<!-- xgd-turn id="c007398b-9767-4a81-942d-87e594b64cb6-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T21:39:52.957097+00:00" -->
#### You
C

<!-- xgd-turn id="c007398b-9767-4a81-942d-87e594b64cb6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T21:49:34.547265+00:00" -->
#### Claude
Updating the ticket to option C first, then cutting the branch. Reading the sim's `/mint` and `/sign-in/access` contracts so the ticket text is accurate.

Design settled; checking one more gate (terms) that could refuse the signed-in probe.

Now updating the ticket body (Fix and Test plan rewritten for option C, the other sections kept).

Implementing in the branch worktree now. Checking it's runnable first.

Now the code change in `dev.ts`.

Now the devRefresh body.

Now isolating the existing BUG-342/BUG-307 callers from the real secrets file, and writing the BUG-346 UATs.

Running the new UATs and the BUG-342/BUG-307 regression suites.

Two harness issues, not the code: the suites race each other for ports 8700–8709 when run in parallel, and the fresh worktree lacks `apps/control-app/src/generated`. Fixing both.

Checking whether this BUG-307 failure predates my change (baseline on the unchanged code).

That BUG-307 test fails on the baseline too, so the failure predates my change. A quick look at why, so I can report it:

The failure is the `front` stand-in, which never reaches the probe, so it's unrelated. Running typecheck and lint.

Against the live dev worker the sequence matches the code: mint, then a 303 with a session cookie, then a 200 whose bytes are identical to the snapshot's. Now commit, merge and promote.

Committed. Now the merge-back and promotion loop.

Last step: adding implementation notes to the ticket body.

I've implemented option C. With Access on, the dev deploy's check now signs in the way you do, then compares the builder bytes with the snapshot. When it can't sign in, it says so by name instead of reporting a failure. BUG-346 is at `free_coded`, merged into xgd-working (commits `1ffbe44c43` and `152107fb17`, version 0.2.764).

**How the check behaves now:**
- **Dev-open mode:** no change; it fetches without signing in.
- **Access on, pointed at access-sim:** it gets a token from access-sim for the address `SERVICE_TOKEN_IDENTITIES` maps to (or the first `PLATFORM_ADMINS` entry), swaps it for a session at the worker's `/sign-in/access`, and fetches `/builder/main.js` with that cookie. This writes one session row to the dev database per deploy.
- **Sign-in not possible:** if Access isn't a local simulator, there's no address to use, no session is issued, or the gate still refuses after sign-in (for example, terms not accepted), the deploy still reports success. It adds a line saying the bytes were NOT compared, with the reason.
- **Still failures:** wrong bytes ("serving an older build"), and any other non-200 response.

**Verification:**
- **Live check:** I ran the same sequence by hand against your running dev worker: the sign-in returned a session cookie, and `/builder/main.js` came back 200 and byte-identical to the snapshot. I haven't run `bin/deploy --env dev` itself with the new code.
- **Tests:** the 5 new tests and the BUG-342 suite pass.
- **One pre-existing failure:** a BUG-307 test (`deploy_restarts_what_serves_the_snapshot`) fails with or without this change. The service it trips on is never byte-checked, so it's unrelated.
- **Typecheck:** clean for the changed files; it reports two errors in `material-import.ts` and `zip-reader.ts`, which I didn't touch.

I also changed the existing BUG-342 and BUG-307 suites to declare dev-open mode explicitly. Without that, they would read your real secrets file and switch on the Access path. Their assertions are unchanged.

The ticket body records the final design. Running `bin/deploy --env dev` should now end with "Dev is up". Promoting to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->