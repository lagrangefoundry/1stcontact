---
uid: comment-c58de9a6
id: COMMENT-5551
type: comment
title: Comment on bug BUG-250
created_by: xgd
created_at: '2026-10-21T21:35:04.197876+00:00'
updated_at: '2026-10-21T21:54:57.631584+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-0ed9c7de
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "0babf6a7-0e57-4a89-aa9b-563f324a7e55",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d2c89cdd-334c-4d2d-84d7-50fefc8962b2-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T21:34:13.505438+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="d2c89cdd-334c-4d2d-84d7-50fefc8962b2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-21T21:54:56.170828+00:00" -->
#### Claude
I'm reading the looks band and toolbar code to see how modes work before I cut a branch.

I've mapped the display panel; now checking how the page index tracks the shown page, and the `show_client`/pane-reporting code.

Now the BUG-246 reporting path, server side and existing tests.

I'm checking whether the consultant has a way to set looks aside when the client keeps their page, since the ticket relies on that.

Server side has no "keep current" op; I'll keep this client-side and fix the stale consultant text. Now reading the existing looks tests to learn the harness.

Scope is clear. Setting the ticket to `free_coding` and cutting the branch.

Branch cut. Checking the URL helpers before writing the new mode.

Writing the new `looks.js`: looks-only members, a Looks-mode controller, and the band with the compare link.

Now config strings, CSS, and app.js wiring.

Now redraw the toggle when Looks becomes offered or not.

Now the server-side view report: accept `look` and name it in the digest.

Updating the consultant's priming and tool descriptions, which still describe the old carousel and "Choose this one".

Code is in place. Running the existing looks suites to see what breaks (and whether the webui suites run in this worktree).

The webui suites run here; all 15 failures encode the superseded View-carousel/"Current" behaviour. Reading those tests to decide which to retarget and which to drop.

I'll retarget these suites to the new model (Looks tab, looks-only ring) and put the new behaviours in a BUG-250 suite. Starting with REQ-391.

BUG-205's suite pins exactly what this ticket reverses (no mode, draft as a position); I'll delete it and carry its still-valid checks into the BUG-250 suite. Now the rest of REQ-402.

Retargeting REQ-402's band tests to Looks mode.

Now writing the BUG-250 suite. Reading the BUG-246 harnesses to reuse their view-capture and digest checks.

Writing the BUG-250 builder suite.

Now the server-side digest test, then run everything.

Two jsdom-visible gaps: the toggle needs to follow `src` (not only `document`), and the page index's `pending` page survives a mode switch. Checking how `pending`/`relOf` work.

`pending` describes the shown frame's destination, so it should drop when a mode switch shows a different frame. Adding that, plus the `src` hook for the toggle.

The pane is on `/draft/`, which is the home page; the assertion was too strict.

Targeted suites pass. Now a wider sweep: every test that mounts the builder or reads the priming, tool surface, roles or pages modules.

Many file-level failures look like the fresh-worktree missing-artifact problem. Checking the reasons.

I need a baseline to separate pre-existing failures. Running the remaining batches first, collecting failing test files.

Individual failures worth checking: BUG-52/53/63/79, REQ-127/179. Looking at their assertions.

BUG-79 (frame count) and REQ-179 (`looks.js` reads the pane's site) are mine. Looking at those and BUG-52.

BUG-79's count is the expected consequence (Looks is a third document mode, with its own frame); REQ-179 forbids `panel.getSite()` in surfaces, so I'll drop that check.

Remaining failures look unrelated (`logDir`, delegation, missing generated artifacts). Committing WIP, then running the individually-failing files on both my tip and the base to compare.

zsh passed the list as one argument. Re-running via xargs.

With the artifact in place, running all the affected workers suites.

REQ-295 is a known pre-existing failure; checking REQ-342 and REQ-416, which read the priming.

Both pre-existing on base. Now lint and typecheck on the changed files.

No lint script; typechecking the server change with `tsc`, filtering to `roles.ts`.

Clean. Reading my notes on this project's free_coded gate before committing.

Amending the WIP into the real `[FREE-CODED]` commit (no hand bump — the gate bumps itself).

Now updating the ticket body to match what was built (keeping the operator's text).

Body updated. Now lock and merge back into xgd-working.

Another ticket (REQ-423) holds the merge lock; waiting for it.

Lock acquired. Merging.

Merged (clean). Moving the ticket to `free_coded`, letting the gate bump the version itself.

Looks is now its own mode. BUG-250 is at `free_coded`: commit `5657a56e40` plus the version-bump commit the gate added, merged into xgd-working, with the branch cleaned up. The new and retargeted looks suites pass. Every remaining failure in the wider sweep also fails the same way without this change.

**What the client sees**
- **A Looks tab** in the mode bar, only while the page shown has looks. When the consultant chooses a look (or the looks are cleared), the pane goes back to View on that page and the tab disappears. The consultant's `show_client` and looks links open Looks on the named look, from any page.
- **Only the looks.** The band moved into Looks unchanged (‹ Name ›, "N of M", full description, "Tell the consultant…", cross-fade), and "Current" is no longer a position.
- **The Looks toolbar** has only width, View on your phone and Open in new tab. Colours, the page selector, Publish and the Edit-only controls are gone. The Edit tab in the mode bar stays, but it leaves Looks to edit the real page — nothing edits a look.
- **"Compare with your current page"** in the band switches to View on the real page. Clicking the Looks tab again returns to the same look.
- **View and Edit have no carousel.**
- **What the consultant is told** now includes which look is open, e.g. *The client is looking at: Looks (the "Workwear" look).*

**Decisions I made**
- If the builder was closed while in Looks, it reopens in View, because the list of looks hasn't loaded yet and a look may have been chosen meanwhile.
- If the client switches mode while a page they picked is still loading, the builder now goes by the page that's actually showing instead of the one still loading.
- I added no server operation for "keep my current page". The consultant's instructions and tool descriptions now record that answer with `set_decision`; the old "Choose this one" wording is gone. The looks stay on offer until the consultant chooses one or clears them.

**Tests**
- New suites: `test_UAT_FC_BUG-250_looks_mode` (in the builder) and `test_UAT_FC_BUG-250_the_consultant_is_told_the_look` (consultant side).
- I updated the REQ-391, REQ-402 and REQ-413 suites to the Looks mode. BUG-79 now expects three frames (View, Edit, Looks).
- I deleted `test_UAT_FC_BUG-205_looks_on_the_toolbar`, since this ticket reverses what it tested; the checks that still hold moved into the BUG-250 suite. The ticket body lists this under "Supersedes" for reconciliation.
- The failures that were already there include BUG-52/53/63, REQ-127/259/285/295/342/398/416 and REQ-117. I compared them against the commit before mine and they match.
- To run the workers suites in the branch I had to copy `apps/control-app/src/generated` (which git ignores) over from the main checkout.

The ticket body now has an "As built" section describing what was implemented. The ticket is ready for you to promote to reconcile when you're happy with it.

<!-- xgd-chat-end -->