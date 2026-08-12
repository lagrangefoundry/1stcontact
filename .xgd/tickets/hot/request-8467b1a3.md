---
uid: request-8467b1a3
id: REQ-133
type: request
title: 'Palette popup: display, pick and edit the site''s colors'
created_by: xgd
created_at: '2026-08-12T00:39:22.220242+00:00'
updated_at: '2026-08-12T17:55:33.396324+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  depends_on:
  - REQ-137
---

# Palette popup: display, pick and edit the site's colors

**A component, not a screen.** One popup surface that shows the site's palette, returns a
chosen color to whoever opened it, and lets the palette itself be edited in place.

**Depends on [[REQ-137]]** — the model change (entry = one color, `shade` on the reference,
`steps` deleted) was split out of this ticket's §2 and must land first: the slider has nothing
to write until `shade` exists, and "one entry, one color" is false while `steps` does.

Consumed by **[[REQ-135]]** (text properties), whose color field opens this to pick a value.
Builds on **[[REQ-114]]** (the L1 palette color model, landed). Design: [[DOC-28]] §8,
[[DOC-23]] §5.

## Status: design settled — ready to implement once [[REQ-137]] lands

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

## 2. The model it sits on — see [[REQ-137]]

Split out of this ticket. In short: an entry is one color, and a reference carries a
continuous `shade` on `[-1, +1]` resolved as an Oklab mix toward black or white. Changing an
entry therefore moves its whole light↔dark family, which is what makes §5(a) a single edit.
The operator never edits a shade directly — the palette holds only real colors, and position
within a family is a slider on the *use*, not a stored sibling.

## 3. What the popup displays

The site's `palette`: named entries, one color each.

- **One swatch per entry**, labeled with its name and its **usage count** across the site's
  pages. The count is the single most useful fact in a palette editor — "primary, used 40
  times" is what makes an edit predictable — and both the delete rule (§5c) and the rename
  confirmation (§5d) are stated in it.
- Selecting an entry reveals the **shade slider** with a live preview of the color at the
  current position. **The slider is continuous** — it matches "a linear spectrum", and it is
  the simpler control. The cost is accepted and recorded: two segments cannot reliably be
  matched to the same shade by eye, so "make these two the same" is an AI request rather than
  a slider skill.

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
reference follows — at every shade**, which is what [[REQ-137]] buys. Free hex lives *here
and only here*: from a segment a user can only pick from the palette ([[DOC-28]] §8), which
is what bounds the incoherence risk.

**(b) Add a color.** A new entry: a kebab-case name plus a hex.

**(c) Delete — restricted.** *Agreed.*

- **Zero references → delete is allowed.** Nothing can dangle.
- **One or more references → refused, naming the count.** Deleting an in-use entry means
  deciding what each use becomes (repoint, or inline the hex as a literal); that is a
  product decision, not something a swatch's ✕ may take silently.
- References at *any* shade count toward the total — with [[REQ-137]] there is no longer a
  separate per-step tally, which makes the rule simpler than it was.

The unsafe half stays with the AI, which can already do it (`set_l1` + `set_config`) and can
talk it through first. Better than no deletion, and better than a confirm dialog that quietly
breaks forty places.

**(d) Rename — in V1, as a total rewrite.** *Agreed, revised this session.*

A reference names its entry by key, so renaming `primary` → `brand` either rewrites every
reference in the same write or orphans all of them. **It rewrites them.** The measured worst
case is `xgd`'s 210 references — mechanical, and cheap enough that the alternative (send the
operator to the AI for a spelling fix) is the worse trade.

- **Atomic.** The key in `palette` and every reference to it move together, or nothing moves.
  A partial rename is an invalid site — every orphan is a validation failure by
  [[DOC-23]] §6, not a silent fallback — so this cannot be two writes.
- **Refused on collision.** A new name that already exists would *merge* two entries, which is
  the same class of decision as deleting one in use: no correct default, so not a text field's
  call. Refused, naming the conflict.
- **Refused on a malformed name** — kebab-case, per `l1PaletteNameSchema`.
- **Enforced server-side**, like delete: a stale client must not be able to talk the store into
  a collision.
- **The count travels with it.** The popup names how many references the rename will rewrite
  before it does, from the same census the swatch label shows.

**Why this is allowed where delete is not.** Rename is *total and lossless* — every use has
exactly one correct new value and the system can compute it. Delete-with-references has no
correct default for any use; the answer differs per site, per page, per element. The rule is
about which decisions have a computable answer, not about how many references are involved.

## 6. The data path

Reads and writes go through the **single write path** (`tools/generate/src/cli/edit.ts`), as
every other editor surface does — so the CLI, the AI and the popup cannot leave the store in
different states after the same edit ([[DOC-8]] §7).

**Surface: `1c palette` as its own command group, with `/api/palette` beside it.** *Agreed.*
`editConfigSet` can already write a palette by merge, but merge cannot *remove* or *move* a
key, and nothing today exposes the reference census the delete and rename rules are written
in terms of. Its own group puts the guards, the counts and the writes in one place, and hands
the AI a usage read it does not have.

- **Read** — the palette plus per-entry usage counts.
- **Write** — set an entry's value, add an entry, delete an entry, **rename an entry**.
  The delete and rename guards are enforced **server-side**, not in the popup.
- A palette write re-renders **both** channels before answering, exactly as `/api/copy` does
  — a color change alters the page, not one rendering of it. Rename additionally rewrites the
  page files themselves, so this is not optional there.

**One structural walk, not three.** The census must count exactly the references the rename
rewrites, or the number shown and the work done can disagree. `collectL1PaletteRefs` and
`resolveL1Palette` (both in `site-schema/src/l1/palette.ts`) are already two hand-kept copies
of the same traversal; rename would be a third. They collapse into one
`mapL1PaletteRefs(input, fn)` — visit every reference structurally, return a replacement or
the original — with collect, resolve and rename expressed on top of it. Structural rather
than a hand-listed tour of the color axes, because `l1Color` is one alias used in a dozen
places and growing.

The walk covers **the site document and every page**, which is the scope `resolveL1Palette`
already runs at in `loadSite`. In practice references live in pages today; walking the
document is what keeps that true rather than assumed when a future axis lands elsewhere.

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

## 8. Decisions taken (this session)

1. **Split** — the model change is [[REQ-137]]; this ticket is the popup and depends on it.
2. **`1c palette` is its own command group**, with `/api/palette` beside it (§6).
3. **Rename is in V1**, as an atomic total rewrite of the key and every reference (§5d).
   *(Initially scoped out; revised after the rewrite was costed at 210 references worst case.)*
4. **The shade slider is continuous**, not detented (§3).

## 9. Acceptance criteria

1. A popup opened from the toolbar's **Colors** action shows every palette entry as a swatch,
   labeled with its name and its usage count across the site's pages.
2. A site with an empty palette opens the popup in a state that offers to add a color.
3. Selecting an entry reveals a continuous shade slider previewing the entry at the current
   position; the slider's range and resolution match [[REQ-137]]'s `shade`.
4. Opened in pick mode, choosing an entry and a shade resolves to a palette reference
   (`{ ref }` or `{ ref, shade }`, never a hex) and closes; canceling resolves to nothing and
   changes no state.
5. Changing an entry's hex changes the rendered page everywhere that color was used **at
   every shade**, from one edit.
6. Adding an entry with a kebab-case name and a hex makes it immediately pickable; a
   duplicate or malformed name is refused with a reason.
7. Deleting an entry with zero references succeeds; deleting one with references is refused
   naming the count, and the refusal is enforced server-side against a stale client.
8. Renaming an entry moves the key and rewrites every reference to it in one write; the site
   validates and renders byte-identically afterwards, and no reference to the old name
   survives anywhere in the document.
9. A rename onto an existing name, or onto a non-kebab-case name, is refused server-side and
   changes nothing — no partially-renamed state is reachable, including from a stale client.
10. The rename count the popup shows and the number of references rewritten come from the same
    structural walk, exercised on a site with references at multiple shades.
11. `1c palette` reads the palette with per-entry usage counts and performs all four writes;
    `/api/palette` exposes the same operations to the popup.
12. A palette write re-renders both the draft and edit channels before it answers.
13. Free hex entry exists only in this surface; no segment field accepts one.
14. Full suite green, clean `pnpm -r build`.

## Origin

Operator request, this session: an interface that displays the palette, lets a color be
chosen from it, and lets the palette be edited. [[DOC-28]] §8 phase 2; unblocks [[REQ-135]].
