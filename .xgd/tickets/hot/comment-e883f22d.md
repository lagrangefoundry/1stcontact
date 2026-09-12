---
uid: comment-e883f22d
id: COMMENT-2875
type: comment
title: Comment on request REQ-231
created_by: xgd
created_at: '2026-09-12T20:48:43.800054+00:00'
updated_at: '2026-09-12T21:36:27.920684+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-b55eabc7
  kind: chat_transcript
---

<!-- xgd-turn id="c48dc1d5-902d-4ba1-b086-afa228d2e137-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T20:48:20.611632+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="c48dc1d5-902d-4ba1-b086-afa228d2e137-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T21:14:56.491601+00:00" -->
#### Claude
Now let me read the wiring tests and index.ts.

Now the index.ts wiring and wrangler.toml.

Now let me look at wrangler.toml, sign-in.ts, and the public-site session reader.

I've read the ticket and the surrounding code. Let me record scope and cut a branch.

Now the version is bumped. Let me confirm the expected failures fire.

Now the second migration.

Now register it with the test fixture's migration list.

Now the `Auth` surface, config type, and `passwordlessFor`.

Now the config type and `passwordlessFor`.

Now `SignedIn`, `sessionIdentity`, the pre-emption predicate, and `purgeSessions`.

Now I'll wire the obligation and the pre-emption into `index.ts`.

Now the `scheduled` handler.

Now the cron trigger in `wrangler.toml`.

Now sign-out-everywhere. Let me look at the `signOut` handler and the route dispatch.

Now the client control for sign-out-everywhere.

Now let me run the existing suites to find regressions before writing new UATs.

Let me write the rotation UATs while that runs.

Now let's run the new rotation UATs.

Now update ACCESS.md for accuracy, then run the full suite.

Let me write the updated ticket body while the suite finishes.

Merged cleanly. Now mark the ticket and clean up.

Done. REQ-231 is at `free_coded`, commit `475f4724`, version `0.2.178`, merged into `xgd-working`.

## What shipped

**The obligation.** `sessionIdentity` now maps every field the component offers — `expiresAt`, `startsVisit`, `setCookie` — rather than three. `index.ts` takes the header the moment the session resolves and a single `withRotatedCookie` wraps **every** exit: the success path, `denied()`, the terms refusal, `ScopeRefusedError`, `NoBusinessError`, and the 503 in the `catch`. A refusal that dropped it would be the worse failure — the rotation is already written by then.

**Schema.** `0001_baseline.sql` carries the nine-column `sessions` and all four indexes. `0002_session_rotation.sql` reaches the live database.

**One deliberate departure from the ticket**, flagged because it reverses an explicit instruction: `0002` is a rename-and-refill rebuild, not four `ALTER TABLE ADD COLUMN`. SQLite has no `ADD COLUMN IF NOT EXISTS`, and `wrangler d1 migrations apply` runs `0001` *and* `0002` on a fresh database — so bare ALTERs are `duplicate column name: issued_at` on every new environment. The rebuild converges from both shapes and leaves the table built by the component's own verbatim `CREATE TABLE`. The two backfill UPDATEs you specified are in it unchanged, and a UAT pins the fresh-database case.

**Numbers chosen:** interval **180 days**, rotation ceiling **24 hours**, pre-emption window P **14 days**. `visitGapMs`/`graceMs`/`retiredRetentionMs` stay at the component's defaults (declared on a new `PasswordlessConfig` type so the constructor literal is actually typechecked — the generated shim is `any`, so a misspelled `rotateAfterMS` would compile and silently leave rotation off).

**Pre-emption** fires only on a GET/HEAD carrying `Sec-Fetch-Mode: navigate`, and ends nothing — a 303 to an XHR is HTML where JSON was expected, silently.

**Sign-out-everywhere** is `everywhere=1` on `POST /sign-out`, not a new path: a new route needs an Access bypass policy configured by hand in Cloudflare that nothing here can verify. Control added to the builder's account dialog.

**Cron:** `scheduled` handler + `[triggers] crons = ["17 4 * * *"]` in both wrangler environments.

## Things you should know

- **The version bump was an environment fix, not a code one.** A stale project-local `1stcontact/node_modules/@lagrangefoundry/auth-passwordless` was shadowing the shared store (which already held 0.0.235), so `1c assets` had been writing a shim pointing at the old component. I removed the shadow — every other component already resolved to the shared store.
- **Two existing assertions had to be amended**: REQ-190's and REQ-194's "the migrations directory is exactly one file". That was the same statement as "one baseline" only while the deployment held no data. They now assert one *baseline*, contiguously numbered files, and that no non-baseline migration touches the account tables.
- **Three pre-existing full-suite failures are unrelated to this diff** and reproduce in isolation: `bug32-webui-scope-rebrand` (names `tests/test_UAT_FC_REQ-228_*` and `tools/generate/src/cli/assets.ts`), `BUG-67 backend settings` (a `gemini` config validator), and `req115-builder-shell` — that last one is the known `dist-assets` staging race, and passes alone.

Full suite otherwise: 3772 passed. The 24 new UATs (15 workers, 9 node) all pass, as does the shipped conformance contract with its rotation cases against this deployment's migration.

<!-- xgd-turn id="883f7351-9836-433c-a6ed-f52076d908e8-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T21:35:20.266411+00:00" -->
#### You
Will existing sessions need to be reestablished?

<!-- xgd-turn id="883f7351-9836-433c-a6ed-f52076d908e8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T21:36:27.847818+00:00" -->
#### Claude
Short answer: **no — existing sessions survive and keep working, with one cohort exception.** Let me verify the deploy ordering before I give you the full picture, since that's where it could go wrong.

No. Existing sessions survive the deploy and keep working — with one cohort that will be *offered* a sign-in earlier than before.

**Why they survive**

The cookie value is the `sessions` primary key, and `0002` carries it across verbatim: rename the table aside, recreate it from the component's own `CREATE TABLE`, copy the five columns both shapes have, backfill `origin_id = id` and `issued_at = created_at`. The browser goes on presenting the same value it always did and it resolves to the same person. `test_UAT_FC_REQ-231_a_pre_rotation_session_survives_and_becomes_its_own_chain` pins exactly that — the row survives, keeps its `expires_at`, and still resolves to its subject and email.

The ordering that makes this safe is already in place: `bin/deploy.d/migrate/10-d1-site-store` applies migrations **before** the Worker is uploaded and aborts the deploy if they fail. That matters more than it did before — a rotating Worker against an unmigrated database is not a degradation but an outage, because `#rotate`'s INSERT names `issued_at` and `origin_id`. The hook is what stops that, and it already worked that way.

On each person's first authenticated request after the deploy, their bearer is older than the 24-hour ceiling, so it rotates once and they get a fresh cookie. That is one extra write per person, not a re-authentication.

**The one exception, and it is the feature rather than a cost**

Existing sessions keep the `expires_at` they were minted with — under the **old 90-day** TTL. `startSession` writes that once and nothing moves it, so the 180-day interval applies only to sign-ins minted from now on. People get the longer interval on their *next* sign-in, not retroactively.

Which means anyone whose session was minted more than ~76 days ago (90 − P) is already inside the 14-day pre-emption window, and will be sent to `/sign-in` at the start of their next visit. That is the deadline being moved to the moment it costs nothing rather than a lockout: it ends nothing, and somebody who backs out keeps working on the same cookie until their real deadline.

So the honest summary is: nobody is signed out by the deploy; a tail of people near the end of their old 90-day window get asked to sign in at the start of a visit somewhat sooner than they otherwise would have, and come out the other side with a 180-day interval.

**Sign-out is unaffected.** The other place that can trigger a rotation is `signOut`, which discards the `setCookie` — correctly, because it then ends the whole chain by `origin_id` and clears the cookie, so the credential it declined to send is deleted along with everything else.

<!-- xgd-chat-end -->