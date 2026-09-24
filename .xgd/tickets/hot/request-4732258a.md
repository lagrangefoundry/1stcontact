---
uid: request-4732258a
id: REQ-314
type: request
title: 'The editor font control: 30 curated faces, and a query box that reaches all
  1,941'
created_by: EPIC-21
created_at: '2026-09-23T03:19:38.760798+00:00'
updated_at: '2026-09-24T18:00:34.694758+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: low
  epic_parent: epic-b9b27697
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-c8fb9044
  commits:
  - working_sha: 00ae98e652a42325e936cfd16429cb21c614148c
    reconcile_sha: null
    main_sha: null
  version: 0.2.348
  story_points: 8
---

## The gap

[[REQ-312]] mirrors 1,941 families. A `<select>` listing all of them is unusable for a
person — scrolling a list that long is not choosing. But a shortlist that is the *only*
way in is worse in a different direction: it tells a web developer who knows exactly what
they want that we do not have it, when we do.

## Operator direction (2026-09-22)

> "Ship everything for the AI — for the human drop down in the editor we choose a curated
> list of <100."

> "If I have a web developer come in and they really know what font they need, and we have
> it, I do not want our UX to prevent them from accessing it."

## The interaction model

One control, two states, no mode switch.

**Closed / empty query — the curated default.** The dropdown shows roughly **30 favourite
families**, each **written in its own face**. A font control that names fonts in a UI font
is asking someone to choose a typeface from a list of words, which is not how anybody
picks type.

**Typing — the whole mirror.** A text box sits at the **top of the dropdown**. Typing
`Ar` replaces the curated 30 with the **top 30 families matching `Ar`, alphabetically** —
Archivo, Arimo, Arsenal, Arvo, and so on. The curated list is the empty-query state and
nothing more.

**Search results are listed in the UI face, not their own** (operator direction,
2026-09-22): *"I only want to render the curated list in fonts — if you go looking by name
you need to know what you are looking for."* Someone typing `Archivo` is committed to
Archivo; the preview earns its cost in browse mode, not lookup mode.

**The selected family is rendered in its own face on the closed control**, however it was
chosen. That face is already loaded — it is applied to the page — so it costs nothing.

**The search reaches the entire mirror, not the shortlist.** That is the point of the
control. There is no "advanced" toggle, no second screen, no preference to find: typing is
the only gesture, and it is available the moment the dropdown opens.

### Matching

- **Word-prefix match**: a family matches when *any word* of its name begins with the
  query. `Ar` → Archivo, Arimo, Arvo. `Mono` → Roboto Mono, JetBrains Mono, Space Mono.
  `Sans` → Open Sans, DM Sans, Noto Sans.

  This keeps strict-prefix predictability — no surprising mid-word hits — while matching
  how people type a distinguishing word. Plain string-prefix would answer `mono` with
  nothing, which is the common case rather than an edge one.
- **Case-insensitive**, and tolerant of spacing — `playfair` matches `Playfair Display`.
- **Alphabetical** order when a query is present. Popularity orders the curated default; it
  does not order results, because someone typing a name is looking for a specific family
  rather than a popular one.
- **Capped at 30**, with the cap made visible when more match — a silent truncation reads
  as "that is all there is".

### Category chips

One row of six toggles, from data the catalogue already carries: **Sans Serif, Serif, Slab
Serif, Display, Handwriting, Monospace**. They narrow whichever list is showing — curated
or query results.

"Show me the serifs" is the dominant browse intent and this is the whole of it.

**Deliberately excluded**, to keep a font picker from becoming a query builder: variable-axis
filter, weight-availability filter, script/subset filter, popularity-sort toggle, fuzzy
matching. The script filter is the first to revisit if a non-Latin site needs it.

### When nothing matches

Distinguish **"no such family"** from **"we do not carry that one"**. A developer typing
`Helvetica` or `Proxima Nova` has asked a reasonable question and an empty list answers it
misleadingly. Where the name is a known commercial family, say that it cannot be served
because commercial webfont licences are per-licensee and cannot be shared across customer
sites, and point at the upload path where they supply their own and attest to the licence.

The list of known-but-unavailable families is a small, explicitly maintained set — it is
not derivable from the catalogue, which by construction contains only what we *do* carry.

## Rendering previews — bounded by construction

Previews are confined to the fixed curated 30, which bounds this entirely.

- **A known, fixed set** — roughly 1–1.5MB of unmodified upstream `woff2`, cacheable across
  sessions and, because platform fonts are shared-served ([[REQ-312]]), across tenants.
  First open pays; every later one does not.
- **No per-keystroke font loading.** Results render in the UI face, so typing fetches
  nothing. The debounce-and-fetch-storm problem does not arise.
- **Load only visible rows**, and **never block on a preview** — `font-display: swap`, so a
  row renders in a fallback immediately and upgrades when its face arrives.

**This closes an open question rather than deferring it.** An earlier draft weighed
name-only preview subsets against full faces, because per-query previews needed to be
cheap — and subsetting is arguably modification under OFL's Reserved Font Name clause,
which [[REQ-312]] avoids by mirroring unmodified upstream `woff2`. With previews confined
to a cached fixed set, **full upstream faces are affordable and the subsetting question
does not arise.** The mirror stays unmodified.

## Selection of the curated 30

Cover the range a small-business site actually needs rather than the 30 most popular, which
skew heavily to a handful of sans faces:

- text faces that set long copy well, serif and sans
- display faces with enough weight range to carry a wordmark
- at least one credible monospace
- enough stylistic spread that two sites built from the default list do not look alike

Every entry comes from the mirror, so nothing here needs its own licence decision.

## It is an affordance, never a gate

The shortlist narrows **what is shown first to a human**. It does not narrow what may be
used. It has no effect on the assistant, which addresses the full mirror through
[[DOC-56]] and [[REQ-313]]'s `use_font`, and does not read this list.

## Behaviour

- Opening the control with an empty query shows roughly 30 curated families, each rendered
  in its own face.
- The query box is present and focusable as soon as the dropdown opens — reaching the full
  mirror takes no discovery.
- Typing `Ar` replaces the curated list with up to 30 families matching `Ar`, alphabetically.
- Query results are listed in the UI face, not in their own faces.
- Word-prefix matching: `Mono` returns Roboto Mono, JetBrains Mono and Space Mono; `Ar`
  returns Archivo, Arimo and Arvo but not Cardo.
- Matching is case-insensitive and space-tolerant: `playfair` finds `Playfair Display`.
- Clearing the query restores the curated 30, rendered in their own faces.
- A family in the mirror but outside the shortlist is selectable through the query box.
- When more than 30 families match, the control says so rather than silently truncating.
- A query matching a known commercial family that we cannot serve explains why and points
  at the upload path, rather than showing an empty list.
- A category chip narrows whichever list is showing; chips combine with a query.
- The closed control renders the selected family in its own face, however it was chosen.
- A curated row renders in a fallback face immediately and upgrades when its own face
  loads; the control never blocks on a preview.
- Only faces for visible curated rows are fetched. Typing fetches no faces.
- Choosing a family binds it by the same path `use_font` uses — one binding mechanism, not
  two.
- The shortlist has no effect on what the assistant may choose.

## Priority

Lower than [[REQ-311]], [[REQ-312]] and [[REQ-313]]. Those three unblock the assistant,
which is what the Lagrange Foundry site and the beta need. This one improves a human
surface that has no fonts to show until the mirror exists.
---

## Implementation — decisions taken while building (2026-09-24)

### Six chips are derivable after all, from `stroke`

The brief said the six chips come "from data the catalogue already carries", and
the projection the assistant reads (`platform-fonts.json`) carries only
`category`, which has five values — no Slab Serif. The catalogue itself carries
a second field, `stroke`, and 30 families declare `stroke: "Slab Serif"`. So the
sixth chip is real data, one join away.

`1c fonts index` now carries a `slab` flag onto the family it projects, derived
from that field. It is one boolean on a generated artifact rather than a second
artifact, for the reason the projection already states about itself: one
generated file cannot disagree with itself, two can.

All 30 slab families are classified `Serif`, so **Slab Serif is a refinement of
Serif, not a sibling**: the Serif chip shows slabs too. Hiding Roboto Slab from
"Serif" because a narrower chip exists would be a lie about what Roboto Slab is.

### Where the corpus reaches the browser

One request, not one per keystroke. `GET /api/fonts` answers the whole browse
corpus once — every family's name, its category and its slab flag, the curated
rows with the mirror path of the face that previews them, and the
known-but-unserved list. Roughly 70KB uncompressed, fetched lazily the first
time a dropdown opens and held for the session.

**Matching happens in the browser**, which is what makes typing instant and what
keeps the origin out of a debounce loop. It is one rule in one module
(`font-search.js`) with one consumer, rather than a rule split across a client
that draws and an origin that filters.

A STALE CORPUS CANNOT PRODUCE A BAD WRITE, which is the difference from the
Library's catalogue and the reason this one is allowed to travel separately from
the descriptors. The mirror is a build artifact; the write side resolves the
chosen family against the same index server-side and refuses an unknown one with
a sentence. The worst a stale list can do is offer a family that has since been
dropped, and the answer to choosing it is a clean refusal rather than a bad page.

### The corpus the Node builder serves is the workspace's own

`RouterDeps.fontIndex` joins `platformFonts` as an injected reader. Deployed it
is the projection the bundle carries; in the `1c` builder it is
`buildIndex(cwd)` over the workspace's own `fonts/platform.json` — which is
where that transport already reads preview font BYTES from. The two have to
agree about what is mirrored, and reading them from one place is how.

### Binding goes through `use_font`'s own resolver

`editCopySet` intercepts a `fontFamily` change before the node is touched:
`resolveFont` resolves the family against the same index, `mergeFontFaces`
merges the faces into the page's own `resources.fonts`, and only then does
`applyCopyFields` write the paintable stack onto the run's `axes.fontFamily`.
Both functions are `use_font`'s, imported rather than restated — so a family a
page already serves from its own files is refused here in the same sentence, and
choosing a family the page already paints writes nothing.

The weights bound are the family's defaults plus the run's own current weight,
and italic is bound when the run is already italic and the family ships one —
so choosing a family never silently re-weights or de-italicises the words.

### The face a preview row is drawn in resolves at the preview's own root

The dropdown composes `_fonts/<path>` against the preview iframe's `baseURI`,
which is the same root the page's own faces resolve at. No new serving route,
no second spelling, and a preview face that resolves is proof the page's will.

### What is not built

- **`1c fonts check` does not gain a shortlist rule.** The rot guard is a UAT
  against `fonts/catalogue.json`, which is committed and therefore runs in CI on
  a checkout with no mirror; widening the check report would put the same
  guarantee somewhere it only runs when a mirror happens to be populated.
- **The unserved list carries open substitutes** (`Helvetica → Arimo`,
  `Times New Roman → Tinos`…) beyond what the brief asked for. A developer told
  only "we cannot serve that" has to go looking; told "we cannot serve that, and
  the metric-compatible open face is Arimo" they are done.

## Behaviour — additions to the list above

- Selecting a family in a run's editor binds its faces to that page's
  `resources.fonts` and paints the run in it, in one Save.
- Selecting the family the run already uses writes nothing.
- Selecting a family the page already serves from its own uploaded files is
  refused with the reason, rather than repointed at the platform's bytes.
- The corpus the control offers is the one the deployment actually serves: a
  checkout with no mirror offers nothing and says so, rather than listing
  families whose bytes do not exist.
- Every curated family resolves to a family the catalogue carries.
- The Serif chip includes slab serifs; the Slab Serif chip narrows to them.