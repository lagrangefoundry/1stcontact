---
uid: comment-66cb2730
id: COMMENT-7941
type: comment
title: Comment on request REQ-665
created_by: xgd
created_at: '2026-11-07T21:32:31.334981+00:00'
updated_at: '2026-11-07T22:28:39.613810+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-51d90ad9
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "b1e8b9ee-611e-46f7-b705-4da18506feb2",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="7870d9e2-da3a-488f-8bd1-a59db0d871fc-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T21:31:06.709235+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="7870d9e2-da3a-488f-8bd1-a59db0d871fc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T22:28:34.946421+00:00" -->
#### Claude
Reading the ticket and mapping the existing legal/Paperwork code before planning the implementation (not a duplicate — REQ-666 is its follow-on).

Now set the ticket to free_coding and cut the branch.

Still mapping: I've got the per-business record store pattern (REQ-660) that the legal document versions will follow; waiting on the scouts for the publish and feature-detection details.

Scouting done. Now reading the render path where the legal pages will be generated.

Design settled; starting the read of the publish route, which is where legal documents get rebuilt and pages added.

Mapping where the consultant's `status` answer is built, to add the pre-publish legal summary there.

Now reading the Legal pane and the Legal assistant code I'll extend.

Reading the legal Markdown sink to decide how placeholder values get escaped.

Writing the core now. Checking a couple of type shapes first (shipping, countries).

Writing the shared module library definition (types, closed sets, build-time validation).

Now the build step in `1c assets`.

Adding legal pages and automatic footer links to the site renderer.

Now the publish hook, rebuild, and preview.

Writing the core client-legal module (details, feature detection, building, versions, overview, publish hook).

Adding backslash-escape support to the legal Markdown sink so escaped placeholder values render as literal text.

Renderer works (markup in values comes out literal and inert). Registering the record types in the business store's type pack.

Wiring the Legal mode routes (overview, details, edit, preview, back-to-standard).

Now the publish/status/preview/rebuild wiring in the router. Checking the store-owner record and rebuild caller first.

Plumbing the legal port into the edit layer (Page menu rows, `status` summary) and the consultant's publish op.

Writing the Legal assistant's client port and new operations.

Now the legal-core surface: new client ops and groups.

Running the typecheck over what's written so far.

Now rewriting the pane's Legal section.

Adding a library injection seam (`RouterDeps.legalLibrary`) so UATs can drive the real router with a fixture library; the real module texts will be draft doc tickets the operator publishes.

Typecheck clean. Now drafting the module library texts as doc tickets. Checking the existing legal doc ticket's field shape first.

Drafting the module texts (22 sections across the four documents, US/UK/EU) as draft doc tickets.

Drafts validate (30 modules). Creating them as draft doc tickets in the project store.

30 draft modules created (DOC-87–DOC-116). Now the UATs — finding an existing workers test that publishes a site through the real router to copy its harness.

Writing the workers UAT next (real router + D1 + public-site Worker); checking how shipping zones are saved so the test uses the real write.

Renaming two ops so no tool name contains another surface's op name (the REQ-662 grant test checks substrings).

Updating the Legal assistant's role prompt to match its new abilities (details yes, document text never).

Updating the consultant's `publish`/`status` descriptions so it tells the owner about legal changes before publishing.

Now writing the workers UAT suite.

Writing the workers UAT file.

All 10 workers UATs pass. Small cleanup in the test, then the Legal assistant UAT.

Writing the Legal assistant UAT (scripted model through the real router).

The development tool's model-facing name is `RequestCapability`. Fixing the test and the prompt/overview wording to match.

The two failures are exactly the behaviours this ticket supersedes (REQ-661's "a client business has none" and REQ-662's "Legal grant has no write"). Updating those tests to the new contract.

Now the builder pane (jsdom). Reading the REQ-661 tab harness.

Writing the pane UAT for a client business.

Pane UATs pass. Adding a build UAT for the module bundler (`1c assets`' writer) — modeled on REQ-488's.

All new UATs pass. Now the regression scope: suites touching render, publish, preview, page list, the surfaces, priming and the asset build.

Getting a baseline for those six files on the unmodified checkout before deciding which are mine.

All 15 fail identically on the untouched checkout (pre-existing). Checking that my change didn't move the numbers inside the already-failing budget/page-list tests.

Both were already over/failing before my change. Still, I'll trim my additions to the consultant's surface text to keep its prompt growth minimal.

Now the node-project regression scope.

Many of these look pre-existing (e.g. BUG-375's default order pages in page lists). Baselining the failing files on the untouched checkout.

The remaining ones all say the control-app assets aren't built in this worktree. Confirming that's only a location artifact by linking the main checkout's built assets in temporarily.

No new node regressions (both remaining failures are identical on the baseline). Running render/publish suites that weren't in the first scope, plus my suites again.

Identical on the baseline. Now the 193 extra workers suites, in two chunks.

121 failures — likely mostly pre-existing, but some (material types, ticket-store registry) could involve my new record types. Baselining these files.

Workers chunk 2.

No new failures in chunk 2. Re-running the typecheck, all REQ-665/661/662 suites, and the first workers scope after the last two fixes.

Typecheck clean; same 15 pre-existing failures, all REQ-665 workers suites included and passing. Final run of the node-side REQ-665 suites.

All green. Updating the ticket body (appending the implementation record, keeping the existing text) before committing.

Committing on the branch.

Committed. Now the merge-back: lock, merge xgd-working into the branch, bump the version, fast-forward back.

Merge was clean. Quick post-merge typecheck and REQ-665 workers run, since other sessions' work just came in.

REQ-665 is built, merged into xgd-working, and parked at `free_coded` (commits `4451eff2` and `fe54781a`, version 0.2.818). It isn't a duplicate: REQ-666 is the follow-on (checkout terms, member acceptance, change notices).

**Before client sites see any of it, you need to review and publish the module texts.** I drafted the 30 module texts as doc tickets DOC-87 to DOC-116, covering the four documents with US, UK and EU variants. They are at `legal_module_status: draft`, following how DOC-76 to DOC-85 were handled, so the build ignores them. Until you set them to `published`, a client business gets no documents or pages. Then the next `1c assets`/deploy bundles them, and each client site gets its pages at its next publish. These are first drafts written by me, not a lawyer, and the lawyer review before paid launch still applies.

What a client business now gets:
- **Legal mode**:
  - **List**: its own documents, each tagged Standard or Edited by you, with version, history, and which site feature or region added each section.
  - **Business details form**: legal name, trading name, address, email, country, returns window, delivery note.
  - **Editing and the warning**: Markdown editing with a preview. An edited document shows a warning, with the section's text, when the standard version would add or remove a section, plus "Go back to the standard version".
- **Detection from the site**: contact form, mailing-list sign-ups, selling (Stripe can take payments and at least one shipping country), signed-in customers, and images or video served from another site. Regions come from the business's country plus where it ships, so a US shop shipping to Ireland gets the EU cancellation section.
- **Publish**: standard documents are rebuilt and served as static `/legal/...` pages, with links added to every footer and the pages listed in the Page menu. A change to the legal documents alone (new details, an edit, going back to standard) is enough to publish. A Shop save keeps the pages on the site.
- **Before publishing**: the consultant's `status` now lists the legal sections being added or removed and why, and its `publish` instructions tell it to say these first.
- **Legal assistant**: it can change business details (the same write the form uses), explain a section, say what turning a feature on or off would do, and file a missing clause as a `RequestCapability` request. It still has no way to write document text.
- **Privacy notice providers**: the list is read from your published Privacy Notice's provider table, so adding a provider there updates every client's notice at its next publish.
- The 1st Contact business's own documents are unchanged and read-only.

This changes two behaviours earlier tickets had pinned, and I updated their tests: REQ-661's "a client business shows no documents" and REQ-662's "the Legal assistant has no write".

**Testing**: the 19 new tests pass, along with the updated REQ-661/662 and REQ-488 suites, and the typecheck is clean. I ran about 500 related test files. Every failure in them also fails, the same way, on the unmodified checkout. That includes the consultant prompt-budget test, which was already over budget before this change. I kept my additions to that prompt small.

One existing problem I noticed and did not file: the consultant's own `publish` tool calls `publishSite` without the shop catalog, so a consultant-triggered publish would render without product pages.

<!-- xgd-chat-end -->