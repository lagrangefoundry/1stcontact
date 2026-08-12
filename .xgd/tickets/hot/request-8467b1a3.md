---
uid: request-8467b1a3
id: REQ-133
type: request
title: 'Palette popup: display, pick and edit the site''s colors'
created_by: xgd
created_at: '2026-08-12T00:39:22.220242+00:00'
updated_at: '2026-08-12T01:43:54.386684+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

# Palette popup: display, pick and edit the site's colors

**A component, not a screen.** One popup surface that shows the site's palette, returns a
chosen color to whoever opened it, and lets the palette itself be edited in place.

Consumed by **[[REQ-135]]** (text properties), whose color field opens this to pick a value.
Builds on **[[REQ-114]]** (the L1 palette color model, landed) and **revises its step model**
(§2). Design: [[DOC-28]] §8, [[DOC-23]] §5.

## Status: design agreed in outline — open questions in §8

---

## 1. What it is

A popup, invoked from two kinds of place:

- **Manage** — a **Colors** button in the builder toolbar. No caller is waiting for a value;
  the user is here to change the palette.
- **Pick** — a color field that needs a value (REQ-135's text color, panel background).
  The popup returns a palette reference to its opener.

**Both entry points open the same surface.** Picking and editing live together deliberately:
"this color is nearly right" is then a one-gesture fix rather than a hunt for a different
screen. In pick mode the surface additionally resolves to a selection; nothing else differs.

It is **not** a display-panel mode. Other entry points may follow (an inline swatch, a
right-click); each is a new caller of the same component, not a new copy of it.

## 2. The model change: shade moves to the reference, `steps` is deleted

**Decided.** A palette entry becomes **one color**. The light↔dark family is not stored;
it is *generated* from the entry, and the position within it is carried by the **reference**.

### Why

This is the argument [[DOC-23]] §5.4 already made about `alpha`, one axis over. Alpha lives
on the reference precisely because an entry that carried it would make one conceptual color
occupy N entries, and the entry would stop being the unit of change. Named steps are that
same mistake: `primary`, `primary/500` and `primary/700` are three stored hexes that nothing
keeps related, so changing "the brand teal" today repaints 40 references and leaves 20 on the
old color. With shade on the reference, **changing the entry moves the whole family by
construction.**

The user consequence is the point: the operator never edits a shade directly. They pick an
entry and move a **light↔dark slider**; the palette editor exposes only real colors.

### Shape

- **Entry**: `{ value: "#rrggbb" }`. `steps` is **deleted** — no legacy mode, no dual path.
- **Reference**: `{ ref, shade?, alpha? }`. `shade` is a signed scalar on `[-1, +1]`:
  negative mixes the entry toward black, positive toward white, **in Oklab**, so the axis is
  perceptually even and the slider is linear in the thing the eye sees. `0` (or absent) is
  the entry itself.
- `shade` and `alpha` are independent axes on the same reference, which is what they are.

### Measured consequences for the existing sites

Every current step was fitted to its best Oklab tint/shade mix from its base:

- **15 of 22 reproduce within 1–8 bytes of 255** — invisible. All of `text`, `sand`,
  `surface`, most of `slate`, `primary/700`, `green/700`, `green/800`.
- **7 fail hard**, all for one reason: **a tint/shade mix can only reduce chroma, and these
  are more saturated than their base.** `amber/500` `#ffb900` vs base `#f5e6a3` — 101 bytes.
  `blue/500` `#1447e6` vs base `#90a1b9` — 89. Also `blue/300`, `blue/400`, `orange/400`,
  `green/600`, `primary/500`.

Those seven are **not shades of anything** — they are distinct colors that REQ-114's
hue-based family grouping filed under one name. Under this model each becomes **its own
entry**, which is more honest than the current grouping and costs nothing: they stay exact
literals.

**So the retrofit is re-run, and it is no longer pixel-identical.** The residual is bounded
and measured: ≤8/255 on the 15 genuine ramp members, zero on everything else. This is a
deliberate, one-time, operator-approved revision of [[REQ-114]] AC3, reported as a
before/after values-diff rather than assumed.

### What this touches

- `packages/site-schema/src/l1/palette.ts` — drop `steps` from the entry schema, add `shade`
  to the reference, implement the Oklab mix in `resolveL1Color`.
- `tools/generate/src/cli/colors.ts` — `groupIntoFamilies` / `toEntry` / `derivePalette`
  currently emit steps; they emit entries + shades, and stop grouping members a mix cannot
  reach.
- `storage/sites/{xgd,gigabytealchemy}` — re-retrofitted.

## 3. What the popup displays

The site's `palette`: named entries, one color each.

- **One swatch per entry**, labeled with its name and its **usage count** across the site's
  pages. The count is the single most useful fact in a palette editor — "primary, used 40
  times" is what makes an edit predictable — and the delete rule (§5c) is stated in it.
- Selecting an entry reveals the **shade slider** with a live preview of the color at the
  current position.

Measured today: `xgd` 6 entries / 210 refs, `gigabytealchemy` 8 entries / 91 refs,
`1stcontact` and `harbor-cafe` 0 entries (all literals). **An empty palette is a legitimate
state**, so the surface reads as "no colors yet, add one" rather than as broken.
Bootstrapping from a folded site's literals already exists as `1c colors <slug> --assign`
and is not rebuilt here.

## 4. Picking

Returns a **palette reference** — `{ ref }` or `{ ref, shade }` — to the opener. Never a hex.

The caller writes it into whatever axis it owns; this component never touches a page. That
is the boundary with REQ-135: this ticket delivers the picker and its contract, REQ-135
wires it to `axes.color`.

`alpha` is not offered. It is an independent axis and belongs to a different conversation.

## 5. Editing

**(a) Change a color.** Free hex entry on an entry's `value`. One write, and **every
reference follows — including every shade of it**, which is what §2 buys. Free hex lives
*here and only here*: from a segment a user can only pick from the palette ([[DOC-28]] §8),
which is what bounds the incoherence risk.

**(b) Add a color.** A new entry: a kebab-case name plus a hex.

**(c) Delete — restricted.** *Agreed.*

- **Zero references → delete is allowed.** Nothing can dangle.
- **One or more references → refused, naming the count.** Deleting an in-use entry means
  deciding what each use becomes (repoint, or inline the hex as a literal); that is a
  product decision, not something a swatch's ✕ may take silently.
- References at *any* shade count toward the total — with §2 there is no longer a separate
  per-step tally, which makes the rule simpler than it was.

The unsafe half stays with the AI, which can already do it (`set_l1` + `set_config`) and can
talk it through first. Better than no deletion, and better than a confirm dialog that quietly
breaks forty places.

**Rename is out of V1.** Renaming `primary` orphans every reference to it unless the rename
rewrites them all — a real operation, but a different one from changing a color.

## 6. The data path

Reads and writes go through the **single write path** (`tools/generate/src/cli/edit.ts`), as
every other editor surface does — so the CLI, the AI and the popup cannot leave the store in
different states after the same edit ([[DOC-8]] §7).

- **Read** — the palette plus per-entry usage counts. The census walks every page with
  `collectL1PaletteRefs` (already in `site-schema/src/l1/palette.ts`), so counting is
  structural rather than a hand-listed tour of the color axes.
- **Write** — set an entry's value, add an entry, delete an entry. The delete guard is
  enforced **server-side**, not in the popup: a client holding a stale count must not be able
  to orphan a reference.
- A palette write re-renders **both** channels before answering, exactly as `/api/copy` does
  — a color change alters the page, not one rendering of it.

`editConfigSet` can already write a palette by merge, but merge cannot *remove* a key and
nothing today exposes the reference census, so the delete rule has no home on that surface.

## 7. Implementation notes

- `webui-fields` already ships the hex control this needs (`string + format:'color'` — swatch
  plus hex entry). The shade slider is new and belongs to this repo, not upstream: it is
  meaningless without a palette entry to be relative to.
- The existing segment modal (`builder-modal` in `apps/control-app/src/builder/editor.js`)
  hand-rolls its own backdrop, Escape handling, close and shell-rooted host. The palette
  popup needs the identical shell with different contents, so that shell is extracted into
  one module both use rather than copied.
- The toolbar renders one control per registered action already; **Colors** is one more
  action spec, not a branch.

## 8. Open questions

1. **Split this ticket?** §2 (schema change + re-retrofit of two sites + the census tooling)
   and §3–§7 (the popup) are separable, and §2 alone is comparable in size to REQ-114's
   13 points. Recommended: split, with the popup depending on the model.
2. `1c palette` as its own command group + `/api/palette`, or read via `config get` / write
   via `config set` with only delete added? (Recommended: its own group — it puts the guard,
   the counts and the writes in one place and gives the AI a usage read it lacks.)
3. Confirm rename stays out of V1 (§5).
4. The shade slider's granularity — continuous, or a small number of detents? Continuous is
   simpler and matches "linear spectrum"; detents make two segments easier to match by eye.

## 9. Acceptance criteria

*(to be finalized once §8 closes)*

1. A palette entry holds a single color; `steps` no longer exists in the schema, and no
   site.json carries one.
2. A reference may carry `shade` on `[-1, +1]`, resolving as an Oklab mix toward black or
   white; `0`/absent resolves to the entry's own hex.
3. `xgd` and `gigabytealchemy` are re-retrofitted onto the new model, with the before/after
   values-diff reported: zero delta except on the members re-expressed as shades, each within
   the measured bound.
4. A step that a mix cannot reach (more saturated than its base) becomes its own entry and
   renders byte-identically.
5. A popup opened from the toolbar shows every entry as a swatch, labeled with its name and
   its usage count across the site's pages.
6. A site with an empty palette opens the popup in a state that offers to add a color.
7. Opened in pick mode, choosing an entry and a shade resolves to a palette reference and
   closes; canceling resolves to nothing and changes no state.
8. Changing an entry's hex changes the rendered page everywhere that color was used **at
   every shade**, from one edit.
9. Adding an entry with a kebab-case name and a hex makes it immediately pickable.
10. Deleting an entry with zero references succeeds; deleting one with references is refused
    with the count, enforced server-side against a stale client.
11. A palette write re-renders both the draft and edit channels before it answers.
12. Free hex entry exists only in this surface; no segment field accepts one.
13. Full suite green, clean `pnpm -r build`.

## Origin

Operator request, this session: an interface that displays the palette, lets a color be
chosen from it, and lets the palette be edited. The step→shade model change (§2) is the
operator's, taken in this session after measuring that the stored steps are unrelated to
their bases. [[DOC-28]] §8 phase 2; unblocks [[REQ-135]].
