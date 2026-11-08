---
uid: comment-ea87f764
id: COMMENT-7870
type: comment
title: Comment on request REQ-657
created_by: xgd
created_at: '2026-11-05T21:15:48.373313+00:00'
updated_at: '2026-11-05T22:12:40.908536+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-10893363
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "0731f916-003a-4aa9-93c8-f21fe0cdb429",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-11-05T21:15:44Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-11-05T21:15:44Z" -->
#### You
The progress bar seems a little redundant: it's not clear we will be visiting those stages and very unclear what they mean. I want more visibility from the consultant on what is coming: how much of the client's story they want (and the story board exercise), some idea of the look before diving in (and the comparisons and look options), and the hero movement and finishing touches.

<!-- xgd-chat role="assistant" ts="2026-11-05T21:15:44Z" -->
#### Claude
Proposed a 'what's coming' message when the first build starts, plus a rough look direction and a question about how much of their story they want before building.

<!-- xgd-chat role="user" ts="2026-11-05T21:15:44Z" -->
#### You
The plan today is mostly the consultant's notes to itself, but this big picture should be aligned on and shared. It's the plan for the consultant and client interaction, and it should be specific. Add a Plan panel at the very top of Input, with a permanent link in How you can help. It doesn't need to be agreed before we build, but it should be created before we go too far. It includes, or leaves out, the activities a client might go through with the AI.

<!-- xgd-chat role="assistant" ts="2026-11-05T21:15:44Z" -->
#### Claude
Agreed. The panel shows this client's route in the consultant's wording, with a status and a link for each entry. The plan record's entries replace the nine stages, as kinds from a fixed menu with free wording, and the progress bar goes. There's no gate: the consultant writes it once it knows what the site is for. The client changes it through the consultant for now.

<!-- xgd-chat role="user" ts="2026-11-05T21:15:44Z" -->
#### You
Yes do it. Also, some clients may want only a shop front; discover that up front and reflect it in the plan. At every stage the consultant can remind the client that nothing is final until they say it is.

<!-- xgd-chat role="assistant" ts="2026-11-05T21:15:44Z" -->
#### Claude
Filed REQ-657. The prompt side is already in DOC-75: find out early what the site is for, a shared specific plan, nothing is final until they say so, and 'what's coming' when the first build starts.

<!-- xgd-turn id="0baed2e7-ebb9-4e93-a4b8-7a90bb087097-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T21:21:54.704083+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="0baed2e7-ebb9-4e93-a4b8-7a90bb087097-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T22:12:39.274929+00:00" -->
#### Claude
Reading the ticket and the plan code before cutting the branch.

Branch cut; making the worktree runnable, then mapping the stage code.

Still mapping the stage model; it reaches the panel, the gates and the handoff code. Reading the remaining uses.

Now the builder side: the progress bar and "How you can help".

Design is settled enough; I'll record decisions in the ticket and start coding. Checking the Publish button handle first.

Now baselining the affected suites before changing anything.

Baseline: 16 pre-existing failures in those node suites, recorded. Now the workers baseline.

Baselines saved (workers: 11 pre-existing failures). Starting the core change: the seed's menu of activity kinds.

Now the plan-core model: replacing the stage constants with the activity menu.

Now the big block of stage helpers (labels, settledness, publish, handoff).

Now `checkPlan`, the panel view and the per-turn lines.

Rewriting the `set_stage` tool into `set_plan`.

Fixing the remaining type errors (router, first-draft, handoff-copy).

Now first-draft's reset of the build activities, and the router's `published` read.

Typecheck clean (bar the pre-existing Uint8Array errors). Now the first-build note in the build's result.

Now the tool declaration in `plan-surface.json`.

Updating the consultant's priming (both copies) to the shared plan.

Now the builder: removing the progress bar from `plan-panel.js`, keeping the status row.

Progress bar removed. Now the new Plan panel module (`plan-route.js`) and its config strings.

Writing `plan-route.js`, the Plan panel itself.

Wiring the Plan panel into the builder (`app.js`).

Builder wired. Scanning the rest of the codebase for stage leftovers.

Typecheck clean. Running the affected node suites against the change.

Most failures are one TDZ bug: `onView` fires during the panel's first render, before `planRoute` exists. Moving it earlier.Now fixing tests. Files whose whole subject is the removed bar (BUG-209, REQ-398, REQ-653) go; the rest get adapted. Looking at the mixed ones first.

Next: suites that read the old banner element (`tracker`, `.plan-stages…`).

zsh doesn't split the variable; using an array file list instead.

Rerunning the node suites to see what's left after the renames.

Now REQ-638 handoff mode.

Next batch: REQ-356 surface, REQ-419, REQ-431/433/442, REQ-629, REQ-636, BUG-269, REQ-638 playbook.

Node suites back to exactly the 15 baseline failures. Now the workers suites.

Many workers failures come from shared helpers (`tests/support/plan-stages.ts`, `d1-site-factory.ts`). Fixing those first.

Now the tests that call `set_stage` in these workers suites.

Many suites use `set_stage` only as "a plan write"; swapping those to `set_plan` first.

Updating the stored ticket schema (`stages` → `activities`) and the REQ-356/364 workers asserts.

Test suites green apart from baseline. Now writing REQ-657's own UATs, starting with the scripted-consultant one.

Now the builder UAT (jsdom, real `mountBuilder`). Borrowing the REQ-431 harness.

Builder UAT passes. Now the workers UAT for the first build's note, on the REQ-448 harness.

UATs in. Now the prompt-budget and lint checks, then a wider sweep.

Need the baseline for these four; checking them on unchanged code via a temporary stash-free swap.

All four are pre-existing, and the change shrinks the consultant's prompt (196,370 → 195,689). Now lint and the control-app typecheck.

Typecheck clean (eslint isn't installed here, so lint couldn't run). Grepping the whole test tree for pinned strings I changed.

These look unrelated (reconciliation, library, chrome). Baselining the same 115 files in the main checkout to confirm.

Those four are worktree-location 503s (webui/font serving), documented in memory. Now the wider workers sweep.

Consistent failure — reading the test.

That one is fixed upstream by `202d619cda` (BUG-357, "refused Delegate is no hand-off"), which my branch predates; I'll recheck after the merge. Next, DOC-75's references to `set_stage`.

DOC-75 has no `set_stage`, but two lines still describe the old pieces. Checking for pinned phrases before I edit it.

Now committing. Checking this project's version-bump convention first.

Committing the work on the branch.

Clean set. Updating the ticket body first so every UAT is motivated by it, then committing.

Committed. Now lock, merge xgd-working into the branch, and recheck the affected suites against the newer base.

Upstream (BUG-360) changed "roughly how long" to "how long in the host's figures". Folding that into the new wording.

Merged. Checking that upstream commits added no new `stages`/`set_stage` uses, then re-running typecheck.

Typecheck clean after the merge. Re-running the affected suites on the merged tree.

Node side: only the 15 baseline failures. Now the workers side, post-merge.

REQ-459 now passes. BUG-278/284 are upstream test files; checking them on the main checkout.

Those three fail on xgd-working too, so they predate my change. Bumping the version and committing.

Merging back into xgd-working with `xgd-merge`.

`free_coded` with both commits and version 0.2.789. Cleaning the branch.

Code has landed. Last, the DOC-75 playbook lines that still describe pieces (documentation only, so it's edited directly).

REQ-657 is built and merged into xgd-working. The ticket is at `free_coded` (commits `9621eda1…` and `6f6dcd2a…`, version 0.2.789) and the branch is cleaned up. I haven't promoted it to `ready_to_reconcile` or deployed it.

**What changed:**
- **Plan panel.** Input now opens with "The plan": the client's activities in order, in the consultant's wording, each with Done / Now / Next / Later and an Open link to where that work happens (Questions, the draft, the story board, the comparison sites, or Publish). Skipped ones sit under "Not included" with their reasons. The panel is read-only and ends with "To change it, just say so in the chat. Nothing is final until you say it is."
- **How you can help** now always ends with a "The plan" line.
- **The plan record.** The nine stages are replaced by `activities`. Each entry is one kind from the fixed menu, with the consultant's text, a status, and a reason if skipped. The consultant writes the whole list with one new tool, `set_plan`; `set_stage` is gone. Plans that already exist keep their old `stages` data, but nothing reads it any more.
- **Statuses the host sets.**
  - First draft is done when the first build's pages have returned.
  - Final checks are done when the review before publishing has run.
  - Publish is done on publish.
  - The consultant is refused if it marks any of these done earlier.
- **No gate.** A first build no longer waits for the client's yes, only for the design. If there's no plan yet, the build's result carries a note saying so; it isn't refused.
- **Progress bar deleted**, code and styles included. The "Nothing being built right now" status row that sat inside it stays.
- **Prompts.** The priming and the tool's description now say the same things, and two lines in DOC-75 that still described stages were reworded.

**Decisions I made that you may want to check:**
- **Prepared sites.** "Waiting for the owner's view" used to be a stage state. It now lasts until the consultant writes the owner's plan, or the owner agrees one. Sites built before stages existed are no longer quietly switched into handoff mode when they're loaded.
- **Story and comparison sections in Input** read "Complete" when every story (or look) activity is done or skipped.
- **Site copies:** when a first draft is copied to a new site, any of its build activities marked done go back to "next".
- **Names.** I renamed the questions panel's screen-reader label to "Questions for you" so it doesn't clash with "The plan". The status row's styling class is now `.progress-status`.

**Tests:**
- Three new test files cover the ticket's test plan: the tool with a scripted consultant, the panel in the real builder with a made-up pottery business, and the first build with no plan running through the real routes.
- About 45 existing suites were rewritten for the new model. BUG-209, REQ-398 and both REQ-653 suites were deleted along with the bar.
- After merging with the latest xgd-working, every failure in the affected suites also fails on xgd-working. A few extra failures appear only in the branch worktree and are location problems (webui and font files not served there).
- Lint didn't run: eslint isn't installed in this checkout. Both projects typecheck cleanly, apart from the existing `Uint8Array` errors.
- The consultant's prompt got slightly shorter (196,370 → 195,689). It was already over its 191,200 budget, and that test still fails as before.

<!-- xgd-chat-end -->