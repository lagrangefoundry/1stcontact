---
uid: comment-223071e7
id: COMMENT-515
type: comment
title: Comment on bug BUG-21
created_by: xgd
created_at: '2026-07-25T01:18:32.460363+00:00'
updated_at: '2026-07-25T01:33:23.067893+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-24975383
  kind: chat_transcript
---

<!-- xgd-turn id="0a080d3c-b712-417b-8290-6c98258ecdf7-user" -->

<!-- xgd-chat role="user" ts="2026-07-25T01:18:30.394798+00:00" -->
#### You
PLease free code this fix

<!-- xgd-turn id="0a080d3c-b712-417b-8290-6c98258ecdf7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-25T01:33:23.036155+00:00" -->
#### Claude
I'll investigate the surface reconstruction code that's double-applying padding.

Now the fix. First, the self-painting-run discriminator:

Now the per-edge outset in `buildCards` and `SurfaceRow`:

Now the outset itself:

Now verify the fold against the real oracle capture:

My work was stashed by a concurrent process. Restoring it:

Both files are intact with the corrected content. Running the UATs plus the adjacent regression scope:

Committed cleanly (only my three files). Now dropping the stale stash and updating the ticket:

Appending the fix record to the ticket (preserving existing content):

Done. BUG-21 is at `free_coded` with commit `5d8832f7`.

## What the fix does

Two independent defects in `tools/generate/src/l1/fold.ts`:

**1. A padded control is self-painting.** `isChipRun` → `isSelfPaintingRun`, gaining `isPaddedControlRun` beside BUG-20's pill test. The discriminator is an **authored vertical inset**: block flow gives a text element zero `padding-top`/`bottom`, so a non-zero one is authored on that element — meaning its captured border-box already spans the painted surface. Such a run carries its surface on its own text leaf and contributes no card row, so no box is reconstructed behind it and no outset can be applied. `card-8`/`card-9` no longer exist. Guards keep it conservative: horizontal padding alone doesn't qualify, and a `surfaceGradient` or ancestor `borderLeft` keeps the run on the card path (the chip axes can't carry either).

**2. The card outset is per edge.** `SurfaceRow` now carries the run's own per-side padding; `cardOutset` returns 0 on an edge the run already padded and the `cardPadding` estimate otherwise. The vertical-rhythm number can no longer land on the horizontal axis.

## Verified against the oracle

Folding the retained `multistate.json`: both controls match their captured x/width at all six widths (`x=24 w=272` at 320 … `x=413 w=123` at 1280). Cards 0–7 are byte-identical to their pre-fix geometry — BUG-14's hierarchy is untouched. 7 UATs in `tests/bug21-control-surface-outset.test.ts`; regression scope green (49 + 42 tests).

Two things worth your attention:

- **AC1 has a 2px residual.** `Subscribe`'s target height is 50 at ≥768 but the fold produces 48. That extra 2px is not a border (the capture records `border: null`) — the desktop flex row stretches the button to its sibling email field's 50px height. A flow relationship (Type-B), outside the absolute-base fold's model. Down from a 50px error.
- **AC4 is not verified.** `1c diff` needs a re-render, and `storage/sites/gigabytealchemy/draft/pages/home.json` still holds the pre-fix fold — regenerating it is a site-data step for the next repro round, not part of this commit.

One operational note: another session was editing this worktree concurrently and my working changes were stashed and restored mid-flight. I committed with an explicit pathspec, so the commit contains only `fold.ts`, the new UAT file, and the version bump — none of the other session's in-flight edits.

<!-- xgd-chat-end -->