---
uid: comment-2d304414
id: COMMENT-942
type: comment
title: Comment on request REQ-139
created_by: xgd
created_at: '2026-08-12T18:15:25.332755+00:00'
updated_at: '2026-08-15T20:31:01.095061+00:00'
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

<!-- xgd-turn id="552615a7-2cdf-44cd-8387-852c251cc107-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-13T21:16:13.796260+00:00" -->
#### Claude
Done. I scanned every open request ticket for cross-references first; only one link was actually missing.

**Changed:**
- **REQ-139** → `depends_on: ['REQ-133', 'REQ-135']` — added REQ-135, since this ticket generalises that ticket's `L1FieldDescriptor.locked`. Body updated to name both.

**Already correct, left alone:**
- REQ-133 → `depends_on: ['REQ-137']` (palette popup waits on the shade model)
- REQ-135 → `depends_on: ['REQ-133']`

So the chain reads REQ-137 (`ready_to_reconcile`) → REQ-133 (`free_coding`) → REQ-139 (`draft`), with REQ-135 (`free_and_reconciled`) already satisfied. Nothing else references REQ-139, so no ticket needed a dependency *on* it.

<!-- xgd-turn id="225dc824-0c82-4e6e-a7a5-b55a5c0dfc49-user" -->

<!-- xgd-chat role="user" ts="2026-08-15T20:13:26.744960+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="225dc824-0c82-4e6e-a7a5-b55a5c0dfc49-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-15T20:31:00.929536+00:00" -->
#### Claude
Now the derivation side.

Now the colour field and its lock:

Now add `lockError` beside the other refusal helpers:

Now the client: the colour row must honour `locked`.

Now the styling — `is-locked` and the reason note:

Now the CLI listing:

Typecheck clean. Now the version bump and commit:

Now merge back into `xgd-working` under the lock:

Done — REQ-139 is at `free_coded`, commit `6b94ba9` merged into `xgd-working`, branch cleaned up.

**No blocking questions came up**, so I built it. Two judgement calls I made rather than asked about, both recorded on the ticket:

**1. A lock refuses a *change*, never the status quo.** This turned out to be load-bearing, not a nicety. The modal posts every staged field on Save, not just the touched ones — so a locked colour comes back on a Save that only rewrote the words. Refusing it would have made an unavailable control freeze the entire segment, and the one node carrying a gradient is a headline. (Same latent bug existed in REQ-135's italic lock: any Save on a run whose font declares no italic face would have been refused. That's fixed too.)

**2. `surfaceGradient` on a panel does *not* lock its fill.** A surface gradient is a background layer over the background colour, so a translucent one shows the fill through — the write stays observable. Only the definitively inert case (`gradientFill` on a text run, which the renderer compiles to `color: transparent`) is locked. That's the ticket's own "a sibling axis is not occlusion" rule.

What landed:

- **`L1FieldDescriptor.reason`** — derived as a pair with `locked`, so a lock can't exist without its sentence. Plain English, names the escape hatch, never an axis name. It's the same string the write side refuses with, so the greyed-out control and the refused write can't tell two different stories.
- **The gradient lock** on a run's colour row, plus the reason REQ-135's italic lock never had.
- **Both presentation gaps closed**: `is-locked` is styled (nothing styled it before, in either stylesheet), the colour swatch is `disabled` rather than merely dimmed, and one pass draws the reason under the row for both control families.
- **`1c copy get`** marks locked fields, so the AI and a CLI reader see the lock before trying to set it.

One existing test changed: REQ-140's UAT asserted the colour row had no `data-field` as a proxy for "the component didn't claim this field". The colour row now carries that attribute so a single pass can find any locked row; the assertion names `.fields-row[data-field=...]` instead, which is what only the component emits.

Full suite: 211 files / 1538 tests pass. Twelve files fail (assistant/chat/tool-surface suites) — I verified they fail identically on the unmodified base, so they're pre-existing and unrelated.

The ticket is parked at `free_coded`; promotion to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->