---
uid: comment-3cf6bde1
id: COMMENT-517
type: comment
title: Comment on bug BUG-22
created_by: xgd
created_at: '2026-07-25T01:20:45.465977+00:00'
updated_at: '2026-07-25T01:39:15.291779+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-3e3fabdb
  kind: chat_transcript
---

<!-- xgd-turn id="15677271-444a-4fe9-a71f-905e17af3591-user" -->

<!-- xgd-chat role="user" ts="2026-07-25T01:20:43.395856+00:00" -->
#### You
Please free code this fix

<!-- xgd-turn id="15677271-444a-4fe9-a71f-905e17af3591-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-25T01:39:15.263238+00:00" -->
#### Claude
I'll start by reading the ticket and investigating the values-diff node-matching code.

Now let me implement. Starting with the shared type:

Now the extractor — the in-page script plus its types:

Now the in-page helper:

Now emit it on runs:

Now sections.ts pass-through:

Now the manifest field and the diff rule:

Now the pill helper refactor:

All clean. Now version bump and commit:

Now updating the ticket body — preserving the original diagnosis and appending what was actually built:

Done — BUG-22 is committed and at `free_coded`.

## What the fix is

The root cause was as you diagnosed. `surfaceFill` / `surfaceGradient` / `borderLeft` already resolve over REQ-88's **geometric** surface chain (tightest-first, so a sibling backing box counts) — which is why the fill matched. `borderRadiusPx` / `boxShadow` / `border` are read from the element's **own** computed style, so on the split shape they were read off the label, which paints nothing.

So capture now records *which box paints the surface*, not just its colour — `ValueElement.surface = { self, box, borderRadiusPx, boxShadow, border }`, resolved over the same chain. `self` is the discriminator: true where the run's own element paints the surface (a conventional `<button>`), false where a different box does (the flat L1 tree). The diff resolves shape/border against that box when the sides disagree about node identity, and compares the backing box's **geometry** against the reference control's box — the axis the phantom was standing in front of.

It's deliberately narrow: a self-painting chip (BUG-20) is `self` on both sides, an ordinary run sits on its band on both sides (no per-run band noise), a genuinely lost rounding still reports `shape`, and a pre-BUG-22 bundle has no `surface` so the resolution is inert.

## Measured on the real bundle

```
before   A-flat 2 -> A-structural 1 -> B 14
           [M] shape  "Subscribe"  radius 8px -> radius 0px            <- no-op
after    A-flat 0 -> A-structural 1 -> B 16
           [H] size   "Subscribe"  surface 272×48 -> surface 322×98    <- BUG-21
```

All four ACs verified. Six UATs drive the real `EXTRACT_SCRIPT` (jsdom, BUG-15's harness) then the real `flattenSignals → diffManifests` pipeline; fixtures measured from the retained capture. Full suite: 726 passed, 1 pre-existing unrelated failure (`req92` "form controls stay residuals" — fails identically on a clean tree). Workspace `tsc --noEmit` clean.

## One thing you need to know

`surface` is a new capture field, so **the retained gigabytealchemy bundle won't benefit until you re-run `1c capture page https://gigabytealchemy.ai/`** — until then the resolution is dormant (no behaviour change either way). I verified the numbers above against a *copy* of the bundle re-projected offline, and deliberately did not promote that copy: offline re-extraction bakes the ephemeral `http://127.0.0.1:<port>/` origin into `backgroundImageUrl`. That's a pre-existing gap in the re-extraction path, worth its own ticket if you want offline refreshes to be promotable.

Ticket left at `free_coded`, story_points 3, body updated with the confirmed root cause, the outcome numbers, and that operational note. Promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->