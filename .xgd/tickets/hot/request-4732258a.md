---
uid: request-4732258a
id: REQ-314
type: request
title: 'The editor font control: 30 curated faces, and a query box that reaches all
  1,941'
created_by: EPIC-21
created_at: '2026-09-23T03:19:38.760798+00:00'
updated_at: '2026-09-23T18:07:00.605172+00:00'
completed_at: null
last_field_updated: title
status: draft
fields:
  priority: low
  epic_parent: epic-b9b27697
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-c8fb9044
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
`Ar` replaces the curated 30 with the **top 30 families beginning with `Ar`, alphabetically**
— Archivo, Arimo, Arsenal, Arvo, and so on — each again rendered in its own face. The
curated list is the empty-query state and nothing more.

**The search reaches the entire mirror, not the shortlist.** That is the point of the
control. There is no "advanced" toggle, no second screen, no preference to find: typing is
the only gesture, and it is available the moment the dropdown opens.

### Matching

- **Prefix match on the family name**, as directed. `Ar` → families starting `Ar`.
- **Case-insensitive**, and tolerant of spacing — `playfair` matches `Playfair Display`.
- **Alphabetical** order when a query is present. Popularity orders the curated default;
  it does not order search results, because someone typing a prefix is looking for a
  specific name rather than a popular one.
- **Capped at 30**, with the cap made visible when more match — a silent truncation reads
  as "that is all there is".

### When nothing matches

Distinguish **"no such family"** from **"we do not carry that one"**. A developer typing
`Helvetica` or `Proxima Nova` has asked a reasonable question and an empty list answers it
misleadingly. Where the name is a known commercial family, say that it cannot be served
because commercial webfont licences are per-licensee and cannot be shared across customer
sites, and point at the upload path where they supply their own and attest to the licence.

The list of known-but-unavailable families is a small, explicitly maintained set — it is
not derivable from the catalogue, which by construction contains only what we *do* carry.

## Rendering names in their own face — the real constraint

Thirty families rendered in thirty faces means loading thirty fonts, and another thirty on
each search. At unmodified upstream `woff2` that is roughly 1–2.5MB per list.

- **Load only what is visible.** Rows fetch their face as they scroll into view rather than
  the whole list at once; a dropdown showing eight rows loads eight fonts.
- **Never block on a preview.** `font-display: swap` or `optional`, so a row renders in a
  fallback immediately and upgrades when its face arrives. A font control that stalls while
  previewing is worse than one that previews late.
- **Debounce the query** so typing `Archivo` does not fetch six successive result sets.

**Open decision — preview subsets.** A name-only subset would be ~1–3KB against a 30–80KB
full face, which is the difference between a snappy control and a slow one. But [[REQ-312]]
deliberately mirrors **unmodified upstream `woff2`** to stay clear of OFL's Reserved Font
Name clause, and subsetting is arguably modification. Three ways out, to be chosen
knowingly rather than by accident:

1. Full upstream faces, lazily loaded — no licence question, more bytes.
2. Generated name-only preview subsets — fast, but reopens the RFN question [[REQ-312]]
   closed.
3. Server-rendered name images — no font loading in the browser at all, but new
   infrastructure and a second rendering path to keep true to the mirror.

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
- Typing `Ar` replaces the curated list with up to 30 families whose names begin with `Ar`,
  in alphabetical order, each rendered in its own face.
- Matching is case-insensitive and space-tolerant: `playfair` finds `Playfair Display`.
- Clearing the query restores the curated 30.
- A family in the mirror but outside the shortlist is selectable through the query box.
- When more than 30 families match, the control says so rather than silently truncating.
- A query matching a known commercial family that we cannot serve explains why and points
  at the upload path, rather than showing an empty list.
- A row renders in a fallback face immediately and upgrades when its own face loads; the
  control never blocks on a preview.
- Only faces for visible rows are fetched.
- Choosing a family binds it by the same path `use_font` uses — one binding mechanism, not
  two.
- The shortlist has no effect on what the assistant may choose.

## Priority

Lower than [[REQ-311]], [[REQ-312]] and [[REQ-313]]. Those three unblock the assistant,
which is what the Lagrange Foundry site and the beta need. This one improves a human
surface that has no fonts to show until the mirror exists.
