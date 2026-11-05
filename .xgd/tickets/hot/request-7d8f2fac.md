---
uid: request-7d8f2fac
id: REQ-440
type: request
title: 'Text over images: a real L1 text outline, applied thin and contrasting by
  default, and a layout check for text over an image with no outline or scrim'
created_by: EPIC-19
created_at: '2026-10-23T23:42:51.763816+00:00'
updated_at: '2026-10-24T00:17:10.021073+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 5
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-a4954bf8
  commits:
  - working_sha: a617ecceb3b20f56e9d331d68221576178997a35
    reconcile_sha: null
    main_sha: null
  - working_sha: def7ecea7ff684e96ebbd99bc9b4bd37d0c31d88
    reconcile_sha: null
    main_sha: null
  version: 0.2.604
---

## Why

On Ariel's home page the white headline sits on the Old Scratch photo, and it
disappeared where it crossed the photo's white lights. The client had to ask for
an outline (2026-10-23 23:36 UTC: "Can you put a thin dark outline on the text
so it is clear on both light and dark backgrounds"). The operator: "putting text
over an image is tricky. A thing that will ensure that it is successful: outlines
around the lettering. If the outline contrasts clearly with the letter colour,
then on any background either the lettering or the outline will be clear."

Today this can't be done properly, and nothing makes it happen by default:

- **L1 has no text outline.** The builder faked one with
  `textShadow {blurPx: 1, spreadPx: 1, color: #000000}` on `hero-headline`. CSS
  `text-shadow` has no spread, so it renders as a faint 1px blur, not an outline.
  Check what the renderer does with `spreadPx` on a text shadow, and say so in
  the ticket.
- **Nothing asks for it.** Text over a photo is laid out with no legibility
  treatment unless the client notices and asks.

## What changes

### 1. A typed text outline in L1

- New text axis `textOutline: { color, widthPx }`. `color` is a hex or palette
  ref, like every L1 colour. `widthPx` is bounded (for example 0.5 to 4). It is
  `.strict()` and validated like every axis (security policy, DOC-7 §6.2).
- The renderer draws it as a real stroke around the glyphs, outside the letter
  shapes so it does not thin the letters. For example `-webkit-text-stroke` with
  `paint-order: stroke fill`, or the most robust cross-browser equivalent the
  child session confirms. It is re-checked at emit time, like every renderer
  sink.
- It round-trips through capture (`capture(render(L1)) ≈ L1`, REQ-82) where
  capture can see it.

### 2. Text over an image gets a contrasting outline by default

- **The rule:** text drawn over an image (the image is behind it in the same
  stack, or is its container's background) has a contrasting `textOutline`, or a
  scrim behind it. "Contrasting" means the outline colour has a clear luminance
  contrast with the letter colour: dark for light text, light for dark text. The
  default is **thin**, about 1px, as the client chose.
- **The check:** a new named check in REQ-429's layout-check framework, "text over
  an image with no outline or scrim". It reports text whose box intersects an
  image painted behind it and which has neither a contrasting `textOutline` nor a
  scrim between it and the image. It is reported like any layout fault, so the
  build holds until it is fixed. Thresholds go in `layout-check.json`.
- **The builder is told:** the builder's instructions say that text placed over
  an image gets a thin contrasting outline from the start, using `textOutline`
  and never a `textShadow` approximation. The client should never have to ask.
  Wording stays within the priming budget.

## Test plan

`tests/test_UAT_FC_REQ-440_text_over_images_is_legible.*`:

- Schema: `textOutline` validates in bounds, and rejects an out-of-range width, a
  non-hex colour and unknown keys.
- Renderer (real Chromium): a white heading with `textOutline {#000, 1}` over a
  white area of an image shows a dark ring around the glyphs (pixel sampling at a
  glyph edge), and the letter width is not reduced.
- Layout check: a fixture with white text over a photo and no outline or scrim is
  reported. The same fixture with a contrasting outline, or with a scrim, is not.
  Text over a plain colour background is not reported.
- Builder priming names `textOutline` for text over images.
- Re-run the REQ-82 round-trip and envelope security UATs and the REQ-429
  layout-check UATs.

## What landed (free-coded)

### Finding: what the renderer did with `spreadPx` on a text shadow

Worse than a faint blur: **nothing was painted at all.** `shadowCss` emitted the
spread as a fourth length (`text-shadow: 0px 0px 1px 1px #000000`). CSS
`text-shadow` takes at most three lengths, so the browser rejected the whole
declaration. The same thing happened to every text shadow folded with
`spreadPx: 0`. Fixed: a text shadow is now emitted without spread or inset. That
reverses REQ-91's pinned output `text-shadow: 6px 4px 10px 0px #00000080`, which
was invalid CSS. The REQ-91 UAT now pins `6px 4px 10px #00000080`.

### 1. `textOutline` in L1

- `textOutline: { color, widthPx }` is a text axis, so `text` and `control`
  nodes carry it. It is `.strict()`. `color` is a hex or a palette reference,
  and references resolve like every other colour.
- `widthPx` is the ring a reader sees **outside** the glyphs. The envelope
  bound `L1_ENVELOPE.textOutlineWidthPx` is [0.5, 4].
- The renderer emits `-webkit-text-stroke: <2×widthPx>px <hex>;
  paint-order: stroke fill`. The stroke is painted under the fill, so only its
  outer half shows and the letters are not thinned. The colour and width are
  re-checked at emit time. Emails do not take `textOutline`: it is not in the
  email target's text axes.
- **Capture.** The extractor now records `textStroke` on a run as
  `{widthPx: stroke/2, color}`. This is capture schema **23**, and the
  coverage register now lists `-webkit-text-stroke-*` as recorded. The value
  axes carry it for the fold, which writes it back as `textOutline`, clamped
  into the envelope. So `fold(capture(render(L1)))` returns the same outline.
  The values diff does not score it: the REQ-82 round-trip report compares
  only type axes, and it does not score `textShadow` either.

### 2. The layout check `over_image` (kind `text_over_image`)

- A text element is checked when its line boxes intersect a picture. A
  picture is an `img`/`video`/`canvas`, or any box with a `url()` background,
  including the text's own container.
- Each of its first `maxLines` lines is sampled at both ends and the middle
  with `elementsFromPoint`, going downward from the text to the first picture.
  The text is **bare** if nothing in between is a veil. A veil is a fill or a
  gradient layer at least `minScrimAlpha` opaque. On the picture box itself,
  only a gradient layered above its `url()` counts, which is where L1's
  `overlay` scrim paints.
- Bare text is reported unless it has an outline of at least `minOutlinePx`
  showing outside the glyphs, in a colour whose WCAG contrast with the letter
  colour is at least `minContrast`. An outline that does not contrast enough
  gets its own wording, which gives the ratio.
- The text is reported once, not again for runs inside it. The finding text
  names `textOutline`, so the builder knows what to write.
- Thresholds live under `over_image` in `layout-check.json`: `minOutlinePx`
  0.5, `minContrast` 3, `minScrimAlpha` 0.35, `maxLines` 6. The runner gained
  `H.stackAt(x, y)`, which scrolls the point into view the way `topAt` does.

### 3. The builder

Both builder orders (`builder_priming` and `builder_priming_with_corpus`) gain
one paragraph after the heading paragraph: "Text laid over a picture gets a thin
`textOutline` from the start — about 1px, dark round light letters and light
round dark — so it reads wherever the picture is as light or as dark as the
letters. Never fake an outline with `textShadow`." The builder vocabulary is
generated from the schema, so it lists `textOutline` without further change.

Observed in Chromium: a 1px outline at a fractional glyph edge is
anti-aliased. It reads as a fine grey-to-black ring, which is visible but light.
If the operator wants it bolder, raise the default in the builder paragraph
(for example to 1.5px). That is a wording change, not a code change.

## Tests

`tests/test_UAT_FC_REQ-440_text_over_images_is_legible.test.ts`:

- `text_outline_is_validated_like_every_axis`: accepts widths of 0.5, 1 and 4,
  a hex colour, and a palette reference that resolves. Rejects 0.2 and 5, a
  non-hex colour, a CSS-injection string, an unknown key, and a reference
  missing from the palette.
- `a_text_shadow_with_a_spread_still_paints`: `{blurPx:1, spreadPx:1}` emits
  `0px 0px 1px #000000`.
- `the_outline_rings_the_letters_without_thinning_them` (real Chromium): white
  letters over a white/dark photograph. Over the white half, the plain render
  has no darker pixels and the outlined render has hundreds. Over the dark
  half, more than 97% of the plain render's white glyph pixels stay white, and
  the text box is unchanged.
- `the_outline_round_trips_through_capture` (real Chromium):
  `foldToL1(runMultiStateCapture(render(doc)))` returns
  `textOutline {#000000, 1.5}`.
- `text_over_a_picture_with_no_outline_or_scrim_is_reported` (real Chromium,
  via `checkLayoutAt`):
  - Bare text is reported at desktop, tablet and phone.
  - Text with a contrasting outline is not reported. Nor is text over an
    `overlay` scrim.
  - A pale outline on white letters is reported as barely contrasting.
  - The same text over a plain fill is not reported.
- `builder_priming_names_text_outline_for_text_over_images`: both builder
  orders.

Regression: the REQ-82 suite, every layout-check suite, and the capture
schema, coverage, values-diff and fold suites (52 files) all pass, except:

- **Already failing on clean xgd-working with the same results:**
  `AC694_capture_emits_advisory_structural_hint_sidecar`,
  `REQ-308_the_placeholder_pseudo_element_is_what_is_read`, and BUG-129's
  consultant priming ceiling (200262 > 200000 on clean working; unchanged by
  this ticket, whose text is builder-only).
- **Changed on purpose:** the REQ-91 shadow assertion, described above.