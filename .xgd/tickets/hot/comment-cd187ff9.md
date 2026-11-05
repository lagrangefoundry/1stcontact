---
uid: comment-cd187ff9
id: COMMENT-6244
type: comment
title: Comment on request REQ-629
created_by: xgd
created_at: '2026-11-01T22:39:12.379711+00:00'
updated_at: '2026-11-01T23:56:01.214168+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-f52d99b8
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "aaa33e1c-c5fa-4840-8ba1-540376035147",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d8f3b3be-2dfb-4b73-8afd-1d5e6837460a-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T22:37:15.355925+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="d8f3b3be-2dfb-4b73-8afd-1d5e6837460a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T22:48:07.980068+00:00" -->
#### Claude
Reading the ticket: it asks for an inventory and a proposed list of cuts, reviewed with you before any text changes. I'm finding the budget UAT so I can measure.

I'm writing a temporary probe test (not to be committed) that captures the consultant's real first request, so the inventory uses measured sizes per section and per tool.

Tool schemas are built from our `*-surface.json` declarations by the framework, so I'll keep the cuts inside our own JSON. I'm totalling the cost per surface, overview text plus its tools.

I have the inventory data. Before drafting the proposal I'm checking DOC-70, the prompt audit, for its list of stale and contradictory text.

I haven't changed any prompt text yet. The ticket says the inventory and proposed cuts go to you first, so they're on REQ-629 for you to review. It stays at `draft` until you agree a set of cuts.

**Where it stands:** I measured the consultant's prompt on clean `xgd-working` by replaying the REQ-466 test's request and capturing what the model was sent. It is **219,329** characters (about 80k of system text and 139k of tool definitions) against the 205,000 target. Reaching ~190k means cutting about 29k.

**What I found:**
- **Host-enforced rules save less than the ticket expected, about 4.9k.** BUG-323 (menu button) and REQ-622 (layout checks) have no text in the consultant's prompt at all; theirs is in the builder's priming. Most of the BUG-322 text is in `set_stage`'s description (2.4k) and two paragraphs of the plan manual.
- **Repeated text is the bigger saving.** For example, the rules for `after` (driving a page before taking its picture) are written five times. The schema for naming a picture is written out three times, at 4.6k each: twice in `compare`, once in `screenshot`.
- **Most of DOC-70's findings no longer apply.** It predates REQ-473's new priming. Still live: the duplicated `compare` schema, the `capture_site` private-address paragraph, `record_check_answer` still calling the consultant "alice", and builder-only manual text being sent to the consultant.

**Proposed cuts:**

| | What | Saves |
|---|---|---|
| P1 | Host-enforced rules down to one line each | ~4.9k |
| P2 | Say each thing once, in the place it's used | ~8.3k |
| P3 | Shorten the shared picture schema (also shrinks the builder) | ~6.5k |
| P4 | Stale text | ~1.5k |
| P5 | Rarely needed reference (drawing craft, layout catalogue, capture detail) moved to the system knowledge base | ~4.5k |
| | **P1–P5 together** | **~25.7k, to about 193.6k** |

So P1–P5 alone land just short of 190k.

**Questions before I start:**
1. **Do you agree P1–P5 as written on the ticket?** Drop any item you don't want.
2. **P6, a grant change: do you want it?** It means taking `compare`, `AgentContext`, `AgentPriming`, `AgentReminder`, `TicketComments`, `TicketBacklinks` and `TicketHistory` away from the consultant and the talker; the builder keeps `compare`. DOC-70 recorded one `compare` call ever and none for the others. It saves about 15k (to ~178k), but it removes tools rather than trimming text, and two tests (REQ-283 AC3, REQ-228) would need revising. Without it, I'd look for about 4k more in the second-wave items.
3. **New target:** OK to set it to the measured size plus about 2,000?
4. **Framework text:** about 3–5k more needs lagrange-framework changes. That is the delegation manual (3.2k, which repeats "Commissioning construction") and builder-only manual text the consultant is sent. Should I file a ticket in that repo? I won't change code there.

<!-- xgd-turn id="a786235c-d149-4584-b7b2-030b728628d4-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T23:05:13.706136+00:00" -->
#### You
Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="a786235c-d149-4584-b7b2-030b728628d4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T23:55:57.690265+00:00" -->
#### Claude
Worktree is ready. Re-establishing the baseline measurement in the worktree:

Baseline in the worktree is 219,329, the same figure as before. Starting with **P6 (the grant)**: I'm finding where the consultant's and the talker's tools are granted.

Still on P6: finding where the framework's Agent* and Ticket* tools are granted to the consultant, so I can narrow that grant without editing the framework.

Found the agent surface grant (`sessionContextSurface`, host-core.ts:3564). It already withholds `summary`, so I'll withhold three more there. Now I need the op names behind those tools.

Writing P6. Ticket reader first:

Now the agent surface (`sessionContextSurface`):

Now `compare`. The consultant's fidelity grant goes through `readOnlyGrant`, so I'm checking it handles an operation list:

`readOnlyGrant` requires a `groups` array. So the consultant's fidelity grant becomes an empty group list plus the four operations it keeps. Applying that, then measuring:

Opening a session now returns 500. Getting the error body:

The declaration's group key is `group`, not `name`. Fixing:

P6 brings it from 219,329 to **203,588** (−15.7k). Next I'm checking how the consultant's fidelity manual reads now that `compare` is gone, since it still mentions `compare`:

Nine failures, all on the grant. I'm reading each assertion to revise it to the new grant, and running REQ-416 on clean `xgd-working` first to see which failures are pre-existing:

Revising each test to the new grant. Reading the relevant blocks:

Still revising the six grant tests: three done, three to go (AC1058, REQ-206, REQ-283 AC3).

Revising REQ-228 to the consultant's shipped composition. Six of the seven tests are done after this.

Recording P6 on the ticket, including the `TicketComments` exception:

Now **P4 and P3**, both in `fidelity-surface.json` plus `record_check_answer`. Reading the surface's overview and its shared picture type:

Before editing, listing exactly which fidelity-surface phrases tests assert, so I keep or retarget them:

The file mixes escaped and literal characters within one string. Making the splice helper match on the decoded value instead:

The first run aborted before writing anything. Re-running the same edits:

Next, removing whole entries: the "Running the reproduction gates" and "Changing a picture" absences (the latter is now folded into "Changing anything"), and the `after` sequence:

Fidelity is done. Next, P4's "alice" in `record_check_answer`:

P4 and P3 bring it from 203,588 to **195,304** (−8.3k). Running every suite that touches the fidelity surface:

165 files is too many for one run (the filter list is too long). Narrowing to suites that reference the fidelity surface or `record_check_answer`, in batches:

REQ-284 is mine to retarget. AC1058 and REQ-416 are already known to be pre-existing. Checking AC931, REQ-290 and REQ-361 on clean `xgd-working`:

All three are also red on clean `xgd-working`, so they are pre-existing. Retargeting REQ-284: the "numbers rather than pictures" line described `compare`, which the consultant no longer holds.

REQ-284 passes. Running the real REQ-466 budget UAT; the consultant should now be inside its 205,000 target, and this also checks the builder and critic:

The budget UAT is green again: consultant 195,304 against 205,000, and the builder and critic are inside theirs. Committing P4 and P3:

Now **P1**. The agreed condition: before a rule shrinks to one line, its host refusal must name what's missing and how to fix it. Pulling the refusal messages for each rule:

`NOT_CRITIQUED` is the one stage refusal that doesn't say how to fix it. Checking what each raise site adds to its message:

`SUGGESTIONS_FIRST` carries the whole pre-publish procedure, so `critique`'s REQ-628 paragraph can shrink to a line. Checking REQ-623, what happens when critique is called during refinement:

REQ-623 has no refusal; the host simply never makes a review due during refinement, so one clause in `critique` covers it. Before editing the P1 texts, listing which tests pin them:

Too noisy to be useful (short common phrases match everywhere). Instead I'm grepping tests for the specific sentences I plan to cut:

The rules and the Commissioning text are templates in `priming.json`. Adding substring replacement to the splice helper, so I can edit inside one long template string:

Printing the exact text of rules §3 and §5 and the scope sentences, so the replacements match:

Applying the P1 edits. Each replaced span is located by its start and end phrases in the decoded text, so there are no transcription errors:

Both REQ-424 failures are also red on clean `xgd-working`, so they are pre-existing. Re-checking REQ-628 in the worktree:

The refusal names "Refining" and "Colours & fonts", not First draft. My assertion was wrong, not the message. Fixing it:

Typecheck is clean. Committing P1:

P1 is committed at 193,000. Moving to **P2** (say each thing once, where it's used). Locating the priming sections involved and the tests that pin them:

Many of these sentences are pinned, so I'm reading the exact assertions before rewriting. The check forms and "not the builder's word" have to survive:

Condensing the check and record paragraphs while keeping every pinned phrase. Checking pins on rules §12 first:

Applying the Commissioning and rules §12 condensation, keeping each pinned phrase:

Next, the priming's "Bring the right view" section, which `show_client` largely repeats. It's stored as a list of lines, so I'm viewing it raw:

There are two identical copies of the section (one per `primingConfig` variant), and REQ-444 reads both. Replacing both with the shortened lines; every pinned phrase is kept:

That brings it to **191,263**. Next are the plan manual's "Asks" and story-board paragraphs. Checking what REQ-408 asserts on the story-board text:

The story board's stage guide already carries the method (it's handed over when the stage starts), so the overview paragraph can shrink to what's needed between stages. Applying both overview edits:

P2 so far brings it to **190,325**. Running the suites that read the priming, the delegation method, the rules or the plan manual, in batches:

Eleven failures in the second batch. Separating my regressions from pre-existing ones by running the same files on clean `xgd-working`:

Six are pre-existing. Six are mine: BUG-246, REQ-342 ×2, REQ-295 (shipped words), REQ-343 and REQ-358. Reading them:

The test run found no files: zsh doesn't split an unquoted `$F` into words (a known gotcha). Re-running with explicit splitting:

Fixing the remaining wraps (BUG-246) and restoring "Ask for the checks in `accept`" to rule §12 (BUG-301):

The new wrap splits another pinned phrase. Keeping "look yourself at … `failed`" on one line:

The regex allows a line break only after "The". Re-wrapping to match the original layout:

REQ-358 also fails alone on clean `xgd-working`, so it's pre-existing. REQ-444 now fails because "Never bury the first draft" got split. One more re-wrap:

Those pass. Re-running all 81 P2 suites to confirm only the known pre-existing failures remain, then measuring:

New in this run: REQ-431, REQ-433, REQ-446 and REQ-472 ×2. Checking them on clean `xgd-working`:

Restoring the two pinned wordings ("Ask for each passage of copy, an exact headline" and "View, Edit, Input or Looks"):

All pass, and the measurement is **190,642**. Running the budget UAT, then committing P2:

Now **P5**: moving rarely needed reference to the system knowledge base. I'm checking how REQ-472's motion reference was put there, to follow the same pattern:

System KB references are `doc` tickets with `doc_kind: system_kb`. Reading `draw_image` and `place_on_site` to separate the craft and edge-case detail from what's needed on every call:

I'll create the reference as a `system_kb` doc ticket, the same shape as DOC-74:

`xgd ticket create` can succeed silently, so I'm checking for the ticket instead of retrying:

DOC-81 was created in the `xgd-working` ticket store, the normal place for tickets. Checking where `readDocTickets` reads from, so the UAT can find it:

It reads through the `xgd` CLI, so the branch sees DOC-81 too. Now trimming the two tool descriptions to pointers, then the UAT:

That gives **189,208**. Checking which tests pin the library-surface text I just trimmed:

REQ-423 pins two sentences that moved to DOC-81 ("crisp and editable", "Draw by hand for…"). Retargeting: the tool keeps the rule in brief plus the pointer, and the reference holds the craft:

My one-liner says "starts as a wordmark" and the pin uses capitals. Matching the original casing:

AC1095 is pre-existing. `REQ-416_stop_building…` passed on clean `xgd-working` but failed in my batch (at 3,020 ms, which looks like a timing failure). Running it alone in the worktree:

It passes alone twice, so the batch failure was timing. P5 is done. Before lowering the target, I'm measuring all three roles with the probe running the full consultant → builder → critic flow:

The budget UAT passes against the new 191,200 target. Confirming the `about` note isn't sent to the model, then finding this repo's version-bump convention:

Committing P5 and the new target:

All five phases are committed. Before merging back I'm bringing the ticket body up to date with the final state:

Now merging back: lock, merge `xgd-working` into the branch, re-check, bump the version, fast-forward.

The merge was clean. Checking whether `xgd-working` brought in any code changes since the branch was cut, which would mean re-running suites:

Only tickets changed, so nothing needs re-running. Bumping the version and fast-forwarding `xgd-working`:

It fast-forwarded onto `xgd-working`. Moving the ticket to `free_coded` with the full SHAs of the five work commits and the version bump:

The ticket is `free_coded` with commits, version and story points recorded. Cleaning up the branch and worktree:

REQ-629 is done and merged into `xgd-working`. The consultant's authored prompt went from **219,329 to 189,208** characters, and its target is lowered from 205,000 to **191,200**. The ticket is at `free_coded`; reconcile is yours to trigger.

**One deviation from what you agreed:** I kept `TicketComments`. The grant code records your 2026-09-11 decision that reading past conversations is the point of the ticket grant, and those transcripts are stored as comments that only `TicketComments` reads. Withholding it saves about 760 characters and is a one-line change (`CONSULTANT_WITHHELD_TICKET_OPS` in `apps/control-app/src/ai.ts`) if you still want it.

**Smaller than you expected (about 175–180k):** P1 and P2 saved about 2.3k each, against estimates of 4.9k and 8.3k. Much of `set_stage` and the "Commissioning construction" text is guidance the consultant needs before it calls a tool, not only rules the host enforces. Many sentences are also pinned word for word by behaviour UATs (REQ-342 alone pins ten in one paragraph), and the ticket says to keep those, so I did.

| Phase | Saved | What changed |
|---|---|---|
| P6, grant | −15.7k | Consultant and talker no longer offered `compare` (the builder keeps it), `AgentContext`/`AgentPriming`/`AgentReminder`, or `TicketBacklinks`/`TicketHistory` |
| P4 + P3 | −8.3k | Shared picture schema cut down (it was written out three times per request); fidelity text said once; stale text and "alice" removed |
| P1 | −2.3k | Host-enforced rules in one line. Every refusal already said what was missing and how to fix it, so no message needed changing |
| P2 | −2.4k | Repeated text in the priming, delegation method and plan manual said once |
| P5 | −1.4k | Drawing craft and the several-framings detail moved to a new system-KB reference, DOC-81; each tool points to it. The composition catalogue is untouched, as agreed |

- **Builder and critic:** inside their targets (125,858 against 137,000; 8,507 against 8,600), and their targets are unchanged. BUG-323 and REQ-622 had nothing in the consultant's prompt to cut.
- **Tests:** a new `test_UAT_FC_REQ-629_shortened_rules` checks that each shortened rule still reaches the consultant, that the stage refusals name what's missing, and that DOC-81 can be found. Ten existing tests were revised to the new grant or text and none were deleted. The REQ-466 budget test passes.
- **Failing before this work:** about 20 tests also fail on clean `xgd-working` and I left them alone, including REQ-416 ×3, REQ-342 ×3, REQ-295 ×2, REQ-424 ×2 and REQ-472 ×2. The full list is on the ticket.

The ticket body has the inventory, your agreement, per-phase figures, five work commits plus the version bump (0.2.733), and story points 8. The framework part is lagrange-framework REQ-236.

<!-- xgd-chat-end -->