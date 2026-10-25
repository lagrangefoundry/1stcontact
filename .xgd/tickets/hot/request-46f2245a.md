---
uid: request-46f2245a
id: REQ-187
type: request
title: Session renewal and mid-session denial — the start of a conversation
created_by: xgd
created_at: '2026-09-05T19:26:36.232349+00:00'
updated_at: '2026-09-12T21:40:19.944157+00:00'
completed_at: null
last_field_updated: body
status: legacy_done
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-44a1d9ad
---

# Session renewal and mid-session denial — the start of a conversation

**This ticket is a conversation, not a specification.** Nothing here is decided.
It exists so the question has a home and does not get answered by accident inside
a bug fix. [[BUG-52]] covers what a *reload* does with a lapsed session and is
deliberately narrow; this is the question of why a session lapsed under someone
who was working.

## The requirement, as stated

Being denied access mid-session is not acceptable for a person who is actively
engaged. Re-login by email is significant friction and must be infrequent.

Both are product constraints rather than security preferences, and they pull
against the instinct that a shorter session is always safer. The purpose of the
conversation is to find where the line actually sits for this product and this
customer.

## One fact that reframes it

`admit` runs on **every request**. `users.status`, membership and entitlement are
re-read per call, so revocation from the Users tab is already immediate and does
**not** depend on the Access session being short.

This matters more than it first sounds. The usual argument for short sessions is
bounding the damage of a stolen cookie — and here that damage is already bounded
by a control we hold and have exercised. Session length and revocation latency
are coupled in most systems and are not coupled in this one.

## Two dials, and they are not equally important

**Session duration** is a Cloudflare Access application setting — thirty minutes
to a month, or tied to the identity provider's own session. It lives in the
Cloudflare dashboard rather than this repository; `apps/control-app/ACCESS.md`
is where such settings are recorded.

**Which identity provider** is the larger lever, and probably the whole answer.
One-time-PIN email is the highest-friction option available: every re-auth is a
code, in a mailbox, retyped. A conventional IdP makes re-auth a *silent
redirect* — the IdP session is long-lived and the person sees a flicker rather
than a login. For the modal customer, a tradesperson on a phone, "check your
email for a code" every few days is the shape of thing that loses accounts.

## Initial thoughts, offered to be argued with

- **A long Access session plus a real IdP**, keeping one-time PIN only as the
  fallback for someone with no other identity. This is where I would start.
- **Step up on destructive actions rather than shortening the session.** Erasure
  ([[DOC-37]]), billing changes, transferring or deleting a business. Re-auth
  where it is rare and consequential is better security than a short global
  session and costs almost nothing in friction.
- **Renewal before expiry, not recovery after it.** If the client knows roughly
  when the session ends it can prompt — or silently probe — while the person is
  still working, rather than discovering it at the moment of a save. This is the
  part with real design content, and the part most likely to be got wrong.
- **Decide what "actively engaged" means.** Keystrokes, an open chat turn, an
  unsaved draft? The requirement above depends on a definition nobody has written
  down, and an idle tab held open for a week is not the same as a person typing.

## Questions this needs answers to

- What is the Access application's session duration today, and what should it be?
- Is a conventional IdP acceptable for the customer base, or is email the only
  identity they reliably have?
- Which actions deserve step-up, if any?
- What happens to unsaved builder state across a renewal — does the design
  guarantee it survives, or merely try?
- Does the recursion apply? Level-2 members reach a portal on the customer's own
  site ([[DOC-42]] §1), which is not behind our Access application at all. A
  session policy that only describes level 1 answers half the product.

## Not in scope here

The client's behaviour when a session has *already* lapsed — that is [[BUG-52]]
and should land first, because a session will expire eventually under any policy
this conversation arrives at.


---

## Where the conversation got to (2026-09-11)

A proposal, not a decision — this ticket stays a conversation. It answers the two
questions the sections above leave open ("renewal before expiry, not recovery
after it" and "decide what *actively engaged* means") and it does so without
shortening anything.

### Only one of the two credentials is ours to renew

| Credential | Minted by | Renewable by us |
|---|---|---|
| Our passwordless session cookie (`sessions.ts` → `@lagrangefoundry/auth-passwordless`) | us | **yes** |
| The Cloudflare Access JWT on `app.1stcontact.io` | Cloudflare | **no** |

The Access one is out of reach on principle rather than on effort: the edge
challenges a request *before* the Worker runs, so there is no code path of ours
that could mint a replacement for it. Mid-session denial on the **operator**
surface therefore remains exactly what this ticket already says it is — session
duration plus the identity provider — and everything below is about the customer.

### The separation that makes both requirements satisfiable at once

Today `expires_at` is both *when this person must sign in again* and *how long
this cookie is worth stealing*. One number, two unrelated jobs, no value at which
both are right. Split them:

- **`expires_at` is the sign-in interval, and it never moves.** Set once at
  sign-in to `created_at + I1`. No activity extends it. One emailed link per I1.
- **The cookie value is a bearer, and it rotates while the person is active.** A
  rotation mints a fresh session id, carries `created_at` and `expires_at` across
  unchanged, retires the id it replaces, and sets a new cookie. It extends no
  lifetime and grants no new access.

This is not a longer session. The credential goes from being live for the whole
interval to being live for one rotation cadence.

### What rotation buys

A retired id presented after its grace window is **proof two parties hold the same
credential** — the only mechanism available here that *detects* a stolen cookie
rather than waiting one out. On detection: end every session descended from that
sign-in. It does not bound theft on its own; a thief who lifts a dormant cookie
becomes the holder. It catches the overlap, which is the ordinary case, and it is
what pays for an I1 measured in months.

The grace window is not optional. The builder fires parallel requests; two in
flight across a rotation would otherwise race each other out of the session —
manufacturing the exact mid-session denial this ticket exists to remove.

### A visit, and the two things that happen at the start of one

`last_seen_at` is written today and **read by nothing**. Give it a reader: a
request arriving after at least N minutes of silence is **the start of a visit**.

- **Rotate there** — one write per visit rather than per request, with a ceiling
  so a long single visit still rolls.
- **Pre-empt the wall there.** An `expires_at` that never moves leaves one hard
  boundary per interval. If a visit is starting *and* the session ends within P,
  send the person to sign in **now** — the one moment re-authentication is nearly
  free, because they have just arrived and have nothing unsaved in front of them.

The wall then becomes unreachable mid-task: crossing it while working would take a
single continuous visit longer than P, and anyone who does not visit during the
final P meets their re-auth on arrival, which is not mid-session either.

**N is not a kill timer.** Nothing here ends a session for inactivity. N's only
job is to say when a visit began, which is the moment re-auth costs nothing —
which is the answer to "decide what *actively engaged* means" above.

### Numbers, and the ceiling nobody chose

| | | |
|---|---|---|
| **I1** | 365 days | The sign-in interval. |
| **P** | 14 days | Pre-emption window — several natural visits' worth of chances. |
| **N** | 30 minutes | The gap that starts a visit. |
| **R** | 24h of activity | Rotation ceiling within one long visit. |
| **G** | 60 seconds | Grace on a retired id. |

**I1 cannot exceed 400 days whatever we decide.** Chrome and Safari cap cookie
`Max-Age` at 400 days per RFC 6265bis, so a longer interval is silently truncated
by the browser rather than honoured. This is the constraint that settles the
question rather than an opinion about it.

### What this design does not remove

- **A year-long session on a device is a year-long session on a device.**
  Revocation stays immediate — `admit` runs per request — but that is an
  *operator* act. `endSessionsForSubject` exists in the component and is reached
  only from `setPersonStatus`; nothing offers "sign out everywhere" to the person
  themselves. At I1 = a year that stops being a nicety.
- **A 401 can still arrive mid-task**, from replay detection or from an operator
  withdrawing somebody, even though a *scheduled* re-auth cannot. The client must
  still preserve state, re-authenticate and retry rather than navigate away —
  [[BUG-52]], unchanged and still first.
- **The recursion is still unanswered.** Level-2 members on the customer's own
  site ([[DOC-42]] §1) are not behind our Access application; this design covers
  them only insofar as they hold one of our session cookies.

### Where the work lives

Almost none of it is in this repository. `resolveSession` in
`@lagrangefoundry/auth-passwordless` is the single place all of these clocks are
read and written, and `sessions.ts` deliberately overrides none of the component's
defaults today. Raised as **[[ticket://lagrangefoundry/lagrange-framework/REQ-151]]**,
which carries the component-side behaviour, the schema change it needs and the
`applySchema` idempotency problem that comes with it.

What stays here is the host's policy: the value of I1 and P, the redirect at visit
start, and passing the configuration through `passwordlessFor`.


---

## Closed — the design was adopted (2026-09-12)

Answered, and by something that shipped rather than by a decision recorded here.
`@lagrangefoundry/auth-passwordless` separated the two clocks
([[ticket://lagrangefoundry/lagrange-framework/REQ-151]], in 0.0.235), and
**[[REQ-231]]** adopts it in this deployment: the rotated `setCookie` is carried
out through `SignedIn` and onto the response, the `sessions` table is migrated,
and the three numbers this ticket left open — `sessionTtlMs`, `rotateAfterMs` and
the pre-emption window P — are chosen there.

The two gaps this ticket flagged as residual are carried into REQ-231 rather than
dropped: **sign-out-everywhere** as a control a person can actually reach, which a
longer interval turns from a nicety into the mitigation for the abandoned-device
cookie; and the pre-emption at visit start, without which the hard boundary still
exists and somebody eventually meets it mid-task — which is this ticket's
unacceptable case, stated in its own words.

This ticket was a conversation and never held code. It closes `legacy_done`
because what it was for — finding where the line sits between *never denied
mid-session* and *rarely made to sign in* — was settled, not abandoned. The answer
was that the two were never opposed; they only looked that way while one number
was doing both jobs.

[[BUG-52]] is unaffected and still stands on its own: a 401 can still arrive
mid-task from replay detection or from an operator withdrawing somebody, and the
client must preserve state and retry rather than navigate away. Rotation removes
the *scheduled* denial, not every denial.
