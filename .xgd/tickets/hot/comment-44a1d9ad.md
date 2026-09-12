---
uid: comment-44a1d9ad
id: COMMENT-2844
type: comment
title: Comment on request REQ-187
created_by: xgd
created_at: '2026-09-12T00:21:09.732212+00:00'
updated_at: '2026-09-12T00:38:22.995088+00:00'
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

<!-- xgd-chat-end -->