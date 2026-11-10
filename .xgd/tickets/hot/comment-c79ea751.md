---
uid: comment-c79ea751
id: COMMENT-8175
type: comment
title: Claude response for fix_reconciliation_review report
created_by: xgd
created_at: '2026-11-10T00:55:40.781967+00:00'
updated_at: '2026-11-10T00:55:40.781967+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-27b9a046
  kind: note
---

I fixed all three gaps from review report-0ddcefe6 and filed the completion report REPORT-12087 (`progress_made=true`, `needs_more_work=false`). As instructed, I did not run the tests, so none of the new or changed tests has been run yet; the workflow's next suite run will be the first check. No production code was touched, and there was no FC-orphan report for this bundle.

**G1 – STORY-157 said the lease and shot were unwrapped.**
- The "Code issue flagged … not wrapped (BUG-80)" section is now marked RESOLVED. It cites override report-c0389fea (`screenshot.ts:321-362`) and the passing quality report report-d6cba09d.
- The Technical Context bullet now lists every wrapped step (lease, navigate, chunks, decode, shot). It also says the deliberate decode refusal is thrown outside the wrapped code and that the driver is still always closed.

**G2 – no test made the browser lease fail.**
- The AC-2565 UAT in `tests/reconciliation-stored-picture-delivery.test.ts` has a new case (e). The driver factory rejects with a multi-MB `data:` URL and base64 payload.
- The test checks the error names the picture, keeps the driver's code, contains no `data:` URL and no base64 run of 120+ characters, and keeps the diagnosis to 400 characters or fewer.
- AC-2565's Verification list now includes this case, so moving the lease back outside the wrap would fail the test.

**G3 – five ACs were pending with no AC-named UAT.**
- **REQ-217:** I renamed the two FC files to `tests/reconciliation-assistant-picture-in-the-turn{,.workers}.test.ts`, with tests named for AC-2569, AC-2570, AC-2571 and AC-2572.
  - I added checks: the exact URL, a `replace: true` redraw through the Worker, `surface_version` 9, the named absence, and the 260px height and `auto` width/height in the chat-pane rule.
  - AC-2570 also has a new reload UAT in `reconciliation-assistant-conversation.test.ts`.
  - I deleted the two `create_image` FC cases because AC-2567 and AC-2568 already cover them.
- **BUG-83:** I removed the FC file.
  - Its hover test is replaced by a new AC-2594 UAT in `reconciliation-marked-points.test.ts`, using the real edit bridge. It adds the two checks the review asked for: turning the mode off restores the render's own hover rule, and the overlay stylesheet has no region-stamp attribute.
  - The three channel-reader tests are folded into a new AC-2364 UAT.
  - I deleted the selector-layout helper test because the AC-1043 UATs already find that rule in the real `builder.css`.
- I set AC-2569, AC-2570, AC-2571, AC-2572 and AC-2594 to `active`, each with a note naming its UATs. STORY-107, STORY-172 and STORY-174 now point at the new evidence.

**Risks:**
- **Two places the new tests may fail:**
  - The Worker redraw step in the AC-2569 test assumes the preview serves the replaced file without caching.
  - The AC-2594 test assumes the edit render's hot-segment rule appears exactly once.
- **Two Verification steps are checked indirectly:**
  - AC-2569 asks that the chat's sanitiser keeps the `<img>`. The sanitiser loads from a CDN and can't run in the suite, so the test checks the markdown shape instead.
  - AC-2594 asks for the computed outline. jsdom has no cascade, so the test checks which CSS rule reaches the segment.
  - Both AC notes say this, but the next review could still flag it.

The test changes are left uncommitted in the working tree, as the instructions said; the ticket updates were committed automatically. A blocked connection to `github.com:22` appeared during the report step, but the report was still created.