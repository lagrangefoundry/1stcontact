---
uid: comment-552601b3
id: COMMENT-3376
type: comment
title: Comment on bug BUG-131
created_by: xgd
created_at: '2026-09-20T23:20:01.427791+00:00'
updated_at: '2026-09-21T00:02:20.068079+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-9ca5a8fc
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "952b5be6-c7bd-48be-92d9-13b4c71f7039",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="351b1184-a1c0-4f34-a340-380bdbec477b-user" -->

<!-- xgd-chat role="user" ts="2026-09-20T23:19:15.336689+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="351b1184-a1c0-4f34-a340-380bdbec477b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-20T23:21:10.379482+00:00" -->
#### Claude
⚠️ Chat generation failed: Claude Code CLI error (exit code 1)
Error: You've hit your session limit · resets 6pm (America/Los_Angeles)

<!-- xgd-turn id="c6581cac-7469-4ba4-9477-4db7e040beb8-user" -->

<!-- xgd-chat role="user" ts="2026-09-20T23:27:13.368750+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="c6581cac-7469-4ba4-9477-4db7e040beb8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-20T23:28:39.111677+00:00" -->
#### Claude
⚠️ Chat generation failed: Claude Code CLI error (exit code 1)
Error: You've hit your session limit · resets 6pm (America/Los_Angeles)

<!-- xgd-turn id="eb1c3243-5659-4846-894a-b8f6f62258cf-user" -->

<!-- xgd-chat role="user" ts="2026-09-20T23:38:26.744091+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="eb1c3243-5659-4846-894a-b8f6f62258cf-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-21T00:02:19.532764+00:00" -->
#### Claude
Now let me start the process: mark the ticket `free_coding` and cut a branch.

Now the toolbar action:

Now fix the `getSrc` doc comment in panel.js (the invariant that has to go, plus the misattributed citation):

Now the UAT suite. Let me check how the existing toolbar tests mount things and whether business scope affects the URL:

Now bump the version and commit:

Now release the lock and tear down the branch:

Done. BUG-131 is at `free_coded`.

## What changed

**The fix** — "Open in new tab" now opens the `draft` render of the page the pane is on, in both channels:

- `toolbar.js` — `openInNewTabAction(honestUrl)` takes a function from the pane's current URL to the production render, and re-derives the href on every `src` event (so it still follows the operator between pages). The module stays import-free and channel-name-free.
- `app.js` — supplies `(src) => previewChannelUrl(src, 'draft')`, beside the mode registry that already names the other channel. That one channel name is the whole of the fix.
- `api.js` — new `previewChannelUrl(url, channel)`: the exact dual of the existing `previewPageUrl` (keeps the page, replaces the channel), co-located with the other readers of that URL shape.

I derived the draft URL from the pane's **URL** rather than from `carry.pathFor(site)`. The carry looked like the obvious source — it's what both modes' `src` already compose from — but `src` fires before the new document arrives, so the carry still names the page being *left*; the link would have lagged one page behind on every move. Recorded in the ticket body.

**Superseded criteria.** Three existing tests pinned the old invariant. `AC-971` ("always targets the displayed document") and `REQ-115`'s AC 8 ("identical URL") are genuine intent conflicts — invalidated as written, re-pointed to the surviving half (it targets the *page* the pane displays, in the production channel), and declared as explicit supersessions in the ticket body so reconciliation handles them rather than discovering them. `AC-1110` merely used this control as its lifetime probe; its expected value moved, its claim didn't.

**Documentation** — DOC-28 §10 now cites DOC-8 §3.3 (production-fidelity check) instead of §4.3 (edits-are-diffs), and says the channel is `draft` in both modes and why. The `panel.js` `getSrc` invariant "the tab and the iframe can never disagree" is gone, with the same misattributed citation.

## Evidence

`tests/test_UAT_FC_BUG-131_open_in_new_tab_is_the_draft_render.test.ts` — 5 UATs against the real `mountBuilder` composition. 4 of the 5 fail with the fix neutralised (verified by temporarily passing identity for `honestUrl`); the fifth is the View-mode no-regression claim and passes either way.

Regression scope green (39 tests across 5 builder suites), `tsc --noEmit` clean on control-app. The full suite shows 2 unrelated pre-existing failures: `bug32-webui-scope-rebrand` (static audit listing files I didn't touch) and `BUG-67_backend_settings` (an unexpected `contextWindow` key).

One process note: `move-to-free-coded --version 0.2.298` was rejected — a dashboard chat-transcript ticket commit landed on top of my merge, so the tip was neither a merge commit nor an ancestor of my SHA and the currency check read my own bump as a foreign publish. I used the auto-version path instead, which allocates the bump inside the gate's own lock; the ticket records `0.2.299` and both SHAs.

<!-- xgd-chat-end -->