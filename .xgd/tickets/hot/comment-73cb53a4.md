---
uid: comment-73cb53a4
id: COMMENT-8019
type: comment
title: Comment on request REQ-669
created_by: xgd
created_at: '2026-11-08T17:45:33.110297+00:00'
updated_at: '2026-11-08T20:53:23.261785+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-d71a191f
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e853b694-2540-4cee-be05-f0739ef8c7af",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="0dc33d92-cc21-41fa-a37a-1dfc0dfe064c-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T17:44:45.251548+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="0dc33d92-cc21-41fa-a37a-1dfc0dfe064c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T17:50:01.643984+00:00" -->
#### Claude
Not a duplicate. Reading the current legal pipeline (REQ-665/666 code) now, before I plan the change.

Still mapping the code: now reading the platform's separate terms gate, the legal pages and the Paperwork routes.

Checking how 1stcontact.io itself is served, since the cutover moves 1st Contact's legal pages onto its own site.

I need your answers to a few questions before I write code. This is not a duplicate: no other ticket covers owner-added sections or moving 1st Contact's documents off the build. The ticket is still at `draft`, and I haven't cut a branch.

I read the current legal code end to end (`client-legal.ts`, `client-terms.ts`, `terms.ts`, `paperwork-legal.ts`, the module library, the publish path) and DOC-120. Five questions change what gets built. Each has my recommendation, so "yes to all" is a fine answer.

**1. What do signed-in customers accept: Terms of use, or Member terms?**
DOC-120 says a 1st Contact client accepts the Member terms, the Privacy notice (read) and the Beta Terms, but not the Terms of use. Today every client business's signed-in customers are asked for the Terms of use *and* the Member terms. To avoid a 1st Contact branch, the rule has to change for every business. *Recommend:* where the site has Member terms, signed-in customers agree to those; the Terms of use are only asked for when it has none. This changes REQ-666's behaviour for client businesses.

**2. How does 1st Contact get Member terms at all?**
Member terms appear when a site has an account module on a page. 1st Contact's clients sign in at the builder's door, not through an account box on 1stcontact.io, so detection from the pages would never give 1st Contact Member terms. *Recommend:* treat "has signed-in customers" as true when a site has an account module **or** the business has anyone who has signed in. Every business uses the same rule, and 1st Contact meets the second half.

**3. What does "legal pages are published on their own" (item 7) mean in practice?**
Today the legal pages are written into the site snapshot when the site is published, and the footer links to them are in that snapshot too.
- *Recommend:* after a legal change, rebuild each of the business's published sites from its **published** definition (the owner's draft is never published by this). It runs as background work in small batches, on the existing rebuild path.
- The alternative is serving `/legal/*` from separate stored pages outside the snapshot. That breaks when Terms of sale appears or goes, because the footer links would then be wrong.

**4. How should 1st Contact's history and DOC-120 be loaded, per environment?**
The cutover removes 1st Contact's documents from the build, so the past versions (DOC-76…118), DOC-120's sections and its business details must be written into 1st Contact's records once.
- *Recommend:* a one-off command (`1c legal seed-platform --env dev|production`) that reads those doc tickets and writes the records. You run it once per environment when this lands; I'll hand you the exact command.
- The record store assigns its own ids, so each old version will also carry its original doc uid. An acceptance naming DOC-84 then still finds DOC-84's text.

**5. Should the new "You can add your own sections" sentence go in at the cutover?**
That sentence belongs to Member terms §8, and after the cutover the "Legal documents we provide for your site" paragraph is one of 1st Contact's own added sections. *Recommend:* include the sentence in that section at the cutover, since the feature exists from that moment, and skip the separate Terms of Service version. Note this is a material change: every 1st Contact client will be asked to accept the new Member terms at their next sign-in. The ticket's test plan already expects that.

**On size:** this is well over 20 points, especially with items 7–9. I'll keep it as one ticket with several commits on one branch, landing in three steps:
1. The library refusal (5–6), owner-added sections (1) and owner-only documents (2).
2. 1st Contact's cutover, the seed and the redirects from the old addresses (3–4).
3. Separate legal publishing and revision announcements with the 14-day notice (7–9).

I'll merge back and move it to `free_coded` only when all three are done.

<!-- xgd-turn id="24f23500-06ac-40a4-8cc2-3e570d3c54b4-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T18:27:03.509340+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="24f23500-06ac-40a4-8cc2-3e570d3c54b4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T20:53:20.361579+00:00" -->
#### Claude
Answers are clear. Reading DOC-121, which the ticket says wins on conflict, before starting.

Ready to code. Starting step 1 (library check, owner-added sections, the business's own documents): marking the ticket `free_coding` and cutting the branch.

Worktree is runnable. Running the existing legal suites as a baseline before changing anything.

The published library uses only `always` and `sells`, except DOC-116 (`signed_in_customers`, to become `always`). Checking who else depends on the page-feature triggers before removing them.

Plan for step 1 is settled. Checking how the renderer uses the legal page list (footer links), since Member terms must stay out of the footer and display-only owner documents go in.

Writing step 1 now, starting with the module library check in `legal-modules.ts`.

Library check in. Updating DOC-116's trigger to `always`, as the answers ask.

Now the business's own documents need acceptance keys. Checking whether `recordAcceptance` only accepts keys from a fixed registry.

Now the main `client-legal.ts` rewrite, in pieces. First the facts: no more page-feature detection.

Now building a standard document with the owner's sections in place.

Now the stored versions, extended for the business's own documents and the original uid of a carried-over version.

Now the rest of `client-legal.ts`: the pane's view, the business's own documents, and publish/pages handling both kinds of document. Rewriting the file's tail in one piece so it stays consistent.

That cut the file's tail with nothing to replace it, which I was about to do anyway. Writing the new tail now.

Typecheck is clean. Now the acceptance gate in `client-terms.ts`: Member terms instead of Terms of use, plus the business's own documents that ask for acceptance.

Membership ("member since") is read from Terms acceptances only; signed-in customers now agree to Member terms, so it must count either.

Now the renderer: the footer links only the documents everyone is subject to.

Now the Paperwork → Legal routes for added sections and the business's own documents.

Typechecks are clean apart from two existing errors in unrelated files. Now the Legal assistant's "feature effect" tool, which can only be about selling now.

Step 1's server side is done and typechecks. Now the Paperwork → Legal pane in the builder, so owners can add sections and their own documents.

Adding to the pane: "Add your own section" on a standard document, the business's own documents in the list, and a new-document form.

Pane code parses. Running the existing legal suites to see which tests encode behaviour this ticket supersedes.

The workers suites fail at load because their fixture libraries use feature- and region-dependent modules that the build now refuses. Reading those fixtures to rewrite them for the new rule.

The REQ-665 suite passes (9/9). Next, the module-build test: its fixture used a `mailing_list` privacy module, and a bad trigger is now caught by the new rule first.

Both pass. Next, `legal_in_use` (checkout, orders, privacy notices).

Now the two jsdom pane tests.

The pane's new section form comes first, so generic selectors in these tests now hit it. Moving "Your own sections" below the editor; the new "Add a document" row is expected in the list.

Existing suites are green. Before writing REQ-669's own tests, checking how the build gets the ticket list, so the "accepts the published library" test can use the real tickets.

Writing REQ-669's own tests. First the node test for the library check, using the build's real ticket reader for "accepts the published library".

All 5 pass. The ticket also asks for the pane in the real builder (jsdom), so reading the existing pane test's harness to add one.

Step 1's tests all pass. Checking the project's lint step and versioning convention before committing step 1 on the branch.

No lint script; typecheck is the gate. The version bump comes at merge time. Committing step 1 on the branch.

55 test files call `acceptTerms` as a fixture. Checking what `admit` needs from it (membership) before deciding what replaces it.

Writing step 2. First `legal-modules.ts` absorbs the few types the build needs, plus the platform providers list.

Removing the leftover generated bundle in the worktree as well, so any remaining import of it fails loudly. Then rewriting `paperwork-legal.ts` without the 1st Contact branch.

Writing the new `terms.ts`.

Still on step 2: the gate is rewritten and typechecks except one call. Fixing it.

The branch's `terms.ts` changed after I first read it (BUG-382, one session per business). Comparing against the committed version so I don't drop that change.

Typecheck is clean. I overwrote whole regions of a few files based on my first read, so checking whether any of them changed between that read and the branch cut.

Only `terms.ts` was affected, and the new version keeps BUG-382's per-business accept address. Checking for other references to the removed bundle.

Remaining references are tests of the superseded path, which I'll handle with the test pass. Checking whether `legal-pages.ts`'s document page is now unused.

Clean. Next is the one-off seed command (`1c legal seed-platform --env …`). Looking at how existing `1c` commands write to a deployed environment.

Wiring Paperwork → Legal writes to publish the legal pages straight away. Adding a `published` hook to the route context.

Typecheck clean. The Legal assistant's detail change goes through the same routes with its own context, so it needs the same hook.

Now the seed itself. Checking `copy.ts`'s origin and service-token helpers so the new command reuses them.

I'll insert that sentence into DOC-120 as its own bullet when I finish the seed. Now the store side of the seed in `client-legal.ts`.

Now the operator-only seed route in the router, next to the other admin routes.

DOC-120 is intact. Writing a node test for the seed builder against the real tickets; first listing the old legal doc tickets' uids and versions.

Only four of the old tickets turned up. Looking for DOC-76, 77, 78 (the Beta Terms) and 79 elsewhere in the store.

They are in the store (on main), and the build's reader sees them: Terms 4 versions, Privacy 3, Beta 1. Writing the seed-builder node test.

Seed-builder tests pass. The worktree's generated module library predates the DOC-116 change, so regenerating it from the real tickets (only that file) before the cutover's workers test.

`local-d1.ts` pre-accepts the bundled documents for the seeded dev identity. With no bundle there is nothing to pre-accept until 1st Contact's documents are seeded, so removing that block.

Now the shared helper that gives a business published standard documents.

Next, the cutover's own workers test. Reading how REQ-203's test signs a 1st Contact invitee in and accepts, to drive the same flow.

Three of four pass. The client is refused before the gate. Getting the full message.

The cutover test passes (5/5). Now the fallout in existing suites that imported the removed bundle or pinned the separate 1st Contact path.

Many more failures than expected (REQ-668, REQ-662, REQ-475 shouldn't depend on the bundle). Looking at one.

Many test environments have no `BLOBS` binding, and the gate now opens the business's ticket store for 1st Contact's users too. Checking whether the store can be opened without `BLOBS` for a read.

Adding `BLOBS` to the test environments that construct one without it, except suites that deliberately test its absence. Checking which suites those are first.

Added the binding in 81 suites' environments. Now the suites tied to the removed bundle, starting with REQ-203 (signing up to 1st Contact): its platform business gets published documents first.

My insertion skipped some multi-line environments because a neighbouring one-line literal already had `BLOBS`. Redoing it scoped to each object literal.

REQ-203 passes with 1st Contact's own published documents. Rerunning the other affected suites.

Both need 1st Contact to have published documents. Applying the same change as REQ-203 to both.

Both pass. Next REQ-662's Legal assistant cases.

REQ-662 passes. Next REQ-245 and REQ-479, which import bundle helpers.

REQ-245 only needs the list of document acceptance keys. REQ-479 checks the feedback clause in the bundled Beta Terms and re-acceptance of older Terms. Reading the rest of that test.

Next, the suites that pin the superseded 1st Contact path: REQ-169, REQ-488 (two files) and REQ-661. Checking their size and what each still proves.

REQ-169 still proves the gate's general rules (refuse sub-resources, no caching, JSON-only, re-prompt on a new version), so I'll port it rather than delete it. Reading how it uses the bundle.

Porting REQ-169: 1st Contact gets published documents, the gate rules are asserted against them, a "bumped" version becomes a material edit of its Member terms, and `/terms` becomes the redirect.

REQ-169 ports cleanly (14/14). Next REQ-488's build test: three cases pin the removed bundle; one ("ticking in the viewer…") is about the acceptance page and should survive.

Keeping only the acceptance-page viewer case, now drawn by `clientTermsHtml`; the three bundle-build cases go with the bundle.

Rewriting REQ-488's workers suite down to the three cases that still apply, against 1st Contact's own published documents.

Next REQ-661: two of its cases pin the separate 1st Contact Legal mode (superseded), the rest are about messages.

Typechecks. Showing the counts in the pane's rows.

REQ-661 passes. Next REQ-665's client suite: the providers call changes, its 1st Contact case is superseded, and saving details now publishes straight away (item 7).

REQ-665's suite passes. Next, the Legal assistant's priming still describes 1st Contact's documents as a separate "level 1" set. Checking which phrases tests pin before editing it.

Those pinned sentences stay unchanged. Editing only the paragraphs that describe 1st Contact separately, textually inside `priming.json` (per the note on its mixed escapes).

Priming-pinning suites pass. Committing step 2 on the branch before running the full suite for wider fallout.

Running the full suite in foreground batches (workers first), then checking any failure against a clean baseline.

That batch timed out at 590s, so re-splitting into chunks of 45 files.

Almost everything in this batch fails, including unrelated suites (PNG codec, material storage). That looks environmental rather than mine. Checking an error.

These failures (`provisionInvite is not a function`, missing accounts) look like long-stale reconciliation suites. Checking the pre-existing-failures memory before building a baseline.

I need a real baseline. Building a detached worktree at the branch's base commit, set up the same way as the branch's.

Batch 1: no new failures against the baseline (2 fewer, in fact). Running the remaining batches on the branch, baselining only the failing files.

Still running the full suite against a clean baseline: five workers batches done, no new failures so far. Checking batch 6.

Four new failures: REQ-188 and REQ-195 rely on accepting 1st Contact's documents making someone a member, so their platform business needs published documents first.

REQ-188 now passes. REQ-195 names its platform differently; looking at it.

Batch 7 found another environment without `BLOBS` (written without the type cast). Fixing it and the same pattern anywhere else.

That REQ-416 case passes on its own (a known timing flake). Running the last workers batch.

Typechecks. Rerunning the four suites.

The extra Terms of sale version (3, not 2) might mean the rebuild and the publish build different text. Printing the versions to see what differs.

Two left. The REQ-666 case pins "1st Contact's own documents are not edited here", which this ticket reverses. Checking REQ-642.

Both pass. The workers project is done, with every new failure fixed or confirmed as a flake. Now the node project, in batches of about 50.

The node project has 993 files (20 batches). Narrowing to the files that could be affected: legal, render, priming, assets, Paperwork, acceptance and the `1c` CLI.

Node batches 1–4 show no new failures against the baseline. Continuing with batch 5.

The selected node suites show no new failures. My last change narrowed which rebuilds re-plan, so re-running the legal suites to confirm.

All 22 legal suites pass (104 tests). Committing the fallout fixes, then starting step 3.

Writing step 3. First the library keeps every published version, with helpers for what is in force on a given day and what is still coming.

Next, in `client-legal.ts`: the revisions still to come that would change a business's documents, with old and new wording and the date, shown in its Legal mode.

Typechecks. Now the owner message: a fixed `legal_revision` trigger with editable copy, and its notify kind.

Still on step 3: the owner message trigger is in and typechecks. Tidying that import, then writing the scheduled job and its migration.

Writing migration `0060_legal_revisions.sql` and registering it with the test factory and the manifest.

Migration, factory marker and manifest are done. Before writing the job, checking `notify()`'s signature and how an existing caller finds the owner and delegates.

Still on step 3. There is no deep link into Paperwork, so the message links to the business in the builder. Now writing the scheduled job.

No shared helper exists. In the scheduled handler I'll use the orders job's rule (the Stripe Connect return address's origin), then `app.<APEX_HOST>`. Applying the two fixes to the job.

Typechecks. Next, the consultant and the Legal assistant need to say what is changing and when, and the pane needs to show the notice. Starting with the consultant's publish summary.

Now the Legal assistant: a read-only tool for the coming revisions. Reading how an existing read op is declared in its surface.

Typechecks. Adding the notice to the Legal pane: on each affected document, the day and each changed section as it is now and as it will be.

The pane loads. Now regenerating the worktree's module library (it now carries every version), then writing the revisions tests.

The overview and the consultant's summary are right, but the job sends no message. Debugging what the announcement does.

Three businesses were counted as told but nothing was sent, so `notify()` is refusing or skipping. Making the job log a notification that wasn't sent (useful in production too) to see why.

The message is sent now; my test reads a field it doesn't have. Checking the `Message` fields.

Test 1 passes. The other two share test 1's revision, which is already fully applied by the time they run, so each test gets its own revision.

All 5 pass. The job now also tells businesses created during the notice period, which is behaviour I added, so it gets its own test (and a line in the ticket).

Rerunning the other legal suites: those whose fixture revisions are dated after the baseline now wait 14 days.

Both pass. Adding a pane case for the revision notice in the real builder (jsdom).

Adding a Legal assistant case for `standard_revisions`, in the suite that already drives the assistant with a scripted model.

The publish needs the site to have an address first; adding it.

Adding one sentence to the Legal assistant's priming about announced revisions and `standard_revisions`.

Typechecks clean. A new fixed trigger can break suites that enumerate the triggers, so finding those first.

Three failures; REQ-240 and REQ-473 both showed failures in the baseline earlier. Confirming they are the same cases.

Both are the same pre-existing failures as the baseline. Checking whether any other suite's module fixtures are dated after the baseline (they would now wait 14 days).

Only a draft in the module-build test is dated later, and drafts never reach the library. Committing step 3.

That ran in the baseline worktree (the shell's directory had moved). Rerunning the commit from the branch worktree.

Step 3 is committed. Re-running the suites most exposed to it: the scheduled handler and the REQ-6xx batch.

The one failure (BUG-249) is a known pre-existing one. Re-running the REQ-6xx batch.

The REQ-6xx batch is fully green. Preparing to land: checking this project's version-bump script and the memory's landing order.

Before landing, updating the ticket body with what was built, the decisions made while building, how the test plan maps to UATs, and what you need to run. Checking the append flag first.

Ticket updated. Landing now: lock, merge `xgd-working` into the branch.

BUG-386 made `recipients` required on every trigger and added an "always on" reason. Bringing my `legal_revision` trigger in line, then typechecking.

Both typecheck. Refreshing the worktree's generated files from the main checkout after the merge, keeping my regenerated module library and leaving out the removed bundle.

BUG-386 and BUG-383 suites pass. Checking whether anything else that arrived with the merge uses the removed bundle or old terms helpers.

All pass. Committing the post-merge adaptations as their own commit (edits inside a merge commit get lost at reconcile), then bumping the version.

Before landing, running the suites that arrived with the merge against my changes.

The only failures are in `reconciliation-client-knowledge-base`, the same 9 that fail on the baseline. Landing now: bump on the branch, then merge into `xgd-working` with `xgd-merge`.

Merged into `xgd-working`. Moving the ticket to `free_coded` with every commit's full SHA.

Now cleaning up the branch (as its own call), then the baseline worktree.

Landed and moved to `free_coded`. Updating the memory note that describes the removed bundle, and recording the test-environment trap.

REQ-669 is built and landed on `xgd-working` in six commits, and the ticket is at `free_coded` (version 0.2.832). All three steps are in. Nothing is deployed and the one-off seed has not been run; both are yours.

**What changed**
- **Owner-added sections:** in Paperwork → Legal, a standard document gets "Add your own section", placed at the start, after one of our sections, or at the end. The document stays Standard, and saving writes a new version with the "tell people / ask again" switch off by default.
- **The business's own documents:** you can add a document of one of three kinds (display only, accept once, accept every new version). Edits save a draft, "Publish new version" is a separate step, and withdrawing keeps everyone's acceptances.
- **Signed-in customers** agree to the Member terms, read the Privacy notice, and accept any of the business's own documents that ask for it. They are never asked to accept the Terms of use. Every business has Member terms; they are linked from the acceptance page, not the footer.
- **Library check:** the build refuses a Terms of use, Privacy notice or Member terms module that isn't `always`/`any`, and a Terms of sale module not triggered by selling. Site features no longer change any document. DOC-116 is now `always`.
- **1st Contact cutover:** its documents are its business's records, with the same gate, Legal mode and pages as any client. The build no longer bundles its documents. `/terms`, `/privacy` and `/beta-terms` (and dated versions) redirect to the legal pages on its own site. DOC-120 now carries the "You can add your own sections" bullet.
- **Legal pages publish on their own:** saving details, editing, adding a section, or publishing or withdrawing one of the business's own documents rebuilds the published sites straight away. So does selling starting or stopping.
- **Standard revisions:** a new version of a module is announced to affected owners: a message with the old and new wording and the date, plus a notice in Paperwork → Legal. It reaches the site 14 days later; an edited document is told as advice and never changed. The consultant and the Legal assistant can say what is changing and when.

**What you need to do**
1. Deploy (it includes migration 0060).
2. Straight after, run the seed. With the Access service token in `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET`:
   `NODE_USE_ENV_PROXY=1 node tools/generate/bin/1c.mjs legal seed-platform --env production`
   Run the same with `--env dev` for dev. **Until it runs, anyone signing up to 1st Contact gets no acceptance page and no business.**
3. Expect two things from the seed. 1st Contact's contacts with an email address get "We've updated our privacy notice". Every 1st Contact client is asked to accept the Member terms, Privacy notice and Beta Terms again; earlier Beta Terms acceptances don't carry over.

**Decisions for you to check**
- **Opt-out:** the revision message carries "Stop these emails", like the other notifications. Should a legal notice be opt-out-able?
- **Shipping changes:** only a legal change or selling starting/stopping re-plans the documents. A change of shipping countries (which can add a Terms of sale region section) waits for the next publish or legal change. I chose this because webhook-started rebuilds couldn't otherwise be kept consistent.
- **When a revision counts:** its 14 days run from its version date. Versions dated on or before 2026-11-08 (today's library) are in force at once. So EPIC-29 should date a revision the day it is published.
- **Acceptance counts:** "how many have accepted which version" used to exist only for 1st Contact. It is now in every business's Legal mode and pane.
- **Where the work runs:** the legal rebuilds run in the Worker, on the same path catalog rebuilds already use, not in a container.

**Tests**
- New `test_UAT_FC_REQ-669_*` suites cover each item in the test plan, plus a Legal assistant case in REQ-665's suite.
- Suites pinning behaviour this ticket supersedes were rewritten: REQ-169, 488, 661, 665, 666, 479, 642 and 192.
- About 85 suites needed the `BLOBS` binding added to their test environments, because the gate now reads each business's own records.
- I compared the full workers project and the 320 node suites that touch this code against a clean baseline: no new failures. The existing red suites are unchanged (`reconciliation-*`, REQ-240, REQ-473, BUG-249, and a REQ-416 flake that passes on its own).
- I did not run the other ~670 node suites or the browser tests.

<!-- xgd-chat-end -->