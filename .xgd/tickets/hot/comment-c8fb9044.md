---
uid: comment-c8fb9044
id: COMMENT-3674
type: comment
title: Comment on request REQ-314
created_by: xgd
created_at: '2026-09-23T18:03:35.670032+00:00'
updated_at: '2026-09-24T07:43:09.645015+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-4732258a
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "2719c19d-9f18-4985-85ce-f1853f55e12f",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="790923cd-3141-41c6-a37b-14307c0b8972-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T18:02:16.284505+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="790923cd-3141-41c6-a37b-14307c0b8972-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T18:07:27.624047+00:00" -->
#### Claude
I've read the ticket, the epic, the sibling tickets, and the code. Before I cut a branch, there's one genuine fork I need you to settle — everything else I'll decide myself.

## What I found

**The prerequisites aren't built.** REQ-311 (catalogue generator), REQ-312 (mirror + platform registry tier) and REQ-313 (`use_font`) are all still `draft`. `grep -r use_font` across the tree hits only ticket markdown — no code. The epic's own ordering says REQ-314 comes "any time after REQ-312".

**There is no editor font control to shrink.** The ticket's framing — "a 1,941-family dropdown is unusable" — is anticipatory, not a description of something on screen. `typographyFields` in `packages/site-schema/src/l1/edit.ts:540` exposes Size, Weight, Italic, Capitalisation and nothing else; `grep fontFamily apps/control-app/src/builder/*.js` returns one hit, and it's a preview CSS variable. So REQ-314 doesn't trim a control, it builds the first one.

**`fonts/catalogue.json` and `fonts/CATALOGUE.md` exist but are untracked** — generated ad hoc while scoping the epic. REQ-311 owns making them a committed, regenerable artifact.

Against that, the ticket's four behaviours land like this: "lists under 100 by default" has no control to list in; "a family outside the shortlist is still reachable" has no mirror to reach into; "binds by the same path `use_font` uses" has no `use_font`; only "no effect on what the assistant may choose" is satisfiable today (trivially, by the shortlist not being in the KB).

## The fork

**A — build the shortlist artifact now, wire the UI when REQ-312/313 land.** Hand-curated `fonts/shortlist.yaml` (taste, so authored not generated), a reader/validator in `site-schema` beside `fonts.ts`, and a `1c fonts check` rule that every entry resolves to a live redistributable family in the catalogue — so the list can't rot as the corpus moves. Real, testable, no throwaway. But nothing human-visible ships until REQ-313.

**B — do nothing here until REQ-312 lands.** The epic's stated order, and this is the lowest-priority ticket in the epic.

**C — build the whole vertical slice now**, including the family control, binding straight into `l1.resources.fonts` from the catalogue. This is the only option that puts something on screen this week, and I'd rather not: with no mirror there are no bytes to serve, so it paints families that resolve to the browser default — exactly the silent failure `REF-l1.md:604` warns about — and it means writing a binding path REQ-313 then has to replace, against the ticket's own "one binding mechanism, not two".

**I'd take A.** It's the half that's genuinely independent of the mirror — selection is taste, and taste doesn't need bytes — and it's the half that takes real judgment rather than plumbing. The curation itself I'll do to the ticket's brief: range over popularity, text faces in both serif and sans, display faces with wordmark-capable weight range, at least one monospace, enough spread that two sites don't look alike.

Say "A" (or just "go") and I'll start; say "C" and I'll build the control too and accept the rework.

<!-- xgd-turn id="4be66efd-0d30-49db-9595-3c862dd2e8d9-user" -->

<!-- xgd-chat role="user" ts="2026-09-24T01:45:12.837629+00:00" -->
#### You
3121 has landed

<!-- xgd-turn id="a6eda3b7-9b58-4b11-b6fa-72ff8919eef1-user" -->

<!-- xgd-chat role="user" ts="2026-09-24T07:12:20.068689+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="a6eda3b7-9b58-4b11-b6fa-72ff8919eef1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-24T07:43:09.090290+00:00" -->
#### Claude
I have the full picture now. Let me record the design decisions on the ticket and start.

Now let me build. First the data layer:

Now the shortlist and browse corpus:

Now the schema side — the `font` descriptor and its write:

Now the binding in `editCopySet` — through `use_font`'s own resolver:

Now the `/api/fonts` route, next to `/api/copy`:

Now the client. The search rule first:

Now the font popup:

Now the field row, modelled on `color-field.js`:

Now the `api.js` transport and the editor/app wiring:

Now the stylesheet:

Clean. Now the UAT suite:

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-chat-end -->