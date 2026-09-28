---
uid: comment-dc48909f
id: COMMENT-4085
type: comment
title: Comment on request REQ-335
created_by: xgd
created_at: '2026-09-27T19:59:57.851332+00:00'
updated_at: '2026-09-28T16:52:51.034544+00:00'
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

<!-- xgd-turn id="c99190b5-9d52-4c70-bbe4-11baa19e3b76-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-27T20:24:46.233078+00:00" -->
#### Claude
Let me restate the shape, because I'd put the line in a slightly different place than you did.

**Wall 2 is the genuinely easy one.** The machinery for it already exists — I'd be reusing what REQ-325/328/329 built, not inventing anything.

**Wall 1 is cheap to *unlock* but not cheap to do *cleanly*.** Flipping the switch takes an afternoon. But motion inside a drawing is motion the platform cannot turn off — a visitor who has asked their OS for "no animation" gets it anyway, and our own screenshot gate starts photographing a moving target. Doing it properly means routing it through the renderer, which is real work. So it's not in the same bucket as Wall 2.

**Wall 3 is structural**, yes — and the important thing is that Wall 1 does *not* get you a discount on it. They look adjacent but they're different features.

---

## What the easy work buys you

**Whole-illustration motion, on a loop, on a trigger you choose.**

- A plate that **breathes, pulses, drifts or slowly rotates**, indefinitely, not just once on arrival.
- Motion that starts **on page load, on hover, or when it scrolls into view** — your pick per element.
- **Several motions layered on one element** — drift while it also fades in — with the platform refusing the combinations that would silently cancel each other out.
- Full control of the timing feel: duration, easing, how many repetitions, whether it reverses.
- All of it **honours "no animation" preferences** and degrades to your static design, because it's built on the path that already does that.

Concretely: your field-lines plate can drift. Your spiral can breathe. A diagram can pulse gently under the cursor and settle when the cursor leaves.

**If we also unlock the drawing surface** (Wall 1), you additionally get ambient motion *inside* a single drawing — parts moving independently of each other, which whole-element motion can't do. Field lines that actually drift relative to a fixed frame. That's a real gain, and it's the one that carries the reduced-motion compromise.

---

## What stays blocked

**Anything the cursor drives inside a drawing.** This is the centre of what you described, and it's worth being blunt: *"the arms begin to draw each other on hover"* is not reachable by the easy work, and not reachable by unlocking the drawing surface either.

The reason is simple and not about our rules. A drawing reaches the page as an image, and browsers deliberately make images deaf to the mouse — an image cannot know the cursor is over it. Motion *inside* it can only be ambient: started on load, running on its own clock, unaware of the visitor. Even the one attribute you flagged as "most of what I actually wanted" — the hover trigger — does nothing from inside an image.

So, specifically blocked:

- **The lever that lifts its load when you point at it.** Hover-triggered, part-level.
- **The diagram that assembles itself element by element on approach.** Sequenced, part-level, triggered.
- **The portrait whose eyes follow the cursor.** Needs to know where the cursor is.
- **Any sequence where one part moves and another deliberately holds still, on demand.**

Fixing that class means the page holding the drawing *directly* rather than as an image — which is Wall 3, and it's a real project: new vocabulary for naming a part, and a chunk of our capture-and-verify pipeline to teach.

**Also blocked, and I'd suggest writing it off:** turning an existing PNG into something with movable parts. There's no path to it in the codebase and nothing that grows into one cheaply. Realistically the answer is "if you want an illustration to perform, author it as a drawing, not a PNG."

---

## The decision I'd put to you

The easy work gets you **ambient** — illustrations that are alive but not *responsive*. It's genuinely more than you have and it ships soon.

Your ticket's own framing — "comes to life **under the cursor**" — is the responsive kind, and that's the structural project.

So: **do you want the ambient version now, or is the responsive version the actual ask?** If it's the latter, I'd rather scope this ticket to that and not spend effort on the drawing-surface unlock, since it buys nothing toward it and costs us the "no animation" guarantee.

Nothing changed in the code. Say which and I'll scope the ticket.

<!-- xgd-turn id="4b3d2ad9-6751-4b2d-bcbe-47a280660022-user" -->

<!-- xgd-chat role="user" ts="2026-09-27T20:39:48.616106+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="4b3d2ad9-6751-4b2d-bcbe-47a280660022-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-27T21:09:52.924752+00:00" -->
#### Claude
Good — that reframes the work. Let me check one feasibility question before I answer, because it decides the shape.

No blocking questions — the one fork I raised (ambient vs responsive) is answered by building **one** primitive that does both, which is what your own "Related" note asks for. Let me confirm the protocol, then state my decisions and build.

Now let me scope the ticket. I'll write the addendum to a file and append it (per the body-file idiom).

Ticket scoped. Now cutting the branch.

Now the schema. Inserting the timed-animation primitive after the scroll-motion schemas:

Now the `parts` declaration on the image node:

Now the types exports and the motion projection:

Now the motion projection — extending the claim model with a target so part-scoped tracks don't falsely contest:

Now the claim model gains a target, and `l1MotionClaims` reads animate tracks:

Now the validator. Let me read the existing exclusivity rule:

Now the per-track checks. Let me see how `checkEntrance`/scroll-track checks are wired into `walk`:

Now the per-track validation function and its wiring:

Now check the package index exports, then typecheck the schema package:

Schema layer typechecks. Now the renderer — the largest piece. Let me read the image emission and the reveal wiring precisely:

Now the renderer. First the animate compiler, modelled on `scrollTrackRules`:

Now the drawings input, the inline emission, and the wiring:

Now the inline-drawing resolver and the image emission:

Now wire `animate` into `emitNode`, including the `in-view` observer handle:

Now the render plumbing in `tools/generate`:

No errors in my code. Now the three render call sites need to lend the store read:

No new authoring op needed — L1 is written verbatim and validated, so the language *is* the API. Now the UATs:

The ticket claims a refusal I decided against (the validator can't see the drawing). Let me correct that one clause rather than leave a contradiction:

Body preserved and corrected. Now the UATs:

23 of 24 pass on the first run. The one failure is my assertion, not the code — the renderer relativizes URLs (REQ-109's flatness rule):

All 24 UATs pass. Now regression — the sibling motion suites and the L1 core, since I changed a shared claim model:

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="9f552803-9c3c-47d6-a792-9f874d9d5f49-user" -->

<!-- xgd-chat role="user" ts="2026-09-28T04:04:30.884363+00:00" -->
#### You
Can you define plainly what your three walls are? I am still struggling to understand exactly what each one is you seem to talk about them but don't define what they really are in simple terms.

Let's talk about this for a moment. I was expecting that we would supply animated gifs - that is images with the animation built-in and a simple control triggered on the page that starts and stops the animation. If the mouse cursor is over an image for example the animation begins. Alternatively if we scroll down to an image, the animation begins. And likewise we would have a stop control when the mouse Cursor is moved off the image the animation stops. Once we scroll beyond the image it stops… Or whatever. I am not expecting that we would capture the movement mechanics or make them anything more complex than a loop but surely we can start and stop an animated gifs no?

<!-- xgd-turn id="9f552803-9c3c-47d6-a792-9f874d9d5f49-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-28T04:06:50.249848+00:00" -->
#### Claude
Let me check one thing before I answer, so I report the state accurately.

Fair challenge. I'd been using "walls" as shorthand for the ticket's own three complaints without ever restating them. Plainly:

## The three walls

1. **You can't put movement inside a picture we generate.** When we write an SVG drawing, a checker inspects every tag and rejects anything not on an approved list. The animation tags aren't on it.
2. **You can't loop movement on the page.** What existed could fade something in once as you scroll past it, or change its colour while hovered. Nothing repeated, and nothing ran a sequence of steps.
3. **You can't move one piece of a picture.** To the page, a picture is a single flat rectangle. There's no way to say "the arm" as separate from "the background behind it".

Wall 2 was easy. Wall 1 turned out to be a bad idea (movement inside the file can't be switched off for people who've asked for no animation). Wall 3 was the structural one.

---

## On animated GIFs — the honest answer

**No, you can't start and stop an animated GIF.** That's not our rules, it's the browser: a GIF begins the instant it loads and runs on its own schedule. There's no attribute, no styling property, and no non-scripted way to pause it, restart it, or ask it how far through it is. It also can't be stopped for someone who's asked their machine for no animation — which is its own problem, and the same reason I ruled out putting movement inside our SVG drawings.

So the specific mechanism you had in mind doesn't exist. **But the effect you described absolutely does**, two ways:

**(a) Two files, swapped.** Show a still frame normally; show the animated file while hovered or in view. One line of styling, no scripting. Downsides: "stop" means "snap back to the still", restarting replays from frame one rather than resuming, and you need an extra still image for every animation.

**(b) One image holding all the frames in a strip, and the page steps through it.** This is the one I'd recommend. You get a genuine start, a genuine stop, a clean loop, instant stop-and-resume, and it switches itself off for anyone who's asked for no animation — all with no scripting. It's the standard technique for exactly this.

---

## Where that leaves what's on disk

Worth being clear, because the gap is smaller than it sounds.

**What I built already gives you your trigger model.** Start on load, start on hover, start when scrolled into view; loop forever or a set number of times; stop when the cursor leaves or when it scrolls away. That's precisely what you described. I built it, and 24 tests pass against it.

**What it moves today is the whole picture** — drift, breathe, rotate, fade. It does not step through frames, and it doesn't touch GIFs.

So option (b) is **one more thing a loop is allowed to move**: which frame of a strip is showing. That's a small addition on top of machinery that's already working and tested, not a different design.

**And I over-built.** The part-addressing — moving the arm independently of the parchment — is more than you asked for. You said you don't want the movement mechanics, and that feature *is* the movement mechanics. It's built and passing. My honest read: it was the cheapest of the three pieces, because our drawing format already allowed naming pieces, so nothing new had to be permitted. But it's surface area you didn't ask for, and surface area is the thing that costs over time.

---

## What I'd do

Add frame-stepping (option b) to the loop primitive that already exists, so a strip of frames plays on hover or on scroll-into-view and stops cleanly. Keep the whole-picture motion, since it's the same mechanism and already done.

**Two things I need from you:**

1. **Keep or cut the part-addressing?** I lean keep — it's built, tested, and costs nothing further. But it's your call and cutting it is clean.
2. **Where do the frames come from?** Option (b) needs one image containing the frames side by side. Can our image generation produce a consistent strip of frames of the same illustration? If not, this is a content problem rather than a code one, and (a) — a still plus a hand-made animated file the operator supplies — becomes the realistic path. I don't know the answer and it changes what I build.

Nothing is committed. Two notes on state: the tests I ran are green for everything I touched, and separately, six suites can't run in this working copy at all because a generated build folder only exists in the main checkout — that's environmental, not my change.

<!-- xgd-turn id="ff8dd2e0-d9ae-40b7-934d-8c5823828834-user" -->

<!-- xgd-chat role="user" ts="2026-09-28T04:16:59.492123+00:00" -->
#### You
tell me more about the part-addressing what does it do exactly? We can select a rectangular bounding box area with in a picture and move it? Rotate it? Resize it? What is left "under it" does it effectively float a copy of itself over the full image?

<!-- xgd-turn id="ff8dd2e0-d9ae-40b7-934d-8c5823828834-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-28T04:17:54.754338+00:00" -->
#### Claude
Good questions, and your mental model is off in a way that matters. Let me correct it directly.

## It's not a region of the picture

You don't select a rectangle. **A drawing isn't pixels** — it's a list of instructions: "draw a line from here to here", "fill this circle", "stroke this path". Whoever draws it can wrap a set of those instructions in a group and give the group a name.

Part-addressing moves **a named group of drawn shapes**. Not an area, not a crop, not a layer — the actual shapes.

Think of a puppet with named joints rather than cutting a region out of a photo.

## Your four questions

**"Select a rectangular bounding box and move it?"** No. You name a group of shapes the drawing already declares. If the illustration is one undifferentiated mass of paths, there are no parts and there's nothing to name.

**"Rotate it? Resize it?"** Yes — four things, each animatable over a loop: move (horizontally, vertically), rotate, scale, fade.

**"What is left under it?"** Nothing is left behind, because nothing was lifted. When the arm's strokes move, the browser redraws the whole picture from scratch that frame with the arm somewhere else. Whatever else the drawing draws in that spot — the background, another shape — is simply what's now visible there. Exactly as if you'd redrawn the illustration by hand with the arm in a new position.

**"Does it float a copy over the full image?"** No copy. One drawing, redrawn each frame.

One edge: if a part moves far enough it gets cut off at the edge of the drawing's own frame, same as any shape would.

## The real constraint — and it's the important one

**The drawing must have been authored with the parts named.** You cannot pick out "the arm" after the fact. That's precisely why this can't work on a photograph or a PNG: there's nothing in the file that says where the arm is or that it's a distinct thing.

In practice: this works on drawings we generate, because the model writes the shapes and can name the groups as it goes. An operator's uploaded SVG usually won't work — export files from design tools carry constructs our checker rejects, so they'd stay ordinary pictures.

## A gap in what I built, which you should know about

**You cannot choose the pivot point.** A part rotates about its own centre. So "the arm rotates" swings around the middle of the arm — not around a shoulder. For your lever example, the thing you'd actually want is a pivot at the fulcrum, and there's no way to say that today.

That's a genuine shortfall against your own example in the ticket. It's a small addition — one more field on a track — but it isn't there now, and without it the part motion is more "drift and sway" than "mechanism that works".

---

So, honestly: what's built is a decent puppet rig with no control over where the joints are. Combined with your earlier point that you didn't want the movement mechanics at all, I'd now say **cut it**. It's over-built for what you asked for, it needs a further addition to deliver the one example it was supposed to deliver, and the frame-stepping route gets you "mechanism that works" more directly — the animator decides how the lever moves, and the page just plays it.

Shall I strip the part-addressing and put that effort into frame-stepping instead? If so I still need your answer on where the frames come from, since that decides whether it's a strip of frames we generate or a file the operator supplies.

<!-- xgd-turn id="c55062d9-e5dd-47d8-ad33-6023269513ca-user" -->

<!-- xgd-chat role="user" ts="2026-09-28T04:27:15.125799+00:00" -->
#### You
**The drawing must have been authored with the parts named.** You cannot pick out "the arm" after the fact. That's precisely why this can't work on a photograph or a PNG: there's nothing in the file that says where the arm is or that it's a distinct thing. <-- ah but I could take the image, cut out a portion of it, put that portion on a transparent background (assuming its not a rectangle but, lets say and arm) and L1 could draw that arm over the top of the one that is already there and move/rotate it?

<!-- xgd-turn id="c55062d9-e5dd-47d8-ad33-6023269513ca-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-28T04:31:09.580331+00:00" -->
#### Claude
That's a genuinely good idea, and I think it's better than what I built. Let me check one thing that decides how far it goes.

Let me prove it rather than assert it — a cut-out overlay, animated, with what's already built:

Yes. And it's better than what I built — it works on photographs, which part-addressing never could.

I just proved the mechanism: a second image node, showing a window onto the *same* file, rocking on hover, valid and rendering. **It needs nothing new built** — it's the whole-element looping I already have, pointed at an overlay.

## The catch

**The original arm is still painted in the picture underneath.** Move your cut-out and you see two arms — one moving, one static. Two ways out:

- **Small movements: no problem.** Cut the arm out slightly generously, and the overlay's ink covers the original's ink at every point in the motion. A sway, a small rotation, a nudge — all fine with one extra file and no erasing.
- **Large movements: you need the base plate patched.** A version of the illustration with the arm erased and the gap filled in. For a line drawing on flat parchment that's easy. For a detailed photograph it's real retouching work.

So the size of the movement decides whether this costs you one asset or two-plus-retouching.

## Three tiers, cheapest first

**1. A rectangular window onto the existing file — no new assets at all.** Point a second node at the same image, size it to the region, position the window over that part. This is what I just proved. Your own example of *"a block diagram that assembles itself element by element"* is exactly this: diagram elements are rectangles.

**2. A simple shape — still no new assets.** Same trick, plus an existing edge-shaping feature that gives circles, ellipses, and soft blobs. Your *"portrait whose eyes move"* is two small ellipse windows.

**3. An arbitrary silhouette — one new file.** The arm. There's no way to clip to a free-form outline, so the transparency has to be in the file, as you described.

Tiers 1 and 2 are free today. Only tier 3 needs someone to cut anything out.

## Your idea fixes the problem I flagged

Last turn I said you can't choose the pivot — a part rotates about its own centre, so an arm swings around its middle rather than a shoulder.

With a cut-out that goes away. **The rotation centre is the centre of the file, and you choose the file's bounds.** Pad the cut-out with transparency on the shoulder side until its centre sits on the joint, and it pivots at the joint. Free, and it means your lever can actually lift from its fulcrum.

## And it degrades perfectly

At rest the overlay sits exactly on top of the original. For a visitor who's asked for no animation, or an older browser, the page is pixel-identical to the static illustration. That's the best fallback behaviour of any option we've discussed — better than the drawing route, where a stopped animation may sit mid-pose.

---

## What I think this settles

**Cut the part-addressing.** Your approach reaches everything it reached, plus rasters, plus a controllable pivot, and needs no new code. Two mechanisms for one job is the maintenance cost you flagged at the start.

**And a line in the ticket is now wrong.** I wrote that raster decomposition is a non-goal with no path to it. That was right about *decomposing* a PNG and wrong about the goal: you don't decompose it, you compose over it. I'll correct that.

So the plan reduces to: keep the looping/trigger primitive that's built and tested, delete the part-addressing, and write up the overlay technique as the supported way to make an illustration perform.

**One open question, and it's the same one as before:** does frame-stepping still matter to you? The overlay technique covers move/rotate/scale/fade of pieces. It does *not* cover an animation someone has drawn frame by frame. If you want that too, I still need to know whether we can produce a strip of frames or whether the operator supplies the file.

<!-- xgd-turn id="5ca9ef2f-2e4c-4cc7-95d3-87634fe86cda-user" -->

<!-- xgd-chat role="user" ts="2026-09-28T16:52:49.949199+00:00" -->
#### You
Yeah I think the frame stepping is important - can you do that?

<!-- xgd-chat-end -->