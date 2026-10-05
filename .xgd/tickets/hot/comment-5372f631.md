---
uid: comment-5372f631
id: COMMENT-5122
type: comment
title: Comment on request REQ-391
created_by: xgd
created_at: '2026-10-05T01:18:12.047040+00:00'
updated_at: '2026-10-05T01:48:22.145203+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-3ed38543
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "ed4eb200-4b4c-4bde-be95-a52a1702e373",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="ad7108cc-4642-4f06-8ec3-77183a0cb073-user" -->

<!-- xgd-chat role="user" ts="2026-10-05T01:16:20.236791+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ad7108cc-4642-4f06-8ec3-77183a0cb073-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-05T01:48:21.171639+00:00" -->
#### Claude
Still reading the builder's pane and page code. The research agents haven't reported yet.

Found where the page dropdown adds "— unreachable" (`toolbar.js`). Now looking for the server code that builds that page list.

Reading how the renderer decides which pages get published. That tells me how to keep alternative looks off the live site.

Now reading how the builder registers its preview modes. The alternatives carousel will sit there, next to the comp viewer.

Waiting on the two research agents before settling the design. I've got the UI side mapped: preview panel, page dropdown, comp viewer, width control, renderer.

Branch cut and worktree repaired. Starting with the data model: an `alternative` block on a page.

Now adding the schema.

Now the site-level checks: an alternative must point at an existing page that isn't itself a look, and nothing may navigate to one.

Now the renderer: looks are rendered for the draft preview but never into a published revision.

Schema and renderer done. Next are the edit operations: make a set, choose a look, and the page listing.

Writing the two edit operations now: make a set, and choose a look.

Now the page listing, and the home-page rule.

Next, the consultant's two operations (`make_alternatives` and `choose_alternative`) in the tool declaration and toolbox.

Wiring the two consultant operations into the toolbox.

Now the plan side: one function that records a choice as a decision, used by both the client's button and the consultant.

Hooking up the imports so the consultant's choose operation can reach both the site and the plan.

Typecheck is clean. Next is the server route behind "Choose this one".

The choose route is written. Making it work on the local dev builder too, which has no ticket store and so no plan.

Now the builder UI. First, checking how the preview remembers which page you were on. "Back to your draft" must return to the real page, not the look you were viewing.

Before the carousel itself, the panel needs two abilities: keep the neighbouring looks loaded in spare frames, and animate a swap. Reading the pane CSS first.

Implementing the spare frames and the animated swap in the panel.

Now the CSS for the swap. It animates opacity and the separate `translate` property, so it doesn't fight the width control's `transform: scale`.

Now the shared carousel control (‹ label · n of N ›). Checking what the comp viewer's tests pin before I swap it in there.

Writing the shared carousel control, then the looks controller.

Switching the comp viewer over to the shared carousel.

Now the looks controller and its two toolbar controls.

Wiring the looks into the builder app: the mode, toolbar controls, chat link, and leaving the carousel on a site switch.

Hooking the "Choose this one" transport into the app, then adding the chat-link hook.

Adding the consultant's priming on sets. It goes in both priming lists, right after the comps step.

Checking whether tests pin the priming entries, or the surface version I just bumped.

Regenerating the consultant's tool reference (`REF-surface.md`, which is built from the declaration I just changed) so the two don't disagree.

`REF-surface.md` is a gitignored build artifact, so there's nothing to commit there. Now the UATs. Looking at the workers-suite harness the comp board tests use.

Writing the UATs now, starting with the consultant/edit-surface suite. First, how the existing suite proves an email page is never published.

I left junk in the second test. Fixing it to check the CLI's human page listing.

The tool declaration treats every `array` as an array of strings. Checking how the library declares an array of objects.

The fix is a declared `param_type` whose items are objects. Adding one to the surface declaration.

Pages list in store-key order, so the carousel would come out alphabetical rather than in the order the consultant gave. Adding an `order` to each look.

The node suite passes (7/7). Now the builder UAT in jsdom. Checking how the page-control suite mounts the builder with a fake page listing.

Tidying a leftover in that test, then running it.

All 7 pass, and they genuinely ran rather than skipped. Now the workers suite: the "Choose this one" route recording the plan decision, and the consultant's choice on the client's say-so.

The scripted `make_alternatives` call didn't create anything. Checking what the tool answered.

"Not enabled": where this deployment hands building work to a builder worker, the consultant's write tools are narrowed away. Looking at what that narrowing keeps.

Moving the consultant's choose onto the plan surface as `choose_look`, with the site write supplied by the host as a port.

The plan declaration's formatting doesn't survive a JSON re-dump, so I'll insert the new operation as text.

Now the plan-core operation and its port.

Removing the old site-surface `choose_alternative` and wiring the host port instead.

Updating the priming to name `choose_look` and to cover the case where a builder worker makes the set.

Making the set in the workers suite would go through a delegated builder, so I'll seed the looks as fixture data. The choose-side assertions move from the node suite into the workers suite.

Rewriting the workers suite around seeded looks.

The write was refused because the file had changed since I read it, so that run used the old file. Removing it and writing again.

A real bug: the rejected labels come out in page-store order, not set order. Fixing it in `editAlternativeChoose`.

All REQ-391 UATs pass: 4 in workers, 11 in node/jsdom. Now the regression scope around what I touched: panel, toolbar, comp viewer, page list, consultant surface, plan, priming, renderer, schema.

13 failures. Some will be pre-existing (my notes list several suites that fail on a clean tree), so I'm checking the same files in the main checkout for a baseline.

Seven of the 13 fail on a clean tree too (BUG-64, BUG-48 ×4, REQ-148 ×2). Six are mine: AC1073, AC970, BUG-79, BUG-94 ×2, REQ-126. Investigating each.

Updating the AC970 test's declared strip to include `compare-looks`, then rerunning the regressions.

All six now pass. Rerunning the whole node/jsdom regression batch, then the related workers suites.

Only the 7 pre-existing failures remain. Now the related workers suites.

Workers: 14 files, 71 tests, all passing. Adding schema/validation, lint and typecheck.

Nothing enumerates the builder's files, so the new modules ship as-is. Before committing, re-reading my notes on how this repo's free-coded gate expects versions and SHAs.

Ticket body updated. Committing on the branch.

Committed. Taking the merge lock and merging back into `xgd-working`.

The merge stopped on a conflict in `host-core.ts`. Another session changed it in the meantime. Looking at the hunks.

Import-only conflict: keep both sides.

Resolved and typechecks clean. Before committing the merge, checking that the auto-merged surface declarations are sound, then rerunning my suites on the merged tree.

Green on the merged tree: 76 node/jsdom tests and 11 workers. Committing the merge, staging only the resolved file.

Merged. Moving the ticket to `free_coded` and letting the gate bump the version itself.

The ticket is `free_coded`, with the feature commit and the auto version bump (0.2.496) recorded. Tearing down the branch, which releases the lock.

REQ-391 is implemented, merged into `xgd-working`, and parked at `free_coded` (feature commit `3036062eb7`, auto version bump to 0.2.496). The ticket body describes what landed, and the branch is cleaned up.

**Making a set.** A look is now a page tagged with whose look it is, its set, label and description. The consultant's new `make_alternatives` copies the page once per look in one call, and returns a chat link that opens the set. It can also take an existing hand-built page, like Charlie's `/workwear`, into a set. Looks are never published but do show in the preview.

**Page dropdown.** Looks are left out. An ordinary unlinked page now reads "not linked from the site" instead of "unreachable".

**Carousel.** It opens from a "Compare looks" button, shown only while a set exists, or from the chat link. It shows ‹ Workwear · 1 of 3 ›, the description, "Choose this one" and "Back to your draft". The width control and "Open in new tab" work on the shown look. The looks either side are loaded in spare frames, and moving between them is an animated swap (instant with reduced motion).

**Choosing.**
- The client presses "Choose this one". The consultant, on the client's say-so, uses `choose_look` with the client's own words.
- The page keeps its address, title and search text, and takes the chosen look's content.
- The decision goes into the plan with the set and the looks not chosen.
- All looks in the set are archived rather than deleted.

**Comps.** The comp viewer uses the same carousel, without "Choose this one".

**Priming.** Both priming lists gain a "looks" entry telling the consultant to build looks as a set, never call a page unreachable, post the link, and use `choose_look`.

Decisions that differ from what the ticket assumed:
- **Undo:** the draft has no undo or revision history. When a look is chosen, the page as it was is kept as an archived look called "Before Coastal" (for example), and choosing that puts it back. This is how "revertible" is met.
- **Who can choose:** where building is handed to a builder worker (as in the workers deployment), the consultant has no site-write tools. So the consultant's choose operation lives on the plan surface, which it always keeps. `make_alternatives` is then run by the builder worker.
- **Earlier tickets:** this supersedes three earlier choices. REQ-248/252's "— unreachable" dropdown label and REQ-378's "Viewing: X" banner with Previous/Next buttons are replaced, and I updated their tests to match. Two tests that list every consultant tool or toolbar control also gained the new entries.

New tests: 4 for making a set, 7 for the builder carousel, and 4 for choosing through the real routes. All pass, including on the merged tree. In the wider regression run (about 50 node/jsdom suites and 14 workers suites), the only failures are 7 that fail the same way on a clean `xgd-working`: BUG-48 ×4, BUG-64 ×1 and REQ-148 ×2.

Not done: I haven't driven it in a real browser or deployed it, so the animation, styling and the live chat link are only checked in jsdom. The ticket is ready for you to try on the dev deploy or promote to `ready_to_reconcile`.

<!-- xgd-chat-end -->