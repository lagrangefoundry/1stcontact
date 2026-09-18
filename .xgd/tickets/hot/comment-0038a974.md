---
uid: comment-0038a974
id: COMMENT-3142
type: comment
title: Comment on request REQ-217
created_by: xgd
created_at: '2026-09-18T22:36:01.473494+00:00'
updated_at: '2026-09-18T22:36:01.473494+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-fd68ef61
  kind: note
---

## Revisited from EPIC-19, 2026-09-18 — built, but not being seen

Operator: *"right now I have to switch to the Library to see the image we just
created."* Recorded as a comment because this ticket's body is frozen at
`ready_to_reconcile`.

**Nothing in the body is out of date.** Both halves landed on 2026-09-11
(`215187d64c`, 0.2.169): `imagegen.ts:391` passes
`display: generatedDisplay(opts.materialUrl)`, `router.ts:667` supplies the
factory, and the sentence the model receives is explicit — *"Show this picture to
the person you are talking to by including this line in your reply, exactly as
written: ![name](url)"*. So the report is not that the capability is missing.

### Establish which of three it is, before changing anything

1. **The model is not pasting the line.** Exactly the failure mode "The failure
   mode we accept" signed up for — *"for a failure that costs a client one
   click"*. If so nothing is broken; the trade is worse in practice than on paper.
2. **The running build predates the commit.** `1c builder` never rebuilds the
   browser bundle — a `src/builder/*.js` change needs `./bin/1c assets` — and a
   deployed host may be behind 0.2.169 entirely. **Check this first: one command,
   costs nothing.**
3. **The call took a path with no `materialUrl`.** Absence is designed to be
   silent: no display field, and a manual that describes none.

### The accepted failure mode is overruled

> *"This might be an option for the AI, but I think it is usually the right
> thing."* — operator, 2026-09-18

Showing a generated picture is the NORM, not a judgement made per call. The
assistant needs a reason to withhold a picture, never a reason to show one: a
client who asked for a picture and is sitting in front of a conversation should
not be sent to another tab to find their own work.

This does not revive the host-injected trailer, which the body rejects for putting
the picture in a fixed place rather than where the sentence wants it. It raises
the bar on the prose:

1. **Make the expectation standing rather than per-call.** The display sentence
   instructs at the moment of the call; nothing in `priming.json` says that work
   the client can see is shown rather than described. That composes with the
   existing `act-rather-than-narrate` reminder and introduces no new concept.
2. **Then measure it.** If the picture is still omitted with a standing
   expectation in place, the guarantee has to become structural and the trailer
   returns — with evidence behind it rather than as a first resort.

If the cause turns out to be (2) above, this ticket is already done and the
finding is about the build rather than the code. Whichever it is, the priming
change belongs to a NEW ticket rather than here, since this body can no longer
move.

### Related

[[BUG-118]] is this seam from the other side — the assistant looked in the site's
assets for its own generated picture and told the client it was blind. The display
line already ships the "how to show it" half; BUG-118 adds that the result should
also make the picture's HOME legible.
