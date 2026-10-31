---
uid: comment-1330f086
id: COMMENT-5772
type: comment
title: Comment on bug BUG-301
created_by: xgd
created_at: '2026-10-27T19:18:22.566511+00:00'
updated_at: '2026-10-27T19:54:32.187274+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-de4fe8a8
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "7238009e-e0c8-4b6c-be36-07bf6e458b1b",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-27T19:18:16Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-27T19:18:16Z" -->
#### You
465 is still concerned about 3 unresolved contradictions - can you check its last turn

<!-- xgd-chat role="assistant" ts="2026-10-27T19:18:16Z" -->
#### Claude
Verified: D-1..D-6 resolved by REQ-473. Open: D-7 (framework Development tickets manual says filing is not on your own initiative; consultant priming says it is), D-8 (Delegation overview says put checks in accept; milder than DOC-70 says, one sentence in the consultant text reconciles it), D-9 (plan-core agendaLines says other questions wait, then lists due questions; 2,000-char cap unchanged).

<!-- xgd-chat role="user" ts="2026-10-27T19:18:16Z" -->
#### You
Please create the ticket. I am good with bug tickets being automatically generated the only caveat is that this will not currently work in production

<!-- xgd-chat role="assistant" ts="2026-10-27T19:18:16Z" -->
#### Claude
Filed one ticket for all three. D-7 resolved as: file on own initiative, but the ReportBug clause is given only where ReportBug is in the grant, since production has no filing address. The framework manual sentence needs an override here or a lagrange-framework ticket.

<!-- xgd-turn id="fb413859-cfe5-42c3-8075-53c79001855c-user" -->

<!-- xgd-chat role="user" ts="2026-10-27T19:22:38.906836+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="fb413859-cfe5-42c3-8075-53c79001855c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-27T19:54:28.989622+00:00" -->
#### Claude
Reading the ticket and the priming code now, before cutting the branch.

Found the mechanism: priming entries can be static text or providers that return null to drop out. Checking how the grant reaches the provider registry.

Checking how the existing REQ-473 test reads the consultant's grant, to derive "ReportBug granted" the same way.

Working out how the host can ask the consultant's toolbox whether ReportBug is granted.

Vocabulary confirmed (`passed`/`failed`/`unverified`/`unreported`). Now the plan-entry part (D-9).

Scope is clear and the ticket body covers it; no blocking questions. Setting status and cutting the branch.

Worktree ready. Checking how "authored" prompt size is measured before moving the rules entry to a provider (a REQ-473 budget test depends on it).

Now editing `priming.json` textually (a JSON round-trip would churn the file's escapes).

Now the roles.ts provider.

Test fakes bind a box with only `manual`, so I'll have the host pass the grant fact as a value (like `delegating`/`writing`) instead of the provider calling `schemas()`.

Now the overview override in `development.ts` (1stcontact already amends that overview, so the override belongs here, no framework ticket needed).

Now D-9 in `plan-core.ts`: hold the due-check questions back while the draft is unseen.

Making the 2,000-char cap cut between lines rather than mid-line (cheap, and removes the DOC-70 concern whatever the plan size).

Code changes done. Now tests — reading the REQ-473 harness imports so the new UAT can reuse it.

Writing the workers UAT (compact pattern from BUG-129: real Worker route, two deployments differing only in the filing address).

Now the node UAT for D-9. Checking the BUG-269 fixture style.

That second test got muddled; rewriting it cleanly.

Now retargeting the REQ-273 assertion that pinned upstream's sentence.

Retargeting the REQ-473 tests: `rules` is now a provider, so their static-text readers also take the rendered rules (both variants).

Running the node-project suites touched first.

Now the three pinned tests: REQ-182, REQ-408, REQ-428.

Node suites green. Now the workers suites (new BUG-301 UAT, retargeted REQ-273/REQ-473, plus REQ-379 which pins the due-check line and BUG-129's priming ceiling).

Two failures. Checking whether the budget one is pre-existing by running it on clean `xgd-working` in the main checkout.

The budget failure is pre-existing on clean `xgd-working` (206,555 > 205,000); my change adds 245 chars. Now retargeting REQ-379.

The turn here carries no draft view, so the draft is still unseen and the question is now held. Retargeting the assertion; the stored check still proves it fell due.

Now a wider sweep: every test importing plan-core, roles, development, or host-core.

While that runs, updating the ticket body (keeping the existing content, adding what landed).

Some of these are mine: BUG-236 and REQ-389 read the static rules text. Others look environmental (webui origin, BUG-124's listener). Getting the full batch-1 file list.

Baselining all 11 failing files on clean `xgd-working` to separate mine from pre-existing.

Four are mine (BUG-236, BUG-241, BUG-245, REQ-389). The other six fail on clean `xgd-working` too. Looking at how mine read the priming.

Node sweep accounted for: all remaining failures are pre-existing. Now the workers files (90) in batches.

Baselining these two on clean `xgd-working`.

Pre-existing (identical 5 failures on clean). Last workers batch.

Baselining batch 3's failures on clean `xgd-working` (REQ-473's budget one is already known).

REQ-410 is mine. REQ-428 and REQ-458 match the baseline counts but touch the agenda, so I'm comparing test names too.

Same names as baseline for REQ-428/458. Fixing REQ-410.

Running the remaining static-priming readers to make sure none needed the rules text.

All green. Quick typecheck.

Typecheck clean for the changed files. Reading my promotion-gate notes before committing.

Committing the code on the branch.

Committed. Now the lock, merge `xgd-working` into the branch, then bump the version at the tip.

Fast-forwarding `xgd-working` (sparse checkout off, then rematerialize the overlay tickets).

Nothing to rematerialize (0 candidates). Updating the ticket body (existing content kept, "What landed" added, test plan expanded with the extra retargets), then the gate.

The gate printed a warning before succeeding, so I'm checking what it was.

The version check passes (exit 0), so the warning was the gate's standard reminder. Saving one gotcha for future sessions.

BUG-301 is merged into `xgd-working` and parked at `free_coded`, with 2 commits (`46c40cc599`, `12bc70d98e`), version 0.2.679 and 3 story points. The branch is cleaned up. All three contradictions are resolved, and no lagrange-framework ticket is needed.

**D-7, filing bugs**
- The consultant is told to report defects with ReportBug "on your own initiative" only where ReportBug is actually in its tools. That is only where a filing address is configured. In production it still says "something on our side isn't working yet; we're fixing it" and says nothing about filing.
- The framework manual's "Filing is not something to do on your own initiative…" paragraph is overridden here. 1stcontact already adds its own note to that manual, so it now drops that paragraph and adds: "Filing does not wait to be asked: when something in this software is not working, report it here yourself, because nobody else will."

**D-8, checking builder work:** rule 12 now says to ask for the checks in `accept`, read the verdicts, and look yourself at anything that came back `unverified`, `unreported` or `failed`. The framework's Delegation manual is unchanged.

**D-9, the plan entry:**
- While the client hasn't seen the first draft, the "Due: ask the client…" questions (and the "record that you asked" line) are held back. They come back once the client has responded to the draft. The checks still fall due in the stored plan.
- **The entry does exceed the 2,000-character cap on a realistic plan:** a fresh plan with the first draft built is already over, before and after the client reviews it. The cut now falls between lines, ending with "(read_plan for the rest)".
- **One change beyond the ticket's wording:** the ~1,000-character "The first draft is built…" hand-over text is now shown only until the client has responded to the draft. Before, it stayed for as long as a first-draft check was due, and pushed the due questions past the cap.

**Tests**
- Five new UATs pass: three run through the real Worker route, with and without a filing address, and two cover the plan entry.
- I retargeted 13 existing test files that pinned the old wording, or read the rules as plain text (they're now generated per session).
- I ran every suite that touches the changed code. The only failures left also fail on a clean `xgd-working`, with the same tests failing; they're listed in the ticket.

**Needs a decision:** the REQ-473 consultant prompt-size test was already failing before this work (206,555 characters against a 205,000 budget). This change adds 245, bringing it to 206,800. Raising `prompt_budget` or trimming the priming is your call.

<!-- xgd-chat-end -->