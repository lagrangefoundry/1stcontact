---
uid: comment-53a73c3f
id: COMMENT-5817
type: comment
title: Comment on request REQ-482
created_by: xgd
created_at: '2026-10-28T21:07:30.807906+00:00'
updated_at: '2026-10-29T19:00:56.204184+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-ff6de55f
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "a9dab115-80a4-438a-8710-99f8b49bebe8",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-28T21:07:22Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-28T21:07:22Z" -->
#### You
Sign in link sends an email, a page with Continue, then the builder app. Back on 1stcontact I only see the sign in link. I expect step 2 to send me back to the 1stcontact homepage signed in, with navigation to my account or the builder. Direct navigation to the builder is ok.

<!-- xgd-chat role="assistant" ts="2026-10-28T21:07:22Z" -->
#### Claude
The shared .1stcontact.io session works (apex serves signed-in with the cookie); the redeem always lands on the builder because sign-in records no starting point. Ticket: carry an allowlisted return address through the token.

<!-- xgd-chat role="user" ts="2026-10-28T21:07:22Z" -->
#### You
Ah I was looking at the published draft preview; on 1stcontact.io I AM logged in but see the old broken links.

<!-- xgd-turn id="2b36690b-b854-46d2-a2e2-da729ca7fcc5-user" -->

<!-- xgd-chat role="user" ts="2026-10-29T18:36:35.990273+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="2b36690b-b854-46d2-a2e2-da729ca7fcc5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-29T18:55:31.365027+00:00" -->
#### Claude
Reading the sign-in code to see how the token, redeem redirect and account-chrome form fit together before writing anything.

Not relevant. Now the sessions module around issue/redeem/mailer and the generated passwordless component.

Mapped the sign-in token, the account-chrome form and its client. Next: how the public-site Worker applies the session and how the builder serves draft previews.

Now find an existing sign-in workers test to base the UATs on.

Writing the code. Migration first.

Hash scheme matches plain sha256. Adding the manifest entry and the test-schema import.

Migration registered. Now checking how `client.js` is embedded in the generated `module-assets.ts`, since I'm changing the client.

No drift. Writing the return-address validator.

Now the sessions changes: `returnTo` through `passwordlessFor` → `recordIssuedAddress`, and read back in `redeemSignIn`.

Now `sign-in.ts`.

Now the builder's redirects to `/sign-in` in `index.ts` carry the page they came from.

Now `APEX_HOST` in the control-app's wrangler config.

Now item 4: the builder's draft preview applies the same session transform for the admitted viewer.

Typechecking.

Typecheck clean. Writing the UATs; checking `claimHostname`'s signature for the bound-host case.

Now the UAT file.

The 5-per-hour rate limit would cut the fallback loop short; giving each case its own member.

All 6 pass. Quick mutation check that the preview and redeem assertions actually depend on the new code.

Assertions bite. Now the regression scope: sign-in, sign-out, rotation, one-login, access gate, account-chrome, BUG-76/299/314 suites.

Unrelated to this diff (`/api/businesses` payload shape). Confirming it's red on clean `xgd-working`.

Pre-existing on `xgd-working`, so not caused by this change. Checking the wrangler-parity and migration suites as well.

72 paths is past the vitest long-filter limit; splitting into batches.

Several failures; comparing against the clean `xgd-working` baseline to separate mine from pre-existing.

All pre-existing except `BUG-310_builder_shows_sign_in_passes_against_the_gate`, which passes on baseline. Looking at it.

Passes on its own (it starts a server and was in a loaded batch). Checking what it asserts about the redirect, to be sure.

BUG-310 is a load flake; the smoke probe checks only the pathname of `/`'s redirect, which stays `/sign-in`. Reading my notes on this repo's `free_coded` gate before committing.

Updating the ticket body to match what was built (keeping the existing Why/What), then committing.

Committed. The `ticket get` view truncates, so checking the stored body directly.

Ticket body is current. Now the merge-back sequence: lock, merge `xgd-working` into the branch, bump, merge back, then `move-to-free-coded`.

REQ-482 is done and merged into `xgd-working`. The ticket is at `free_coded` (commits `041dc2f8…` and the 0.2.701 version bump `ae00f578…`). It isn't deployed yet, and I haven't tried it in a browser.

**What changes for you**
- **Starting on 1stcontact.io:** "Sign in" → email → Continue now brings you back to the page you started on, signed in. Previously it always landed in the builder.
- **Starting in the builder:** a builder page that sends you to sign in is where you come back to. Going to `app.1stcontact.io/sign-in` directly still lands on `/`. Invitation links behave as before.
- **If the page's script didn't load:** the sign-in form still posts, but you land on the site's home page rather than the exact page. The browser only passes the site's address in that case.
- **Draft preview:** the builder's preview of a page with the account controls now shows them signed in, with your initial on the avatar, as the published site does.

**How it works**
- The return address is stored with the sign-in token, not put on the emailed link, so editing the link can't change where you land.
- It's only accepted if it's one of our own addresses: the builder itself, 1stcontact.io, or a domain bound to a site in our database. Lookalike hosts, `http`, odd ports and anything else go to the builder's `/`, as before.
- For this the builder now needs to know the apex host. I added `APEX_HOST` to `apps/control-app/wrangler.toml`: `1stcontact.io` in production, empty locally and in dev.

**Before it works in production**
- **Database migration:** the change adds one nullable column (`db/migrations/0036_sign_in_return.sql`). It has to be applied before the new Worker serves sign-ins.
- **Old broken links on 1stcontact.io:** this change doesn't fix those. The likely cause is that the published 1stcontact.io site was rendered before BUG-299 corrected those links, and a published site keeps the links it was built with. Republishing it should fix them; I haven't checked the live copy.

**Tests**
- Six new tests in `tests/test_UAT_FC_REQ-482_sign_in_returns.workers.test.ts` all pass. They cover: starting on the apex, the no-script post, rejected addresses, the emailed link ignoring an added return value, the builder redirect, and the preview. I temporarily removed the new code and all six failed, so they do test it.
- I ran 21 existing sign-in, sign-out and account-control test files and 72 config and migration test files. The failures I saw also fail on unchanged `xgd-working`: REQ-204 (the businesses list now has an extra key), REQ-180, REQ-185, REQ-393, REQ-162, BUG-124, and two reconciliation suites. One other test, BUG-310, failed once in a large batch and passed when run on its own.

<!-- xgd-turn id="03d2e038-f3cf-4e54-9ead-2339d51e18e5-user" -->

<!-- xgd-chat role="user" ts="2026-10-29T18:58:40.628599+00:00" -->
#### You
Does this ticket cover signing in to the "view on Phone" QR code?

<!-- xgd-turn id="03d2e038-f3cf-4e54-9ead-2339d51e18e5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-29T19:00:54.424696+00:00" -->
#### Claude
Yes, though only as a side effect. The ticket doesn't mention the QR code, and none of the tests cover it.

**What happens now:** the QR code holds the draft preview's builder address (`/b/<business>/preview/<site>/draft/…`). When a phone that isn't signed in opens it, the builder sends it to sign in. With REQ-482, that redirect now includes the preview address. The sign-in form records it with the token, so when the emailed link is opened on the phone, it lands back on the same draft page, signed in. Before this change it would have landed in the builder's home page.

**Limits:**
- **The email has to be opened on the phone.** The session goes to whichever browser opens the link. If the client reads the email on their computer, the computer gets signed in and lands on the draft, and the phone stays signed out. The dialog says "use the same email you use here" but doesn't say to open the email on the phone.
- **Not tested for this route.** The builder-redirect test uses `/b/<id>/?tab=settings`. The preview address goes through the same redirect code, but no test runs it.
- **Older phone browsers:** the redirect only fires when the browser marks the request as a page navigation. Browsers that don't, such as iOS Safari before 16.4, get a plain "Sign in to continue." page instead. That was already the case before this ticket.

If you want it covered formally, I can add a sentence about the QR code to the ticket and a test that a signed-out request for a preview address comes back to that address after sign-in. That's small and stays on this ticket. I could also add "open the email on this phone" to the dialog text.

<!-- xgd-chat-end -->