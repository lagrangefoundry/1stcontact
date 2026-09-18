---
uid: request-2a60571e
id: REQ-275
type: request
title: 'capture: audit completeness once, mechanically, instead of one round at a
  time'
created_by: EPIC-12
created_at: '2026-09-18T22:31:25.525963+00:00'
updated_at: '2026-09-18T23:37:35.330799+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: high
  story_points: 8
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-dfecee22
---

# Audit capture completeness once, mechanically, instead of one round at a time

## Where this came from

EPIC-19's audit of rounds 1–3: five of the 22 defects are one shape — *the
extractor stores a rounded or defaulted value instead of the true one, and no
fold fix or L1 axis can recover what capture discarded*. Padding, the
line-height fraction, `href`, alpha, transparent-vs-white.

Each was found by a separate console round, at roughly $7 a round.

## The mechanism we have is reactive by construction

REQ-270 landed `CAPTURE_SCHEMA` (`tools/generate/src/cli/capture/schema.ts`) and
`CAPTURE_SCHEMA_AXES`, which is the right machinery: it stamps a bundle, names
the axes a bundle is missing, and tells the operator to re-capture. It works.

But an axis only joins `CAPTURE_SCHEMA_AXES` **after a round has discovered it is
missing**. The registry currently holds five axes, and those five are precisely
the five a round paid to find. There is no reason to believe the list is
complete, and no cheaper way to extend it than running another round.

Measured today on the epic's own reference:

```
storage/references/gigabytealchemy.ai/index/capture.json
  captureSchema: absent -> schema 1      vs CAPTURE_SCHEMA 3 today
  padding*Px on a field  : absent
  href on a run          : absent
  headingLevel on a run  : absent
  background.kind "none" : absent
  fractional lineHeight  : absent
```

Five for five. That is the reactive registry working, and it is also a
demonstration of how much a single bundle can be behind.

## Behaviour wanted

**Turn discovery into one mechanical pass instead of N rounds.**

1. **A completeness probe.** For a reference page, enumerate the CSS properties
   and DOM facts the live page actually uses — computed styles over the rendered
   DOM, not a fixed wishlist — and diff that against what `capture.json` records
   for the same nodes. Output: the properties the page demonstrably uses that the
   bundle does not carry.
2. **Run it over all three stored references**, so a property that matters on one
   site and not another is still surfaced. `gigabytealchemy.ai`, `faelan.com`,
   `joyfulculinarycreations.com`.
3. **The result is a list, and the list is triaged in the ticket**, each entry
   marked: *record it* (the extractor should carry it), *deliberately not
   recorded* (with the reason, as REQ-73 does for band padding), or *not
   expressible in L1* (which makes it a capability item, not an instrument one).
4. **Whatever comes out of (3) marked "record it" is landed**, and each lands as
   a `CAPTURE_SCHEMA_AXES` row so the staleness message names it for every older
   bundle. `CAPTURE_SCHEMA` bumps once, not five times.
5. **The probe is a command, not a one-off script.** It will be worth re-running
   the next time the reproduction reaches a new class of site, and a script that
   lived only in a transcript will not be there.

## Why now

The alternative is finding the sixth, seventh and eighth lossy axis at $7 each,
across rounds that also spend their budget re-confirming residuals a frozen
bundle cannot clear. This is the single highest-leverage unfiled item in the
epic's instrument half.

## Acceptance

- A command reports, for a reference bundle, the properties its page uses that
  its `capture.json` does not carry.
- It is run over all three stored references and the combined list appears in
  this ticket's body, triaged.
- Every entry triaged *record it* is carried by the extractor, has a
  `CAPTURE_SCHEMA_AXES` row, and is visible to `staleCaptureDetail`.
- Entries triaged *deliberately not recorded* carry their reason in the code
  beside the decision, the way REQ-73's band-padding note does.

## Not in scope

Comparing the two sides of a diff — that is the one-projection ticket. This is
about whether the reference side has the value at all.


---

# What landed

## The command

`1c capture audit <bundleName> | --all [--json]`.

It takes a **stored bundle, not a URL**, and serves it offline over an ephemeral
loopback origin. The bundle's `rendered.html` IS the DOM its `capture.json` was
extracted from, so the two sides of the comparison are the same page by
construction; pointing the probe at the live site would report the site's own
drift since capture as an instrument gap. The loopback server is `reextract`'s
own, factored out as `serveBundle` rather than duplicated — a second
`createServer` would be a second answer to "what is this bundle's origin".

**What "the page uses this property" means** is decided from the page, never
from a list: a longhand is in use when a rule declaring it matches a *visible*
element, plus whatever visible elements carry inline. Shorthands are expanded by
the engine itself (set on a scratch element, read back) so the expansion cannot
drift from the browser's. Dynamic pseudo-classes are stripped before matching, so
a `:hover` treatment is attributed to the element it decorates instead of
silently vanishing. CSS-wide keywords (`initial`/`inherit`/`unset`/`revert`) are
not use — they ask for the value the property would have had anyway. Custom
properties are not use — they reach the page only through the longhand that
consumes them. DOM attributes are enumerated beside the CSS, because `href`, a
control's `name` and a form's `method` are page truths no computed style holds.

## The register — and why the probe pays for itself on the second run

`tools/generate/src/cli/capture/coverage.ts` records, for every property the
corpus uses, **what was decided about it and why**. Nothing reads it to decide
what to look for — the page decides that. It is read only to answer "and what did
we decide about this one?", so the report is exactly the properties nothing has
an answer for. A re-run on a site of a new class therefore surfaces only what is
genuinely new, instead of re-triaging 175 longhands every time.

Three verdicts, and the difference is whose problem it is: `recorded` (the
extractor carries it), `declined` (deliberately not carried, reason beside the
decision, in the shape REQ-73's band-padding note set), `not-expressible` (a
capability item — an L1 axis — not an instrument one).

## The triage — run over all three stored references

`faelan.com` (22 visible elements, 77 properties in use), `gigabytealchemy.ai`
(108 / 85), `joyfulculinarycreations.com` (424 / 175). 113 distinct properties
reached a bucket below; the remainder are recorded axes this corpus demonstrably
carries.

**UNTRIAGED: none.** Every property and DOM fact the three references use now has
a decision recorded against it. That is the state the register is supposed to
reach, and a re-run that reports a row is reporting something genuinely new.

### record it — landed (4)

All four are DOM facts, and that the CSS half came back empty is a result rather
than a coincidence: REQ-47/48/63/265/269 have swept the paint surface repeatedly,
so what was left uncovered was the half **no pixel gate can see**.

| property | now recorded as | why it matters |
|---|---|---|
| `dom:target` (×4, faelan + joyful) | `newTab` on a linked run or field | a footer whose outbound links all open in place is wrong with a perfect pixel score. Stored as the derived boolean L1 carries, not the raw `target`: `_self`/`_parent`/`_top`/a named frame all mean the same thing to a reproduction that has no frames |
| `dom:name` (×3, gigabytealchemy) | `controlName` on a form control | without it the fold slugifies the visible label to invent a key, and posts `your-email` where the reference's handler expects `email` |
| `dom:method` (×1, gigabytealchemy) | `formMethod` on a form control | the other half of REQ-93's `formAction`: the right endpoint reached by the wrong verb puts every answer in the URL and loses the submission |
| `dom:required` (×3, gigabytealchemy) | `required` on a form control | the obligation the browser itself enforces; `aria-required` counts too. A required field reproduced optional has no painted trace at all |

`CAPTURE_SCHEMA` bumps **3 → 4 once for all four**, which is the point — every
earlier number on that list was paid for by a round that found a single axis the
expensive way. Each is a `CAPTURE_SCHEMA_AXES` row, so `staleCaptureDetail` names
it for every older bundle; all three stored references are at schema 1 and are
now told about all nine axes they are behind on, by name, in one sentence.

### recorded already, absent from a given bundle (9 more)

`dom:href`, `opacity`, `vertical-align`, `list-style-type`, `text-decoration-line`,
`font-variant-caps`, `mix-blend-mode`, `box-shadow`, `filter`. Reported as
*candidate* loss, never as fact — a rule can match an element the capture does not
model, so "no run carries a text-shadow" means "no run we modelled had one". A
bundle that visibly carries the axis is never accused of losing it, the same
asymmetry REQ-270's `present` runs on.

### deliberately not recorded (71)

Grouped by the reason, which lives beside the decision in `coverage.ts`. The
register's groups are wider than this corpus — only the properties the three
references actually used are listed here:

- **layout mechanism, not a rendered fact** (DOC-13 §3) — `display`, `position`,
  `width`, `height`, every `margin-*`, `top`/`right`/`bottom`/`left` and the
  logical `inset-*`, the whole flex/grid axis set, `max-width`, `min-height`,
  `box-sizing`, `order`, `clear`, `widows`/`orphans`, `break-*`, `visibility`.
  The extractor records the box the page laid out, so two DOMs that lay out
  identically project identically; transcribing the mechanism would make the same
  rendering compare as two.
- **text wrapping is measured, not transcribed** — `text-wrap-mode`,
  `white-space-collapse`, `word-break`, `overflow-wrap`. REQ-88 derives
  `nowrapFromPx` from whether the reference held the run on one line at every
  captured width. A declaration says what the author asked for; the ladder says
  what the page did.
- **rasteriser hint** — `-webkit-font-smoothing`, `text-rendering`,
  `font-kerning`, `font-optical-sizing`, `font-size-adjust`,
  `font-language-override`, `backface-visibility`, `will-change`. Same glyphs,
  different antialiasing; the gate compares layout boxes precisely because
  subpixel coverage differs per engine anyway.
- **interaction affordance, not paint** — `cursor`, `appearance`, `touch-action`,
  `resize`, `-webkit-tap-highlight-color`. Derived from the node role a
  reproduction folds to, not transcribed.
- **loading hint** — `dom:loading`, `dom:decoding`, `dom:fetchpriority`,
  `dom:srcset`, `dom:sizes`. Changes when bytes arrive, never what is painted;
  a reproduction makes its own delivery decisions (REQ-234).
- **page script** — `dom:onmouseover`, `dom:onmouseout`. A
  reproduction mounts behaviour through a vetted capability module; transcribing
  the reference's script is barred by the structured-only invariant, not by a
  capture limitation.
- **framework bookkeeping** — `dom:data-*` (×333, collapsed to one row). Names
  the tool that built the page, not anything the page renders.
- **sizing/ordering mechanisms with a measured outcome** — `dom:rows` (the
  measured `box` carries the height it produced), `dom:tabindex` (focus order is
  document order in a reproduction).

### not expressible in L1 — capability items, not instrument ones (29)

These are the probe's *other* product: things the corpus demonstrably uses that
recording would not help, because nothing downstream could consume the value.
They belong to the epic's capability half.

- **background framing** — `background-size`, `background-position-x/y`,
  `background-repeat`, `background-attachment`, `background-origin`. L1 pins a
  surface's background to `cover / center / no-repeat` (BUG-13); REQ-136 already
  records unpinning it as phase 2.
- **no vector leaf** — `fill`, `stroke`. `<svg>` is not in the field selector and
  L1 has no vector kind, so an inline icon reaches a reproduction as nothing at
  all. Its paint is the second problem, not the first.
- **no ARIA axis** beyond the folded role and `link.ariaLabel` — `dom:aria-hidden`,
  `aria-current`, `aria-live`, `aria-controls`, `aria-roledescription`.
- **glyph-selection axes** — the `font-variant-*` family other than
  `font-variant-caps` (which is recorded), plus `font-feature-settings`,
  `font-variation-settings`, `font-stretch`, `-webkit-text-stroke-color`.
- **no clipping axis** — `overflow-x/y`, `clip`. A `mask` is paint and is
  recorded; `overflow: hidden` is a containment rule a flat absolutely-positioned
  tree has no vocabulary for.
- **no decoration detail** — `text-underline-offset`. `textDecoration` is a closed
  enum of lines with no colour, style, thickness or offset.
- **no word-spacing axis** — `word-spacing`. `letterSpacingPx` has no companion.
- **one writing mode** — `direction`. RTL/vertical flow is a substrate capability
  no reference has yet needed.

## Evidence

`tests/test_UAT_FC_REQ-275_capture_completeness_audit.test.ts`, 8 UATs. Five run
with no browser and pin the triage, the register's integrity (every entry states
its reason; a `declined`/`not-expressible` note must actually reason, not merely
label), the one-bump-for-four invariant, and the cross-bundle combine. Three
drive a **real headless Chromium** against a committed fixture
(`tests/fixtures/capture/req275-completeness.html`) through the whole command
path — capture to a bundle, then audit that bundle — and skip cleanly where no
browser can launch. They prove an undecided property (`tab-size`) surfaces from a
real page without anyone having thought to look for it, that the four new axes
reach `capture.json` with the right values, and that a bundle the current
extractor took is reported as carrying them rather than losing them.