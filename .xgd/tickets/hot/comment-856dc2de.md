---
uid: comment-856dc2de
id: COMMENT-8081
type: comment
title: Comment on bug BUG-402
created_by: xgd
created_at: '2026-11-09T07:15:42.156231+00:00'
updated_at: '2026-11-09T14:50:14.745717+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-79e4cb9b
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "052427f4-f61b-4657-bde7-5668c01da458",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="ae32059d-e2b5-4771-a238-d8654b8b19d1-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T07:14:42.103287+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="ae32059d-e2b5-4771-a238-d8654b8b19d1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T07:32:06.235280+00:00" -->
#### Claude
Not a duplicate. Let me look at the code.

Not a duplicate (only BUG-78 mentions the honeypot, unrelated). Now tracing which page rule can un-hide it — looking at the renderer's broad `> *` rule at render.ts:2745.

Still diagnosing: I'm looking for the existing contact-form render tests so I can render a real form in Chromium and find what un-hides the honeypot.

Cutting the branch, then probing in Chromium.

Now a throwaway probe: render the contact form page in Chromium at several widths with a page rule stressing the form's children, and read the honeypot's box and computed styles.

The probe runs now but its output was swallowed; re-running with console output shown so I can read the honeypot's box at each width.

Published render hides it correctly at every width, so the trigger is in the builder preview path or the client's L1. Checking how the preview serves `theme.css`.

Found two places where the builder injects a `<style>` into the preview frame (`points.js` and `page-style.js`); checking whether either touches the form's children.

Implementing now: the inline hiding in `component.ts`, then the new layout check.

Checking whether the req484 `theme.css` fixture is compared byte-for-byte with fresh renders, which changing the stylesheet would break.

L1 never emits `!important`, so a single-class `!important` rule (keeping the selector the REQ-96 ACs pin) can't be beaten by page CSS. The inline copy covers a stale or missing `theme.css`. Editing.

Now the component: shared inline hiding, plus `data-fc-invariant="hidden"` on the honeypot and the programmatic labels.

Now the layout check (item 4): a new `hidden_invariant` check that reports any `data-fc-invariant="hidden"` element that isn't sealed in a clipped box of at most 1×1px.

Code is in. Now the UATs; checking how existing layout-check tests serve a fixture page and whether the renderer has an edit-channel option.

Writing the UAT file.

All 4 pass. Checking they actually detect the fault: running against the old component and stylesheet.

The old code fails the hostile-rule case (honeypot painted at 320×40) and the fix passes. Next: regenerate the embedded `MODULE_CSS` in `module-assets.ts`.

Running just that generator (not the whole `1c assets`, which blanks the KB in a worktree).

Running the adjacent regression scope (contact-form, module CSS, layout-check framework and rubric suites).

Those 4 failures also happen on clean `xgd-working`, so they predate this change. Re-running the scope plus my UATs in the worktree after the stylesheet change.

All 13 suites pass. Quick typecheck/lint before committing.

Clean. Checking this project's version-bump convention.

Committing the fix first, then I'll follow that merge/bump order.

Before merging, updating the ticket body so it reflects the shipped design and what I could and couldn't establish about the trigger.

Ticket updated. Now the merge back: lock, merge `xgd-working` into the branch, bump, and fast-forward.

`free_coded` with both commits. Tearing down the branch.

BUG-402 is fixed and landed on `xgd-working`, and the ticket is at `free_coded`. It isn't a duplicate: the only other ticket that mentions the honeypot is BUG-78, which is unrelated.

**The fix:**
- **The honeypot now hides itself.** Its markup carries inline `!important` hiding (position, 1×1 size, overflow, `clip` and `clip-path`, and the rest of the box zeroed). Nothing on the page can override that, and it doesn't need `theme.css` to load. It is still not `display: none`, and keyboard and screen-reader behaviour is unchanged.
- **The stylesheet rule is `!important` too**, with `clip-path` added. It doesn't zero padding, border or margin, because existing acceptance criteria only allow `padding`/`border` as plain `0` in module CSS; the inline copy covers those.
- **The layout check now flags it.** The honeypot and the form's hidden labels are marked `data-fc-invariant="hidden"`. A new layout check reports any such element that paints more than 1×1px, quoting its text ("Leave this field empty"), so the consultant sees it before a client does.

**I didn't find the actual trigger (item 3).** Rendering a stacked contact form in Chromium at 320, 374, 375, 768 and 1280px, in both the View and Edit renders, leaves the honeypot hidden on the old code. Nothing in the renderer's CSS or the builder's preview injection reaches it. I don't have the client site's definition here. Two things do show it on the old code:
- a page rule that puts the form's children back in normal flow (it appears as a 320×40 block);
- a missing or stale `theme.css`.

Both are now closed whichever one hit the client site. If it reappears, the new layout check will name the width. The ticket body records all of this.

**Tests:** 4 new UATs in `tests/test_UAT_FC_BUG-402_honeypot_never_shown.test.ts`:
- hidden at every width in View and Edit, with a pixel-identical screenshot check;
- still hidden under a hostile page rule and with `theme.css` removed (this one fails on the old code);
- the trap is never reached by Tab;
- the layout check reports a visible honeypot and ignores a hidden one.

13 nearby suites pass. Four other tests fail (three in `generate.test.ts`, one REQ-148), but they fail the same way on clean `xgd-working`. BUG-237's suite also fails, but only on findings that were already failing; none are the new kind.

**For you to know:**
- I updated one existing test (REQ-223) whose exact markup string now includes `data-fc-invariant="hidden"` on the labels.
- No UAT drives the builder's own preview frame on "Fit pane". The View and Edit channels it shows go through the same render function the tests use.
- Commits are `7479d3477d` (fix) and `faac8d838e` (version 0.2.845, story points 3), and the branch is cleaned up.
- The sandbox wouldn't let me save a note to memory; it was a tip on regenerating `module-assets.ts`.

Promoting to `ready_to_reconcile` is your call.

<!-- xgd-turn id="7836edc3-1ef6-44a2-8753-a59a19141955-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T14:48:02.041329+00:00" -->
#### You
Is this ticket complete?

<!-- xgd-turn id="7836edc3-1ef6-44a2-8753-a59a19141955-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T14:50:12.098088+00:00" -->
#### Claude
Yes. My part of the ticket is finished, and the next step is yours.

- **Status:** BUG-402 is at `free_coded`, with story points 3 and version 0.2.845.
- **Commits:** both `7479d3477d` (the fix) and `faac8d838e` (the version bump) are on `xgd-working` and recorded on the ticket.
- **Branch:** the `free-BUG-402` branch and its worktree have been removed.
- **Ticket body:** it describes the change as shipped, including what I couldn't establish about the cause.

**One gap you should know about:** I never reproduced the exact trigger from the client site. The fix doesn't depend on finding it:
- the honeypot now hides itself with inline `!important` styles, so page CSS can't override it and it stays hidden even if `theme.css` is missing or stale;
- the new layout check flags it if it ever becomes visible.

So the symptom can't come back unnoticed. But if you want the actual cause confirmed, we'd need the client site's definition.

**Next step:** move the ticket to `ready_to_reconcile` when you want reconcile to run.

<!-- xgd-chat-end -->