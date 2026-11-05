---
uid: comment-b3b54360
id: COMMENT-7811
type: comment
title: Comment on request REQ-655
created_by: xgd
created_at: '2026-11-05T15:49:06.906585+00:00'
updated_at: '2026-11-05T15:56:15.865036+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-7c539f69
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e3506054-c63e-4f91-951c-a370bb611881",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="77428a67-331b-4fe7-a7fa-3fcf977e9d6a-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T15:48:38.172399+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="77428a67-331b-4fe7-a7fa-3fcf977e9d6a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T15:56:13.663984+00:00" -->
#### Claude
Reading the ticket and the existing layout floor checks (REQ-648's `layout-check.ts`) before planning the change.

Still mapping the code: the existing checks already cover wrapped labels and ragged stacks, so I'm now reading how the renderer draws button components to see where the defaults need to change.

Finished surveying. Before writing code I have one question that changes the scope, and a few decisions I'd like you to confirm.

I haven't changed anything yet: no code, no branch, and the ticket is still at `draft`. There's one thing I need you to decide, and three choices I'll go ahead with unless you object.

## What's already there

- **The floor check is mostly built.** `button_wraps` (REQ-457) already reports a label that wraps. `ragged_buttons` (REQ-622) already reports a stack of buttons with unequal widths, though it allows 2 px and this ticket says 1 px. The only missing rule is **equal heights for buttons in a row**. Part 2 of the ticket becomes: add that rule, tighten the stack rule to 1 px, and word the failures like your example.
- **The renderer has a related rule.** REQ-622 lets a wrapping row of buttons spread each button across its own line once the row wraps. Nothing stops a label from wrapping, nothing evens out heights in a row, and nothing gives a set equal widths.

## The question: how should overrides be recorded?

There's already one way to say "this is on purpose", and it covers every layout check: the `layout_kept` decision (BUG-313). The consultant records it in the client's words, it goes in the decision ledger, and the check skips that finding until it changes or moves. Only the consultant can write it, so the builder can't use it to make a failure go away.

It doesn't match your spec, though. It isn't a typed field on the node. It's keyed to the finding's exact line at one width, and the consultant can only record it after a check has reported the problem, not as a design choice made in advance.

Your two instructions point different ways here: "a typed exemption on the node" and "if those checks already have an exemption mechanism, use it". Which do you want?

- **(a) Reuse `layout_kept` as it is.** The least new work, and it already meets "never silent" and "the builder can't add one". But it's reactive and has to be recorded once per width.
- **(b) Add a typed exemption on the node and replace `layout_kept` with it,** for all taste checks including REQ-648's grid rules. It would be a field naming the rule it exempts from, with a reason. It matches your spec and keeps a single mechanism, but it's more work. We'd need to migrate the existing `layout_kept` decisions, and the builder's write path would have to refuse the field so only the consultant can set it.

I'd lean towards **(b)** because it's what the ticket describes, but it roughly doubles the size of the ticket.

## What I'll do unless you object

1. **Deciding when a group stacks.** CSS can't tell whether a row of buttons fits on one line. I'll estimate each label's width from its character count in the button's own font (allowing for uppercase and letter spacing) and switch the whole group between one row and a full stack, so it never splits two-and-one. This uses no fixed breakpoints and no script. The estimate errs wide, so a set will be equal-width at the estimated widest label, a little wider than an exact fit. The check remains the safety net if the estimate is ever wrong. The exact alternative would be a small script on the published page, which I'd rather avoid.
2. **What counts as "the same kind".** The renderer drops the component name once the design is applied, so I'll treat buttons as the same kind when they're painted identically (same fill, border, text colour, type role and padding).
3. **One REQ-622 test changes as a result.** It expects two identically styled hero buttons to have different widths on one line. Under your rule they're a same-kind set and get equal widths, so I'll update that assertion and note in this ticket that it supersedes it.

Once you answer, I'll cut the branch and build the whole thing.

<!-- xgd-chat-end -->