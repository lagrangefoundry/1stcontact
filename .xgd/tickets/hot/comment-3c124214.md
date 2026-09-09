---
uid: comment-3c124214
id: COMMENT-2322
type: comment
title: Comment on chat CHAT-49
created_by: xgd
created_at: '2026-09-09T17:28:06.441437+00:00'
updated_at: '2026-09-09T17:33:34.596839+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-a0262d7c
  kind: chat_transcript
---

<!-- xgd-turn id="504dfa2e-e4a0-4c57-9d45-551161f57ccb-user" -->

<!-- xgd-chat role="user" ts="2026-09-09T17:27:56.839454+00:00" -->
#### You
The vector graphics are proving very useful but there are 2 problems (1) they are challenging for the AI its shooting in the dark (2) it becomes frustrating describing picture changes in words. Please read my chat session from last night with Claude building the 1st contact site.

In this chat I would like to explore 2 threads:
(1) is it possible for us to give clear telemetry to the AI about object size and placement
(2) is it possible to create UI tools so the user can move, resize, rotate vector components directly in edit mode

In the discussion last night we were using svg to create a 1st Contact logo - the st was colored differently from the rest of the text, made smaller and raised to a superscript. It took many attempts over a long period to get the placing of the st acceptable. In the end the AI did it by drawign a grid onto the text area and then measuring it with a screenshot - complex and token costly not to mention cumbersome. When the AI fumbles about it does not fill the user with confidence.

Could the AI have access to clarity on object sizes and locations automatically? (L1 tool?)

We already have edit mode - it would have been extremely helpful if I could have selected the "st" component of the logo and dragged it to the correct location - also resized it perhaps. Are there js vector editing libraries that we could import to do this?

<!-- xgd-turn id="504dfa2e-e4a0-4c57-9d45-551161f57ccb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-09T17:33:34.166372+00:00" -->
#### Claude
I'll start by finding last night's chat session and understanding the current vector/L1 surface.

I read the session (D1 `comment-e24dfdb4`, plus the tool transcript `comment-a7078536`) and traced the code. Here's what I found.

## What actually went wrong

The wordmark work ran **02:15 → 02:31**: 13 `write_image` calls and 13 `screenshot` calls, and it still isn't right. The final asset is:

```xml
<text x="0"  y="62" font-family="system-ui, -apple-system, sans-serif" font-size="62" font-weight="800" fill="#1a3a6b">1</text>
<text x="27" y="29" font-family="system-ui, …"                          font-size="20" font-weight="700" fill="#e76f51">st</text>
<text x="48" y="62" font-family="system-ui, …"                          font-size="62" font-weight="800" fill="#1a3a6b">Contact</text>
<line x1="80" y1="78" x2="240" y2="78" …/>
```

Three **separately, absolutely positioned** `<text>` elements. So every gap in that wordmark is a number the AI had to guess, and the only way to check a guess was to render and look. Hence the ruler-grid SVG (`wordmark-measure`, red lines at x=20/25/30/35/40) and the mobile screenshot to read it off.

There's a second problem the session never noticed. `system-ui` is not a font — it resolves to SF Pro on macOS, Segoe UI on Windows, Roboto on Android. Different advance widths. **The x=27 and x=48 that were tuned over 17 minutes are only correct on your machine.** The logo is subtly broken for most visitors, and the hardcoded underline (`x1="80" x2="240"`) is wrong everywhere. That's a live defect in the draft, independent of tooling.

---

## The free fix

`<tspan>`, `dx`, `dy`, `font-size`, `font-weight` and `fill` are **already in the SVG allowlist** (`packages/site-schema/src/svg.ts`). So this validates today — I ran it against `validateSvg` to be sure:

```xml
<text x="0" y="62" font-family="Satoshi" font-size="62" font-weight="800" fill="#1a3a6b"
  >1<tspan font-size="20" font-weight="700" fill="#e76f51" dy="-33">st</tspan><tspan dy="33">Contact</tspan></text>
```
```
{ "ok": true, "errors": [] }
```

One `<text>`, three runs. **The browser advances the pen** — horizontal position is automatic and exactly correct in whatever font actually resolves. There is no x to guess, no gap to measure, and no screenshot loop. `dy` alone carries the superscript raise, which is a single perceptual judgement the AI can make from one look.

Nothing in the `write_image` docs tells the AI this. It says "shapes, paths, gradients, text and grouping" and lists the security rules; it never mentions that text runs compose. That omission cost the whole session. It's a prompt/docs change — no ticket needed under the free-coding rules.

I'd add a second line while we're there: **a mark must name a real registered font, never `system-ui`** — a drawing that resolves differently per visitor isn't a logo.

That probably removes 80% of the pain for near-zero effort. The rest is worth building anyway.

---

## Thread 1 — telemetry

The measurement machinery already exists; it just isn't exposed as numbers. `tools/generate/src/cli/capture/extract.ts` already drives Playwright and reads `getBoundingClientRect()` and `Range` rects. Three distinct things you could build, in value order:

**`measure_drawing`** — render an SVG asset headless, walk it, return `getBBox()` per node in **viewBox user units** (the space the AI authors in), plus for text: `getComputedTextLength()`, and `getExtentOfChar(i)` per glyph. That last one *is* the question the ruler grid was asked to answer — "where does the `1` end" — returned as a number in one call instead of a render, a screenshot and a squint. Small, self-contained, general to every drawing. It should also report **which font actually resolved**, because that's how `system-ui` gets caught.

**`outline_text`** — `(font, size, weight, string) → { d, advanceWidth, capHeight, bbox }`, computed from the registered font file via `fontkit`/`opentype.js`. No browser at all. The AI drops the `d` into a `<path>`, which the allowlist already accepts, so it's not a schema change. This is how real logos ship: exact at author time, and **identical for every visitor** regardless of installed fonts. It's the correct answer for a wordmark specifically, and it dissolves both problems at once. Caveat worth checking: outlining can be a separate licence grant from webfont use — `fonts/registry.yaml`'s `redistribute_in_product` is the field that would need to say yes.

**`measure_page`** — box per stamped L1 segment at a given width. Much broader value than logos ("the headline sits 4px from the edge", "these overlap at 900px"). Note `l1/probes.ts` already computes this *analytically and browser-free* — but it **estimates** text height and can't know glyph widths, which is precisely the blind spot that caused this. So: analytic as a cheap pre-check, browser-backed for truth. This is a separate concern from the other two and I'd sequence it apart.

---

## Thread 2 — direct manipulation

Feasible, but there's a wall in the way that's worth seeing clearly.

The renderer emits `<img class="…" src="…svg">` (`packages/framework/src/l1/render.ts:2155`). An `<img>` is a black box — no DOM, no clicks, nothing inside it is addressable. The edit stamp (`data-l1-path`) addresses **L1 nodes**; the `st` is not an L1 node, it's bytes inside an asset. So today edit mode cannot see it at all.

There's also DOC-28 §7.3, an explicit scope wall: *"no adding, removing, reordering, resizing or repositioning segments. Structure is the AI's job."*

**But I think that wall doesn't actually bind here, and the reason is the interesting part.** It exists because page geometry is responsive — six breakpoints of keyframes — so "drag this left" is genuinely ambiguous: which breakpoint did you mean, and what happens to the other five? A drawing has none of that. One coordinate system, no reflow, no breakpoints. Moving a node inside an SVG is unambiguous and lossless. **A drawing is a fixed coordinate space, and that is exactly what makes direct manipulation tractable there and intractable on the page.** So it's a separable feature, not a breach.

What it needs:

1. **Inline the SVG in the edit channel only** — emit `<svg>…</svg>` instead of `<img>` so nodes are in the DOM. Contained change, edit-render only; View and published stay as-is.
2. **Stable `id`s on manipulable nodes** — already allowed by the validator; would become a convention the AI follows when drawing.
3. **A typed write** — the diff is `{asset, node: 'ord', translate: [dx, dy]}`, applied server-side by rewriting that node's `transform` and re-running `validateSvg`. Critically: you do *not* let the browser serialize the SVG back. That keeps DOC-28 §4's "second producer, not second path" invariant intact.

**Libraries** — I'd avoid the obvious ones. `fabric.js` and `konva` are canvas scene graphs: they *import* your SVG into their own model and *export* SVG back, which is a lossy round-trip that would mangle the AI's authored document (comments, ids, structure). Wrong shape.

Two that fit:
- **`interact.js`** (~40KB, MIT) — pure gesture layer. Drag/resize/rotate on any element including SVG nodes, no scene graph, no document model. It hands you deltas and you decide what diff to emit. Best fit precisely *because* it does less.
- **`@svgdotjs/svg.js`** + `svg.draggable.js` / `svg.resize.js` / `svg.select.js` (~20KB, MIT) — purpose-built for selection handles on SVG nodes. More out of the box, slightly more opinionated about owning the document.

I'd lean `interact.js` for the invariant.

**One caution.** Free-dragging by eye isn't obviously better than the AI getting it right — you'd still be nudging. What makes dragging genuinely better is **snapping and a numeric readout**: the top of `st` snaps to the cap-height of `1`, with the offset shown. That's `interact.js` plus a small snap layer, and it's where the actual value is.

**And an honest tension.** DOC-46 and DOC-33 are emphatic that the client answers questions about their business and *never* drags a block or picks a font — "no templates, and nothing for you to design either." A vector nudger is a designer tool. I think this is most valuable as an **operator/builder** capability (you, building 1st Contact's own site) and much weaker as a client-facing one. Worth deciding which audience it's for before it's built, because that changes the UI a lot.

---

## Where I'd put the effort

| | Cost | What it buys |
|---|---|---|
| **0. `tspan` + real-font docs** | ~an hour, no code | Removes the guessing entirely for text marks. Also fixes the live cross-platform defect. |
| **1. `measure_drawing`** | small | Kills the ruler-grid hack; general to all drawings. |
| **2. `outline_text`** | medium | Exact *and* portable wordmarks. The proper answer for a logo. |
| **3. `measure_page`** | medium | Broad value, separate concern. |
| **4. Drag in edit mode** | large | Real, and cleanly scoped to drawings — but decide the audience first. |

0 and 1 together would have turned last night's 17 minutes into about two exchanges.

Want me to write up 0 as a docs change now, and/or open tickets for 1–2? (I'll keep everything on CHAT-49 unless you tell me otherwise.)

<!-- xgd-chat-end -->