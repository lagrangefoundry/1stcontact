---
uid: request-eba5ef7f
id: REQ-204
type: request
title: 'Account dialog: sign-out control'
created_by: martin-github@westhead.me
created_at: '2026-09-07T21:42:25.156652+00:00'
updated_at: '2026-09-07T21:57:11.636547+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-c6aae867
  story_points: 2
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
