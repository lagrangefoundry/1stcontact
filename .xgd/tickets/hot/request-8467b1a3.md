---
uid: request-8467b1a3
id: REQ-133
type: request
title: 'Palette popup: display, pick and edit the site''s colours'
created_by: xgd
created_at: '2026-08-12T00:39:22.220242+00:00'
updated_at: '2026-08-12T01:13:09.683050+00:00'
completed_at: null
last_field_updated: title
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

# Palette popup: display, pick and edit the site's colours

**A component, not a screen.** One popup surface that shows the site's palette, returns a
chosen colour to whoever opened it, and lets the palette itself be edited in place.

Consumed by **[[REQ-135]]** (text properties), whose colour field opens this to pick a value.
Builds on **[[REQ-114]]** (the L1 palette colour model, landed). Design: [[DOC-28]] §8,
[[DOC-23]] §5.

## Status: design agreed in outline — open questions in §7

---

## 1. What it is

A popup, invoked from two kinds of place:

- **Manage** — a **Colours** button in the builder toolbar. No caller is waiting for a value;
  the user is here to change the palette.
- **Pick** — a colour field that needs a value (REQ-135's text colour, panel background).
  The popup returns a palette reference to its opener.

**Both entry points open the same surface.** Picking and editing live together deliberately:
"this colour is nearly right" is then a one-gesture fix rather than a hunt for a different
screen. In pick mode the surface additionally resolves to a selection; nothing else differs.

It is **not** a display-panel mode. Other entry points may follow (an inline swatch, a
right-click); each is a new caller of the same component, not a new copy of it.

## 2. What it displays

The site's `palette` (REQ-114): an ordered map of named entries `{ value, steps? }`.

**Entries and their steps are both shown and both pickable.** A row per entry — the base
swatch first, its steps beside it. Steps are not decoration: 25 of `xgd`'s 210 references
point at a step rather than a base, so a picker that hid them would fail the rule that a
field's *current* value is always among its options (a segment painted `primary/700` would
open a picker not containing its own colour).

Measured today:

| site | entries | steps | refs in pages |
|---|---|---|---|
| `xgd` | 6 | 10 | 210 |
| `gigabytealchemy` | 8 | 22 | 91 |
| `1stcontact`, `harbor-cafe` | 0 | 0 | 0 — all literals |

An empty palette is a legitimate state (two of four sites), so the surface must read as
"no colours yet, add one" rather than as broken. Bootstrapping a palette from a folded
site's literals already exists as `1c colors <slug> --assign` and is **not** rebuilt here.

**Each swatch carries its usage count.** It is the single most useful fact in a palette
editor — "primary, used 40 times" is what makes an edit predictable — and it is what the
delete rule (§4) is stated in terms of.

## 3. Picking

Returns a **palette reference** — `{ ref }` or `{ ref, step }` — to the opener. Never a hex.

The caller writes it into whatever axis it owns; this component never touches a page. That
is the boundary with REQ-135: this ticket delivers the picker and its contract, REQ-135
wires it to `axes.color`.

`alpha` is not offered. It is a separate axis (DOC-23 §5.4) and the reference carries it
independently; a picker that set it would be conflating the unit of colour change with
translucency.

## 4. Editing

**(a) Change a colour.** Free hex entry on an entry's `value`, or on a step. One write, and
every reference follows — which is the whole point of the palette being the unit of change.
Free hex lives *here and only here*: from a segment a user can only pick from the palette
([[DOC-28]] §8), which is what bounds the incoherence risk.

**(b) Add a colour.** A new entry: a kebab-case name plus a hex. Adding a *step* to an
existing entry is out of V1 — it means choosing a ramp position, which is a different act
from "I want another colour"; ramps stay with the AI.

**(c) Delete — restricted.** *Agreed: restricted delete.*

- **Zero references → delete is allowed.** Nothing can dangle.
- **One or more references → refused, naming the count.** Deleting an in-use entry means
  deciding what each use becomes (repoint, or inline the hex as a literal); that is a
  product decision, not something a swatch's ✕ may take silently.
- Deleting an entry that has steps requires zero references to the entry **and** to every
  one of its steps. A single step may be deleted on its own terms under the same rule.

The unsafe half stays with the AI, which can already do it (`set_l1` + `set_config`) and can
talk it through first. This is better than no deletion and better than a confirm dialog that
quietly breaks forty places.

**Rename is out of V1.** Renaming `primary` orphans every reference to it unless the rename
rewrites them all — a real operation, but a different one from changing a colour.

## 5. The data path

Reads and writes go through the **single write path** (`tools/generate/src/cli/edit.ts`), as
every other editor surface does — so the CLI, the AI and the popup cannot leave the store in
different states after the same edit ([[DOC-8]] §7).

- **Read** — the palette plus per-entry and per-step usage counts. The census walks every
  page with `collectL1PaletteRefs` (already in `site-schema/src/l1/palette.ts`); counting is
  therefore structural, not a hand-listed tour of the colour axes.
- **Write** — set an entry's or a step's value, add an entry, delete an entry or step. The
  delete guard is enforced **server-side**, not in the popup: a client holding a stale count
  must not be able to orphan a reference.
- A palette write re-renders **both** channels before answering, exactly as `/api/copy` does
  — a colour change alters the page, not one rendering of it.

`editConfigSet` can already write a palette by merge, but merge cannot *remove* a key and
nothing today exposes the reference census, so the delete rule has no home on that surface.

## 6. Implementation notes

- `webui-fields` already ships both controls this needs: `enum + format:'color'` (swatch
  grid) and `string + format:'color'` (swatch + hex entry). Nothing to build there.
- The existing segment modal (`builder-modal` in `apps/control-app/src/builder/editor.js`)
  hand-rolls its own backdrop, Escape handling, close and shell-rooted host. The palette
  popup needs the identical shell with different contents, so that shell is extracted into
  one module both use rather than copied.
- The toolbar renders one control per registered action already; **Colours** is one more
  action spec, not a branch.

## 7. Open questions

1. `1c palette` as its own command group + `/api/palette`, or read via `config get` / write
   via `config set` with only delete added? (Recommended: its own group — it puts the guard,
   the counts and the writes in one place and gives the AI a usage read it lacks.)
2. Confirm rename stays out of V1 (§4).
3. Confirm adding a *step* stays out of V1 (§4b).

## 8. Acceptance criteria

*(to be finalised once §7 closes)*

1. A popup opened from the toolbar shows every palette entry and every step as a swatch,
   each labelled with its name and its usage count across the site's pages.
2. A site with an empty palette opens the popup in a state that offers to add a colour.
3. Opened in pick mode, choosing a swatch resolves to a palette reference (`{ref}` or
   `{ref, step}`) and closes; cancelling resolves to nothing and changes no state.
4. Changing an entry's hex updates every reference to it — the rendered page changes
   everywhere that colour was used, from one edit.
5. Adding an entry with a kebab-case name and a hex makes it immediately pickable.
6. Deleting an entry with zero references succeeds; deleting one with references is refused
   with the count, and the refusal is enforced server-side against a stale client.
7. An entry with steps cannot be deleted while any of its steps is referenced.
8. A palette write re-renders both the draft and edit channels before it answers.
9. Free hex entry exists only in this surface; no segment field accepts one.
10. Full suite green, clean `pnpm -r build`.

## Origin

Operator request, this session: an interface that displays the palette, lets a colour be
chosen from it, and lets the palette be edited. [[DOC-28]] §8 phase 2; unblocks [[REQ-135]].
