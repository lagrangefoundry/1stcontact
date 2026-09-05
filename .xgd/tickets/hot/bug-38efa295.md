---
uid: bug-38efa295
id: BUG-52
type: bug
title: An expired session renders as a working, empty account
created_by: xgd
created_at: '2026-09-05T19:10:55.261370+00:00'
updated_at: '2026-09-05T20:35:23.798617+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  severity: high
  priority: high
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-22b21d75
  story_points: 3
  commits:
  - working_sha: 902b5b63d93eb4716df946d6d8f462a2d3aa0a97
    reconcile_sha: null
    main_sha: null
  - working_sha: 1cd00146f39e34df5fae860e124c2e071797cd7a
    reconcile_sha: null
    main_sha: null
  version: 0.2.76
---

# An expired session renders as a working, empty account

Scope: what a **reload** does. The larger question — not being denied mid-session
in the first place, and how a session renews — is deliberately **not here**. It is
[[REQ-187]], and this bug must not be closed by answering it.

## What happens

When the caller's session has lapsed, every route answers 401 — correctly. The
builder client then swallows all three of the calls it makes on load and draws a
builder that looks fine and contains nothing:

| Call | Worker | `api.js` does |
| --- | --- | --- |
| `/api/businesses` | 401 | `return { account: null, businesses: [] }` (`api.js:147`) |
| `/api/status` | 401 | `return { ai: true, message: null }` (`api.js:123`) |
| `/api/sites` | 401 | throws, and `app.js:724` `.catch(() => [])` discards it |

The switcher is empty, the avatar has no account behind it, the site list is
empty, and the assistant reports itself healthy. Nothing says *you are signed
out*. **There is no 401 handling in the client at all.** Verified 2026-09-05
against a running stack with a deliberately expired token.

## Why it is a bug rather than a rough edge

An expired session is **indistinguishable from a deleted account**. That is the
exact failure this codebase rejected once already: [[REQ-178]] refused to drop
lapsed businesses from the switcher because *"a business that silently vanishes
is indistinguishable from a deleted one, which is the wrong thing to tell someone
whose card expired"*. The same sentence applies here with a worse subject — not
one business missing, but every business, the account and the sites at once.

The person most likely to hit it is mid-edit, and an empty builder reads as data
loss. The obvious response to apparent data loss is to start re-creating things.

## Production is not milder

Behind real Cloudflare Access the Worker is not reached: Access answers the
lapsed cookie itself, redirecting to its login origin. A top-level navigation
recovers on its own, but a background `fetch` gets a cross-origin redirect it
cannot follow and **rejects** rather than returning 401 — landing in the same
`catch`es above. The symptom is identical and harder to diagnose, because there
is no status code to find in the network panel.

## A valid stored token must survive a reload

The complementary half, and the one an operator meets first: when the cookie is
still good, reloading must simply work. It does today — nothing in the Worker
issues a `Set-Cookie` and both the 401 and the 200 carry `Cache-Control:
no-store`, so neither a cleared cookie nor a cached refusal is in play (checked
2026-09-05). A UAT pins it, because this is the property the fix above could
plausibly break: a client that reacts to auth failure is a client that can
misfire on a working session and sign someone out for no reason.

## Test sessions must outlive a work session

The local Access harness mints one-hour tokens, which expire inside a single
sitting and make this bug's own symptom hard to distinguish from the harness
running down. Test sessions want a lifetime measured in days. This is
harness-only and has no production counterpart — deployed session lifetime is
[[REQ-187]]'s subject.

## What was built

### The session became a thing, in one module

`apps/control-app/src/builder/session.js` is new and holds the whole idea: the
two ways a session ends, the error that names them, the subscription that
reports one, the sentence shown to the operator, and the notice that carries it.
Before this, an ended session was represented nowhere — each call in `api.js`
met a 401 alone and turned it into whatever local default read best at that call
site, which is how three separate reasonable-looking defaults added up to an
empty builder.

The split against `api.js` is **transport versus meaning**: `api.js` recognises
a 401 and a rejected fetch, `session.js` says what they mean and who is told.
The dependency runs one way, so the entry point and the shell ask about identity
without importing transport.

### Every request goes through one place

`api.js` gained a private `send()` that all twenty-odd calls route through.
Nothing outside that module calls `fetch` at all, so *"the client notices a
401"* is mechanically true rather than a convention someone has to remember at
the next route added.

A 401 is announced and handed back; the three load-path calls
(`/api/businesses`, `/api/status`, `/api/sites`) additionally **throw** rather
than returning their defaults. The other callers keep their existing error
contracts — `CopyError` still carries the validator's sentence, the assistant's
stream still turns a refusal into a frame in the conversation — because the
banner reaches the operator either way and rewriting all of them would be a
bigger change than the bug.

An origin that merely **failed** is unchanged: a 500 still leaves the builder
mounted and unblocked, which is what REQ-173's and REQ-179's defaults were
written for. Only a 401 — which answers the question, with *"not you"* — stops
being a default.

### A rejected fetch is classified as an authentication failure

With the reason `unreachable`, kept distinct from `expired` for one purpose: the
sentence. `expired` says *"Your session has ended"*; `unreachable` hedges —
*"The builder could not reach the server — your session may have ended"* —
because a rejected fetch is a lapsed Access cookie most of the time and an
origin that is down the rest of it, and this side genuinely cannot tell. One
button recovers from both. The original error is kept as `cause`.

### Two shapes, one wording, one action

- **At load**, a refusal draws the reason where the builder would have been.
  Nothing is mounted — the alternative on offer was a builder assembled from the
  defaults, and an empty builder reads as data loss. Filling `#app` is also what
  stands REQ-149's boot guard down, so the page never says *"your session
  ended"* and then *"the builder did not start"* four seconds later. Any other
  load failure is still thrown, or a 500 and a broken import map would both
  report *"sign in again"*.
- **Mid-session**, a strip appears above the shell, mounted on `root` so its
  text can be selected and pasted into a support message. It is said **once**
  however many calls are refused.

The decision at load lives in `session.js`'s `loadOrSignOut`, not in `main.js`:
that file imports three modules by absolute URL only a browser can resolve, so a
decision written there is a decision no suite can drive.

### Nothing is disabled, and nothing navigates by itself

This is the one place the fix departs from REQ-173's unconfigured-deployment
block, and it follows from *"the person most likely to hit it is mid-edit"*
above. `inert` removes a subtree from hit testing, so blocking the shell would
put the operator's own half-typed text behind a barrier they cannot even select
it out of — immediately before the recovery discards it. So the shell stays
live, is not dimmed, and recovery is a **button** they press when they are
ready: a top-level reload, which is the only navigation Access will answer with
its login page.

Concretely: a refused site listing no longer empties anything. It used to arrive
as `[]` like any other failure, and everything after that line rewrites a
surface — the pane, the Library, the People tab — from a store this session can
no longer read. It now stops there.

### The harness

`tests/support/access.ts` mints seven-day tokens by default, behind a named
constant. An hour is the worst possible length: long enough to look like a
working session, short enough to end inside one. It remains a default and not a
ceiling — `token({exp})` still overrides it, which is how the suites that mint a
deliberately expired token work.

## Test plan

`tests/test_UAT_FC_BUG-52_expired_session.test.ts` (jsdom):

- the three load calls refuse rather than returning a default
- a rejected fetch is an authentication failure, with the original kept as cause
- every call announces it, not only the ones on the load path
- a **valid** session answers normally and announces nothing
- an origin that merely failed (500) is still not a session failure
- a refused load draws the reason where the builder would have been, as the only
  child of `#app`
- any other load failure is still thrown
- recovery is a top-level navigation the operator asks for
- a session that lapses mid-edit says so and leaves the unsaved work where it
  is: not removed, not `inert`, pane unchanged
- it is said once however many calls are refused
- a refused site listing does not empty the builder
- both shapes are styled, and neither reaches for `inert` or the dimming class

`tests/test_UAT_FC_BUG-52_harness_token_lifetime.test.ts`:

- a minted token lasts days rather than one hour
- a deliberately expired token is still mintable

## Acceptance

- with an expired session, the builder reports that the session ended and does
  not draw an empty account
- `/api/businesses`, `/api/status` and `/api/sites` no longer convert a 401 into
  a default value
- a rejected fetch that may be an identity-provider redirect is treated as an
  authentication failure, not a transport error
- a **valid** stored token still loads the builder normally across a reload, and
  no auth-failure path fires on it
- unsaved editor state is still present after whatever recovery is offered
- the local Access harness issues multi-day tokens by default