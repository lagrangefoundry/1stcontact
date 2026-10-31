---
uid: comment-bc06c619
id: COMMENT-5769
type: comment
title: Comment on request REQ-473
created_by: xgd
created_at: '2026-10-27T15:48:19.433522+00:00'
updated_at: '2026-10-27T16:24:11.602066+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-bfa0b74f
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "15c98770-c4de-4c8c-a4f7-c07fd0afc1f9",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="bfb39e62-7ecc-4935-962c-198d278bb2a3-user" -->

<!-- xgd-chat role="user" ts="2026-10-27T15:46:48.376259+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="bfb39e62-7ecc-4935-962c-198d278bb2a3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-27T16:24:08.630230+00:00" -->
#### Claude
Reading DOC-73 and the current priming setup next; I'll then cut the branch and implement.

Surveying the ~60 test files that read the priming; next I cut the branch, set the ticket to free_coding, and check DOC-70's contradiction list.

Working out how the knowledge base is built: Part B becomes a doc ticket with `doc_kind: system_kb`, which `1c kb build` exports into `kb/system/`.

Plan is clear. Next: cut the branch, mark the ticket `free_coding`, and baseline the priming-related tests before changing anything.

Worktree is ready. Baselining the ~60 priming-related test files on the clean branch.

Baseline recorded: 8 tests are already red on the clean branch (BUG-245 ×2, REQ-376, REQ-358, REQ-408, REQ-342 ×3). Next I'm looking at how the consultant's grant and authored size are measured.

Measured the baseline: the consultant's authored total is 229,242 (system text 105,249, tools 124,252). Now checking how ReportBug is granted, since it isn't in the default test grant.

Writing the new priming now. Part B is one knowledge-base doc whose sections are titled "Stage guide: …", so a chunk search for each stage lands on its guide.

Now the splice script that rewrites the two priming lists, the three reminder texts and the budget about-text in place.

Splice applied cleanly; the reminder hunks are minimal. Measuring the new priming text size.

Priming text drops from 42,929 to 12,860 characters (−30,069). Next: Part B goes in as a `doc_kind: system_kb` doc ticket.

DOC-75 was created, but in the main checkout's store. Checking whether the worktree's KB export can see it.

It sees it: `readDocTickets` goes through `xgd ticket list`, which reads the shared store. Writing the UATs now.

Nine of ten stage searches land; "is it right?" is too generic a query. I'm renaming that guide to "checking your work".

The stub embedder is a 64-bucket bag of words, so rank 1 is noise for short queries. The test now asserts the stage's guide is among the passages the search returns.

Each hit carries up to three passages, and the "checking your work" heading (it names publishing) crowds out the publishing guide. Shortening that heading.

Two words of overlap carry the stub, so I'm making each guide name its own subject in its opening line ("What the story board is for: …"). That reads fine and helps a real embedder too.

All 6 node UATs pass. Next is the workers UAT: every tool named in the priming is in the consultant's real grant, and the authored size is inside the lowered budget.

Budget lowered. Now running the full candidate set (node and workers) against the new priming, to compare with the baseline.

44 node failures across ~30 files, which is the retargeting the ticket expects. Running the workers candidates too, so I have the whole list before editing.

66 failures in total. Several workers ones look behavioural (scripted clients probably recognise the consultant by a priming phrase). Reading the failure messages next.

Some failing files weren't in my first baseline. Swapping the original priming.json back in briefly to baseline those, then restoring mine.

The baseline run produced no results. Re-running one file with console output to see why.

zsh doesn't word-split `$L`. Re-running the baseline with `${=L}`.

Helper works. Launching four forks on disjoint test-file groups. They retarget tests only and leave priming.json and DOC-75 to me.

While the forks work, I'm checking things outside their files: references to the removed section titles elsewhere in the AI layer, the REQ-472 motion-reference ranking, and the exact authored figure.

REQ-472 still ranks the motion reference first, and my UATs pass. Measuring the authored figure in REQ-466's grant (no filing tools) to confirm the number in the budget note.

Exact figures: 199,158 in REQ-466's grant and 203,294 with the filing tools. Setting the target to 205,000 (the measured size plus the ~5.8K margin REQ-466 used) and correcting the note.

Group C and D follow-ups pass. Waiting on group B; meanwhile I'm checking this project's version-bump convention.

Noted the gate order: merge xgd-working into the branch, bump the version on the branch, then fast-forward back. Waiting for group B to finish.

Drafting the ticket's "as landed" section while group B finishes.

The new focus-task section mentions "board" twice and outranks the comparison-board guide under the stub. Rewording it to "notes".

All green locally. Running the full candidate set again (node and workers) to compare against the baseline.

Node: only the three tests that were already red on clean remain. Now workers.

Workers: the 9 remaining reds are exactly the baseline's. One last measurement of the final authored figures for the ticket.

Final figures: 199,513 in REQ-466's grant and 203,649 with filing; system text 75,520. Updating the budget note and the ticket text, then committing.

Committed on the branch. Updating the ticket body (appending the "as landed" section, existing text kept) before the merge.

Ticket updated. Now the merge-back: lock, merge xgd-working into the branch, bump the version there, then fast-forward xgd-working.

Merged cleanly (only ticket files came in). Bumping the version on the branch.

Fast-forwarded; rematerialize had nothing to change. Moving the ticket to `free_coded` with the full SHAs.

REQ-473 is `free_coded` with both commits and version 0.2.676. Cleaning up the branch and worktree.

REQ-473 is implemented, merged into xgd-working, and parked at `free_coded` (commits `13e281fb` and `5499a90e`, version 0.2.676, 8 story points). All the new tests and the ~35 retargeted suites pass; the only reds left are 12 that were already red on the clean branch.

**What changed**
- **Part A is now the consultant's priming.** The eleven old entries are gone. In their place are DOC-73 A1–A7, the carried-over copy rules for builder briefs, the `showing` section (with REQ-467's link-label rule), and a short knowledge-base pointer where `purpose` was.
- **Interim adaptations:**
  - The client profile is kept with `set_readiness`, the standing note and `record_decision`.
  - "Read its guide" is now "search your knowledge base for its guide".
  - `stage_guide`, `make_favicon` and the readiness check aren't named anywhere in the priming.
- **Part B is a new doc ticket, DOC-75** (`doc_kind: system_kb`). It has ten sections titled "Stage guide: …", plus a short focus-tasks section. That's where DOC-73 Part C sends the focus-task rules (the material-track guide).
- **Part D:**
  - The long-work and method reminders are rewritten as the ticket specifies.
  - The vocabulary reminder now points at "Who you are", because its old section is gone.
  - The commissioning text that's also sent to the consultant still told it to "end your message with a story question" (DOC-70's D-1). It now says the wait is time for gathering material.
  - BUG-297 and BUG-298 are already in code, so those cues didn't need changes. The critique cue's "after hand-over, follow A5 rule 2" needs a code change, so I left it for its own ticket.

**Size**

| | Before | After |
|---|---|---|
| Consultant priming text | 42,929 | 13,215 |
| Authored total | 229,242 | 199,513 |
| Authored total with the bug-filing tools | – | 203,649 |
| `prompt_budget.roles.consultant` | 235,000 | 205,000 |

**Decisions you may want to check**
- **Seven rules I kept although DOC-73's wording dropped them.** Nothing in DOC-73 retired them and a test protects each, so each is back in a sentence, in the priming or in DOC-75:
  - BUG-118: read a tool's full entry when unsure where its target lives.
  - BUG-240: don't repeat what the client was told while a build ran.
  - REQ-410: don't claim parallel work you didn't start.
  - REQ-389: no metaphors the client has to translate.
  - REQ-415: work from a comparison site's description; look at its picture only when discussing how it looks.
  - BUG-245: a comparison-card note gets a reply of two or three sentences.
  - REQ-424: the focus-task method.
- **Assertions retired as DOC-73 intended**, not deleted wholesale: "build sooner, story later", "move on if nothing lands", "options that differ in kind", the three-line hand-back, ending with a story question, "the story is proof and character", and the A1 "Lead." paragraph.
- **I renamed "is it right?" to "Stage guide: checking your work"** and made each guide name its own subject in its opening line. The test embedder ranks short queries too noisily otherwise. The search test finds the guides document across the knowledge base, then searches inside it for each stage's name.
- **Test-only constants in `roles.ts` now carry the new entry names.** The REQ-358 test that was red on clean now passes, because the budget note no longer names a DOC id.

**Still to do:** DOC-75 only reaches the consultant once the shipped knowledge base is rebuilt (`1c kb build` or `bin/kb-release`) and deployed. I haven't done either.

The ticket body keeps your original text, with an "As landed" section added that has the full record and measurements.

<!-- xgd-chat-end -->