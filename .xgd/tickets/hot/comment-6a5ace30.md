---
uid: comment-6a5ace30
id: COMMENT-5866
type: comment
title: Comment on bug BUG-321
created_by: xgd
created_at: '2026-10-31T21:09:42.557350+00:00'
updated_at: '2026-11-01T16:14:12.221663+00:00'
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

<!-- xgd-turn id="eb859c76-6ef3-4281-9412-07857ba59f5a-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T16:04:20.911495+00:00" -->
#### You
The issue was occuring on Safari but only when I was speaking to the talker (worker was busy). Do you have what you need to finish this?

<!-- xgd-turn id="eb859c76-6ef3-4281-9412-07857ba59f5a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T16:06:14.272732+00:00" -->
#### Claude
That's a useful clue: the caret only disappears while the worker is busy. Something in that state is doing it, either 1st Contact's builder code or the framework's composer. I'll trace what changes in the composer while the worker is busy.

The preview refreshes by loading a new iframe and swapping it in, which happens repeatedly while the worker writes. That's the main suspect on the host side. Reading the swap code.

Not yet. Knowing it happens only while the worker is busy narrows it to two likely causes, but I can't reproduce it. WebKit won't open a page in my sandbox, so I can't drive Safari's engine. One log from you in Safari would tell me which cause it is and where the fix goes.

**What's different while the worker is busy**
1. **The preview refreshes repeatedly (most likely, and 1st Contact's own code).** Each time the worker writes, `panel.js` loads the newer page into a hidden spare iframe. It then swaps that frame in, scrolling it to where you were and restarting its animations. This only happens while the worker is busy, and it runs right beside the focused chat box. Safari can lose the parent page's caret when a frame next to it loads or swaps.
2. **The chat box is cleared after you send to the talker (framework code).** The framework's composer resets its editor to empty while you're still focused in it. Then the Stop and Send buttons flip while the talker replies. This also happens after a normal send, so the busy state would only make it more noticeable.

The "working…" line and the plan panel's redraw only change their own parts of the page, so I've ruled them out.

**What I need from you:** paste this into Safari's console (Develop → Show JavaScript Console) on the builder before you reproduce it:

```js
(() => {
  const ed = () => document.querySelector('.builder-chat .ProseMirror')
  const log = (k) => { const s = getSelection(); console.log(new Date().toISOString().slice(11, 23), k,
    'active=', document.activeElement?.className || document.activeElement?.tagName,
    'hasFocus=', document.hasFocus(), 'selInEditor=', !!(s.anchorNode && ed()?.contains(s.anchorNode)), 'ranges=', s.rangeCount) }
  for (const t of ['focusin', 'focusout', 'selectionchange']) document.addEventListener(t, () => log(t), true)
  new MutationObserver(() => log('frame')).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['src', 'class'], childList: false })
  setInterval(() => log('tick'), 2000)
})()
```

Then click back on the page, start a worker turn, talk to the talker, and click into the empty box when the cursor is missing. Send me the console lines from around that moment.

The log points to one of three cases:
- **Focus has left the chat box** (`active` is no longer the ProseMirror, or `hasFocus=false`) right after a `frame` line: it's the preview swap. I'll fix that in 1st Contact under this ticket, with a test.
- **Focus is still in the box, but `selInEditor=false` or `ranges=0`**: the editor lost its selection, which points at the clear-after-send. That fix belongs to the framework, as a reopen of BUG-104 or a new ticket there.
- **Focus and selection are both fine, but no cursor shows**: Safari is just not painting it. I'd work around it by restoring the selection after each preview swap or clear.

I've added the narrowed symptom, both candidates and this plan to the ticket. The status is still `draft`.

<!-- xgd-turn id="8f65670a-8331-442b-9266-fd3e46fdecfb-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T16:10:04.718976+00:00" -->
#### You
It did not reproduce - cursor was visible

<!-- xgd-turn id="8f65670a-8331-442b-9266-fd3e46fdecfb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T16:10:30.016097+00:00" -->
#### Claude
Then I'd close BUG-321. The cursor showed in Safari with the worker busy and you talking to the talker, which is the exact state that used to lose it. One caveat: it was intermittent before, so one clean run is good evidence but not proof.

- **No code lands against this ticket.** 1st Contact's own code doesn't contribute: our CSS has no rule on the caret or the placeholder. The fix is lagrange-framework BUG-104, now in the shared store and in the builder's rebuilt assets. That framework fix also covers the known Safari way of losing the caret in an empty box.
- **The ticket body now records** the host check, the pick-up, the narrowed symptom with both candidate causes, and this non-reproduction. The status is still `draft`, because `free_coded` requires recorded commits. Closing it is your call.
- **If it comes back,** the console snippet from my last message is the next step. It tells a lost focus (the preview swap, fixable here) from a lost selection (the framework's clear-after-send).

I've deleted the throwaway probe files.

<!-- xgd-turn id="2a361d33-dfa5-48ba-93f3-e941d287ffaf-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T16:13:53.760755+00:00" -->
#### You
ok please close the bug now as legacy_done we will return to it if it coninues to be a problem

<!-- xgd-turn id="2a361d33-dfa5-48ba-93f3-e941d287ffaf-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T16:14:11.547377+00:00" -->
#### Claude
BUG-321 is now closed as `legacy_done`; I read the ticket back to confirm. Its body keeps everything from the investigation, including the console snippet to use as the first step if the missing cursor comes back.

<!-- xgd-chat-end -->