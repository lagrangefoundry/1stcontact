---
uid: comment-ef30d053
id: COMMENT-5614
type: comment
title: Comment on bug BUG-272
created_by: xgd
created_at: '2026-10-24T23:32:44.366053+00:00'
updated_at: '2026-10-26T00:58:58.445187+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-3bd5d1b7
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "41cd262c-a9ff-4338-8f41-fdc657078f19",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="ff8d73c2-ea0b-427a-b038-553eada99821-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T23:31:59.210205+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ff8d73c2-ea0b-427a-b038-553eada99821-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T23:35:37.453494+00:00" -->
#### Claude
I've stopped before writing any code because the ticket's own gate isn't met yet, and that's your call to make.

**The conflict:** BUG-272's body says the change "lands only after REQ-452 compares today's builder configuration with this one on the recorded briefs and the operator accepts the comparison." REQ-452 (the builder replay evaluation tool) is still at `draft`, so that comparison can't be run yet. The free-coding protocol only lets me reach `free_coded` after merging into `xgd-working`, and merging is exactly the "landing" the gate forbids.

**What I've found so far:** most of the fix is configuration rather than code. The builder's priming sections, the conversation-memory text ("Reaching the rest of this conversation" is the `transcript-pointer` entry in `tools/generate/src/cli/ai/priming.json`) and the surface manuals (`l1-surface.json`, `fidelity-surface.json`, `talker.json`, …) are all JSON. REQ-452 is designed to score a priming/grant variant from files, so the change could be built as a candidate it can evaluate. The per-role wording of shared tool descriptions may need a small code mechanism, and I'll find out during implementation.

**Options:**
- **A (recommended):** I implement it fully on a `free-BUG-272` branch, with tests and a commit, but don't merge. The ticket stays at `free_coding` with the branch recorded, ready to be REQ-452's first candidate. After you accept the comparison, I merge and set `free_coded`. The risk is that the branch drifts from `xgd-working` while it waits.
- **B:** You waive the gate. I implement, merge and set `free_coded` now, and the REQ-452 comparison becomes evidence after the fact.
- **C:** I wait until REQ-452 exists.

Which do you want? If A or B, I'll go straight ahead.

<!-- xgd-turn id="3374e2f2-c3ee-489a-b064-c3ec69888f61-user" -->

<!-- xgd-chat role="user" ts="2026-10-26T00:31:46.012987+00:00" -->
#### You
Please implement it now and merge it in I will try it out and we can revert if it fails badly

<!-- xgd-turn id="3374e2f2-c3ee-489a-b064-c3ec69888f61-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T00:48:00.943608+00:00" -->
#### Claude
I'm on branch `free-BUG-272` now and reading how the builder's prompt gets assembled.

Still mapping where each part of the builder's prompt comes from. The memory blocks come from shared product priming, which the consultant and builder share in one manager.

Setting up the worktree so I can run the builder-priming tests and capture the builder's actual system prompt.

Next: removing the four tools from the builder's grant. Checking how grants are expressed (groups vs individual ops).

I have the full list of client-facing lines in the builder's surfaces. Now checking the framework's memory-config format and the host's `fill` helper, then writing the code.

Writing the code now. First `roles.ts`: the builder gets no conversation-memory blocks, and the consultant's memory charter is rendered by the host instead of the framework's per-manager core.

Now `host-core.ts`: the builder's manual is projected without the delegation surface's manual.

Grants are done. Next is the rewording table; first checking the builder role's own screenshot guidance so the new camera wording agrees with it.

Writing the rewording table.

All rules match. Now the module that applies them, wired into the builder's surface construction.

The code typechecks. Re-running the probe to compare the builder's prompt before and after.

Another session overwrote my baseline file in the shared `$TMPDIR`, so I'm recapturing it under a unique name. I'll set my changes aside as a patch, probe, then reapply.

Three leftovers: the Library's "Showing a picture…" absence, plus two "your client" phrasings. Adding rules for them.

Now I need a browser and a knowledge base in the test deployment so the fidelity and knowledge tools are composed. Looking for the existing fake-browser pattern.

Writing the UAT file. It drives the real route in workerd with a fake browser and a system KB, then asserts on what the builder and the consultant were actually sent.

Same reason: the consultant has no `add_page`, so that sequence never reaches it. Removing it from the paired list too; the `your user` sweep still covers the builder.

All four UATs pass, with a browser and a KB composed. Now measuring the real size change on a fully composed builder, comparing before and after.

Three failures. BUG-210's is mine (the charter config moved). Checking the other two against a clean baseline in the main checkout.

<!-- xgd-turn id="666d5860-d97c-449c-9875-39a61fca105d-user" -->

<!-- xgd-chat role="user" ts="2026-10-26T00:50:21.471332+00:00" -->
#### You
Your scope was narrowed can you reread your ticket and implement just the new scope please?

<!-- xgd-turn id="666d5860-d97c-449c-9875-39a61fca105d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T00:58:57.221030+00:00" -->
#### Claude
The scope is narrower now: just the deletions plus one line in the builder's role section, with no rewording mechanism. I'll strip the rewording work from the branch and keep the rest.

The earlier host-core edit didn't run because the `rm` failed first. Removing the rewording wiring now.

Adding the role line after the builder role's opening paragraph, in both declared orders.

Now updating BUG-210's expectation, since the core charter is now off by design, and rewriting the BUG-272 UATs to the new plan.

Now the UAT file, rewritten to the new test plan.

All five pass. Running the related node suites again.

Checking whether those two also fail without my changes.

Both fail on clean code too, so they predate this change. Now the related workers suites, in batches.

REQ-416 is a known failure on clean code. Baselining the other four files without my changes.

Every remaining failure also fails on clean code. Typechecking both packages.

Both packages typecheck clean. Updating the ticket body: I'm keeping the existing content, recording what landed, and making the age-out test-plan line honest.

The Python script had a syntax error, so the update re-saved the unchanged body (harmless). Writing the script to a file instead.

The ticket is updated. Committing the work on the branch.

Committed. Now the merge-back: lock, merge xgd-working into the branch, bump the version, then fast-forward.

I've implemented the narrowed scope of BUG-272 and merged it into `xgd-working`. The ticket is at `free_coded` with commits `88b5053` and `bc69efc` (version 0.2.654). The rewording mechanism (`builder-wording-core.ts` / `builder-wording.json`) and the probe tests are deleted, and the builder sees every shared manual and tool description word for word as the consultant does.

**What the builder no longer gets:**
- **Conversation memory:** "Reaching the rest of this conversation", the work-log note and "Your memory of this conversation" no longer appear in its prompt.
  - The last of these is set per manager in the framework, and the builder shares the consultant's manager. So I switched the framework's copy off and the host now renders the same text, in the same place, for every role except the builder.
  - The consultant's, coordinator's and settings assistant's prompts are byte-identical to before.
- **The delegation manual.** `ReportResult` still reaches the builder as a tool, and its own "Reporting" section explains it.
- **Four tools:** `capture_site`, `list_references` and `describe_reference` (its camera access is now just `screenshot` and `compare`), and `KnowledgeChanges`. The consultant keeps all four.

**The new role line**, added after the builder role's opening paragraph, says:
- "your client" / "your user" in shared tool text means the consultant's conversation, and the builder never talks to the client;
- what it did, and anything it would ask the client, goes in `ReportResult`;
- the client may edit the page while it works, and their changes must never be overwritten;
- pictures it takes stay for the rest of the run and don't age out.

**One thing to be aware of:** the shared screenshot description still says pictures "age out" after two turns. Item 4 of the narrowed scope said to leave shared text alone and put the true statement in the role line, so the builder now reads both, with the role line correcting the tool text. I reworded that test-plan line in the ticket to match.

**Size:** on a builder with a browser and knowledge base, the cuts took its system text from 66.6K to 56.7K characters and its tools from 49 to 45. I measured that before the narrowing; the narrowed version keeps the same deletions and adds the role line (about 550 characters).

**Tests:** typecheck is clean.
- The five new BUG-272 UATs pass. They cover the memory blocks and manual, the tool list, the role line, the picture statement, and the shared text reading the same to both roles.
- I updated two existing UATs that pinned the old behaviour: REQ-295, which checks the builder's camera access, and BUG-210, which checks the memory-charter setting. Both pass.
- In the related suites, eight tests still fail, and all of them fail the same way with my changes removed: AC1058, REQ-361, BUG-275 (two), REQ-295 delegation (two), REQ-431 and REQ-458. REQ-416 also fails and is a known failure on clean code.

It's ready to try on a first-draft test. Revert both commits if it goes badly.

<!-- xgd-chat-end -->