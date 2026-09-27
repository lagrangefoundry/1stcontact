---
uid: comment-dc48909f
id: COMMENT-4085
type: comment
title: Comment on request REQ-335
created_by: xgd
created_at: '2026-09-27T19:59:57.851332+00:00'
updated_at: '2026-09-27T20:24:06.671625+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-9678f656
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "dcf1cf92-baf9-4e37-8987-a193fc4ec5b4",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="57024d99-2086-44c0-a1bc-fc7beff99576-user" -->

<!-- xgd-chat role="user" ts="2026-09-27T19:58:21.369987+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="57024d99-2086-44c0-a1bc-fc7beff99576-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-27T20:09:07.721477+00:00" -->
#### Claude
I'll start by reading the ticket.

Now let me investigate the implementation. I'll fan out a couple of explorations in parallel.

## Findings — REQ-335

I read the three walls against the code. All three are real, but they're not three sizes of the same change: **one is cheap and blocked by an accessibility invariant, one is nearly free, and one is architectural.** Here's what's actually there.

---

### Wall 1 — the drawing surface (`packages/site-schema/src/svg.ts`)

The refusal is exactly as you read it. `validateSvg` is a closed scanner: `SVG_ELEMENTS` (18 names) and `SVG_ATTRIBUTES` (~70 names), and **every byte must match a grammar token** — the `if (!token)` branch at `svg.ts:283` is the closure, so an unrecognised construct is a refusal, never a skip. The module docstring names `animate*` in the deliberately-refused list alongside `<script>`, `<style>`, `<use>`, `<foreignObject>`.

**The good news:** no existing UAT asserts animation is refused. The hostile-payload table in `tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:395` has 17 entries — script, handlers, `foreignObject`, external refs, entity declarations, CDATA — and **not one of them is an `<animate>`**. So allowlisting SMIL breaks no existing evidence. Mechanically, option A is adding ~5 names to one set and ~10 to another.

**Two things make it not that simple.**

**1a. `values` launders every reference check.** `REFERENCE_ATTRIBUTES` keys off the attribute *name* (`fill`, `stroke`, `clip-path`, `mask`) — and the test table already refuses `fill="url(https://evil.example/x#g)"`. But `<animate attributeName="fill" values="url(https://evil.example/x);red">` puts that same external reference in an attribute called `values`, which no reference check would see. SMIL also animates *arbitrary* attribute names, so `attributeName` must itself be constrained to `SVG_ATTRIBUTES` or the allowlist becomes advisory. There's no CSP anywhere in the repo — I checked — so `validateSvg` is the only line. Both holes are closeable; they just mean A is a considered validator change, not a one-line relaxation.

**1b. `begin="mouseover"` cannot work, and that's the part you said you actually wanted.** Every generated SVG reaches the page as `<img src="/assets/…">` (`render.ts:4367` — the renderer has no inline-SVG or `<object>` sink at all). Browsers run `<img>`-embedded SVG in **secure animated mode**: SMIL and CSS animations play, but scripting, external references *and interactivity* are all off — the SVG receives no pointer events. So permitting SMIL buys you the ambient half (drifting field lines, a breathing spiral) and **not** the hover half, regardless of what the validator accepts. Hover-driven illustration needs the SVG inlined, which is Wall 3's problem, not Wall 1's.

**1c. The one that actually blocks it: SMIL cannot honour `prefers-reduced-motion`.** This is the finding I'd want to discuss first. The platform's motion contract is that everything degrades — `l1ScrollTrackSchema`'s docstring says it outright ("DEGRADES TO THE DESIGN, NEVER TO A BLANK"), and the renderer gates every animation behind `not (prefers-reduced-motion: reduce)` (`render.ts:1225`). SMIL has no media-query gate and can only be paused by script; the only declarative way to respond would be a `<style>` block inside the SVG, which is precisely the raw-CSS line DOC-2 draws.

And it's not only accessibility. `reducedMotion: 'reduce'` is the **freeze-determinism precondition** for the whole capture gate (`playwright-driver.ts:70` — "an unfrozen page projects a different frame every run and the whole gate is flaky"). SMIL ignores it, so an animated drawing would screenshot at an arbitrary animation time and make the fidelity gate non-deterministic.

That reframes A. "Permit SMIL" isn't a validator relaxation — to satisfy the existing contract it needs a renderer-side decision (a static poster swapped under reduced motion, or the animation expressed structurally so the renderer can gate it). Which points at the same place C does.

---

### Wall 2 — L1 motion (`packages/site-schema/src/l1/motion.ts`, `render.ts`)

Your reading is right, and REQ-325/326/328/329 have already built most of the machinery you'd need.

What exists: `reveal` (one-shot entrance, transition-based, `opacity` + independent `translate`), `scrollTrack` (REQ-325/329 — real `@keyframes` driven by `animation-timeline: view()`, `opacity`/`translateYPct`/`scale`), and `interaction.hover`/`focus` (state deltas, transitions). There is **no time-driven animation**: the only `animation-duration` in the renderer is the literal `auto` for the progress timeline (`render.ts:1338`).

**Option B is much cheaper than it looks.** `scrollTrackRules` (`render.ts:1302`) already compiles stops → a named `@keyframes` block, collects them into a document-level list, emits them before the rules, and gates on reduced-motion. A time-driven track reuses all of it verbatim — swap `animation-timeline: view()` + `animation-range` for `duration`/`iteration-count`/`direction`/`delay`, drop the `SCROLL_TIMELINE_SUPPORTS` feature query (time animations need no fallback), and `hover` as a trigger is just `:hover` on the selector. The property-collision rule you'd need already exists and is already cross-trigger: `l1MotionClaims` + `L1_STRUCTURAL_RULES.animatedPropertyIsExclusive` (`validate.ts:197`).

**And there's no round-trip debt.** Capture records motion as a single flag — `motion?: 'animation' | 'transition' | 'both'` (`capture/types.ts:503`) — and `fold.ts` never produces `reveal` or `scrollTrack` at all. Motion is a **write-only axis in L1**: authored and rendered, never recovered. B inherits that precedent and owes nothing new to REQ-82.

Your own caveat stands though: B's property vocabulary is `opacity`/`translate`/`scale` on a *node*. It pulses a whole plate. It cannot move the arms while the parchment holds still.

---

### Wall 3 — addressable parts

This is the one that is genuinely architectural, and it's where A's hover promise and C converge.

To reach `#left-arm` from the page, the SVG has to be **in** the page. Today it never is. Adding an inline sink runs into four things:

1. **Trust asymmetry.** `IMAGE_EXTENSIONS` (`edit.ts:2717`) accepts operator-uploaded `.svg` on an extension check alone — a human vouched for the bytes. Those files have never seen `validateSvg`. An inline sink can only accept *generated* assets, or must validate at render time.
2. **The round-trip breaks on structure, not motion.** `isMediaElement` (`fold.ts:1332`) matches on `a11yRole === 'img'`, which an inline `<svg role="img">` satisfies — then `fold.ts:3222` demands a resolvable `src`, finds none, and signals a folder-power gap. So inline SVG needs either a new node kind the fold recognises or a renderer-owned-subtree marker (the `data-l1-zoom` family is the nearest precedent).
3. **`id` collisions.** Two instances of one drawing on a page, or a drawing whose ids collide with L1's own — needs namespacing at emit time.
4. **The naming problem.** L1 would have to address a part *inside* an asset. That's a new kind of reference: today no instance string reaches a CSS identifier, deliberately (`scrollTrackRules`' comment on naming).

**Raster decomposition (your point 3) I'd separate out entirely.** There is no raster→vector path in the repo and nothing that could grow into one cheaply. I'd treat that as a non-goal for this ticket and let the answer be "author the illustration as a drawing if you want it to perform" — worth stating explicitly, since as you say it determines the migration story.

---

### What I'd put to you

The ticket orders A → B → C by cost. **I think the code inverts the first two.**

- **B is the cheapest thing here**, not the second cheapest. The keyframes pipeline, the collision rule and the reduced-motion gate all exist; it's a schema addition plus a variant of one existing renderer function, with no round-trip obligation.
- **A is cheap to *permit* and expensive to make *honest*.** Bare allowlisting gives you motion that ignores `prefers-reduced-motion` and destabilises the capture gate — the one hard wall DOC-2 says never moves. Making it honour the contract needs a renderer-side gate, at which point you're most of the way to expressing the animation structurally anyway.
- **C is the only thing that delivers what you actually described** ("the arms draw each other on hover"), and A's `begin="mouseover"` does *not* deliver it, because `<img>`-embedded SVG gets no pointer events. If hover-driven illustration is the goal, A is not a cheap down-payment on it — it's a different feature.

There's a fourth shape not in the ticket that I think is worth weighing, because it satisfies DOC-7 §6.3's "add a typed primitive, never open a raw hole" more cleanly than A does: **the renderer inlines a validated generated drawing and compiles L1-authored, structured motion onto named parts inside it.** The model authors `id`s in the drawing (already permitted) and a structured animation in L1 (which the renderer gates on reduced-motion, as it does everything else). No SMIL, no raw CSS, no free-form timing strings, one motion model — and it's the only route that reaches C at all.

That's a bigger build than any of A/B/C individually, but B is a strict subset of it, so B-first is not wasted work either way.

Two things to settle before I'd write anything down:

1. **Is `prefers-reduced-motion` negotiable for drawings?** If you'd accept ambient SMIL that ignores it, A becomes viable on its own and the capture gate needs a separate answer. If not, A needs the renderer regardless.
2. **Is hover-driven illustration in scope for this ticket, or is ambient motion enough for now?** That's the B-versus-C fork, and it decides whether this is one ticket or two.

I've made no code changes. Tell me which way you're leaning and I'll scope the ticket body to match.

<!-- xgd-turn id="c99190b5-9d52-4c70-bbe4-11baa19e3b76-user" -->

<!-- xgd-chat role="user" ts="2026-09-27T20:24:06.045643+00:00" -->
#### You
There's a lot of details that I am not following here.

I hear you see 3 "Walls". 1 and 2 have relatively straightforward fixes, Wall 3 has more structural issues that you can't see easy changes to satisfy?

Rather than getting into the implementation weeds can you tell me what capabilities I can get with the easy fixes, and what capabilities remain blocked please?

<!-- xgd-chat-end -->