---
uid: request-b55eabc7
id: REQ-231
type: request
title: Adopt rolling session credentials — send the rotated cookie, migrate the sessions
  table
created_by: REQ-151
created_at: '2026-09-12T20:12:43.372086+00:00'
updated_at: '2026-09-12T20:12:43.372086+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
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
schema is wrangler's migration runner reading `.sql` off disk, so the ALTERs
have to be written by hand, and in two places for two different databases:

- **`db/migrations/0001_baseline.sql`** — the `sessions` CREATE TABLE updated to
  the new nine-column shape plus the two new indexes, so a database created from
  scratch (and every test fixture) matches, and the verbatim guard passes.
- **A new numbered migration** — four `ALTER TABLE sessions ADD COLUMN`
  (`issued_at`, `origin_id`, `superseded_by`, `retired_at`), the two
  `CREATE INDEX` statements, and the backfill:

  ```sql
  UPDATE sessions SET origin_id = id WHERE origin_id IS NULL;
  UPDATE sessions SET issued_at = created_at WHERE issued_at IS NULL;
  ```

  Editing the baseline alone is not enough: the live database has already run
  0001 and will never run it again. The backfill is what makes an existing
  session the single-bearer chain it always was, so that ending a sign-in is one
  indexed DELETE on every row rather than on some of them.

Order matters in the new migration for the same reason it did upstream: the
indexes name columns that do not exist until the ALTERs have run.

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

- **`apps/public-site`.** It reads the session cookie by *name* only —
  `readSessionId` — to decide cache bypass and which `account-chrome` state to
  render, and never resolves it. A rotated cookie is a different opaque value in
  the same slot, which is exactly what that code already tolerates.
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

## Not in scope

- **An idle timeout.** Nothing upstream ends a session for inactivity and
  REQ-187 argues against wanting one.
- **Changing what `admit`, scope or the terms gate consume.** This produces the
  same verified email it always did.
- **Cross-domain sessions.** Customer sites on their own domains still cannot
  read a `.1stcontact.io` cookie, and that remains correct rather than a
  limitation.
