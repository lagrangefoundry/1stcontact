---
uid: comment-eaa38ee5
id: COMMENT-5358
type: comment
title: Comment on bug BUG-206
created_by: xgd
created_at: '2026-10-12T11:19:50.950684+00:00'
updated_at: '2026-10-12T11:31:31.506198+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-83a90ebd
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "7aeb6946-a72c-49f4-8a02-d143f5935766",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="0573cead-67fc-49bc-9d11-de2dc3eaa820-user" -->

<!-- xgd-chat role="user" ts="2026-10-12T11:19:01.538004+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="0573cead-67fc-49bc-9d11-de2dc3eaa820-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-12T11:31:31.213750+00:00" -->
#### Claude
Reading the image pipeline (ladder, HEIC seam, material ingest) to map every path that writes a site asset before I scope the change.

Mapping every path that writes a site asset (Library upload → promote, `/api/import`, editor/AI writes) to choose a single door for the downscale.

Looking at the publish route's error envelope next, then I'll write up the scope on the ticket and cut the branch.

Still designing: checking the store object shape and the local test renderer so the decorator and a new `height` render option work in both runtimes.

Design settled. Now looking at an existing `/api/import` UAT harness and the node ladder UAT so the new tests drive real entry points.

Router UATs run under workerd; checking one (BUG-126) for how it builds scope/env so my UATs can hand `route()` a fake Images binding at the external boundary.

I have the design. Recording it on the ticket (appending, existing body preserved), moving to `free_coding`, and cutting the branch.

Branch cut. Now the code — starting with the transient-9529 retry in the renderer.

Now the ladder: the cap constant, `capSource`, the named error, and planning/rendering from the capped intermediate.

Now the door: export the sizer adapter and add `cappedSiteStore` in `image-ladder.ts`.

Now writing the door decorator and the exported sizer in `image-ladder.ts`.

Router wired. Type-checking now.

Typecheck is clean (the remaining errors are pre-existing missing generated artifacts in a fresh worktree). Checking memory notes on running workers suites from a worktree before writing the UAT.

The worktree lacks the gitignored `generated/` build artifact, which the router suites need. Checking whether it's ignored, so I can copy it in from the main checkout.

Writing the UAT next. Confirming the `/api/import` asset payload shape first.

Payload confirmed (`{name, base64}`). Writing the UAT file.

Running the new UAT under the `workers` project.

All 5 pass. Running the adjacent regression scope: the existing ladder, renderer, and router-picture suites.

Regression scope green (142 node + 90 workers). Quick falsifiability check: disable the ladder cap and confirm the "pre-existing oversized photo" UAT goes red.

Committing on the branch with explicit paths.

Committed. Now lock and merge back into `xgd-working`.

Fast-forwarded. Running the overlay check the lock output named.

No tickets touched by the merge. Moving to `free_coded` (letting the gate do the version bump itself).

Ticket is at `free_coded` (v0.2.503). Cleaning up the branch and worktree.

I've fixed BUG-206: a full-size camera photo no longer stops a site from publishing. The ticket is at `free_coded` (commit `7584ed475d`, version 0.2.503), merged into `xgd-working`, with the branch cleaned up.

**What changed**
- **Size limit:** there is now a maximum photo size of 4096 pixels on the longest side (`MAX_SOURCE_EDGE`). One function shrinks photos to fit it, and both the upload path and the publish step use it.
- **Uploads:** every site store the router opens now shrinks oversized photos as they're saved. That covers adding a photo from the Library, the assistant placing a photo, and `/api/import`. The photo keeps its format and proportions. Anything already within the limit is stored unchanged, without being re-encoded. If shrinking fails at upload, the original is saved and publish tries again, so an upload never fails over this.
- **Publish:** an oversized photo is shrunk once to the limit, and every delivery size is made from that copy. That includes photos already on sites, such as Faelan's `scorched-earth.jpeg`, without rewriting them (there is no one-off sweep). What visitors are served doesn't change: the original is still listed as the largest size.
- **Retries:** when the image service refuses with 9529 (which also means "busy"), it's retried twice, after 200 ms and 800 ms.
- **Error message:** a failure that remains now names the photo instead of showing the raw code, e.g. "`scorched-earth.jpeg` is 5712 × 4284 pixels and could not be prepared for publishing… replacing it with a copy no larger than 4096 pixels on its longest side will let the site publish."

**Two decisions to check**
- **The 4096 limit wasn't measured.** The sandbox can't reach the deployed Worker, and the local stand-in for the image service doesn't behave like the real one. I picked 4096 from the production evidence: the 5.8 MP picture on Faelan's site worked and the 24.5 MP one didn't, and 4096 (12.6 MP for a typical 4:3 photo) sits roughly midway. My best guess is that the failure came from encoding the WebP copy at the original's full 5712-pixel width. It's one constant to change if a real measurement says otherwise; this is noted on the ticket as an open item.
- **I didn't reuse `heic.ts` directly.** The HEIC conversion only runs when files enter the Library, but photos also reach sites by import and by the assistant. So the upload check sits on site-store writes and uses the same image service setup as HEIC conversion and editing, with no second connection to the service.

**Tests**
- I added 5 tests in `tests/test_UAT_FC_BUG-206_camera_photo_publishes.workers.test.ts`, all passing. They run through the real router, store, cache, ladder and publish code, with a fake image service that refuses large outputs with the real 9529 message. They cover: an imported 24 MP photo stored at 4096 × 3072 in its own format; a photo within the limit stored unchanged; a site that already holds the big photo publishing successfully; a one-off 9529 retried; and a persistent 9529 giving the named message.
- The test proving existing big photos now publish fails if I turn the shrinking off.
- The existing image and publish tests pass: 142 in node and 90 in workerd.

The ticket body has the design decisions and test plan appended.

<!-- xgd-chat-end -->