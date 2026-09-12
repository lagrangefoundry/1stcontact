---
uid: request-b55eabc7
id: REQ-231
type: request
title: Adopt rolling session credentials — send the rotated cookie, migrate the sessions
  table
created_by: REQ-151
created_at: '2026-09-12T20:12:43.372086+00:00'
updated_at: '2026-09-12T21:14:18.594848+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-e883f22d
  commits:
  - working_sha: 475f47248a9f741ee89deff17ff29837a0c1cd46
    reconcile_sha: null
    main_sha: null
  version: 0.2.178
---

# Adopt rolling session credentials — send the rotated cookie, migrate the sessions table

`@lagrangefoundry/auth-passwordless` now separates the two clocks that used to be
one object (lagrange-framework REQ-151, shipped in 0.0.235). `expires_at` is the
sign-in interval and nothing moves it; the cookie's *value* is a bearer that
rotates underneath a session that is already live.

This is what [[ticket://lagrangefoundry/1stcontact/REQ-187]] asked for, and
adopting it is what makes REQ-187's two constraints stop pulling against each
other: being denied access mid-session is unacceptable for somebody actively
engaged, and re-authenticating by emailed link must stay infrequent. Until now
`sessionTtlMs` chose both with one number and there was no value at which both
were right.

**Nothing upstream lengthens a session.** Rotation carries `subject_id`,
`created_at` and `expires_at` across unchanged. Somebody who visits daily signs
in exactly as often as somebody who visits quarterly. What changes is that the
credential on the wire is worth a rotation cadence rather than a quarter — which
is what makes a *longer* interval affordable.

## The obligation, first, because it is the one that can hurt

With rotation on, `resolveFromCookie` may return a session carrying a
**`setCookie` this deployment is obliged to send**. A host that drops it rotates
the server while the browser goes on presenting the retired id, and everybody is
signed out one grace window (60s) later.

`apps/control-app/src/sessions.ts:446` is where that lands. `sessionIdentity`
calls `resolveFromCookie` and returns `{ sessionId, subjectId, email }` —
**every other field is discarded today**, which is correct for a component that
had nothing else to say and is the exact shape of the failure once it does.

So `SignedIn` has to carry the header out, and `apps/control-app/src/index.ts`
— which calls `sessionIdentity` before falling back to the Access JWT — has to
append it to the response it eventually builds. That is the whole adoption in
one sentence; the rest is schema and configuration.

## What breaks the moment the version is bumped, and why that is good

`tests/test_UAT_FC_REQ-202_passwordless_wiring.test.ts` asserts every statement
in `SCHEMA_STATEMENTS` appears verbatim in `db/migrations/0001_baseline.sql`.
REQ-151 changed the `sessions` CREATE TABLE and added two indexes, so that test
fails as soon as `1c assets` regenerates `src/generated/auth-passwordless.js`
against the new framework. The build refuses to proceed on a forked migration,
loudly, before anything reaches a database — which is the guard working.

`tests/test_UAT_FC_REQ-202_conformance.workers.test.ts` is the second half of
that: the shipped contract gained eight rotation cases and they run against
*this* deployment's binding and migration. A schema that is nearly right fails
there rather than in production.

## Schema — and this deployment does not use the component's migrator

Upstream `applySchema` guards its `ALTER TABLE`s behind `PRAGMA table_info`, so
it is safe to run on every boot. **That code does not run here.** Production
schema is wrangler's migration runner reading `.sql` off disk, so the change has
to be written by hand, and in two places for two different databases:

- **`db/migrations/0001_baseline.sql`** — the `sessions` CREATE TABLE updated to
  the new nine-column shape plus the two new indexes, so a database created from
  scratch (and every test fixture) matches, and the verbatim guard passes.
- **`db/migrations/0002_session_rotation.sql`** — the half that reaches the live
  database, which ran `0001` months ago and will never run it again. It performs
  the backfill that makes an existing session the single-bearer chain it always
  was, so that ending a sign-in is one indexed DELETE on every row rather than on
  some of them:

  ```sql
  UPDATE sessions SET origin_id = id WHERE origin_id IS NULL;
  UPDATE sessions SET issued_at = created_at WHERE issued_at IS NULL;
  ```

### The second migration is a rebuild, not four `ALTER TABLE ADD COLUMN`

**This is a deliberate departure from how the ticket was first written, and the
reason is that the obvious form cannot be deployed.**

Upstream issues exactly those four ALTERs and is safe because it reads
`PRAGMA table_info(sessions)` first and skips the columns already present.
A `.sql` file cannot: SQLite has no `ADD COLUMN IF NOT EXISTS`. So a file of
bare ALTERs is correct for the one database that has the old shape and is a hard
error — `duplicate column name: issued_at` — on **every database created from
the updated baseline**, because `wrangler d1 migrations apply` runs `0001` and
then `0002` on a fresh database too. That is not hypothetical: it is
`wrangler dev`'s local D1, a preview environment, and the next deployment of
this product. A migration set that cannot create a database is a landmine.

So `0002` is the SQLite rebuild idiom `0001`'s own header already names
("create-copy-drop-rename"): rename `sessions` aside, create it from the
component's own verbatim `CREATE TABLE`, copy the five columns **both** shapes
have, run the two backfill UPDATEs, drop the old table, and recreate all four
indexes (the rename took the old ones with it). It converges from either shape
onto one, it runs once per database before that database serves a request, and
it leaves the table created by the same text `0001` creates it with — so a
migrated database and a fresh one do not merely agree about columns, they were
built by the same statement.

Order still matters for the reason it did upstream: the indexes name columns
that do not exist until the table does.

## `purgeExpired` has nowhere to run

There is no `scheduled` handler and no `[triggers]` block in any
`wrangler.toml` in this repository today, so `purgeExpired` is currently called
by nothing. That was survivable when the only dead rows were expired sessions.
It is not once rotation is on: a rotating deployment writes one retired row per
visit per person, and they are reaped on `retiredRetentionMs` (7 days) by that
call and by nothing else. Wire it to a cron.

`purgeExpired` now reports `{ tokens, sessions, retired }`.

## The type declaration is the only thing watching

`src/generated/auth-passwordless.d.ts` says `any` for every export, so the
hand-written `Auth` and `Session` interfaces in `apps/control-app/src/sessions.ts`
are what this repository actually typechecks against. They need the new fields —
`startsVisit`, `setCookie` on the session; `rotateAfterMs`, `visitGapMs`,
`graceMs`, `retiredRetentionMs` on the config — or the wiring will compile
while dropping the header.

## Decisions this deployment has to make

`passwordlessFor` currently documents, deliberately, that **the component's
defaults are not overridden**. Adopting rotation reverses that for at least one
option, so the comment is part of the work rather than an obstacle to it.

- **`rotateAfterMs`** — the opt-in. `null` today. It is the ceiling on how long
  one credential serves a continuously active session; most rotations will fire
  on visit start well before it.
- **`sessionTtlMs`** — 90 days today, and the number REQ-187 actually cares
  about. With rotation on, lengthening it no longer widens the stolen-cookie
  window, because that window is now governed by the rotation cadence. 180 days
  is defensible and halves the emailed links. Two things bound the choice: the
  400-day `Max-Age` cap Chrome and Safari enforce per RFC 6265bis, and the one
  risk that does scale with the interval — a cookie lifted from a device the
  owner never uses again, which rotation cannot detect because there is no
  second party to conflict with.
- **The pre-emption policy, P.** `startsVisit` is true on the first request after
  `visitGapMs` of silence, and the session already reports `expiresAt`. Together
  they let this deployment send somebody to sign in *at the start of a visit*
  when their session ends within P — the one moment re-authentication costs
  nothing, because they have just arrived and have nothing half-finished. Without
  this, the hard boundary still exists and somebody eventually meets it mid-task,
  which is precisely REQ-187's unacceptable case. The component reports and does
  not steer: P, the redirect and the wording are this repository's.
- **Sign-out-everywhere.** `endSessionsForSubject` exists and is wired to
  withdrawal (`setPersonStatus`), but there is no control a person can reach. A
  longer interval makes the abandoned-device cookie the residual risk, and this
  is its mitigation.

## What needs no change

- **`apps/public-site`.** It reads the session cookie by *name* (`readSessionId`)
  to decide cache bypass, and resolves it through one narrow read —
  `SELECT subject_id FROM sessions WHERE id = ? AND expires_at > ?` — only to
  choose which of `account-chrome`'s states to render. A rotated cookie is a
  different opaque value in the same slot, holding the same `subject_id` and the
  same `expires_at`, so that read answers identically before and after a
  rotation. It never sees a retired id, because the browser is holding the
  successor; and a chain ended by replay detection has no rows at all, which
  that query already reads as signed out.
- **Sign-out** at `apps/control-app/src/sign-in.ts:270`. `endSession` now ends
  the whole chain rather than one row, which is what sign-out already meant.
- **`subjectFor` / `primaryEmailOf`** and everything downstream of `SignedIn`.
  `subject_id` is unchanged and opaque.

## Behaviour to pin

- A signed-in request after a period of silence comes back with a `Set-Cookie`
  on the response, and the following request on the new value resolves to the
  same person.
- `expires_at` for a given sign-in is identical before and after any number of
  rotations, read off the database rather than off the return value.
- An existing production-shaped `sessions` row survives the migration, still
  resolves to its subject, and carries `origin_id = id`.
- The shipped conformance suite passes against this deployment's binding and
  migration, rotation cases included.
- Two requests racing across a rotation both leave the browser holding one
  credential.
- A session ends at its original `expires_at` no matter how heavily it was used.

## As built — the decisions this deployment made

### The three numbers

| Constant | Value | Why |
|---|---|---|
| `SESSION_TTL_MS` | **180 days** | The number REQ-187 cares about. Rotation governs the stolen-cookie window now, so lengthening this widens nothing; it halves the emailed links. Well inside the 400-day `Max-Age` cap. |
| `SESSION_ROTATE_AFTER_MS` | **24 hours** | A *ceiling*, not a cadence — most rotations fire on visit start, well before it. It bounds the other case: the tab left open for a fortnight, which never goes quiet long enough to start a visit. A day, because what this trades against is writes: every rotation is an INSERT, an UPDATE and a row the sweep later reaps. |
| `SESSION_PREEMPT_MS` (P) | **14 days** | P is also the fraction of the interval somebody is asked to spend re-authenticating early, so a large P is a shorter interval wearing a different name. Two weeks out of 180 days is ~8%, and a week or more of visits in which the offer can fire before the wall does. |

`visitGapMs`, `graceMs` and `retiredRetentionMs` are left at the component's
defaults. They are its own race and evidence windows and are not this
deployment's to tune; they are declared on the config type so a future change to
them typechecks, and deliberately absent from the literal.

### The obligation is applied at every exit, not at the rotation

`sessionIdentity` now maps **every** field the component offers —
`expiresAt`, `startsVisit` and `setCookie` — rather than three.
`index.ts` takes the header the moment the session resolves, into a variable
declared beside `admission` and for the same reason, and a single
`withRotatedCookie` wraps every exit: the success path, `denied()`, the terms
refusal, `ScopeRefusedError`, `NoBusinessError` and the 503 in the `catch`.

A refusal that dropped the header would be the worse failure, because the
rotation is already written to the database by the time the refusal is decided:
the person refused would be holding an id the server had just retired. It
**appends** rather than sets, because a route may be setting a cookie of its
own, and it rebuilds the response because one returned by `env.ASSETS.fetch` is
immutable.

`PasswordlessConfig` is declared alongside `Auth` and the constructor literal is
built as it. The generated shim says `any` for every export, so
`new PasswordlessAuth(db, { rotateAfterMS: … })` would compile — and a
misspelling there is not a compile error, it is rotation silently staying off.

### Pre-emption fires only on a top-level navigation

`expiringWithinPreemption` (both halves: `startsVisit` **and** the deadline)
answers the question; `index.ts` decides what to do about it. It answers 303 to
`/sign-in`, but only for a GET/HEAD carrying `Sec-Fetch-Mode: navigate`.

A 303 answered to an XHR is HTML where JSON was expected, and to an SSE stream
it is the stream ending — silently, both. The header is asked of the browser
rather than guessed from the path, because a path-shaped guess would have to be
kept in step with the router forever; a client that sends nothing simply does
not get the offer and meets the ordinary expiry it would have met anyway.

**It does not end the session.** The cookie is still live and still theirs; a
person who backs out keeps working, and because the visit just refreshed
`last_seen_at` the next navigation is not intercepted. The offer is once per
visit and the real boundary is still `expires_at` underneath it.

It sits ahead of `admit`, because what it offers is a fresh sign-in — worth
offering to somebody whose admission is about to be re-checked anyway, and
pointless behind a denial it cannot help with.

### The cron

`index.ts` gains a `scheduled` handler whose one job is `purgeSessions`, and
`wrangler.toml` gains `[triggers] crons = ["17 4 * * *"]` — declared in **both**
environments. `triggers` is on wrangler's inheritable list, unlike vars and
bindings, so the repeat is redundant today and is written anyway for this file's
own stated rule: nothing here depends on remembering which keys inherit, and
losing the production half fails silently.

Once a day because the retention window is measured in days; off the hour
because a schedule on the hour shares a platform-wide spike for no benefit to a
job nothing waits on. The three counts go to the invocation log — a deployment
whose `retired` count is flat at zero is one where rotation is not firing, and
nothing else says so. `purgeSessions` returns zeros rather than refusing when
sessions are not configured, so the cron is not a nightly red alarm on a
deployment that has simply not switched sign-in on.

### Sign-out-everywhere is a field, not a second path

`POST /sign-out` with `everywhere=1` in the body (form-encoded, or `true`/`"1"`
in JSON) ends every session the subject holds, via `endSessionsForSubject`.
Without the field it ends this chain exactly as before.

**A field rather than a new route, for an operational reason.** Every sign-in
route runs ahead of the Access gate and therefore needs a Bypass policy
configured by hand in Cloudflare and recorded in `ACCESS.md` — a step nothing in
this repository can perform or verify. A new path would be complete, correct,
and refused at the edge with an Access one-time-PIN page until somebody
remembered. The field inherits the bypass `/sign-out` already has.

The control is in the builder's account dialog, above the footer rather than in
it: it is not a way to close the dialog, it is an act with a consequence on
machines that are not in the room. A `<form method="post">` with a hidden field,
like its neighbour, so it works when script does not. It carries **"Sign out
everywhere"** on the button — the words have to carry the destructiveness on
their own — and a hint beneath, because the reason to press it is not derivable
from its name: it is the answer to a device somebody no longer has, which is the
one risk rotation cannot detect (theft is detected by *conflict*, and an
abandoned laptop has no second party to conflict with).

### Two existing assertions had to be amended

`test_UAT_FC_REQ-190_the_migrations_directory_is_one_baseline` and
`test_UAT_FC_REQ-194_the_baseline_declares_the_account_and_both_edges_of_it`
both asserted the migrations directory contained exactly one file. That was the
same statement as "one baseline" for as long as the deployment held no data —
a schema change was an edit to a file that had never been applied. `sessions`
has rows now, so it is not the same statement any more.

What they protect is kept: REQ-190 now asserts there is exactly one *baseline*,
that it is first, and that the files are contiguously numbered from `0001` — so
the nine-file repair chain cannot come back. REQ-194 now asserts that no
migration other than the baseline touches the account tables, which is the claim
that case was actually making.

## Environment, not code

The shared component store beside the checkout already held 0.0.235. A stale
project-local copy at `1stcontact/node_modules/@lagrangefoundry/auth-passwordless`
was shadowing it — Node resolves the nearest — so `1c assets` had been writing a
shim pointing at the old component. Removing the shadow and re-running
`1c assets` is what bumped the version; every other component already resolved
to the shared store, so this restores the consistent state rather than
introducing one. Nothing tracked changed.

## Behaviour pinned, and where

`tests/test_UAT_FC_REQ-231_rotation.workers.test.ts` — 15 cases driving
`worker.fetch` / `worker.scheduled` inside workerd against real D1:

- a visit after silence answers with a rotated cookie, and the new value
  resolves to the same person; the predecessor is retired and points at it;
- **a refusal still carries the rotated cookie** — the `ScopeRefusedError` path,
  the exit furthest from where the rotation was read;
- an ordinary request inside a visit rotates nothing (a `Set-Cookie` on every
  response would be a write per request);
- `expires_at` and `created_at` are identical across three rotations, read off
  the database, while `issued_at` moves; every bearer shares one `origin_id`;
- a fresh sign-in lasts `SESSION_TTL_MS` (an accidental revert to the
  component's 90 days would otherwise be invisible);
- a visit starting inside P is sent to sign in, still carrying the rotation, and
  the session is **not** ended; a visit with the interval ahead of it is not
  interrupted; a non-navigation is never redirected;
- sign-out-everywhere ends every sign-in the person holds; an ordinary sign-out
  still ends only this browser;
- the cron reaps retired credentials, spares live ones, leaves the person signed
  in, and reports three counts; an unconfigured deployment sweeps nothing rather
  than failing;
- a pre-rotation `sessions` row survives `0002` with `origin_id = id`,
  `issued_at = created_at`, an unmoved `expires_at`, and still resolves;
- **and `0002` applies cleanly to a database the baseline already shaped** —
  the fresh-database case that four bare ALTERs could not survive.

`tests/test_UAT_FC_REQ-231_wiring.test.ts` — 9 cases about files rather than
behaviour, because none of these fails a test elsewhere and every one of them
fails in production weeks later: the `scheduled` export exists, the cron is
declared and agrees in both environments, `0002` contains no
`ALTER TABLE sessions ADD COLUMN`, both migrations declare the *same* `sessions`
DDL, the backfill statements are present, all four indexes are in both files,
the account dialog posts the wider sign-out with the field in the body, and the
field the control sends is the constant the Worker reads.

The shipped conformance suite (`test_UAT_FC_REQ-202_conformance.workers`) covers
the two remaining pinned behaviours — two requests racing a rotation both leave
one credential, and the retired-id grace window — against this deployment's
binding and migration, so they are deliberately not restated.

## Not in scope

- **An idle timeout.** Nothing upstream ends a session for inactivity and
  REQ-187 argues against wanting one.
- **Changing what `admit`, scope or the terms gate consume.** This produces the
  same verified email it always did.
- **Cross-domain sessions.** Customer sites on their own domains still cannot
  read a `.1stcontact.io` cookie, and that remains correct rather than a
  limitation.