---
uid: comment-44a1d9ad
id: COMMENT-2844
type: comment
title: Comment on request REQ-187
created_by: xgd
created_at: '2026-09-12T00:21:09.732212+00:00'
updated_at: '2026-09-12T00:56:17.136491+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-46f2245a
  kind: chat_transcript
---

<!-- xgd-turn id="113a5ae9-b98f-494a-8942-1dc614f97f3e-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T00:20:53.304172+00:00" -->
#### You
Let's talk about this ticket. It is important that our tokens expire. However it is a poor user experience for a token to expire during an active session. If a user is actively using the site when a token comes up for expiry, is it possible for us to mint a short term replacement, and keep minting short term replacement until the user session is over. Let's define a user session as being over as being N minutes of in activity. Where N is let's say 30 minutes

<!-- xgd-turn id="113a5ae9-b98f-494a-8942-1dc614f97f3e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T00:25:03.492775+00:00" -->
#### Claude
Read the ticket and the actual auth code. Here's what's true today and what your proposal runs into.

## We mint one of the two credentials, not both

| Credential | Who mints it | Can we renew it? |
|---|---|---|
| Our passwordless session cookie (`sessions.ts` → `@lagrangefoundry/auth-passwordless`) | us | **Yes** — entirely ours |
| Cloudflare Access JWT on `app.1stcontact.io` | Cloudflare | **No** |

The Access one is unreachable for this: the edge challenges the request *before* the Worker runs, so there is no code path of ours that could mint a replacement. Mid-session denial on the operator surface stays what the ticket already says it is — a session-duration setting plus the IdP choice. Everything below is about our own sessions, which is where the customer actually lives.

## What exists today

`passwordless.js` has three timestamps on a session: `created_at`, `expires_at`, `last_seen_at`. Only the second is enforced.

- **90-day absolute TTL**, set at `startSession` and never touched again.
- `last_seen_at` is refreshed lazily (`touchAfterMs`, 1 hour) **and nothing reads it.** It's a write with no reader.
- No renewal, no rotation, no idle timeout.

So today the answer to "what happens at expiry" is: it lapses at 90 days flat, whatever the person is doing. Your instinct is right that this is the wrong shape — but note which direction the fix goes: **the proposal makes our sessions shorter, not longer.** Right now a cookie copied off a machine is live for a quarter regardless of whether anyone uses it.

## Your proposal is three clocks, and they should be named separately

1. **Credential lifetime** — how long one minted cookie is good for. Short.
2. **Idle window (your N)** — no activity for N ⇒ session over, re-authenticate by email.
3. **Absolute cap** — a ceiling regardless of activity. Without one, sliding renewal is an immortal session: someone who visits weekly forever never signs in again. That may be what we want; it should be chosen, not fallen into.

## The uncomfortable part

**A sliding window does not bound cookie theft.** The thief is active, so the window slides for them exactly as it does for the owner. What it genuinely kills is the *abandoned* credential — an old phone, a shared machine, a cookie in a backup. That's a real win and a narrower one than it first looks.

The security payoff you're reaching for comes from **rotation**, not from the short TTL. Two shapes:

- **Extend `expires_at` in place** — one UPDATE, trivial. The cookie value never changes, so a stolen cookie stays good indefinitely while it's used.
- **Mint a new session row and a new cookie, retire the old** — now a request presenting a retired id is a detectable replay, which is the only way we'd ever *learn* a cookie was stolen. Costs a grace window, because the builder fires parallel requests and two in flight would otherwise race each other out of a session.

Only the second buys anything security-wise. It's the one worth building.

## N = 30 minutes is wrong for this product

The ticket's own reframing is the argument: `admit` runs on every request, so revocation is already immediate and does *not* depend on session length. The usual reason to keep sessions short is already paid for by a control we hold.

Against that, 30 minutes means a tradesperson who opens their site between two jobs is re-typing a code from their mailbox most times they come back. That is precisely the friction the ticket says must be infrequent, and it lands hardest on the customer portal — the surface with the least privilege and the least technical user. 30 minutes is an operator-console number; it belongs on the builder if anywhere, and the builder already sits behind Access.

What I'd suggest instead:

- **Credential lifetime: hours** (say 12–24), rotated on renewal.
- **Idle window: days, not minutes** — 7 is defensible; it is still a hard reduction from 90 days of absolute liveness.
- **Absolute cap: keep 90 days.** Signing in quarterly is the promise the component already makes.
- **Step-up re-auth on the consequential acts** rather than a short global session — the ticket already proposes this and it's the better trade.

## One trap that will bite whatever N we pick

`src/builder/api.js` opens an `EventSource` on `/api/material/changes`, and `EventSource` reconnects by itself. **An open tab makes requests forever with nobody at the keyboard.** If "activity" means "a request arrived", the idle window never closes on exactly the case it exists for — the builder left open on an unlocked laptop. So activity has to be defined as something narrower than traffic: either background streams are excluded from the touch, or the client signals genuine interaction. The ticket flags "decide what actively engaged means" as an open question; this is the concrete form of it, and it has to be answered before the number matters.

## Where it would be built

`resolveSession` in `passwordless.js` is the single place all three clocks live — it already reads `expires_at`, already writes `last_seen_at`, and already runs on every authenticated request. That's the component's file, not ours, so this is upstream work in `lagrange-framework` with the numbers passed as config from `passwordlessFor` in `sessions.ts`. The component already takes `sessionTtlMs` and `touchAfterMs`; it would gain an idle window and a rotation mode.

---

Shall I write this up into the ticket body as a section — the three clocks, the rotation-vs-extend choice, the recommended numbers, and the SSE activity trap as a blocking question? I'd keep your 30-minute proposal in it as the stated starting position with my counter-argument next to it, rather than quietly replacing it.

<!-- xgd-turn id="b5f5bd24-9ce6-429e-8969-71307ef7546b-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T00:38:21.897950+00:00" -->
#### You
I never said extend the cookie, I said mint a short term extension.

Look sign in is friction we want to minimize whilst keeping appropriate levels of security.

You did not understand or respond to the actually mechanism I proposed. You argued against things I never suggested. But you understand more about token security than I do so let me pose it as a question rather than a solution. Here are my goals:

1) Users should not have to resign in frequently - lets call this interval I1 - I1 needs to be >24h but <3 years
2) Users should not be signed out mid-session - if the user is actively using the site their access should be extended (not using your idea of extending the token lifetime!) Perhaps we preempt this situation by forcing resign-in on first use near token expiry

<!-- xgd-turn id="b5f5bd24-9ce6-429e-8969-71307ef7546b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T00:40:08.001661+00:00" -->
#### Claude
You're right — you said mint a replacement, and I presented "extend in place" as though it were on the table. It isn't; rotation is what you described. Dropping it.

Here's the design your two goals actually imply.

## The load-bearing move: separate the clock from the bearer

Two things are conflated in the current code, and the whole answer is pulling them apart:

- **`expires_at`** — when this person must genuinely sign in again. This is your I1.
- **the cookie value** — the bearer token proving they already did.

Today those are one thing, which is why a short credential and an infrequent sign-in look like opposites. They aren't.

**`expires_at` is set once at sign-in and never moved.** `created_at + I1`. That is goal 1, exactly and by construction — one email link per I1, no more.

**The cookie value rotates** while the person is active. A rotation mints a fresh session id, carries `created_at`/`expires_at` forward unchanged, retires the old id, and sets the new cookie. It extends nothing. It replaces the bearer.

So the renewal is continuous, the sign-in interval is fixed, and neither constrains the other.

## Your pre-emption idea is the part that makes it work

`expires_at` never moving means there *is* a hard wall once per I1, and goal 2 says nobody may hit it mid-task. Your answer is the right one, and it gives your 30 minutes a real job:

> force re-sign-in on first use near token expiry

Concretely: a request arriving after ≥ N minutes of silence is **the start of a visit**. At that moment — and only at that moment — check whether `expires_at - now < P`. If so, send them to sign-in *now*.

This is cheap precisely because of when it fires. Someone who just opened the tab has no unsaved chat turn, no half-edited page, nothing in flight. They sign in a week or two early, at the moment it costs least, and walk away with a fresh I1.

And the wall becomes unreachable mid-session: the only way to cross `expires_at` while working is a single continuous visit longer than P. With P measured in days, no human does that. Anyone who *doesn't* visit during the final P gets their re-auth on arrival — which is not mid-session either.

So N is not a kill timer. It's the definition of "a visit just started", which is the one moment re-auth is free.

## Same trigger, second use

Rotate at visit start too. One concept, two jobs, and it puts the write cost at one per visit rather than one per request. Cap it with a ceiling — rotate at visit start, or after R hours of continuous activity, whichever comes first — so a marathon session still rolls.

## What rotation buys, and it's the honest answer to "appropriate security"

A retired session id presented after its grace window is **proof two parties hold the credential**. That is the only mechanism in any of this that can actually *detect* a stolen cookie rather than hope it expires. Response: kill every session in the family and force a real sign-in.

That detection is what pays for a long I1. Note what it does *not* do: it doesn't bound theft on its own — a thief who steals and uses the cookie while the owner is dormant just becomes the owner. It catches the overlap, which is the common case.

The grace window is not optional. The builder fires parallel requests; two in flight across a rotation would otherwise race each other out of the session and you'd have manufactured the exact mid-session denial this ticket exists to prevent. Retired ids resolve to their successor for ~60s, then become replay evidence.

## Numbers

**I1 has a ceiling you didn't know about: Chrome and Safari cap cookie `Max-Age` at 400 days** (RFC 6265bis). Your "<3 years" isn't reachable through a cookie at all — the browser silently truncates it. So:

| | |
|---|---|
| **I1** | **365 days.** Inside the cap with room, and makes signing in an annual act. |
| **P** (pre-empt window) | 14 days — several natural visits' worth of chances to catch someone early. |
| **N** (visit gap) | your 30 minutes, unchanged. |
| **R** (rotation ceiling) | 24h of continuous activity. |
| **G** (grace) | 60s. |

One implementation consequence: `last_seen_at` is currently written lazily at `touchAfterMs` = 1 hour and **read by nothing**. To detect a 30-minute gap it has to be fresher than the gap — say 5 minutes. That's a write per 5 min per active session instead of per hour. On D1 at our volume that's noise, but it's a real change and it's what finally gives that column a reader.

## What I'd flag before building

- **A year-long session on a device is a year-long session on a device.** Revocation is immediate (`admit` runs per request), but that's an operator action. `endSessionsForSubject` exists in the component and is only ever called from `setPersonStatus` — nothing exposes "sign out everywhere" to the person themselves. With I1 at a year, that stops being a nice-to-have.
- **A 401 can still arrive mid-task** from replay-kill or operator revocation, even though scheduled re-auth can't. The client still needs to preserve state and retry rather than navigate away — that's BUG-52, and this design doesn't remove the need for it.
- **The operator surface is unaffected.** Access mints its own JWT and challenges before our Worker runs; none of this reaches it. Still session-duration plus IdP choice.
- **This is component work.** `resolveSession` in `@lagrangefoundry/auth-passwordless` is where all of it lands — upstream in `lagrange-framework`, with the numbers passed as config from `passwordlessFor`. `sessions.ts` currently overrides none of the component's defaults deliberately.

Want me to write this into REQ-187 as a proposed design section — the clock/bearer split, pre-emption at visit start, the numbers with the 400-day constraint, and the three flags as open questions? It's still a conversation ticket, so I'd record it as a proposal rather than a decision.

<!-- xgd-turn id="823732d3-734e-4714-9813-f408d6989b4c-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T00:43:06.452466+00:00" -->
#### You
please write it up and create a ticket in lagrange-framework

<!-- xgd-turn id="823732d3-734e-4714-9813-f408d6989b4c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T00:46:03.933983+00:00" -->
#### Claude
Landed in the right store. Now cleaning up the misfiled duplicate.

Now the REQ-187 write-up, appended so the existing body is preserved.

Both written.

**REQ-187** (1stcontact) — appended `## Where the conversation got to (2026-09-11)`, original body intact. It records the clock/bearer split, rotation and what it does *and doesn't* buy, the visit-start trigger doing double duty (rotate + pre-empt), the numbers table, the 400-day browser cap as the thing that settles I1, and the three residual gaps (no customer-facing sign-out-everywhere, 401 can still land mid-task via replay-kill or revocation, level-2 recursion still open). Framed as a proposal — the ticket stays a conversation.

**REQ-151** (lagrange-framework, `request-aad3ebb2`) — the component work. Beyond restating the mechanism it pins down three things the design discussion hadn't reached:

- **Rotation has to be opt-in, and for a hard reason.** `resolveSession` would start returning a `Set-Cookie` the host is *obliged* to send. Every existing caller ignores it, because today there's nothing to ignore — so a host that upgrades without noticing rotates the server while the browser keeps presenting the retired id, signing its users out on a grace-window timer. `rotateAfterMs: null` by default.
- **Schema:** `superseded_by` + `retired_at` (rotated rows are kept, not deleted — inside grace they resolve through, after it the same row *is* the replay evidence), and `origin_id` so killing a compromised family is one indexed DELETE.
- **`applySchema` idempotency breaks.** It's `CREATE ... IF NOT EXISTS` throughout and safe to run twice; `ALTER TABLE ADD COLUMN` is not, and hosts call it on boot. Flagged as a constraint on the migration rather than left to be discovered.

Also: `touchAfterMs` must be forced below `visitGapMs` — hourly last-seen writes can't evidence a 30-minute silence, and the failure mode is a feature that silently never fires.

One correction worth flagging: `XGD_PROJECT_ROOT` is pinned to 1stcontact for this session, so my first `create` run from the lagrange-framework directory landed in the wrong store as REQ-230. I archived it and recreated with the var overridden. Nothing else was touched.

No code was written — this stayed a design conversation, so no branch was cut.

<!-- xgd-turn id="2ccdcced-dd9d-416d-9c65-ba65b821aa3f-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T00:51:13.903209+00:00" -->
#### You
I don't understand if you are asking a question or what?

<!-- xgd-turn id="2ccdcced-dd9d-416d-9c65-ba65b821aa3f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T00:51:20.709995+00:00" -->
#### Claude
No question — it's done. That was a completion report.

You asked for two things and both exist:

- **REQ-187** in 1stcontact — the design written up as a new section at the end of the body. Original text untouched.
- **REQ-151** in lagrange-framework — a new `request` ticket for the component work.

Nothing is waiting on you.

<!-- xgd-turn id="d74da71c-4d65-4386-b657-2b13a9879eaf-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T00:55:00.610455+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="300ce890-632f-4d14-9f9b-5eb3e70f9df6-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T00:55:57.775960+00:00" -->
#### You
If this is complete, please move the ticket to legacy_done

<!-- xgd-turn id="300ce890-632f-4d14-9f9b-5eb3e70f9df6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T00:56:17.085778+00:00" -->
#### Claude
No — it isn't complete, so I haven't moved it.

What exists is documentation only:

- **REQ-187** body has the design write-up appended.
- **REQ-151** created in lagrange-framework.

What doesn't exist: no branch was cut, no code was written, no UATs. Still on `xgd-working` with a clean tree. I was at the scoping step of the free-coding when the turn ended.

There's also a substantive blocker I found while scoping, which you should know before deciding what to do with this ticket. Most of REQ-187's design **cannot** be built in this repo yet:

- **Visit detection is impossible against the component as it stands.** `resolveSession` overwrites `last_seen_at` *before* returning it, so when the gap exceeds `touchAfterMs` the host reads a gap of zero — exactly the case it needs to detect. Rotation, and the pre-emption that hangs off visit-start, are both blocked on REQ-151.

What *is* free-codable here without the component change is a smaller slice:

1. **Set I1 = 365 days** — `sessions.ts` overrides none of the component's defaults today, so it's on the 90-day default. One config pass through `passwordlessFor`.
2. **Customer-facing "sign out everywhere"** — `endSessionsForSubject` exists and is reachable only from `setPersonStatus`. REQ-187 flags this as no longer a nicety at I1 = a year.

Item 2 is currently written in the ticket as an observed gap, not a requirement, so the body needs language added before it can motivate a UAT.

Two ways forward — your call:

- **Free-code that slice now** under REQ-187, and leave rotation/pre-emption to land after REQ-151.
- **Leave REQ-187 as the conversation it says it is**, and treat REQ-151 as the thing that moves first.

Which do you want?

<!-- xgd-chat-end -->