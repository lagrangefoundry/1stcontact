---
uid: comment-217c94cb
id: COMMENT-4878
type: comment
title: Comment on bug BUG-196
created_by: xgd
created_at: '2026-10-04T01:13:40.190963+00:00'
updated_at: '2026-10-04T01:27:52.789354+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-63d82041
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "79b0327c-6acf-4355-9f61-0df7d306f5c3",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="6f1778e0-ed62-493f-8df3-7856b5ba167f-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T01:12:38.126527+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="6f1778e0-ed62-493f-8df3-7856b5ba167f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-04T01:27:52.216648+00:00" -->
#### Claude
I'm mapping the plan-ask upload path end to end (panel → `/api/plan/ask` → material store → consultant surfaces) before cutting the branch.

Still reading: now the host's library deps, `reviseRole`, and the delete path, so the consultant's new operations reuse them.

Reading the Library pane now (role control, delete button) — that's the last piece before I cut the branch.

I have the design mapped. Marking the ticket `free_coding` and cutting the branch now.

Worktree repaired. Starting with the plan model (`plan-core.ts`): an ask's `upload_role` and `multiple`, and an answer that can cite several files.

Now the plan-core edits.

Now the plan surface declaration — `set_ask` gets `upload_role` and `multiple`.

Next: the router — validate each cited material, and send the panel the Library rows its answered uploads cite (so it can offer "Use on the site" and Delete).

Now the `panelWithMaterial` helper beside `theOneSite`.

Now the consultant's half: two library-surface operations over `reviseRole` and `archiveMaterial`. Checking the existing refusals first.

Writing the library-core operations.

Now the declaration (`library-surface.json`): two operations, a `KeepLibrary` group, two refusal codes, and the absences rewritten.

Host side (`library.ts`): `setRole` and `remove` over the existing functions, refusals translated.

Frontend next. I'll extract the delete control and its confirmation into one shared module so the Library pane, the Library row, and the plan panel all use the same code and style.

Writing the shared `material-actions.js`.

Now rewiring `library.js` onto the shared module, and adding the row actions.

Now the plan panel itself.

Now the panel code.

Now the CSS: one danger-button style, the neutral action style, and layout for the row and panel file lists.

Code is in place. Typechecking and running the existing suites that touch these areas.

Typecheck is clean. Running the related existing suites.

Existing suites green. Now the new UATs — first checking how the panel suite drives uploads and mounts the builder.

Writing the browser-side UAT file.

7/7 pass (actually executed, not skipped). Now the server-side UATs — reading how the REQ-281 workers suite seeds material and a site.

Writing the workers UAT (real routes, real D1/R2, real catalogue surface).

Two test-side mistakes (re-placing returns the existing asset name; `tickets.get` has a different shape). Fixing the assertions to read through the catalogue instead.

All 13 new UATs pass. Now a wider regression sweep over every suite touching the plan, the Library, and the library surface.

402/402 across 54 suites. Re-running the typecheck, plus the `tools/generate` project if it has its own.

Typecheck clean. Before committing, checking my notes on this repo's version-bump and `free_coded` gate quirks.

Now updating the ticket body (keeping the existing content) to record the final design, the explicit REQ-281 supersession, and the UAT mapping, before the commit lands.

Committed (`d1fcdd41`). Taking the merge lock and merging back into `xgd-working`.

Merged cleanly. Now the gate — without `--version`, so it bumps inside its own lock.

Landed. One last honest touch: this ended up larger than the 3 story points on the ticket, so I'm bumping that to 5.

BUG-196 is done and merged into `xgd-working`. The ticket is at `free_coded` (commit `d1fcdd41`, plus the automatic version bump to 0.2.474). The ticket body now records what was built.

**What changed**

1. **An ask says what its uploads are for.** The consultant's `set_ask` takes `upload_role` (`site` or `reference`). The panel uploads with that role instead of the hard-coded `reference`. With no role set it stays `reference`. Uploads to a `site` ask go onto the site as they arrive, so the consultant can use them straight away.
2. **Several files per ask.** The picker accepts several files when the ask allows it, which is the default for a `site` ask. Every file is recorded against the ask, and the consultant's notice says how many arrived (e.g. "2 documents").
3. **The client sees what they can do with an upload.** An answered ask on the panel now lists its files, and each Library row shows the same two actions:
   - **Use on the site** appears only where it would work: a file the client uploaded that is still background material. It goes through the existing role route, which also places the file.
   - **Delete** asks first, as before. A file that has since been deleted shows as "Deleted from your Library".
4. **The consultant has two new operations, used only on the client's say-so.**
   - `set_upload_role` uses the same rule as the client's control: only files the client uploaded, and never back to background once on the site.
   - `delete_library_item` uses the same deletion as the client's Delete button. Its result says plainly when a deleted picture is still showing on a page.
5. **Delete looks dangerous.** It's now a real button with a trash-can icon and the word "Delete" in the danger colour, the same everywhere it appears, including the confirm button in the dialog. Screen readers still hear "Delete this from your Library".

**Decisions I made**
- When the consultant changes a file's role, it does not also place the file; placing stays a separate step. The client's "Use on the site" does place it, because the existing route already did that.
- The delete control, "Use on the site", and the confirmation dialog are now one shared file used by the Library pane, the Library row and the plan panel, instead of living inside the Library code.

**Older behaviour this replaces.** Four existing tests pinned what this ticket changes, so I updated them. The ticket body names each one as superseded:
- REQ-281's rule that delete is "not on the row".
- The consultant's library manual saying "no way for you to delete" and "no way to change what a file is for".
- REQ-228's expectation that the consultant gets two groups of library operations (it now gets three).

**Tests**
- 13 new tests, all passing: 6 run against the real server routes and storage, 7 run the real panel and Library in a simulated browser.
- A wider run of 54 related test files (402 tests) passes, and the typecheck is clean.
- I haven't looked at it in a real browser, so check the new button styles by eye on the plan panel and the Library tab.

<!-- xgd-chat-end -->