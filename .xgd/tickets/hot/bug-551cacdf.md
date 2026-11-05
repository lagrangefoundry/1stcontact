---
uid: bug-551cacdf
id: BUG-321
type: bug
title: 'Builder chat box: pick up the framework''s chat fixes — cursor on focus (LF
  BUG-104), paced streaming (LF REQ-231)'
created_by: EPIC-19
created_at: '2026-10-31T20:48:24.893866+00:00'
updated_at: '2026-11-01T16:14:06.435439+00:00'
completed_at: null
last_field_updated: status
status: legacy_done
fields:
  severity: low
  priority: medium
  auto_merge_back: true
  needs_review: false
  parent_uid: epic-95bc3b15
  chat_comment: comment-6a5ace30
---

## Symptom

Operator, production, 2026-10-31: clicking into the builder's empty chat box shows no text cursor; it only appears after the first character is typed.

## Where the fix lives

The chat box is lagrange-framework's `webui-chat` composer (TipTap/ProseMirror), not 1st Contact code. Diagnosis and fix design are in **lagrange-framework BUG-104** (`bug-9e511842`, "webui-chat composer: text cursor hidden in the empty box until the first keystroke"). Likely cause there: the BUG-23 placeholder is an absolutely positioned `::before` on the empty first paragraph, which loses the caret in WebKit/Chromium until text exists.

**No code lands against this ticket.** It tracks the framework fix reaching 1st Contact: done when the framework version carrying lagrange-framework BUG-104 is picked up here and the builder's chat box shows its cursor on focus before typing.

If 1st Contact's own `builder.css` composer rules turn out to contribute (e.g. a host rule on `.ProseMirror` or the input wrapper), that part is fixed here under this ticket, with a UAT asserting the caret is visible in the focused empty chat box.


## Host check (2026-10-31)

Checked 1st Contact's own code for anything on the composer's caret or focus. `apps/control-app/src/builder/builder.css` has only two rules on the composer: font-size on `.chat-widget-input` (REQ-401) and the left inset of `.chat-widget-composer-action` (REQ-464). There is no `caret-color`, no `.ProseMirror` rule, no rule on the placeholder, and no host focus handling anywhere in `apps/control-app/src`. The host does not contribute, so the whole fix is lagrange-framework BUG-104. When this check was made, BUG-104 was still `draft` with no commits.

## Also: paced streaming (lagrange-framework REQ-231)

Operator, 2026-10-31: live replies appear in uneven chunks and the panel's scroll jumps with each one, while the scripted introduction (REQ-403's `typedOut` in `apps/control-app/src/builder/chat.js`, 3 words every 40 ms) reads smoothly. The fix is **lagrange-framework REQ-231** (`request-b6fdeaac`, "webui-chat: paced reveal of streamed text, and smooth follow-scrolling").

When it is picked up here:
- Live consultant and talker replies reveal smoothly, and the panel follows them without jumps while the client is at the bottom.
- **`typedOut` is deleted** and the introduction is handed to the chat as one frame, so the builder has one pacing mechanism, the framework's. The introduction still reads as typed out.
- UAT: the introduction arrives as a single text frame from the host side (no `typedOut`), and a streamed reply is revealed progressively by the chat.

The cursor fault is also now known to show **while a turn is in progress** (talking to the talker during a build); see lagrange-framework BUG-104.


## Pick-up (2026-10-31)

- lagrange-framework BUG-104 landed as `02cff360a056` (status `ready_to_reconcile`). The shared store at `~/lagrangefoundry/node_modules/@lagrangefoundry/webui-chat` carries it: the placeholder `::before` is now `float: left; height: 0`, the textarea-to-editor upgrade passes focus on to the editor, and a press on the mount wrapper focuses the editor.
- 1st Contact pins no framework version. The builder gets `webui-chat` from the store through `1c assets`. After `1c assets` was re-run, `apps/control-app/dist-assets/webui/webui-chat/src/chat.css` (gitignored) carries the new rule. No tracked file changed.
- The fix reaches production on the next `bin/deploy` from xgd-working, and dev on `bin/deploy --env dev`. Until then both serve the old CSS.

## Verification

Throwaway probe, not shipped: the composer's DOM with the builder's own `builder.css` over `webui-chat`'s chat.css, a click into the empty editor, then screenshots with the caret shown vs hidden.
- Chromium: the editor has focus and a caret is painted, with both the old and new CSS. The bug was never Chromium's.
- WebKit (the engine that reproduced it): can't be run in the agent sandbox, because its page process dies on launch. Still to check by hand in Safari: click into the empty builder chat box on a deployed build and look for the caret before typing, and also on a second try, since the report was intermittent.

No code lands against this ticket. The host doesn't contribute (see the host check above), so there is nothing here for a UAT to pin. The framework's BUG-104 UATs are the evidence.


## Narrowed symptom (operator, 2026-11-01)

The cursor goes missing in Safari **only while the worker is busy and the client is talking to the talker**. So the framework fix (BUG-104) isn't enough by itself to close this. Something about the busy-worker state hides the caret. Candidates found in 1st Contact and framework code; none confirmed, because WebKit can't run in the agent sandbox:

1. **Preview refresh swaps (BUG-248).** While the worker writes, `panel.js` repeatedly loads a newer page into a hidden spare iframe, then swaps it in (`finishRefresh`: `contentWindow.scrollTo`, `display`, `replayMotion`). These are host-owned frame loads and swaps happening alongside the focused composer. That only happens while the worker is busy.
2. **Composer clear after a send.** Sending to the talker calls the framework composer's `clear()` → TipTap `setContent('')` on the focused editor. That re-creates the empty paragraph and its placeholder `::before`, and the Stop/Send buttons toggle while the talker replies. This also happens after an idle send, so the busy state would only make it more noticeable.

Ruled out: the working line (REQ-459) and the plan panel's redraw only change their own subtrees and never touch focus or selection.

Next: log focus and selection in Safari during a repro, to tell lost focus (1 or 2) from a lost or unpainted selection (2, a WebKit painting issue). Then fix wherever the log points. A 1st Contact fix lands here with a UAT; a framework fix goes on lagrange-framework BUG-104 or a new ticket there.


## Repro attempt (operator, 2026-11-01)

The operator tried in Safari with the worker busy and talking to the talker, as above. **It did not reproduce: the cursor was visible.** The log wasn't needed, so neither candidate is confirmed. The original report was intermittent, so one clean run doesn't prove the bug is gone. But nothing points to a host cause, and the BUG-104 fix covers the known WebKit caret loss. No code lands against this ticket.