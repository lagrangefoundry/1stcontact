---
uid: comment-6a5ace30
id: COMMENT-5866
type: comment
title: Comment on bug BUG-321
created_by: xgd
created_at: '2026-10-31T21:09:42.557350+00:00'
updated_at: '2026-10-31T22:51:18.192736+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-551cacdf
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "357d5a9a-aeb5-45e4-b035-118a406dd673",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="2bb2d707-e7af-4139-ae85-4d30e76f73e8-user" -->

<!-- xgd-chat role="user" ts="2026-10-31T21:08:12.740422+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="2bb2d707-e7af-4139-ae85-4d30e76f73e8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-31T21:12:04.186157+00:00" -->
#### Claude
Checking whether any 1st Contact code touches the composer's caret or focus. After that I'll report back.

There's nothing to code under BUG-321 yet. The ticket says no code lands here unless 1st Contact's own CSS turns out to contribute to the missing cursor, and it doesn't.

**Where the fix stands:** the actual fix belongs to lagrange-framework BUG-104 (`bug-9e511842`), and that ticket is still `draft` with no commits. Until it lands and 1st Contact moves to a framework version that includes it, BUG-321 has nothing to pick up.

**Host check:** I looked for anything in 1st Contact that could hide the cursor. `apps/control-app/src/builder/builder.css` touches the chat box in only two places:
- the text size of `.chat-widget-input` (REQ-401)
- the left inset of the "+" button (REQ-464)

There's no `caret-color` rule, no `.ProseMirror` rule, no styling of the placeholder text, and no focus handling of our own anywhere in `apps/control-app/src`. So the bug is entirely in the framework. I added this finding to the ticket body. The status stays at `draft`, since there's no code, branch or commit for this ticket.

**Next step:** run the BUG-104 session in lagrange-framework, under that ticket and following its test plan (Playwright in WebKit and Chromium). The fix there swaps the placeholder's `position: absolute` for `float: left; height: 0` and makes a click anywhere in the box focus the editor. Fixes to another repo go through that repo's own ticket, so I haven't touched framework code from this session. Once a framework release includes the fix, come back here to bump the version and check the cursor in the builder. That closes BUG-321.

<!-- xgd-turn id="9273f11d-39a8-48f9-b079-bf676c22b1db-user" -->

<!-- xgd-chat role="user" ts="2026-10-31T22:46:21.471908+00:00" -->
#### You
104 is completed and installed please proceed

<!-- xgd-turn id="9273f11d-39a8-48f9-b079-bf676c22b1db-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-31T22:51:16.327761+00:00" -->
#### Claude
Now checking how 1st Contact consumes the framework, and whether the installed copy carries the fix.

The vendored copy in `dist-assets` still has the old rule. Checking the shared store the build copies from.

The installed framework store (15:46) has the BUG-104 fix. The builder's vendored copy in `apps/control-app/dist-assets` (built 15:39) is older and still has the old rule. Rebuilding the assets.

Assets now carry the fix, and no tracked files changed. Next I'll check the caret in a real browser with the builder's own CSS applied.

Getting the browser probe to run in the sandbox. With `--single-process`, Chromium only allows one page, so I'll reuse it.

Python Playwright 1.62 in the xgd venv matches the installed WebKit (2336), so I'll drive both browsers through its bundled driver, using the pixel check.

Chromium paints a caret with both the old and new CSS. That fits the bug being WebKit-specific. WebKit crashes on `newPage`, so I'll pull its browser log to see why.

WebKit can't open a page inside this sandbox (its WebContent process dies with no log), so the Safari check has to happen outside it. Recording the result on the ticket.

The fix is in 1st Contact's local build, but no code landed under BUG-321. Production still shows the bug until the next deploy, and the Safari check is still to do.

**What I did**
- **Confirmed the fix is installed:** the framework store 1st Contact builds from has BUG-104 (`02cff360a056`). The placeholder no longer uses `position: absolute`, focus carries over to the editor when the box upgrades, and clicking anywhere in the pill focuses the editor.
- **Rebuilt the assets:** 1st Contact pins no framework version and takes `webui-chat` from that store through `1c assets`. The builder's built copy in `dist-assets` dated from before the fix, so I re-ran `1c assets` and it now has the new rule. No tracked file changed.
- **Checked the caret in Chromium:** a throwaway probe put the empty chat box in a page with the builder's own `builder.css`, clicked into it, and looked for a painted caret before typing. Chromium shows the caret with both the old and new CSS, so the bug was never Chromium's.

**Still open**
- **Safari (WebKit), where the bug actually appeared, is unchecked.** WebKit won't open a page in my sandbox. Please click into the empty builder chat box in Safari on a deployed build and look for the cursor before typing. Try it twice, since the original report was intermittent.
- **Deploy:** the fix reaches production on the next `bin/deploy`, and dev on `bin/deploy --env dev`. I haven't run either; tell me if you want me to.

**Ticket**
- The body now records the pick-up, the Chromium check, and the Safari step.
- Nothing in 1st Contact's own code contributed to the bug, so per the ticket there's nothing to commit or test here. The framework's BUG-104 tests are the evidence.
- Status stays `draft`, because `free_coded` requires recorded commits and there are none. Close it once Safari shows the cursor.

<!-- xgd-chat-end -->