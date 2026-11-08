---
uid: comment-7063f0f8
id: COMMENT-7909
type: comment
title: Comment on request REQ-656
created_by: xgd
created_at: '2026-11-06T20:07:51.997913+00:00'
updated_at: '2026-11-06T20:25:51.860226+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-f2dd608f
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "878bd04a-ee7e-4ba4-9890-efd74ae9f096",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="6d2ec775-d747-4b65-abe2-e970c463f79b-user" -->

<!-- xgd-chat role="user" ts="2026-11-06T20:07:28.864699+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="6d2ec775-d747-4b65-abe2-e970c463f79b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-06T20:25:50.827737+00:00" -->
#### Claude
Not a duplicate. Now exploring the code: the Library tab, the conversation upload path, and how background material notices work.

Reading the existing wiring now. The Library already has a drag overlay from REQ-161, so I'm checking what it actually does today.

Mapping the server side now: the upload route and how the consultant's per-turn notices are assembled, so a Library upload can get its own "client added files" notice.

Still reading: the Library panel's layout (header slot, imports progress rows) to decide where the button and in-flight rows go.

Branch cut. Now linking `node_modules` into the worktree so the tests can run there.

Now the Library panel: an **Upload** button in the filter row, plus a status line for each file while it uploads.

Now `library.js`.

Now the client transport (`api.js`) and the server route plus the material record.

Now the consultant's notice in `session-delta.ts`.

Now the stylesheet: remove the overlay's rules and add the Library's drop outline, the button and the upload lines.

The code is in place. I'm tidying the stale "overlay" comments, then I'll typecheck and run the tests.

Typecheck is clean. Next I'll check how the existing tests drive the material route and the per-turn delta, so the new UATs can use the same harnesses.

Still debugging the server-side UAT: the second turn carries no corpus-delta line at all, so I'm checking why route-uploaded material isn't swept.

Still on the server-side UAT. The cursor isn't being written on the first turn, so I'm adding a temporary log inside `turnDelta` to see why.

Server UAT passes (2/2). Now the builder-side UAT in jsdom against the real `mountBuilder`: the Upload button and picker, picking two images, the drop outline, a refusal, and no chat message or turn.

All 4 pass. Next, the existing tests that pinned the old overlay.

Old overlay tests are updated. Running the broader regression next: the builder and Library suites, the attachment/chat suites, and the delta-related workers suites.

A lot of failures. Most look unrelated (access gate, REQ-452 replay, AC-numbered reconciliation suites), so I'm running the same file set on the clean main checkout to get a baseline to diff against.

Those pass now. Running the workers suites that touch the delta and the material route.

These look like stale reconciliation suites (the `businessId` TypeErrors, a `brief` ticket type that no longer exists). Running the same files on the clean checkout to confirm they're pre-existing.

The workers failures are identical to the clean baseline: 68 pre-existing, none new, and my 2 new tests pass. Final checks: typecheck again and look for a linter.

Typecheck is clean and there's no linter configured. Before committing I'll update the ticket body with the cursor fix and the actual test changes, so every UAT is motivated by its text.

Ticket updated. Committing the work on the branch.

Committed. Now the merge back: lock, merge `xgd-working` into the branch, bump the version, run `xgd-merge`, then move the ticket to `free_coded`.

Ticket is at `free_coded`. Cleaning up the branch and worktree.

Merged and cleaned up. The ticket also asks that, once this lands, the Library's **Upload** be added to the playbook line in DOC-75 ("Sending you files"). Checking that section.

Adding one sentence to that line through the ticket CLI (it's a doc change, so no ticket needed).

DOC-75 changed only that line. One last ticket touch: recording that the DOC-75 follow-up is done.

REQ-656 is done. The Library has an **Upload** button and takes dropped files, both using the conversation's own upload, and the consultant is told about them on its next turn. It's merged into `xgd-working` and the ticket is at `free_coded` (version 0.2.805). It isn't a duplicate of any open ticket.

**One decision to check:** this removes REQ-161's "Purpose" sheet, the one that asked "Site asset or Background information?" whenever a file was dragged over the Library. A file now arrives with the conversation's default (pictures, fonts and ZIPs are Site asset; everything else is Background information), and the client corrects it on the row. The ticket asked for the same picker and drop highlight as the conversation, so I treated this as an explicit supersession and named the dropped REQ-161 ACs in the ticket body. If you wanted the question kept for Library uploads, say before promoting it.

**What changed:**
- **Upload button** sits beside the Library's filters. It opens the same picker as the conversation's **+**: same accepted types, several files at once. Both surfaces now share one picker and one drop handler, so they can't drift apart.
- **Dropping on the Library** shows the conversation's dashed outline and goes straight in.
- **Progress:** each file shows an "Uploading …" line until it's stored and its row appears. ZIPs show the existing unpack lines.
- **Refusals:** a refused file shows the server's own sentence in the Library, the same one the conversation's chip shows.
- **The consultant is told** on its next turn: "Your client added N files to the Library since your last turn: IMAGE-12 (`van.png`), …". Nothing is posted to the chat and no turn starts. Conversation attachments aren't flagged, because their message already announces them.
- **A bug I found and fixed on the way:** the "new material" notice never saved its position on a session's first turn. In a new business, a file added between the first and second turns was never announced. This was also hiding behind the REQ-160 tests, which only passed because earlier cases had already set things up.
- **DOC-75** ("Sending you files") now tells clients they can use the Library's **Upload**, as the ticket asked.

**Tests:**
- New UATs: 4 in the builder and 2 end-to-end on the server, all passing.
- Old overlay tests:
  - `test_UAT_FC_REQ-161_upload_overlay.test.ts` is deleted.
  - `reconciliation-upload-overlay.test.ts` keeps only the check that every surface names the two roles the same way (AC2021).
  - The REQ-176, REQ-221, REQ-414, REQ-635 and BUG-70 tests lost their overlay steps.
- Typecheck is clean, and there's no linter configured.
- Against a baseline on clean `xgd-working`, the related builder and server suites show no new failures. There are 68 failures in the related server suites, the same 68 on the baseline. A few builder-suite failures appear only because the tests ran from a branch worktree (webui serving, env files).

I set story points to 5, up from 3, because of the supersession and the cursor fix.

<!-- xgd-chat-end -->