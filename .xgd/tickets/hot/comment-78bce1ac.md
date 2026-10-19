---
uid: comment-78bce1ac
id: COMMENT-5522
type: comment
title: Comment on bug BUG-230
created_by: xgd
created_at: '2026-10-19T23:32:47.182153+00:00'
updated_at: '2026-10-19T23:51:42.538107+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-e72f1211
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "17b9a3da-3048-4d7e-9237-2704b667c7d4",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="c51a9650-a047-438a-92dd-2d444a45830b-user" -->

<!-- xgd-chat role="user" ts="2026-10-19T23:32:13.081711+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="c51a9650-a047-438a-92dd-2d444a45830b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-19T23:51:37.434028+00:00" -->
#### Claude
The ticket is well scoped. Setting it to `free_coding` and cutting the branch.

Now how `publishSite` checks addresses, and what other coded refusals exist.

Now the builder's publish handler and the banner (`block.fail`).

Still surveying the code: the route/stream fix is clear, and I'm checking the builder's other banners for item 3 before moving to the consultant side (items 4–5).

Surveyed the banners. Now finding `show_client` (REQ-413) and the per-turn plan notice for items 4–5.

Now the builder side of `#show=` links (app.js ~1040–1140).

Now the going-live priming (from `1c6a268d7e`) and the per-turn plan notice.

Found where the plan notice is built; tracing how the chat host already gets the site's addresses so the notice can use the same reader.

I have the full picture. Starting with the server: `streamPublish` holds the response until the first progress frame, and a late coded refusal carries its code.

Now `api.js`: carry `code` from a failed terminal frame.

Writing a small shared helper for "plain line + Details toggle", used by the publish banner and the plan panel's error line.

Now wire it into the publish banner and the plan panel, with the copy in `config.js`.

Banner done. Now item 4: the `web_address` target for `show_client`.

Now the priming line, both copies (splicing textually per the mixed-escapes note).

Item 5: the plan notice line. Checking the stage helpers.

Code is in. Typechecking, then writing the UATs.

Generated artifacts are missing in a fresh worktree (known); filtering to the files I touched.

Clean. Now the UATs — looking at the existing REQ-238 / REQ-250 / REQ-413 suites to reuse their harnesses.

The workers suites run once `generated/` is copied in. Checking how the REQ-222 stream tests inject a ladder, so I can cover the late-refusal case.

I'm working out how to trigger a real post-stream failure (a picture the image service can't resize) for the late-refusal UAT.

Writing the workers UAT for the server half.

Server side green. Now the builder-side UATs; checking whether the REQ-250 jsdom harness runs in this worktree.

Writing the builder-side UAT file now (dialog via the real `api.js` stream client, the plain banner, and the `web_address` link/switch).

All five builder UATs run and pass (not skipped). Now the consultant side: `show_client` returning the `web_address` link, and the plan notice line. Checking how existing suites exercise those.

Writing the last UAT file: a real chat turn through the Worker with a scripted model, covering the `web_address` link/switch and the plan-notice line.

Fixing a slip in `site()` (it seeded twice).

All BUG-230 UATs pass. Running the adjacent regression scope (show/plan/priming/publish suites).

17 failures across 11 files; most look unrelated (KB, palette, REQ-285 digest). Checking them against a baseline by temporarily setting my diff aside.

The same 17 fail on the clean base, so they predate my change. Restoring my work.

Now the workers regression scope (show_client, cadence, publish, admin addresses).

Regression scope is green. Reading my notes on this project's version/free_coded gate before committing.

Plan: commit on the branch without a manual bump, merge back, then let `move-to-free-coded` bump the version itself. Committing.

Committed. Updating the ticket body (keeping the existing content, adding what landed) before merging back.

Ticket body updated. Locking and merging back into xgd-working.

A conflict in `app.js` (someone else landed nearby). Resolving it.

BUG-231 just introduced a `createBanner` helper with a dismiss ×. Checking what `content` accepts so I can combine both changes.

Sides are reversed in this merge direction; adjusting the marker.

Resolved. Re-running the builder suites, including BUG-231's banner tests.

BUG-53 failed on the baseline too, but it checks for unstyled classes, so I'm confirming my new classes aren't part of its complaint.

Unrelated (`builder-library__confirm-delete`, same as baseline). Committing the merge resolution, then landing it on xgd-working.

Fast-forwarded onto xgd-working. Moving the ticket to `free_coded` (no `--version`, so the gate bumps the version itself).

Ticket is `free_coded`, with three commits and version 0.2.547. Cleaning up the branch.

BUG-230 is done and merged into xgd-working. The ticket is at `free_coded` (commits `c14ce028`, `f365ba1c` and the version bump `ab9e3cad`, version 0.2.547), and its body now records what was built.

**The fix.** The server now waits before committing to a stream: it holds the publish response until the publish first reports progress, or finishes. A site with no address therefore gets the ordinary `409 NO_PUBLIC_ADDRESS` in both forms, and REQ-250's dialog opens. I did this instead of a separate address check at the route because it keeps the existing order: a broken draft is still reported before a missing address. If a refusal with a code happens after the stream has started, the final message now carries that code too, and the builder passes it on.

**Side effect:** every refusal that happens before image resizing starts (invalid draft, nothing built, missing site, the image-limit refusals) now comes back as a normal HTTP error status in the streaming form, not a `200` with a failure message inside.

**What changed on screen and for the consultant:**
- **Publish failure banner:** it now says *"This site was not published. Something went wrong — try again in a minute, and tell us if it keeps happening."* The server's text sits behind a closed **Details** toggle.
- **Other banners:** the plan panel's "That answer was not saved" was showing server text, so it gets the same treatment. The session-ended, no-business and no-API-key banners only use our own wording, so I left them alone.
- **`show_client`:** has a new `web_address` target. As a link or a switch, it opens Settings at the web-address section, the same way the dialog's button does. The tool description and both copies of the going-live instructions name it.
- **Plan notice:** shows *"No web address yet: the site can't be published until one is chosen."* while Finishing touches or Ready to publish is started or done and the site has no address. Addresses are only looked up at those stages.

**Tests:** I added 11 UATs in three files covering every Test plan item, and all pass. The adjacent publish, `show_client` and plan suites (workers and jsdom) pass too. 17 tests in 11 other files fail, but they fail identically with my changes removed (knowledge base, palette, REQ-285 digest, BUG-53).

**Two existing tests I changed, because this ticket deliberately changes what they pinned:**
- REQ-222's "failure in the terminal frame" test used a missing site, which now fails before the stream starts. It now uses a real failure after the stream starts, and a separate case checks that the missing site gets an error status.
- BUG-231 landed mid-session and moved the banner onto `createBanner` with a dismiss ×. I merged on my branch so the banner keeps both the × and Details, and updated BUG-231's exact-text check to the new wording while keeping its point (the × adds no text).

<!-- xgd-chat-end -->