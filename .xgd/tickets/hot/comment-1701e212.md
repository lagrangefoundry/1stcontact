---
uid: comment-1701e212
id: COMMENT-8018
type: comment
title: Comment on bug BUG-382
created_by: xgd
created_at: '2026-11-08T17:45:23.796397+00:00'
updated_at: '2026-11-08T18:16:18.022844+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-40fd134b
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "7c2d9b69-fdb3-4e2d-bad9-9a834ea006e6",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="92d2391d-d484-455a-b160-1ae43515877b-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T17:44:39.105165+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="92d2391d-d484-455a-b160-1ae43515877b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T18:16:13.892759+00:00" -->
#### Claude
Checking whether BUG-382 is a duplicate (it isn't, from what I've found so far) and mapping out the session code before I cut a branch.

Still mapping: the session cookie is read in the control app and in the public site, and the portal is at one shared path. Next I'm checking how the portal picks its business.

Reading the session component's built bundle to see how it names and sets cookies.

Writing the code now. First, the shared naming rules (cookie name per business, the client portal path) in the module both apps already share.

Now the control app's session module.

Applying the session-module edits.

Now sign-in: per-business landing and per-business sign-out.

Now: a sign-in that starts on a client business's portal page is for that business.

Now the Worker entry and router: strip the `/c/<business>/` prefix for routing, and build the client portal's endpoints under it.

Control app typechecks. Next: the public site, which reads the session cookie to draw a site's account box.

Public site: a site's account box will accept a session only if its person is a contact of that site's business. Editing the reader.

Now the account box's "Your account" link on a client site must open that business's portal.

Typechecking everything touched.

Typecheck clean. Now the UATs: updating the REQ-668 suite (its single-session behaviour is what this ticket overrules) and writing BUG-382's own.

Those five failures are the expected ones (old single-cookie behaviour). Updating them to name the business in the address.

One place should strip the prefix rather than several. Folding it into `splitBusinessPrefix` itself.

Existing suites green. Now writing BUG-382's own UATs. Checking what the account endpoints return so the tests can tell the two contacts apart.

Writing the control-app UAT file first (real Worker, real D1).

Two failures came from my test helper choosing an already-used link when one person gets several. Fixing the helper to skip used links.

Control-app UATs pass. Now a public-site UAT: a site's account box shows signed in only for its own business's session, and links to that business's portal.

New UATs pass. Running the wider set of suites that touch sign-in, sessions, the portal and the account box.

Many failures; most look pre-existing (stale-schema reconciliation suites). Baselining the failing files against the clean main checkout.

My additions trip REQ-200's rule that the account-chrome module names no business. Moving the business-aware helpers out of that module, and having the module take a plain portal path instead.

Only REQ-204's pre-existing failure remains (it fails identically on clean xgd-working). Running the second batch of related suites.

The baseline run for this batch didn't execute; most of these are clearly stale-API failures, but REQ-666 ("Sign in to continue.") looks like mine. Inspecting it.

The REQ-666 suite navigates a client contact to the bare `/account`, so it needs the prefix too. It also flags a real gap: the terms page's accept form posts to an unprefixed path. Checking terms.ts.

Now updating REQ-666's suite to address the client portal by its business.

Those 21 fail identically on clean xgd-working, so they're pre-existing. Running lint on the changed files.

No linter in this repo; typecheck is clean. Checking the version-bump convention for this project.

Updating the ticket body to describe what was built (keeping the existing sections), before committing.

Now committing on the branch.

Committed. Now merging back: lock, bring xgd-working into the branch, re-run the key suites, bump the version, fast-forward.

All 37 pass after the merge. Bumping the version and fast-forwarding xgd-working.

The rematerialize script path printed by the lock doesn't exist (a known quirk); using the CLI verb instead, then checking the ticket.

The ticket is now `free_coded`. Cleaning up the branch.

BUG-382 is fixed and merged into xgd-working. The ticket is at `free_coded` (version 0.2.827, two commits recorded), and the branch has been cleaned up. It wasn't a duplicate.

**What changed**
- **One cookie per business.** 1st Contact keeps the `session` cookie, so existing builder sign-ins keep working. A client business's sign-in sets its own cookie, `session-<businessId>`. Signing in to one business no longer replaces another's session.
- **The address names the business.** Pages under `/c/<businessId>/` belong to that business, and everything else (the builder, the console, `/account`) belongs to 1st Contact. Each page reads only its own business's cookie, and it refuses a session whose person belongs to a different business, whatever the cookie is called.
- **Client portals have their own address.** A client business's portal is now at `/c/<businessId>/account`, and the requests it makes go to addresses under the same prefix. A client contact with no saved return address now lands there after signing in. A signed-out visitor to that portal is sent to sign in for that business.
- **Sign-out is per business.** `/sign-out` ends only the 1st Contact session. `/c/<businessId>/sign-out` ends only that business's session and never touches Access.
- **Published sites.** A site's account box shows signed in only for a session belonging to that site's business. For a client business, the "Your account" link opens that business's portal.
- **Terms page.** A client business's terms page now posts the acceptance under that business's address. Without that, accepting would have been refused because the request would carry no session for that business.

This overrules REQ-668's "signing in to another business replaces the session". It also changes REQ-668's landing rule, since a client contact now lands on `/c/<id>/account`. I updated the REQ-668, REQ-666 and REQ-200 UATs to the new addresses and recorded the overrule in the ticket body.

**Tests**
- Seven new UATs, `test_UAT_FC_BUG-382_*`:
  - four run through the real Worker and D1 with one shared cookie jar;
  - three run through the public-site Worker.
- The updated suites pass, both before and after merging xgd-working in.
- In the wider run over the sign-in, session and portal suites:
  - 21 failures in the contacts-tab, customer-portal and REQ-484 suites also fail on clean xgd-working;
  - REQ-204's one failure has the same message on clean xgd-working;
  - four failures in the REQ-115 and BUG-310 suites appear only in the branch worktree. They come from files the worktree lacks (builder web-component resolution and the `dist-assets` directory), so I'm treating them as worktree effects, not regressions.
- This repo has no linter, so the only static check is the typecheck. It's clean for the control app, the public site and the framework.

**Known limits** (also in the ticket):
- If a business builds its own portal page instead of using the built-in one, the page's requests keep whatever addresses its author set. Plain `/api/…` addresses would read 1st Contact's session when the portal is served under `/c/`. Every business uses the built-in portal today.
- Client sessions created before this fix were stored under the old shared `session` name.
  - The control app now refuses them, so those contacts will need to sign in once more.
  - The public site can't tell which business is 1st Contact. So on the contact's own business's site, such an old cookie still shows signed in until it expires.

<!-- xgd-chat-end -->