---
uid: comment-255d2d41
id: COMMENT-5608
type: comment
title: Comment on request REQ-450
created_by: xgd
created_at: '2026-10-24T20:31:02.750295+00:00'
updated_at: '2026-10-24T20:53:43.935603+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-a589df82
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "cfcc407c-cea1-40c5-b968-9cefa2398766",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="ddded5d0-1709-484e-9287-069127fd7771-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T20:30:13.575992+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ddded5d0-1709-484e-9287-069127fd7771-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T20:53:41.937429+00:00" -->
#### Claude
I'm reading the existing provisioning, chat-copy and ticket-store code before cutting the branch for REQ-450.

Still mapping the code: now looking at the platform-sites listing (for the source picker), and the ticket store's attachment API.

Reading the plan's story-board and focus-task shapes to find every uid the plan holds.

Checking how material labels are numbered, so copied labels don't collide with the next upload.

Checking the upstream ticket store's counter so carried labels like `IMAGE-5` don't get reissued in the copy.

Design is clear now. Next: finding the existing UATs for admin provisioning and the chat copy, to reuse their fixtures.

Good, there's a simple `route()` + real `Admission` harness to reuse. Now the People-panel side.

Now updating the ticket to `free_coding` and cutting the branch, then writing code.

Writing the server module now.

Small exports first: `toPlan` from plan.ts, a label-reservation helper in material.ts.

Now the core copy module.

Fixing two slips: `labelOf` doesn't exist, and the remap must not rewrite `copied_from` itself.

Now `provisionBusiness` takes the client-facing site name, and the router gets the two first-draft paths.

Adding the provisioning and per-target orchestration to the module so the router stays a thin gate.

Now wiring the router.

Server side typechecks clean. Now the client: API calls and the People dialog.

I'll apply the dialog change with targeted edits instead.

Now the module-level helper and CSS rules beside the existing `fulfil` styles.

Code is in. Now the UATs — first checking what a valid seeded plan needs to pass `checkPlan`.

Writing the route-level UAT now (workerd, real D1/R2, real admission).

Running the new workers UAT.

Six of seven pass. The failure is my fixture: the host re-derives `other_sites` from the comp board, which I seeded as unfinished. Checking the rule.

All 7 route-level UATs pass. Now the People-dialog UAT; checking how existing tests open the provision dialog.

Dialog UATs pass; the BUG-53 failure is pre-existing on clean `xgd-working` (a library class), not this change. Running the adjacent suites.

Unrelated (the `/api/businesses` key set). Confirming it fails on clean `xgd-working` too.

Pre-existing too. Now the node-side suites touching people.js, api.js, material and plan.

Baselining those same failing files on clean `xgd-working`.

Most match the baseline. Two extra in the worktree — the workspace-origin set (a known worktree-location artifact) and BUG-58. Checking BUG-58's message.

Both are location artifacts (unbuilt assets in a fresh worktree); I'll recheck BUG-58 from the main checkout after merge. Committing on the branch.

Now updating the ticket body — keeping the existing spec and appending what was built.

Ticket updated. Now merging back: lock, merge `xgd-working` into the branch, rerun the UATs, then `xgd-merge`.

Merged. Rechecking BUG-58 from the main checkout, where assets are built.

Clean. Moving the ticket to `free_coded` (letting the gate bump the version itself).

The first-draft test option is built and merged into `xgd-working`. REQ-450 is at `free_coded` with two commits (the work, plus the version bump to 0.2.620 that the gate made). I haven't run it against real Dina's Diner data or a deployed Worker yet.

**What the operator sees.** In People → Provision a business, ticking **First-draft test** shows a picker of every business with a site. Each business appears once, and existing test businesses aren't offered. Picking one fills in its name and shows `Provisioned as First-Draft-Test <name>`. Pressing Provision creates the business, then copies in chunks, with a progress bar and "N of M" until it says the discovery is copied. If a chunk fails, the message tells you to press Provision again, which picks up where it stopped.

**How it works:**
- **Same route.** `POST /api/admin/businesses` takes a new `firstDraftFrom`. The Worker adds the prefix, and the starter site gets the source's name, so the prefix never reaches the draft.
- **Re-running resumes.** Sending the same request again finds the unfinished copy and returns it instead of refusing the name. Once a copy has finished, the name is refused (409) as usual.
- **Chunks.** `POST /api/admin/businesses/first-draft { business }` copies up to 40 attachments or 16 MB per call. It reads the source from a marker on the new plan, never from the request, so it refuses any business that isn't a first-draft test.
- **No duplicates.** Each copied ticket records the source ticket it came from and whether it is complete, and attachments are matched by content. Each chunk works out what's left from those records, so nothing is copied twice.
- **Reuse.** The chats go through `readChats`/`writeChats` (only the site and business sessions). The plan is written through `sitePlan().write`, so it goes through the normal validation.

**Decisions I made that the ticket didn't spell out:**
- Material placement fields (`placed_on`/`placed_as`) are dropped, since they describe the source's site.
- The label counter is moved past the highest copied label, so the next upload gets `IMAGE-10` rather than reusing `IMAGE-7`.
- Uids are rewritten everywhere in the plan, including its body text, and also where one copied material names another.
- After a copy, the stages before `first_draft` keep their state, but the plan re-checks its self-ticking stages, as it does on any save. If the source's stored state doesn't meet a stage's rule, that stage will reopen in the copy.

**Not covered:** chat transcripts are copied as they are, so a uid quoted inside an old chat turn still points at the source's ticket. The ticket only asks for the plan's uids to be rewritten.

**Tests:** both new suites pass after the merge (7 against the real routes, 3 for the People dialog). Nearby suites pass except failures that happen on unchanged `xgd-working` too: REQ-180 "chrome offers no way to add one", BUG-53's `builder-library__confirm-delete`, BUG-52 and REQ-376. A few other failures (AC961–AC979 and BUG-58) only appeared in the fresh worktree because its assets weren't built; BUG-58 passes from the main checkout.

The ticket body keeps your original spec, with an "Implementation (as built)" section and the test list added below it.

<!-- xgd-chat-end -->