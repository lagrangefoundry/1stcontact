---
uid: request-eba5ef7f
id: REQ-204
type: request
title: 'Account dialog: sign-out control'
created_by: martin-github@westhead.me
created_at: '2026-09-07T21:42:25.156652+00:00'
updated_at: '2026-09-07T22:47:47.593775+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-c6aae867
  story_points: 3
  commits:
  - working_sha: e6bbe46f22d899a4e211059d934f73ad7dbae5bf
    reconcile_sha: null
    main_sha: null
  version: 0.2.128
---

## What changes

The builder's **Account** dialog — the modal behind the avatar, showing who is
signed in, which businesses the account reaches, and the link out to the
customer portal — gains a **Sign out** control. Pressing it ends the session
this browser holds and lands the person on the sign-in page.

## How it behaves

- The control is a real `<form method="post" action="/sign-out">` with a submit
  button, not a click handler that fetches and then navigates. `POST /sign-out`
  already ends the row, clears the cookie and answers `303 -> /sign-in`
  ([[REQ-202]]), so letting the browser follow the redirect means there is no
  error branch to invent and the control still works when script has failed —
  the same reasoning the portal link already uses for being an anchor rather
  than a button.
- It sits in the dialog footer, beside Close.

## Why it is conditional

**The control is drawn only when this session is one we can actually end.** The
builder admits two ways ([[REQ-202]]): our own session cookie, tried first, and
Cloudflare Access as the fallback. `POST /sign-out` ends the first and can do
nothing about the second — a person admitted by Access who pressed Sign out
would be redirected to a sign-in page and then re-admitted the moment they
navigated back. A Sign out that does not sign out is the same defect
[[REQ-183]] §4.2 refuses for a Delete account button that deletes nothing, so
the control is **absent** rather than dishonest.

Making that decision on the client needs one fact the client does not have, so
as a technical consequence of the above:

- `GET /api/businesses` carries one new boolean, `session`, saying whether this
  request arrived on a session of ours. `index.ts` already knows — it resolves
  the session cookie before it falls back to the gate — and hands the bit down
  to the router beside the admission it already hands down. It is a fact about
  the SESSION, which is what that endpoint answers and what a portal on another
  origin cannot state; it is not the beginning of an account view.
- `false` is the answer for the Access path, for the unconfigured-local-dev
  path, and for any host with no identity behind it — all three are states with
  no session to end.
- The path the form posts to is the server's own `SIGN_OUT_PATH`. The client
  holds its own constant because the builder is browser JavaScript and cannot
  import the Worker's TypeScript; the two are pinned equal by a UAT so they
  cannot drift.

## Test plan

UATs named `test_UAT_FC_REQ-204_*`:

1. The dialog, mounted into a real DOM with `session: true`, holds a `POST`
   form whose action is the sign-out path and a submit button inside it.
2. The same dialog with `session: false` (and with the field absent) renders no
   sign-out control at all — the absence is the claim, so it is asserted.
3. `businessesPayload` reports `session` as it was handed, on both the admitted
   and the scope-only branch.
4. `GET /api/businesses` carries the boolean through the route.
5. The builder's sign-out path constant equals the Worker's `SIGN_OUT_PATH`.
---

## Revision: the control is unconditional, and sign-out ends whichever credential you hold

**This supersedes "Why it is conditional" above.** That section's premise was
right — a Sign out that leaves you signed in is a lie — but it drew the wrong
conclusion. Hiding the control documents the gap instead of closing it, and the
people in the gap are exactly the operators: everyone arriving through
Cloudflare Access, in production and through `bin/access-sim` locally, gets a
builder they cannot leave. The fix is to make the endpoint honest for both
credentials rather than to withdraw the control from one of them.

### What changes

- **The dialog always draws Sign out.** No condition, no state in which the
  control is absent.
- **`session` leaves `/api/businesses` and the builder wiring.** With the
  destination decided on the server there is no reader for it, and a field
  nothing reads is drift. This removes it from the payload, from `RouterDeps`,
  from `index.ts`, and from `api.js` / `main.js` / `app.js` /
  `openAccountSurface`. The two assertions that moved when it landed — BUG-52's
  failure default and REQ-180's payload key set — move back with it.
- **`POST /sign-out` chooses where you land, from what the request carries.**
  Both halves it already does are unchanged: end the session row if there is
  one, clear our cookie always. What is new is the destination.
  - The request carries an Access credential (a `cf-access-jwt-assertion`
    header or a `CF_Authorization` cookie — `accessTokenFrom`, which already
    exists) **and** a team domain is configured: `303` to
    `<team-domain>/cdn-cgi/access/logout?returnTo=<this origin>/sign-in`.
  - Otherwise: `303` to `/sign-in`, exactly as before.

### Why it is keyed on what the request carries

Not on which producer admitted it. A person can hold BOTH — a session of ours
and a live Access cookie — and for them `index.ts` admits on the session,
because it is tried first. Deciding from that would send them to `/sign-in`
with the Access cookie intact and re-admit them on the next navigation, which
is the same defect this revision exists to remove, surviving in the one case
nobody would think to test.

### What `returnTo` is, and what it is not

It is a REQUEST to the edge, not a guarantee. The load-bearing half is the
cookie being cleared, which is Cloudflare's to do and does not depend on the
parameter; if the edge ignores it the person lands on Cloudflare's own logout
page with the cookie gone, which is degraded rather than broken. The value is
built from the request's own origin and never from anything the caller sent, so
this cannot become an open redirect.

The team domain is used rather than the app path so that one expression serves
both deployments and local dev: in production `ACCESS_TEAM_DOMAIN` names
Cloudflare, and locally it names the simulator, which is the same substitution
`certsUrl` already relies on.

### The simulator gains the other half

`bin/access-sim` serves `/cdn-cgi/access/logout`: it clears the
`CF_Authorization` cookie it set and honours `returnTo` for its own forwarded
origin. It is the EDGE's half of the protocol, which that process already owns
— it does the service-token exchange for the same reason ([[BUG-59]]) — and
without it the operator loop this revision exists for is unverifiable on the
machine where it is being used.

### Test plan

Replacing cases 1–4 of the plan above, and keeping case 5:

1. The dialog draws the sign-out form with no `session` told to it at all —
   there is no state in which the control is absent.
2. Signing out with only a session of ours: the row is gone, the cookie is
   cleared, and the redirect is to the sign-in page.
3. Signing out while carrying an Access credential: the redirect names the team
   domain's logout path and carries a `returnTo` on this origin — and our
   cookie is still cleared on the way.
4. Signing out while holding BOTH: the Access logout wins. This is the case
   that would otherwise re-admit.
5. A deployment with no team domain configured never redirects off-origin,
   whatever the request carries.
6. `/api/businesses` no longer carries `session`.
7. The simulator's logout clears the cookie it issued and honours `returnTo`,
   driven against a real spawned simulator the way [[REQ-192]]'s suite drives it.
