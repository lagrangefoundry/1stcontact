---
uid: request-8467b1a3
id: REQ-133
type: request
title: 'Palette popup: display, pick and edit the site''s colors'
created_by: xgd
created_at: '2026-08-12T00:39:22.220242+00:00'
updated_at: '2026-08-20T12:50:44.695949+00:00'
completed_at: '2026-08-20T12:50:44.695949+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  depends_on:
  - REQ-137
  commits:
  - working_sha: 61c653710270e533bf83ad9c4bcaea94974a4696
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - 8e66fef6becf576d5f54bfc1cc199ea2ba44c9b5
  version: 0.1.43
  story_points: 13
  bundled_in: bundle-77b28def
  chat_comment: comment-b9821b09
---

# Palette popup: display, pick and edit the site's colors

**A component, not a screen.** One popup surface that shows the site's palette, returns a
chosen color to whoever opened it, and lets the palette itself be edited in place.

**Depends on [[REQ-137]]** — the model change (entry = one color, `shade` on the reference,
`steps` deleted) was split out of this ticket's §2 and landed first: the slider has nothing
to write until `shade` exists, and "one entry, one color" is false while `steps` does.

Consumed by **[[REQ-135]]** (text properties), whose Phase B color field opens this to pick a
value. Builds on **[[REQ-114]]** (the L1 palette color model, landed). Design: [[DOC-28]] §8,
[[DOC-23]] §5.

## Status: implemented

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

Split out of this ticket, and landed. In short: an entry is one color, and a reference carries
a continuous `shade` on `[-1, +1]` resolved as an Oklab mix toward black or white. Changing an
entry therefore moves its whole light↔dark family, which is what makes §5(a) a single edit.
The operator never edits a shade directly — the palette holds only real colors, and position
within a family is a slider on the *use*, not a stored sibling.

## 3. What the popup displays

The site's `palette`: named entries, one color each.

- **One swatch per entry**, labeled with its name and its **usage count** across the site's
  pages. The count is the single most useful fact in a palette editor — "primary, used 45
  times" is what makes an edit predictable — and both the delete rule (§5c) and the rename
  confirmation (§5d) are stated in it.
- Selecting an entry reveals the **shade slider** with a live preview of the color at the
  current position. **The slider is continuous** — it matches "a linear spectrum", and it is
  the simpler control. The cost is accepted and recorded: two segments cannot reliably be
  matched to the same shade by eye, so "make these two the same" is an AI request rather than
  a slider skill.
- **In manage mode the slider previews and writes nothing** (decided during implementation).
  A shade lives on a *use*, so there is nothing on the entry for it to change — but an
  operator choosing a hex is choosing the whole family, and this is the only place to see what
  its ends look like. Only in pick mode does the slider contribute to the returned reference.

Measured today: `xgd` 7 entries / 210 refs, `gigabytealchemy` 15 entries, `1stcontact` and
`harbor-cafe` 0 entries (all literals). **An empty palette is a legitimate state**, so the
surface reads as "no colors yet, add one" rather than as broken. Bootstrapping from a folded
site's literals already exists as `1c colors <slug> --assign` and is not rebuilt here.

## 4. Picking

Returns a **palette reference** — `{ ref }` or `{ ref, shade }` — to the opener. Never a hex.

The caller writes it into whatever axis it owns; this component never touches a page. That
is the boundary with REQ-135: this ticket delivers the picker and its contract, REQ-135
Phase B wires it to `axes.color`. Reached as `mountBuilder(...).openPalette(slug, {mode:
'pick', value})` — exposed on the builder handle rather than imported directly, so the host,
the transport and the shade arithmetic are bound once, in the module that knows all three.

A zero shade is **omitted** rather than sent as `shade: 0`. They resolve identically, but an
absent shade is the reference a literal converts to byte-for-byte, and writing `0` everywhere
would put a rounding path in front of colors that never needed one.

`alpha` is not offered. It is an independent axis and belongs to a different conversation.

## 5. Editing

**(a) Change a color.** Free hex entry on an entry's `value`. One write, and **every
reference follows — at every shade**, which is what [[REQ-137]] buys. Free hex lives *here
and only here*: from a segment a user can only pick from the palette ([[DOC-28]] §8), which
is what bounds the incoherence risk.

**(b) Add a color.** A new entry: a kebab-case name plus a hex. An 8-digit (alpha-carrying)
hex is refused — translucency is a reference axis, not an entry.

**(c) Delete — restricted.**

- **Zero references → delete is allowed.** Nothing can dangle.
- **One or more references → refused, naming the count.** Deleting an in-use entry means
  deciding what each use becomes (repoint, or inline the hex as a literal); that is a
  product decision, not something a swatch's ✕ may take silently.
- References at *any* shade count toward the total — with [[REQ-137]] there is no longer a
  separate per-step tally, which makes the rule simpler than it was.
- **No `--force`.** A force flag would be a one-keystroke route to an invalid site, since
  every orphaned reference is a validation failure ([[DOC-23]] §6) rather than a fallback.

The unsafe half stays with the AI, which can talk it through first — and can now *see* the
count, which it could not before (§6).

**(d) Rename — in V1, as a total rewrite.**

A reference names its entry by key, so renaming `primary` → `brand` either rewrites every
reference in the same write or orphans all of them. **It rewrites them.** The measured worst
case is `xgd`'s 210 references (45 on `primary` alone) — mechanical, and cheap enough that
the alternative (send the operator to the AI for a spelling fix) is the worse trade.

- **Atomic.** The whole resulting site — document, palette and every page — is assembled in
  memory and validated before a byte is written. A refusal leaves the draft byte-unchanged,
  so no partially-renamed state is reachable from any caller.
- **Refused on collision.** A new name that already exists would *merge* two entries, the
  same class of decision as deleting one in use: no correct default, so not a text field's
  call. Refused, naming the conflict.
- **Refused on a malformed name** — kebab-case, per `l1PaletteNameSchema`.
- **Enforced server-side**, like delete: a stale client must not be able to talk the store
  into a collision.
- **The count travels with it.** The popup names how many references the rename will rewrite
  before it does, from the same census the swatch label shows.
- **Only `ref` moves.** `shade` and `alpha` are properties of the use and say nothing about
  which entry it names, so a reference at a shade survives at exactly the shade it had.
- The key moves **in place**, so a palette an operator has arranged keeps its order.

**Why this is allowed where delete is not.** Rename is *total and lossless* — every use has
exactly one correct new value and the system can compute it. Delete-with-references has no
correct default for any use; the answer differs per site, per page, per element. The rule is
about which decisions have a computable answer, not about how many references are involved.

## 6. The data path

Reads and writes go through the **single write path** (`tools/generate/src/cli/edit.ts`), as
every other editor surface does — so the CLI, the AI and the popup cannot leave the store in
different states after the same edit ([[DOC-8]] §7).

**Surface: `1c palette` as its own command group, with `/api/palette` beside it.**
`editConfigSet` can already write a palette by merge, but merge cannot *remove* or *move* a
key, and nothing exposed the reference census the delete and rename rules are written in
terms of. Its own group puts the guards, the counts and the writes in one place.

- **Read** — `1c palette get <slug>` / `GET /api/palette?slug=` — the palette plus per-entry
  usage counts.
- **Write** — `set` | `add` | `rm` | `rename`, as CLI subcommands and as a closed `op`
  vocabulary on `POST /api/palette`. The delete and rename guards are enforced **server-side**,
  not in the popup; the popup's disabled Delete button is an explanation, never the rule.
- Every write answers with the operation's result **and the whole re-taken census**, so the
  popup redraws from what the store now holds rather than from its own guess at what changed.

**No re-render on write — REQ-119 retired the question** (revised during implementation; the
original §6 and AC-12 predated it). `draft` and `edit` are rendered at request time, so the
next fetch of either channel renders the definition the write just produced and there is no
artifact for a write to keep in step. `/api/copy` dropped its re-render for the same reason.
The popup instead reloads the preview frame, which is not optional: a color change repaints
the page, and a write that left a stale frame on screen would read as a write that did
nothing.

**One structural walk, not three.** The census must count exactly the references the rename
rewrites, or the number shown and the work done can disagree. `collectL1PaletteRefs` and
`resolveL1Palette` (both in `site-schema/src/l1/palette.ts`) were two hand-kept copies of the
same traversal; rename would have been a third. They now sit on one
`mapL1PaletteRefs(input, fn)` — visit every reference structurally, return a replacement or
the original — with `collectL1PaletteRefs`, `resolveL1Palette` and `renameL1PaletteRef`
expressed on top of it. Structural rather than a hand-listed tour of the color axes, because
`l1Color` is one alias used in a dozen places and growing.

The walk covers **the site document and every page**, which is the scope `resolveL1Palette`
already runs at in `loadSite`. In practice references live in pages today; walking the
document is what keeps that true rather than assumed when a future axis lands elsewhere.

**The AI reaches the same surface.** All five operations are declared on the toolbox surface
(`ai/l1-surface.json`) — `get_palette` in `ReadSite`, the four writes in a new `ManagePalette`
group granted to the caretaker. This is as much a narrowing as a widening: the assistant
already reached the palette through `WriteConfig`'s merge and did so *blind*, with no way to
ask what a change would move and no way to remove or rename at all.

## 7. Implementation notes

- The existing segment modal hand-rolled its own backdrop, Escape handling, close and
  shell-rooted host. That shell is extracted into `apps/control-app/src/builder/modal.js` and
  both dialogs wear it.
  - **`mount()` is separate from construction, and the ordering is load-bearing.** Appending
    at construction — the obvious simplification — silently breaks the segment editor:
    `mountFields` ends its click-to-edit with `control.focus()`, and REQ-117's
    `openLoneControl` fires that click while the dialog is still detached, where focus does
    not move. Attached, the focus is real, the browser moves it away, and the control
    confirms-and-reverts to a display cell before the operator has typed. Caught by
    `reconciliation-copy-edit-live-preview`'s AC-1138. Recorded rather than repaired, because
    it is landed REQ-135/138 behaviour; the real fix is the `autoEdit` seam `openLoneControl`
    is already asking upstream for.
- **The shade arithmetic is split into `packages/site-schema/src/l1/shade.ts`**, a module with
  no runtime imports, re-exported from `palette.ts` so no caller learns about it. The slider is
  continuous, so it resolves a shade once per frame of a drag — a round trip per frame is not
  a control, it is a progress bar. The browser therefore needs the maths, and the only
  acceptable way for it to get it is to run the *same* code the renderer runs: the builder
  serves it type-stripped at `/framework/site-schema-shade.js`, exactly as it already serves
  the edit bridge. `palette.ts` imports zod and could never travel that route.
- The hex control is native (`<input type=color>` paired with a text field that mirrors it) —
  the picker cannot express every hex form the schema accepts, and the text field cannot be
  dragged, so each mirrors the other.
- The toolbar renders one control per registered action already; **Colors** is one more action
  spec, not a branch, and it is listed by both document modes because a palette is a property
  of the site rather than of one rendering of it.

## 8. Decisions taken

1. **Split** — the model change is [[REQ-137]]; this ticket is the popup and depended on it.
2. **`1c palette` is its own command group**, with `/api/palette` beside it (§6).
3. **Rename is in V1**, as an atomic total rewrite of the key and every reference (§5d).
   *(Initially scoped out; revised after the rewrite was costed at 210 references worst case.)*
4. **The shade slider is continuous**, not detented (§3).
5. **AC-12's re-render is withdrawn** — REQ-119 made both channels render at request time, so
   there is nothing to re-render. Replaced by the frame reload (§6).
6. **The slider is shown in manage mode too**, as a family preview that writes nothing (§3).
7. **The AI gets the whole surface**, not just the read — a `ManagePalette` group beside the
   `get_palette` read (§6).

## 9. Acceptance criteria

1. A popup opened from the toolbar's **Colors** action shows every palette entry as a swatch,
   labeled with its name and its usage count across the site's pages.
2. A site with an empty palette opens the popup in a state that offers to add a color.
3. Selecting an entry reveals a continuous shade slider previewing the entry at the current
   position; the slider's range and resolution match [[REQ-137]]'s `shade`, and the preview is
   produced by the renderer's own arithmetic rather than a copy of it.
4. Opened in pick mode, choosing an entry and a shade resolves to a palette reference
   (`{ ref }` or `{ ref, shade }`, never a hex) and closes; canceling resolves to nothing and
   changes no state.
5. Changing an entry's hex changes the rendered page everywhere that color was used **at
   every shade**, from one edit, and moves nothing else.
6. Adding an entry with a kebab-case name and a hex makes it immediately pickable; a
   duplicate, a malformed name, or an alpha-carrying hex is refused with a reason.
7. Deleting an entry with zero references succeeds; deleting one with references is refused
   naming the count, the refusal is enforced server-side against a stale client, and there is
   no force flag.
8. Renaming an entry moves the key and rewrites every reference to it in one write; the site
   validates and renders byte-identically afterwards, every shade survives at the position it
   had, and no reference to the old name survives anywhere in the document.
9. A rename onto an existing name, or onto a non-kebab-case name, is refused server-side and
   changes nothing — no partially-renamed state is reachable, including from a stale client.
10. The rename count the popup shows and the number of references rewritten come from the same
    structural walk, exercised on a site with references at multiple shades.
11. `1c palette` reads the palette with per-entry usage counts and performs all four writes;
    `/api/palette` exposes the same operations to the popup and refuses a verb it does not
    declare.
12. A palette write requires no re-render: the next fetch of either the draft or the edit
    channel serves the new color, because both render at request time (REQ-119).
13. Free hex entry exists only in this surface; no segment field can express one.
14. Every operation is declared on the AI toolbox surface, classified `write` where it writes,
    and belongs to exactly one grantable group.
15. Full suite no worse than the branch point; clean `pnpm -r build` and typecheck.

## Origin

Operator request: an interface that displays the palette, lets a color be chosen from it, and
lets the palette be edited. [[DOC-28]] §8 phase 2; unblocks [[REQ-135]] Phase B.

-