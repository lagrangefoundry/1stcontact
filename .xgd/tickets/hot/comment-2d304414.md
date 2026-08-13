---
uid: comment-2d304414
id: COMMENT-942
type: comment
title: Comment on request REQ-139
created_by: xgd
created_at: '2026-08-12T18:15:25.332755+00:00'
updated_at: '2026-08-13T21:13:40.764370+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-3f57cd0c
  kind: chat_transcript
---

<!-- xgd-turn id="f98cbb90-5697-4f79-a5b1-8373bb0927e9-user" -->

<!-- xgd-chat role="user" ts="2026-08-12T18:15:21.298528+00:00" -->
#### You
In situations where our simple controls are too limited to capture what is going on in a text box, or a picture, we should disable the limited control controls.

For example, the gigabyte alchemy title has a color gradient. We do not have tools to capture or edit that gradient. So the text color tool should be grayed out and unavailable. Likewise if different font sizes were being used then the font size adjuster should be grayed out and unavailable. Does this make sense? Can you sufficiently generalize from these examples?

<!-- xgd-turn id="f98cbb90-5697-4f79-a5b1-8373bb0927e9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-12T18:19:55.224559+00:00" -->
#### Claude
I dug into the code and the real site data first. Yes, it makes sense — and it generalizes cleanly, because the mechanism already half-exists.

## What's already there

`L1FieldDescriptor.locked` (REQ-135) does exactly this for one case: italic on a family that declares no italic face. Its doc comment already states the principle you're reaching for — *"Dropping the field instead would be worse than useless — the absence would read as 'this build has no italics' rather than 'this site's font has none'."* And `applyCopyFields` already **refuses** a locked field on the write side, so the lock is enforced, not cosmetic.

So this isn't a new mechanism. It's one rule generalised from one trigger to a family of them.

## The generalisation

> A control is offered only when it is **faithful**: the value it shows is the whole truth about what the element holds, and setting it produces exactly the change the operator expects. When it isn't, the control is shown **locked, with the reason**, never hidden and never quietly lossy.

Three ways faithfulness breaks — same treatment, different cause:

| | Cause | Example |
|---|---|---|
| **Inert** | Another axis on the node overrides the one the control writes, so setting it paints nothing | `gradientFill` emits `color: transparent` — a colour picker would write a value that never appears |
| **Lossy** | The node holds a *structure* where the control offers a *scalar*; showing it is a projection, writing it is a flattening | a gradient reduced to one swatch; a mask carrying shape parameters |
| **Unsupported** | Expressible, but the site can't honour it | italic with no italic face (already done) |

The test is **"is the write observable and complete?"** — not "is another axis present". That distinction matters: `gigabytealchemy/home` has a background image under an `overlay`, and the picker there is still perfectly good — a scrim tints the image, it doesn't hide it. Presence of a sibling axis is not occlusion.

## What actually fires, measured against the real folds

- **`gradientFill`** — 1 run, and it is exactly the Gigabyte Alchemy title.
- **Varying responsive size tracks** — 8 runs on `gigabytealchemy/home`, 14 on `xgd/home`, 7 on `xgd/whitepapers`.

## Two things beyond the derivation

1. **The reason has to be visible.** `locked` today carries no explanation. A grey box with no cause reads as a bug. It needs a plain-English reason that also names the escape hatch — *"This heading is painted with a colour gradient. Ask me in chat to change it."*
2. **Locked doesn't currently look locked.** `webui-fields` adds an `is-locked` class and nothing — neither its stylesheet nor ours — styles it. The existing italic lock is invisible today.

## Two things worth your call before I build

**The text colour tool does not exist yet.** There is no colour control on any segment — colour is still waiting on REQ-133's palette control. So the gradient case is a gate we'd be building *before* the control it guards. That's the right order, but worth knowing it won't be visible until colour ships.

**Responsive font size is a genuine judgement call, not an obvious lock.** Today the size control shows the widest keyframe and `scaleTrack` scales the *whole* track proportionally — the mobile 36px and desktop 72px both move, keeping the shape the fold measured. That is arguably the honest generalisation of "make it bigger" rather than a loss. Locking it would withdraw size editing from every heading on the two real sites — which is precisely what people most want to resize.

So: **lock it** (strict — the displayed "72" is a half-truth at 375px), or **keep it and relabel** (the write is faithful, the label is what's lying)? I lean keep-and-relabel, and lock only the genuinely non-generalisable cases. Which do you want?

I've drafted the ticket to that shape — say the word and I'll cut the branch and build it.

Ticket **REQ-139** is titled and scoped, still at `draft`. No code written yet — waiting on your call on the responsive-size question before I cut the branch.

<!-- xgd-turn id="60bfdace-fabe-4174-88d3-bd8eaa7470bd-user" -->

<!-- xgd-chat role="user" ts="2026-08-13T16:30:05.173467+00:00" -->
#### You
please ignore responsive size - but lets wait for color controls before implementing this one

<!-- xgd-turn id="60bfdace-fabe-4174-88d3-bd8eaa7470bd-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-13T16:31:03.908341+00:00" -->
#### Claude
Understood — parked, nothing built.

REQ-139 stays at `draft` with two decisions recorded:

- **Responsive font size dropped from scope.** `scaleTrack` moving the whole track proportionally is the honest generalisation of "make it bigger", so it isn't treated as a faithfulness break; size stays editable on every heading.
- **Blocked on colour controls.** `depends_on: REQ-133` (palette popup, itself waiting on REQ-137). Picked up once colour lands.

What's left in scope when it resumes: the inert/lossy colour cases — in practice `gradientFill`, the one run on the Gigabyte Alchemy title — plus the two presentation gaps (a plain-English reason on `locked`, and actually styling `is-locked`, which nothing does today).

<!-- xgd-turn id="552615a7-2cdf-44cd-8387-852c251cc107-user" -->

<!-- xgd-chat role="user" ts="2026-08-13T21:13:40.236551+00:00" -->
#### You
Can you add depends_on refs to the relevant tickets

<!-- xgd-chat-end -->