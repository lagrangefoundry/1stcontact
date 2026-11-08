---
uid: comment-97fe617c
id: COMMENT-7875
type: comment
title: Comment on bug BUG-363
created_by: xgd
created_at: '2026-11-05T22:54:18.776160+00:00'
updated_at: '2026-11-05T23:12:43.548067+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-cb0cf782
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e85b4550-3bae-42cc-894f-62ea1162fd67",
  "role": "chat2",
  "backend": "claude_code+km",
  "filter_tool_use": false,
  "backend_ref": "d7c30995-a88e-4b0c-916e-fbcc40c70194",
  "chat_ticket_uid": "bug-cb0cf782"
}
-->

<!-- xgd-turn id="e312bf5b-485a-447b-adbb-fba4877c3a06-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T22:53:44.532972+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="e312bf5b-485a-447b-adbb-fba4877c3a06-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T23:12:39.734498+00:00" -->
#### Claude
Reading the ticket and the buy/checkout code paths; now tracing how the draft preview serves the Buy link.

Still tracing why the Buy link lands back on the product page — checking how bound hrefs are emitted.

Found it: `bind.link: true` always links to `hrefs.item` (the item's own page).

Looking at `describe_site` now, to add a checkout-readiness readout the consultant can use.

Wiring the consultant's checkout-readiness read: finding where the control app already builds the catalog (payments + shipping) for the preview, so `describe_site` can reuse the same source.

Tracing how the consultant's host gets its per-business wires (the router builds them, and turns may run in a container), to see what a checkout-readiness read would take.

Scope is settled. I'm adding a "What this fix does" section to the ticket and keeping the existing body, then cutting the branch.

Branch cut. Linking node_modules into the worktree so tests can run there.

Worktree is ready. Looking at existing catalog/checkout tests to model the new UATs on.

Implementing now. First a quick check of how the checkout client script treats the `unavailable` node, since the draft channel runs scripts.

Implementing the framework side (items, catalog, checkout, bind link rule).

Now the generator: compute `buyBlockers` only for the builder's renders.

Now the consultant's `describe_site` readiness read. Wiring the toolbox side first.

Code changes are in; typechecking now.

Typecheck is clean for my changes; the two errors are in files I didn't touch. Writing the UATs next, modelled on the REQ-643 suite.

Writing the two UAT files.

All 4 pass. Checking they actually catch the bugs: running against the old code.

Old code fails all four, fix restored. Now the `describe_site` workers UAT.

Passes. Running the regression scope: catalog, checkout and product-page suites, bind round-trip, and the toolbox/`describe_site` suites.

zsh wasn't word-splitting the file list. Rerunning with explicit splitting.

Some failures to check against the baseline. Looking at the errors first.

Both failures are environmental: the sandbox won't launch Chromium, and the worktree has no `dist-assets`. Neither touches this change. Running the workers regression scope now.

All 73 pass. One more sweep: every suite that mentions `describe_site` or `catalogRecord`/`bindL1`.

Three failures; checking each against the old code to see if they predate this change.

All three fail on the old code too, so they predate this change. Now the docs: DOC-47 and REF-l1.

DOC-47 and REF-l1 are system-KB tickets, and those ride the live store rather than the branch. So the plan is to merge the code first, then update the docs. Finding their ticket ids.

REF-l1 is generated from the schema's own comments, so documenting `buy` there means commenting the bind schema's fields. Checking how the projection reads those comments.

The projection reads per-field comments inside the schema object, so commenting `field` and `link` puts the `buy` rules into REF-l1 automatically.

The projection keeps only part of a comment, and `field`'s comment was dropped entirely. Reading its rules.

Only the first sentence (≤240 chars) projects. Rewriting both comments so the first sentence carries the rule.

REF-l1 now explains `buy`. Wrapping those comment lines to match the file's style.

Everything passes. Committing the work on the branch.

Committed. Next is the merge back: lock, merge xgd-working into the branch, bump the version, then fast-forward.

Merged; a ticket commit landed meanwhile, so it's a merge commit and not a fast-forward. Trying the free_coded gate.

free_coded. Now updating DOC-47's "Buying is not built yet" paragraph, since the code is on xgd-working.

Checking no test pins the old wording before applying.

Now cleaning the branch (as its own call), then recording story points and finalising the ticket body.

Updating the ticket body so it matches what landed: the hint's link behaviour, the checkout script marker, and the docs.

I've fixed BUG-363 and merged it into xgd-working. The ticket is at `free_coded` (commits `6fec4e2e2d3a` and `2963f2532d48`, version 0.2.791, 5 story points).

**The bug where Buy came back to the same page.** If a node bound to `buy` was also marked `link: true`, it linked to the item's own page instead of the checkout. Your Buy button had exactly that setup, so once Stripe and shipping were both set up, clicking it reloaded the product page. Now a field that has its own destination keeps it: `buy` goes to `checkout/<item>`, and the enquiry and commission links go to their form. `link: true` still links fields like the name or photo to the item page.

**Seeing why Buy is missing.** All of this appears only in the builder; the published site never shows it.
- **Product page:** an available item that can't be bought yet shows "Buy appears here once Stripe is connected (Settings → Payments) and you add a shipping zone (Settings → Shipping). Only you see this." It names only what's actually missing. The enquiry link still shows next to it.
- **Checkout page:** it says "Checkout opens once …" with the same detail. Its script now leaves that sentence alone, instead of covering it with "This can't be bought right now".
- **Product template:** the builder now shows the first available item instead of the first item, so you can check Buy on the template itself.
- **Consultant:** `describe_site` now reports whether the shop can sell: whether payments are connected, which countries it ships to, whether Buy shows, and what's missing. It can answer "why no Buy?" without guessing.

**Docs.** I replaced DOC-47's "Buying is not built yet" with when Buy shows, where it links and the builder-only messages. REF-l1 is generated from comments in the code, which now cover `buy` and `link: true`. It will pick that up on the next KB build. The payments mode isn't in the consultant's readiness report; it only says whether payments are connected.

**Tests:** six new tests pass. The four product and checkout ones fail on the old code. The `describe_site` one runs against the real shop data tables, with no Stripe connection. The nearby catalog, checkout, product-page and consultant-tool suites pass apart from five failures that have nothing to do with this change:
- **Three fail on the old code too:** one style-audit test, one page-composition test and one long-turn test.
- **Two couldn't run here:** one needs Chromium, which the sandbox won't launch, and one needs built assets the branch didn't have.

The dev environment serves a frozen snapshot, so you won't see this there until it's redeployed with `bin/deploy --env dev`. Your pendant's Buy button should then go to its checkout page.

<!-- xgd-chat-end -->