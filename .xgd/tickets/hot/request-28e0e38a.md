---
uid: request-28e0e38a
id: REQ-230
type: request
title: Rolling session credentials — rotate the bearer, hold the sign-in interval
  still
created_by: REQ-187
created_at: '2026-09-12T00:44:56.589576+00:00'
updated_at: '2026-09-12T00:44:56.589576+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
---

# Rolling session credentials — rotate the bearer, hold the sign-in interval still

`@lagrangefoundry/auth-passwordless` gives a host one session clock and one bearer
token, and they are the same object. `startSession` writes
`expires_at = now + sessionTtlMs`, nothing ever moves it, and the cookie carries
that one session id for the whole span. So a host choosing `sessionTtlMs` is
choosing two unrelated things with one number: **how long a stolen cookie stays
useful**, and **how often a person is made to sign in again**. Shortening one
shortens the other, and there is no value at which both are right.

Requested by [[ticket://lagrangefoundry/1stcontact/REQ-187]], where the product
constraint is stated plainly and pulls both ways at once: being denied access
mid-session is unacceptable for somebody actively engaged, and re-authenticating
by emailed link is significant friction that must stay infrequent.

## The separation

Split the two clocks the `sessions` row already almost has.

**`expires_at` is the sign-in interval, and it never moves.** Set once at
`startSession` to `created_at + sessionTtlMs`. No activity extends it, no renewal
touches it, and there is no code path that writes it twice. A host that sets it to
a year gets exactly one emailed link per person per year, which is the whole of
what "infrequent" can be made to mean.

**The cookie value is a bearer, and it rotates.** A rotation mints a fresh session
id, carries `subject_id`, `created_at` and `expires_at` across unchanged, retires
the id it replaces, and hands the host a new `Set-Cookie`. It extends no lifetime,
grants no new access, and resets no clock. It replaces the credential underneath a
session that is already live.

Nothing here lengthens a session. That is worth saying twice, because the feature
reads like a session extension and is the opposite of one: today's credential is
live for the entire sign-in interval, and after this it is live for the rotation
cadence.

## What rotation is actually for

**A retired session id presented after its grace window is proof that two parties
hold the same credential.** That is the only mechanism in this component that can
*detect* a stolen cookie rather than wait one out. On detection, end every session
descended from the same original sign-in and let the person sign in again.

It does not bound theft by itself, and the ticket should not claim it does: a
thief who lifts a dormant cookie and uses it simply becomes the holder, and the
owner's next visit is what exposes them. What rotation catches is **overlap** —
two parties using one credential — which is the ordinary shape of the theft.

## The grace window is not optional

A host's client fires requests in parallel. Two in flight across a rotation race
each other: one writes a cookie the other has already superseded, and the loser's
next request presents an id that no longer exists. **That is exactly the
mid-session denial this work exists to remove, manufactured by the fix for it.**

So a retired id resolves to its successor for `graceMs` and is treated as replay
only after that. The window belongs to the component and not to the host, because
the race is inside the component's own write and a host has no way to see it.

## Visits — and the two things that want to happen at the start of one

`last_seen_at` is written today at `touchAfterMs` and **read by nothing**. Give it
a reader.

A request arriving after at least `visitGapMs` of silence is **the start of a
visit**. `resolveSession` reports that as a field on the session it returns — a
fact, not a callback — and two things hang off it, both cheap because visits are
rare where requests are not:

- **Rotate there.** One write per visit rather than one per request, with
  `rotateAfterMs` as a ceiling so a single long visit still rolls.
- **Let the host pre-empt the wall.** An `expires_at` that never moves means there
  is a hard boundary once per interval, and the entire point of this design is
  that nobody meets it mid-task. A host that can see *this visit is starting, and
  this session ends within P* can send the person to sign in **now** — at the one
  moment re-authentication costs nothing, because they have just arrived and have
  no unsaved work in front of them.

The component decides neither P nor what to do about it. It reports `startsVisit`
and it already returns `expiresAt`; the host's policy is the host's.

**`touchAfterMs` must be shorter than `visitGapMs`.** A `last_seen_at` written
hourly cannot evidence a thirty-minute silence, so a configuration where it is not
shorter reports no visit ever — silently, and in a way whose only symptom is a
feature that quietly does nothing. Refuse it at construction.

## Rotation must be opt-in, and not for timidity

`resolveSession` and `resolveFromCookie` return a session today. With rotation on
they may also return a **`Set-Cookie` the host is obliged to send**, and a host
that ignores it rotates the server while the browser keeps presenting the retired
id — signing its users out on a grace-window timer. Every existing caller ignores
it, because today there is nothing to ignore.

So `rotateAfterMs` defaults to `null`, meaning no rotation, and the return shape
is unchanged until a host asks for it. Opting in is the host saying *I send the
cookie you hand me*, which is a promise the component cannot make on its behalf.

## Configuration

| Option | Default | What it is |
|---|---|---|
| `sessionTtlMs` | 90 days (unchanged) | The sign-in interval. Now unambiguously that and nothing else. |
| `rotateAfterMs` | `null` | Ceiling on how long one bearer serves a continuously active session. `null` disables rotation and every behaviour below it. |
| `visitGapMs` | 30 minutes | Silence after which the next request starts a new visit. |
| `graceMs` | 60 seconds | How long a retired id still resolves to its successor. |
| `touchAfterMs` | 1 hour (unchanged) | Must be `< visitGapMs` when rotation is on. |

## Schema, and the migration it needs

Two columns on `sessions`, and they are what make the two new behaviours possible
rather than convenient:

- **`superseded_by`** and **`retired_at`** — a rotated row is kept, not deleted,
  pointing at its successor. Inside `graceMs` it resolves through; after it, the
  same row is the replay evidence.
- **`origin_id`** — the id of the first session in the chain, so *end everything
  descended from this sign-in* is one indexed `DELETE` and does not require
  walking a linked list of retirements.

`SCHEMA_STATEMENTS` is `CREATE ... IF NOT EXISTS` throughout and is idempotent
because of it. **`ALTER TABLE ADD COLUMN` is not** — SQLite errors when the column
is already there, so a second `applySchema` against a migrated database would
throw where today it is a no-op. Whatever shape the migration takes, `applySchema`
has to stay safe to run twice; that property is load-bearing for every host that
calls it on boot.

`purgeExpired` must also reap retired rows, or a rotating deployment accumulates
one dead row per visit per person forever.

## Behaviour to pin

- A session's `expires_at` is identical before and after any number of rotations.
- A rotation returns a new id and a `Set-Cookie` carrying it; the old id resolves
  to the *same subject and same expiry* for `graceMs`.
- A retired id presented after `graceMs` resolves to nothing **and** ends every
  session sharing its `origin_id`.
- With `rotateAfterMs: null` the component behaves exactly as it does today,
  including the shape of what `resolveSession` returns.
- `startsVisit` is true on the first request after `visitGapMs` of silence and
  false on the requests that follow it within the gap.
- A construction with `touchAfterMs >= visitGapMs` and rotation on is refused.
- `applySchema` is safe to run against a fresh database and against one already
  carrying the new columns.

## Not in scope

- **An idle timeout.** Nothing here ends a session for inactivity; `expires_at` is
  the only thing that ends one. A host wanting an idle death can have it later,
  and [[ticket://lagrangefoundry/1stcontact/REQ-187]] argues it should not want one.
- **The host's pre-emption policy** — the value of P, the redirect, the wording.
  The component reports; it does not steer.
- **Cookie `Max-Age` ceilings.** Worth knowing while choosing `sessionTtlMs`, and
  not the component's to enforce: Chrome and Safari cap `Max-Age` at **400 days**
  per RFC 6265bis, so a host asking for longer silently gets 400.
