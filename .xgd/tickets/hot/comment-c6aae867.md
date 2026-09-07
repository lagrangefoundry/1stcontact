---
uid: comment-c6aae867
id: COMMENT-2308
type: comment
title: Comment on request REQ-204
created_by: xgd
created_at: '2026-09-07T21:53:41.000844+00:00'
updated_at: '2026-09-07T22:27:32.846128+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-eba5ef7f
  kind: chat_transcript
---

<!-- xgd-turn id="ece1c8e5-c113-4961-a103-2f2c76ef888a-user" -->

<!-- xgd-chat role="user" ts="2026-09-07T21:53:33.425564+00:00" -->
#### You
please create a sign-out CTA on the user portal modal

<!-- xgd-turn id="ece1c8e5-c113-4961-a103-2f2c76ef888a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-07T22:05:06.317711+00:00" -->
#### Claude
Now I have the picture. Let me scope the ticket.

Ticket scoped. Cutting a branch:

Now the dialog itself:

Now the server side — the one bit the client needs:

Now the client transport and wiring:

Now the UATs:

Now lock, merge back, and record the commit:

Done — REQ-204 is `free_coded` on `xgd-working` (commit `e6bbe46f22d8`, version 0.2.128).

**What I built.** The builder's Account dialog (the modal behind the avatar) now has a **Sign out** control in its footer, opposite Close. It is a real `<form method="post" action="/sign-out">` with a submit button, so the browser follows the Worker's existing 303 to the sign-in page — nothing to read, no failure to word, and it still works if script has broken. That matches the reasoning already in the file for the portal link being an anchor.

**One judgment call worth your attention.** The control is drawn *only* when the session is one we can actually end. The builder admits two ways (REQ-202): our own session cookie, tried first, and Cloudflare Access behind it. `POST /sign-out` ends the first and can do nothing about the second — an Access-admitted operator who pressed Sign out would be sent to the sign-in page and re-admitted the moment they navigated back. That is the same shape as a Delete account button that deletes nothing, which REQ-183 §4.2 refuses, so the control is absent rather than dishonest. Practically: **you'll see it when you signed in by link, and not when you came in through Access.**

Making that decision client-side needed one new fact: `GET /api/businesses` now carries a `session` boolean, set in `index.ts` on the branch where the cookie answered and false everywhere else (Access, dev-open, the Node transport). It is a fact about the session, which is what that endpoint already answers — not the start of an account view.

**Tests.** Six new UATs, all passing: the dialog renders a POST form at the sign-out path with a submit button; it renders nothing at all when `session` is false *or* absent (the absence is asserted, both by class and by the path appearing nowhere in the dialog); the client constant equals the Worker's `SIGN_OUT_PATH`; and at the Worker, a real redeemed session reports `true` while a real Access token reports `false`. Regression: all 36 affected test files pass (287 tests). Two existing assertions moved with the new field — BUG-52's failure default and REQ-180's payload key set — both updated in place with a note, their claims unchanged.

One thing that is not your change: `reconciliation-copy-edit-form-presentation.test.ts` failed on font assets until I ran `./bin/1c assets` in the fresh worktree; `dist-assets/` is gitignored and absent on a new checkout.

<!-- xgd-turn id="affa9ce6-8b0d-40c3-b900-3f025237c875-user" -->

<!-- xgd-chat role="user" ts="2026-09-07T22:20:57.493356+00:00" -->
#### You
I am logged in a Felix Test. I have restarted the server. I do not see the new CTA?

<!-- xgd-turn id="affa9ce6-8b0d-40c3-b900-3f025237c875-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-07T22:23:57.711099+00:00" -->
#### Claude
Let me check rather than guess — two candidates: stale built assets, or `session` coming back false.

Found it. Rebuilding the assets the dev server actually serves:

Fixed — reload the page and it'll be there. No code was wrong; the browser was running the old bytes.

**What happened.** `1c builder` only starts `wrangler dev` — it never builds. The Worker serves browser assets out of `apps/control-app/dist-assets/`, which `./bin/1c assets` copies from `src/builder/`. Your `dist-assets/builder/business.js` was stamped 14:35, twenty minutes before the merge, so restarting the server changed nothing: `.ts` edits hot-reload, `src/builder/*.js` does not. I ran `./bin/1c assets` in the main checkout.

**Verified against your running server on :8788, not just the source:**

- `GET /builder/business.js` now contains `builder-account__sign-out` — the served bytes, not `src/`.
- `GET /api/businesses` with your session returns `{"person":{"name":"Felix Test",…},"session":true,…}` — so the condition the control hangs on is satisfied for you.

A plain reload should do it; hard-reload (⌘⇧R) if the browser cached the old `business.js`. Open the avatar dialog and **Sign out** sits at the left of the footer, opposite Close.

One thing to expect later: if you test by simulating an Access login (`bin/access-sim`) instead of your sign-in link, the control will correctly be absent — `session` comes back false, because `POST /sign-out` can end a session row and can do nothing about the Access cookie. That's the conditional working, not a regression.

<!-- xgd-turn id="77831d05-3004-4359-b3e7-0e2bd5e7392f-user" -->

<!-- xgd-chat role="user" ts="2026-09-07T22:26:29.470580+00:00" -->
#### You
ok fixed - now help me understand "accounts that cannot sign out?"

I am now logged in as me from the access-sim and I don't see the logout capability

<!-- xgd-turn id="77831d05-3004-4359-b3e7-0e2bd5e7392f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-07T22:27:32.520674+00:00" -->
#### Claude
Short version: it's not a class of *accounts*, it's a class of *credentials we didn't mint* — and right now that's you.

**Why you're in it.** Since REQ-202 the builder admits two ways, and `index.ts` tries them in order: our own session cookie first, Cloudflare Access second. `POST /sign-out` does exactly two things — deletes the `sessions` row and clears our cookie. When you arrive through access-sim, your credential is a `CF_Authorization` JWT that *the edge* minted; there is no session row and no cookie of ours. So the endpoint would succeed, 303 you to `/sign-in`, and the Access cookie still in your browser would re-admit you on the very next navigation. The button would look broken while behaving exactly as built, which is why I hid it rather than shipped it.

So the split, concretely: a customer who signed in by link can sign out; an operator arriving through Access (production) or access-sim (local) cannot. Felix Test could because that account holds a real redeemed session — you, right now, don't.

**Getting out today.** Against real Access, Cloudflare owns the logout: `https://<host>/cdn-cgi/access/logout` clears `CF_Authorization` for that app. Locally there's no such route — access-sim only serves `/login` and `/cdn-cgi/access/certs` — so you'd delete the `CF_Authorization` cookie for `127.0.0.1` by hand.

**What I think we should do instead.** Hiding the control is honest, but it's the wrong answer to the actual question — it documents a gap rather than closing it. The better shape is to make sign-out truthful for *both* credentials and always show it: end whatever we can (delete our row, clear our cookie) and then, when the caller came in through Access, redirect to the Access logout instead of to `/sign-in`. We already hold `ACCESS_TEAM_DOMAIN`, so the target is derivable and no new configuration is needed. That deletes the "cannot sign out" class outright, and the conditional I built collapses into "which logout does this credential need" — the `session` boolean stays useful, it just picks a destination rather than deciding whether to draw a button.

Two things I'd want your call on before I scope it into REQ-204:

1. **Local testability** — access-sim would need a matching `/cdn-cgi/access/logout` that clears the cookie it set, or this stays unverifiable on your machine and only works deployed. I'd add it; it's a few lines in the simulator and it's the edge's half of the protocol, which that file already owns for service tokens.
2. **Where you land after an Access logout** — Cloudflare's own logout page, or bounced back to the app so you meet a fresh challenge. I'd pick the bounce, since "sign out and hand the laptop over" is the case that matters.

Want me to build that? It's a behaviour change to what just landed, so it needs its own language in the ticket body before any code — I'd add the section, then cut a branch.

<!-- xgd-chat-end -->