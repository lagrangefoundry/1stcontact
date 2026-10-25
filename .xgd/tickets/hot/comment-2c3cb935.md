---
uid: comment-2c3cb935
id: COMMENT-5615
type: comment
title: Comment on request REQ-454
created_by: xgd
created_at: '2026-10-24T23:45:07.357362+00:00'
updated_at: '2026-10-25T01:05:15.501036+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-76ed153b
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "0c700e8a-0737-480f-a498-d872447c697d",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="2342f76a-c011-49f3-bdd3-305058e72d9b-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T23:44:26.482972+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="2342f76a-c011-49f3-bdd3-305058e72d9b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T23:48:19.842548+00:00" -->
#### Claude
I haven't written any code yet. REQ-454 can't start on its own, and I need you to decide how to handle that.

**The blocker:** REQ-454 adds to the REQ-452 replay tool, and that tool doesn't exist yet. REQ-452 is still `draft`. It has no branch and no commits. Its session stopped at the "options 1 / 2 / 3" question, and your answer to that question (1 + 2) is recorded in REQ-454's "Why", not on REQ-452. Every section of REQ-454 extends something REQ-452 builds:
- §1 extends the snapshot recorded at each delegation.
- §2 extends the history replay.
- §3 adds new scores to REQ-452's per-run scores.
- §4 adds a gate on recording.

The rest of what REQ-454 needs has already landed: REQ-446, 447, 448, 449, 450 and 451 are all at `ready_to_reconcile`.

**Options:**
1. **Fold REQ-452 into this ticket and build both here.** I'd write one branch for the whole tool: extraction (history replay plus record-at-delegation), the run command, budget handling, REQ-452's scores and REQ-454's additions. REQ-452's UATs would sit next to REQ-454's under one ticket. This is the large option: REQ-452 is roughly 13+ points on its own, so the total is near the 20-point limit.
2. **Build REQ-452 first in its own session, then come back here.** The tickets stay as they are now. That's two reconciles, and REQ-454 stays parked until REQ-452 reaches `free_coded`.

**I recommend option 1.** REQ-454 corrects REQ-452 for a system that has since changed, and building REQ-452 to its old spec only to revise it straight after is wasted work. One ticket also matches your preference for fewer tickets. If you choose it, I'd:
- merge REQ-452's body into this ticket under its own heading;
- set REQ-452 to whatever status you want for a folded ticket;
- raise the story points honestly, around 15–18.

I'd keep the plan REQ-452's session laid out: a `1c builder-eval extract|run` command on the Node host, a scripted consultant replaying the exact `Delegate` call, real model calls for builders only, configurations applied through the existing configure hooks, and cost priced with `spend-core.ts`.

One risk applies to either option. History replay (REQ-452 option 1) may not reproduce some sites exactly, and REQ-452's session planned to measure how many sites pass before building anything on top. I'd do that measurement first and report back if Bob's or Ariel's fail the final-state check.

Which option do you want?

<!-- xgd-turn id="ffe4b3ca-785a-42f6-8102-8be5213ca4cd-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T00:46:11.828266+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ffe4b3ca-785a-42f6-8102-8be5213ca4cd-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T01:05:10.380007+00:00" -->
#### Claude
REQ-452 has landed since my last turn (now `ready_to_reconcile`), so the blocker has cleared and I can go ahead. Next I'm reading what it built.

Still mapping: the case already stores site.json raw, so a legacy (pre-design) site is recorded in its old shape. Next I'm checking how the `design_first` gate decides "unwritten".

Next is §4, recording only test and dev businesses by default. I'm checking how the Worker wires case recording and how REQ-450 marks a test business.

I have the shape of the work. Before coding I'm recording the design decisions on the ticket, then cutting the branch.

The ticket now records the decisions and is at `free_coding`. Next I'm cutting the branch.

The worktree is ready: generated artifacts copied and the shared store linked. Now I'm writing the code, starting with the recording predicate in the case recorder.

Now the edits. First, a shared per-page off-system count in site-schema, reused by the critic path and the eval:

The case recorder now gets a recording predicate, and host-core passes it through:

Next is the Worker side: the recording policy and the operator opt-in.

Now the Worker policy, the opt-in setter, and the env var:

Next, the admin route for the opt-in, on the provisioning gate:

Next, the dev-deployment var: in the top-level and `env.dev` vars, absent from production.

Next is the eval itself. First I'm confirming the layout-finding `kind` field, and which result fields carry the builder's words.

Writing the eval-builder changes: case loading (pre-design migration and brief flags), the new scores, and the summary and report rows.

Next, the aggregates, `--skip-pre-design`, and the report rows:

Both projects typecheck. Next are the UATs, and first I'm checking which builder operation writes an element's text, so a scripted builder can alter a passage.

I'm writing the UATs now. First I'm checking how the workers test support writes a site plan, so the policy tests can mark a business as a first-draft test or opted in.

The harness design is settled. I'm writing the Node UAT file now.

Running the new Node UATs:

All five passed on the first run, which is fast enough to be suspicious. I'm checking they really ran, and that they fail when the code they test is broken.

Each mutation turned its test red, so the tests do assert something. But my cleanup was wrong: `git checkout` also discarded my real edit to `builder-case-core.ts`. I'm reapplying it now.

Restored, and it typechecks. Next is the Worker UAT for the recording policy, plus the update to REQ-452's Worker UAT:

The var-repetition pins require every top-level var to be repeated under production, so I'm declaring it there as empty (recording off) instead of leaving it absent:

AC1333 fails on the clean main checkout too, so it was already failing before this change. I'm fixing a dangling sentence in the `ai.ts` comment, then rerunning the whole scope from the worktree.

All 56 pass. Next, lint on the changed files:

No eslint is installed and there's no lint script, so typecheck is the static gate here. Next, the version bump and commit, following the project's free-coded promotion notes.

Committing the work on the branch:

Committed. Before merging back, I'm appending an "As landed" section to the ticket so its body matches the implementation:

Now the merge-back sequence: lock, merge xgd-working into the branch, bump, merge back, then the free_coded gate.

The merge picked up another session's change to `host-core.ts`, so I'm re-typechecking and rerunning the UATs before committing the bump.

It fast-forwarded cleanly. Now the gate:

REQ-454 is implemented and merged into xgd-working, and the ticket is at `free_coded`. It records two commits and version 0.2.629. All the new UATs pass, and so do REQ-452's.

**Blocker cleared:** REQ-452 landed during this session, so I built REQ-454 on top of its replay tool rather than folding the two tickets together.

**What changed:**

1. **A case carries what its brief was written for.** REQ-452's saved case already held `site.design` (in the raw `site.json`) and the exact `Delegate` input with the finished copy, so this needed no new code. A UAT now changes the live site's design after recording and shows the replay is still judged against the case's design.
2. **Pre-design cases.** REQ-452 dropped the history import, so no rebuilt historical cases exist. Instead this applies to any case recorded from a site still stored in the old shape.
   - On load it gets REQ-447's migration; the stored case is not changed.
   - If its plan records neither a design nor a first pass, the replay's copy is marked as having a design, so it isn't refused `design_first`.
   - The run is marked pre-design, and `--skip-pre-design` leaves such cases out.
   - A brief that asks the builder to write words, or names a removed setting, is flagged in the report and left as it was.
3. **New scores:**
   - **Copy altered:** each passage the brief asks the page to contain, checked after the run with the host's own text check. A change is counted as reported when the builder's report quotes the passage or its first eight words; otherwise it is unreported.
   - **Design writes refused:** the builder's refused attempts to write the site's design.
   - **Page health per page:** off-system counts (one function now shared with the critic) and craft-check findings, as before/after changes.
4. **Recording policy on the Worker.** A delegation is saved only if one of these holds:
   - the deployment is dev: `RECORD_BUILDER_CASES = "1"`. Production repeats the var empty, because the deploy checks require every var to appear there;
   - the business is a REQ-450 first-draft test;
   - the operator opted the business in with `POST /api/admin/businesses/record-cases {business, record}`. Anyone but the operator gets a 404.

   The local Node host records everything.

**Things to know:**
- There's no UI toggle for the opt-in yet; you call the route directly.
- No business-deletion path exists, so "deleted with the business" can't be wired up yet. Cases sit under the tenant's own `cases/<tenant>/` prefix in R2, ready for deletion when it's built.
- Craft-check findings need a browser. Chromium can't start in the agent sandbox, so the UAT uses a fake layout checker and the real browser half is unexercised.
- I changed REQ-452's Worker UAT to set `RECORD_BUILDER_CASES: '1'`, since recording is no longer unconditional.
- One deploy-smoke test (AC1333, about deploy hooks) fails, but it fails the same way on a clean checkout, so this change didn't cause it.

The ticket body now has "Decisions" and "As landed" sections describing the final design.

<!-- xgd-chat-end -->