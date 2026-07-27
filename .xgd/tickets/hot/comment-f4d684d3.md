---
uid: comment-f4d684d3
id: COMMENT-528
type: comment
title: Comment on request REQ-99
created_by: xgd
created_at: '2026-07-27T19:41:20.530232+00:00'
updated_at: '2026-07-27T19:52:55.778856+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-c0435b4c
  kind: chat_transcript
---

<!-- xgd-turn id="171e58c9-b4a4-4cea-8eb5-8597054ce836-user" -->

<!-- xgd-chat role="user" ts="2026-07-27T19:41:18.662100+00:00" -->
#### You
Please free code this ticket

<!-- xgd-turn id="171e58c9-b4a4-4cea-8eb5-8597054ce836-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-27T19:52:55.750816+00:00" -->
#### Claude
I'll start by reading the ticket and understanding the current state of the L1 schema and renderer.

Now I understand the shape. Let me implement — starting with the schema.

Now the types and validator:

Now the envelope validator:

Now the renderer — the sole pseudo-class sink:

Now wire it into `emitNode`:

Now the UATs:

Now the xgd.dev CTAs (acceptance item 4). Let me find them:

Now updating the ticket body to reflect what was actually built:

REQ-99 is free-coded at `6b93f12`, v0.0.211.

## What landed

**`node.interaction`** — a node-level field carried identically by all six kinds (node-level rather than per-kind, for the reason REQ-98 gives about asymmetric slices):

```jsonc
"interaction": {
  "transition": { "durationMs": 160, "easing": "ease-out" },
  "hover": { "surfaceFill": "#1A1A1E", "color": "#FFFFFF",
             "motion": { "offsetYPx": -2, "scale": 1.02 } },
  "focus": { "ring": { "widthPx": 2, "color": "#FAFAF9", "offsetPx": 2 } }
}
```

A state is a delta bag of the shared REQ-98 surface group plus `color`, `textDecoration` and a typed `motion` — nothing new had to be invented for a state to restate what the node could already paint. `transition` sits on the interaction, not inside `hover`, because a CSS transition lives on the base rule and governs the leave as well as the enter.

**Structured-only holds.** The renderer is the sole pseudo-class sink; the document never names a selector. Strict objects reject `selector` / `css` keys, `easing` is a closed enum, and a state's `backgroundImageUrl` clears the same `isSafeUrl` allowlist — a hole that opens only on pointer-over is still a hole.

**The focus-indicator obligation** is enforced from both ends: the schema has no way to express "no ring" (positive `widthPx`, no `none` variant), and the emitter gives every bound `control` a default `currentColor` ring when none is authored — including when it authored a hover and nothing else. That matters specifically because the control emitter strips UA chrome with `appearance: none`, so silence is what would actually remove the indicator. The ring is excluded from the transition property list: a ring that fades in is briefly absent.

Also: state motion merges with the node's base transform (CSS `transform` replaces rather than accumulates), `prefers-reduced-motion` drops the travel but keeps the paint, and the L2 `contactFormPreset` now authors both states.

## One acceptance item is partial

The xgd.dev CTAs now respond to **pointer** (lift + fill/shadow, 160ms, reduced-motion respected; site validates and renders). They do **not** respond to keyboard, and no interaction axis can make them — they are L1 `box` nodes, which render as `<div>`. Only a `control` bound to a behavior module is focusable today. Making a plain CTA focusable needs a navigation surface (a typed link/href axis with its own URL allowlist), which is a different capability from interaction state; I left it out rather than widening scope. Flagged in the ticket body.

The CTA edit is in the working tree but not in the commit: `storage/sites/xgd/` is untracked and belongs to REQ-95, and site config is exempt from free-coding ceremony.

## Verification

837 tests green (full suite), clean `tsc` across site-schema / framework / tools-generate. Six new UATs in `tests/req99-interaction-state.test.ts`, including 10 hostile documents that must all fail validation and a check that no `outline: none` / `outline: 0` appears anywhere in the emitted CSS.

<!-- xgd-chat-end -->