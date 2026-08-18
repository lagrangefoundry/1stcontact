---
uid: bundle-77b28def
id: BUNDLE-19
type: bundle
title: REQ-133 + BUG-35 + REQ-131 + REQ-140 + REQ-139 + 4 more
created_by: xgd
created_at: '2026-08-18T17:25:57.653435+00:00'
updated_at: '2026-08-18T17:26:37.052657+00:00'
completed_at: null
last_field_updated: status
status: reconciling
fields:
  commits:
  - working_sha: 8e66fef6becf576d5f54bfc1cc199ea2ba44c9b5
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 90b762cf4ff88cc39e0cf43a742b9778d03ca5b6
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: af9b8ab43f70ce0f44b736ebe92ca3491d9b0e0f
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: ceed377a03fb9f1c1bf084dd224d70cb58d6110f
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: b2699987b3d4281051bb078d209d3a8099cd7054
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: e70668dd1ce02f09ab7f914cbaa5ac672454535a
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 6b94ba96367a3f0cb7ec6dfc7f5dfe3d5661dae5
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 2dbf7e705ed58294e3ede858ee834530ca2f5912
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: c60cbf756a056f0afcca065147093aeae8f20361
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: aea40e5d7eb148ebeb121d7cb55e5b1c40cd81fc
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: cd6f00c6e0802569098bbfccc0befd33bc9d78b4
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: b179902c314cff1f8027d9fa28d1c495df9ddda8
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: da7d31b388e51407e48754b243ee6ab3f4743a0e
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 8581a924ff56bc405b155186e11ad8ff3cc03cce
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  auto_merge_back: true
  priority: medium
  orphan_commits:
  - old_sha: 05cec63e464f1256108c67f3363e66f594de85e0
    new_sha: df9508312058e2e9b14a4e81d1d16d6845cb42e3
  skipped_commits:
  - caeb60b401959fe54206c7c1877103ab9d6debbc
  - 7a0261676b45494d231c6b7136bd6d0d181f9d1b
  - b7eb44708a1e77b47c432e0b0dfbe9526ae888bf
  - 06ad8ad645f3c03adec7c526467300009e198a45
  - 87306fa43ea10900fecabea6d00f47b11184a3e2
  - af9b8ab43f70ce0f44b736ebe92ca3491d9b0e0f
  - 1e0b9151165d7e64f65eb22bfd4da8bda33230c0
---

# Bundle

This ticket bundles the following source tickets:


---

## REQ-133: Palette popup: display, pick and edit the site's colors

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


---

## BUG-35: Copy modal: Capitalisation never previews — UA reset blocks text-transform on the text control

## Symptom

In the copy edit modal, the **Capitalisation** control does nothing visible.
Picking Uppercase / Lowercase / Capitalize leaves the words in the editing box
exactly as they were; the change only appears after Save → POST → iframe reload.
Size, Weight and Italic all preview correctly, so the control reads as broken
rather than as slow.

Reproduce: open the builder's Site tab in Edit mode, click a copy segment, change
Capitalisation in the parameter sheet under the box. Nothing moves.

## Root cause

**Not REQ-138's wiring.** `--preview-text-transform` *is* written to the box on
every change (`editor.js` → `previewVarFor`, `page-style.js`), and `builder.css`
consumes it:

```css
.builder-modal__box { text-transform: var(--preview-text-transform, none); }
```

The words, however, live in an `<input>`/`<textarea>` *inside* that box, and the
browser's UA stylesheet sets `text-transform: none` on form controls — which
beats inheritance from the box. The variable lands; it has no route to the glyphs.

Verified in Chromium (playwright), all three elements sharing one parent that
declares `text-transform: uppercase; letter-spacing: 4px; font-style: italic`:

```
input    {"tt":"none","ls":"normal","fs":"italic"}
textarea {"tt":"none","ls":"normal","fs":"italic"}
span     {"tt":"uppercase","ls":"4px","fs":"italic"}
```

This is also precisely why the other three axes work. `fields.css` carries the
host's typography into the control with `.fields-control { font: inherit }`, and
the `font` shorthand expands to family, size, weight and style — exactly the four
that preview. It does not expand to `text-transform` or `letter-spacing`, and
nothing else supplies them.

## Scope: `letter-spacing` is the same defect

`.builder-modal__box` also declares `letter-spacing: var(--preview-letter-spacing,
normal)`, one line above the transform, and it has never reached the words either
— same UA reset, same cause (`ls: "normal"` in the probe above).

That half predates REQ-138: it is REQ-121/REQ-135's "the box mirrors the page's
own typography" being quietly false for any tracked headline. Because
letter-spacing is not an editable parameter it surfaces as mis-mirroring rather
than as a dead control, which is why it has gone unreported.

Both are fixed together. Fixing only capitalisation would leave a known-false
declaration standing in the same CSS rule.

## Fix

Restore inheritance for the two properties the `font` shorthand cannot carry,
scoped to the preview box:

```css
.builder-modal__box .fields-control {
  text-transform: inherit;
  letter-spacing: inherit;
}
```

Confirmed in the same probe: `input` and `textarea` then compute `uppercase` /
`4px`.

This is a deliberate departure from the note at `builder.css:222` — feed the box's
seams rather than override `.fields-control`. The seam route is unavailable here:
there is no `--fields-*` variable for either property, and unlike colour and font
neither can arrive by inheritance at all while the UA rule stands. The override
stays confined to the preview box, which is the only host that wants the *page's*
capitalisation rather than the chrome's.

The general fix belongs upstream in `webui-fields` — `.fields-control` claiming
`font: inherit` while silently dropping two neighbouring inherited text properties
is a component-level gap. Out of scope here; recorded for whoever next touches
that package.

## Test plan

**jsdom cannot observe this defect.** It ships no UA stylesheet and does not
resolve inherited properties through the cascade, so a jsdom assertion would pass
identically before and after the fix and prove nothing. The UAT must drive a real
browser.

`tests/req117-builder-viewport-fill.test.ts` already establishes the pattern —
`loadChromium()` / `launchAnyChromium()` with a graceful `skip()` when no browser
build can be launched.

UATs named `test_UAT_FC_<TICKET-ID>_*`, asserting against the **shipped**
`builder.css` and `fields.css` rather than a hand-written stylesheet, so the test
tracks the real cascade:

- with `--preview-text-transform: uppercase` on the box, the copy control's
  computed `text-transform` is `uppercase` (before the fix: `none`)
- with `--preview-letter-spacing` set, the control's computed `letter-spacing`
  matches (before the fix: `normal`)
- an unset variable leaves the control at the box's default — no forced casing
- a control outside the box (the parameter sheet's own selects) is unaffected

Regression scope: `tests/test_UAT_FC_REQ-138_live_preview.test.ts`,
`tests/req121-copy-modal-elegance.test.ts`, builder suites.

-


---

## REQ-131: Draft change journal — let the AI know what changed without re-reading the site

# Draft change journal — let the AI know what changed without re-reading the site

## Problem

The page editor ([[DOC-28]]) lets the client change copy, images and — as its phases land —
friendly parameters, directly on the draft, at any time, including between AI turns. That freedom
is valuable and free. It also means **the AI's picture of the page is stale by default**, and today
it has no cheap way to find out.

The failure is specific and severe: the AI writes a section, the client rewords it, and the AI
later "improves" that section and silently reverts them. A client who loses their own edit to the
thing they are paying to help them does not report it as a bug — they stop touching the editor, and
the cheapest channel in the product goes dark.

The only correct behaviour available today is to re-read the page before acting. [[DOC-28]] §6.3
measured a real page at 73 segments, 62 of them copy. Doing that defensively on every turn of a
4–5 hour session is not affordable ([[DOC-33]] §4), so in practice it will not be done, and the
silent-revert will happen.

**`status` does not answer this.** It reports the draft against the last *published* revision:
file-level `added`/`modified`/`removed` paths. No ordering, no actor, no before/after, no notion of
"since I last looked". Different question.

**Nothing versions the draft.** [[DOC-12]] revisions are publish-time snapshots and `history.json`
gets one entry per publish. Between publishes the draft is an unversioned mutable working copy.

## Why this is cheap to build

Two things are already true:

- **`edit.ts` is the single write path** for the CLI, the AI and the page editor ([[DOC-30]]) —
  one chokepoint to instrument.
- **The editor emits the same structured, validated diff vocabulary the AI emits** ([[DOC-28]] §4)
  — so this persists something that already flows through that chokepoint rather than inventing a
  representation.

## Behaviour

Three questions, answerable at three costs:

| Question | Should cost | Answered by |
|---|---|---|
| Has anything changed since I last looked? | ~nothing, no tool call | pushed in the per-turn reminder |
| What changed? | proportional to *the change* | one tool call, returning the journal slice |
| What is the page now? | proportional to *the page* | existing reads — fallback only |

### Part 1 — business logic and API (`edit.ts` and the draft store)

- Every mutating `edit*` operation appends a **journal record** and increments a **monotone draft
  counter**, transactionally with the write it describes. A refused write appends nothing (writes
  are already all-or-nothing).
- Every mutating operation **returns the resulting counter**. This is what makes a caller's baseline
  advance as it writes, so any gap between its baseline and current is by construction *someone
  else's* work — no actor filtering needed on the read side.
- A read function returns **the journal since a given counter**, plus the current counter and a
  `truncated` flag.
- A journal record carries: the counter it produced, the actor (`ai` | `client` | `cli`), a
  timestamp, the operation, its target, and enough self-describing content to be read without
  resolving anything — **for copy, the before and after text** (bounded; long bodies truncated),
  and the segment's human-readable label.

**Records must be self-describing, because addresses are not durable.** L1 addresses are
render-scoped by design ([[DOC-28]] §5.2) — a path of child indices valid only for the render that
produced them. A record saying `set_l1 at 0.2.1` is worthless once structure has moved. The
human-readable label comes from the same derived segment model the editor already uses for its
outlines (`pageSegments`).

**This is not a revision.** No revision id, no `history.json` entry, no participation in
publish/checkout. [[DOC-12]] principle 3 is forward-only and immutable; §5.1's preview snapshots
are the standing precedent for an artifact that is deliberately not a revision.

**Bounded, degrading gracefully.** The journal keeps a window (size to be pinned below). A baseline
older than the window returns `truncated: true` and the caller falls back to a full read. No
correctness cliff, and the journal stays small.

### Part 2 — surface and toolbox

- **New read operation** in `l1-surface.json` — *"see what has changed on the site since you last
  looked, and who changed it"* — with a new `shape` for the journal slice, bound in
  `l1Operations`, and placed in the **`ReadSite`** group (already granted to `caretaker` in
  `instances.json`, so no grant change is needed).
- **`returns.provenance: "untrusted"`** — the journal carries client-typed copy and is squarely the
  injection vector [[DOC-30]] S5 names. It must not be marked otherwise.
- **The `change` and `publish_result` shapes gain the resulting counter**, so a caller's baseline
  advances on its own writes without a second call.
- **The `overview` gains one paragraph**: the site can change under you between turns, here is how
  you find out. This is a cross-cutting rule and belongs there rather than repeated per-operation
  ([[DOC-30]]'s stated reason for having an overview at all).
- **A `sequences` entry** — signal → read the changes → act.
- **The `absences` entry on undo** should be revisited: it currently instructs the AI to *"tell the
  user what the previous value was whenever you change something"*, which the journal makes
  unnecessary to carry in the conversation. Adjust the note; do **not** add undo — out of scope.

### Part 3 — the push signal (`roles.ts` / `host.ts`)

`caretakerReminder()` is re-applied every turn through the system channel and never enters the
transcript. The host knows turn boundaries.

- The host records the draft counter at the end of each turn and compares at the start of the next.
- When they differ, the reminder carries a short line saying the site changed and how many edits
  landed.

This is the whole point of the design: in the common case (nothing changed) it costs nothing and
the AI makes no call at all. The tool is pulled only when the signal fires, and the AI never has to
remember a baseline.

*(Note: a counter is deliberately a value the host may hold across turns, unlike an address. It is
safe precisely because staleness is detectable rather than silent — the opposite of the addressing
rule in the overview.)*

## Acceptance criteria

1. A mutating operation returns a draft counter greater than the one before it; a refused write
   does not advance it and appends no record.
2. Asking for changes since the current counter returns an empty slice — this is the cheap
   "nothing happened" answer.
3. After a client-side copy edit, asking for changes since a prior counter returns a record naming
   the page, a human-readable label for what changed, and the before and after text.
4. A caller that only makes its own edits and reads the counter back from each one never sees its
   own edits reported as changes.
5. A baseline older than the retained window returns `truncated: true` alongside whatever records
   remain.
6. Records survive a structural change that invalidates the address they were recorded against —
   the before/after text and label remain readable.
7. The new operation is projected into the manual for a session granted `ReadSite`, and absent from
   one that is not.
8. The journal slice is marked untrusted in the projected surface.
9. A session whose site changed between turns receives the signal in its reminder; one whose site
   did not, does not.

## Decisions to pin during implementation

- **Where the journal lives.** `storage/sites/<slug>/draft/` is git-tracked ([[DOC-12]] §3.1), and a
  journal of every copy edit would churn it badly. A gitignored sibling is the alternative — the
  journal is ephemeral, windowed, and losing it degrades to a full read rather than to
  incorrectness. Lean gitignored; decide explicitly and record the reason.
- **Window size.** Records, age, or since-last-publish. Wants to be large enough that a normal
  session never truncates.
- **Actor attribution.** How the write path learns whether a call came from the editor, the AI or
  the CLI. If it cannot be known cleanly today, the counter mechanism still works without it
  (AC 4 does not depend on the actor field) — so ship without it rather than blocking.
- **Whether the counter is per-site or per-page.** Per-site is simpler and matches "has anything
  changed"; per-page would let the AI ignore changes to pages it is not working on. Lean per-site
  for v1.

## Explicitly out of scope

- **Undo.** The journal makes it *thinkable* and that is not a reason to build it here.
- **Any change to the revisions model.** [[DOC-12]] is untouched by this.
- **Surfacing the journal to the client** in the builder UI. [[DOC-28]] names a revision-diff
  display mode as a peer panel; that is its own piece of work.
- **Divergence detection against the ledger** ([[DOC-33]] §7.9) — this ticket makes it cheap; it
  does not implement it.

## Context

Designed in [[CHAT-21]]. [[DOC-33]] §7.9 states the requirement and §13 carries the sketch this
ticket is drawn from; it is the largest gap between what that playbook assumes and what the
platform provides.


---

## As built

Landed in one commit, `ceed377a03f` (v0.1.45). Nothing in the design above changed;
this section records the decisions the spec left open, and one thing the spec did not
anticipate.

### The four decisions, pinned

**Where the journal lives — gitignored, beside the site.** `storage/sites/<slug>/.journal.json`,
next to `.draft-base.json` at the site root and never inside `draft/`, so it can neither be
captured by a publish snapshot nor perturb byte-identity. Gitignored, as the spec leaned:
a record of every copy edit would churn the tracked tree on every keystroke-settle, and
nothing depends on it surviving a clone — a missing journal degrades a reader to a full
re-read, which is the same fallback an over-old baseline already takes. Correctness never
depends on the journal existing, which is also why a malformed file reads as empty rather
than throwing: a corrupt journal must degrade to "I cannot tell you what changed" and
never to "your edit failed".

**Window — 500 records, 300 characters per text value.** Sized so a whole consultation
session never truncates in practice: the measured page carries 73 segments, so 500 is
several complete rewrites of a page plus everything else a session does. Truncation is
graceful degradation, so the number is chosen to make it rare rather than impossible.

**Actor attribution — shipped, via `GlobalOptions.actor`.** It turned out to be knowable
cleanly: the two callers that are not a person at a terminal each set it where they
construct their options — the AI host (`actor: 'ai'`) and the builder's own palette and
segment routes (`actor: 'client'`) — and the default is `cli`, which is what an
unattributed caller genuinely is. Nothing about *detecting* a change depends on it, so a
caller that forgets it produces a less informative record and never a wrong answer.

**Counter grain — per-site.** As the spec leaned.

### One thing the spec did not anticipate

The spec says "the `change` and `publish_result` shapes gain the resulting counter". Two
write operations answer with neither: `add_asset` and `write_image` return the asset they
wrote. Omitting the count there would have been defensible on shape grounds and wrong on
behaviour grounds — a session whose last write was an upload would hold a baseline that
never advanced, and would be told next turn that its own upload was somebody else's work.
That is exactly the false alarm the counter exists to make impossible, so the rule is
*every* write hands the count back regardless of the shape of its answer. The `image`,
`asset` and `palette_change` shapes were widened to declare it, because a returned field
the manual never mentions is a field the model will not use.

### Notable implementation points

- **`edit.ts` records at the return of a mutating command, never before the write.** That
  is what makes "a refused write appends nothing" true without a transaction: every write
  validates the whole resulting definition and throws on refusal, so reaching the journal
  call means the bytes have landed. A record's `summary` is the command's own `human`
  line rather than a second sentence, so a change reads the same way to the person who
  made it and to whoever finds it later.
- **A no-op advances nothing.** A copy save that changes no field, and a dry-run gap fix,
  return the current count without appending — otherwise every no-op save from the modal
  would look, to the assistant, exactly like the operator rewriting a heading.
- **The push signal needed no upstream change.** `SessionManager` reads `role.reminder` at
  the top of every turn, so refreshing that string in `streamPrompt` is the whole delivery
  mechanism. The baseline is recorded *after* the turn, in a `finally`, so the assistant's
  own writes are absorbed rather than reported back to it, and an abandoned turn does not
  leave the baseline behind.
- **The page-segment walk moved** from `ai/toolbox.ts` to `cli/segments.ts`, so a journal
  record is labelled by the same derivation the editor uses for its outlines rather than
  by a second one that could disagree with it.
- **`1c changes <slug> [--since n]`** exposes the same journal to the operator. It is a
  different question from `status`, which compares the draft to the last *published*
  revision and knows nothing about ordering or about who did anything.

### Evidence

`tests/test_UAT_FC_REQ-131_change_journal.test.ts` — 13 UATs, all passing, covering all
nine acceptance criteria. Nothing stubs `edit.ts`, the store or the Toolbox; the AC-9 case
drives a real builder origin with a real session manager and a real tool loop, and the only
double in the file is the Anthropic client, which is the network.

Regression scope (20 files across the edit path, the tool surface, the render channels and
the builder routes) shows an identical failure set on this branch and on clean
`xgd-working` — 60 pre-existing failures from upstream making `Toolbox.run` async, which
those suites have not caught up with. This work adds 13 passing and breaks nothing.
Typecheck clean.


---

## REQ-140: Page editor: colour — text colour and panel background from the palette (REQ-135 Phase B)

# Page editor: colour — text colour and panel background from the palette

**REQ-135 Phase B.** Phase A (typography) landed and reconciled; §9 named the remainder
"Phase B — colour (blocked on REQ-133)". [[REQ-133]] is implemented and on `xgd-working`, so
the block is cleared and this ticket finishes the work.

Builds on [[REQ-114]] (the L1 palette colour model), [[REQ-137]] (entry = one colour,
continuous `shade` on the reference) and [[REQ-133]] (the palette popup, which already
implements pick mode). Design: [[DOC-28]] §8, [[DOC-23]] §5.

## 1. What it adds

Two colour fields on the segment surface, plus the navigation that connects them:

- **Text colour** on a `text` segment → the `color` axis.
- **Background colour** on a painted `box`/`container` segment → the `surfaceFill` axis.
- **The escalation row** — REQ-135 §2 variant B — a read-only swatch of the panel's current
  fill in the text modal, labelled *from the panel behind this text*, with an
  `edit the panel ↗` link.

## 2. REQ-135 §3.1 is superseded, and the work shrinks

That section specified a **ramp grid of named steps** writing `{ref:'slate', step:'900'}`.
[[REQ-137]] deleted named steps in favour of a continuous `shade` on the reference, so both
the control and the value shape it described are gone.

What replaces it is not a new control. [[REQ-133]]'s popup **already implements pick mode**
and already resolves to `{ref, shade}` (`openPalettePopup`, `apps/control-app/src/builder/palette-popup.js`).
Today its only caller is the toolbar's Colors button in manage mode. This ticket supplies
the missing caller. No picker is built here.

## 3. Colour writes a palette reference, never a hex

Unchanged from REQ-135 §3 and load-bearing. From a segment a user cannot invent an
off-system colour; free hex entry is a deliberate, separate act inside the palette editor.
Picking on a folded site converts literal→reference, which is the refinement direction
DOC-23 §5.2 wants.

## 4. Decided: the descriptor carries the colour, and the write side validates it

`L1FieldValue` is `string | number | boolean` and `L1FieldDescriptor.type` has no colour
case (`format` knows only `'image'`). A colour value is a typed object, so something has to
widen.

**Decided: widen the descriptor** — a `'color'` type, `L1FieldValue` extended with `L1Color`,
`L1SegmentFieldOptions.palette`, and `applyCopyFields` enforcing that the value is a
reference into *this site's* palette. The rejected alternative was staging the colour
entirely client-side, outside `mountFields`.

The reason is the one that already settled `imageChoices`: **the write side is the
authority, not the client**. A palette reference needs the same membership check an image
handle gets, or a stale client can post a `ref` the palette does not hold. Encoding
`{ref, shade}` into a magic string was also rejected — `palette.ts` chose a typed object
over a magic string deliberately, and the field layer should not undo that.

Values already travel as JSON (`tools/generate/src/cli/edit.ts` parses a CLI value as JSON
with a raw-string fallback), so a typed object needs no new transport.

## 5. Decided: the client control mirrors the image-picker seam

`mountFields` has an `enum` + `format: 'color'` swatch grid, but its value is a hex string
and ours is a reference. So the colour row is **a field the dialog owns**, exactly as
`image-picker.js` owns `format: 'image'` fields — split by descriptor, not by segment kind,
so the day a third surface exposes a colour it is answered there too.

## 6. Empty palettes are the common case at first

`gigabytealchemy` has 15 entries and `xgd` 7; every folded site holds literals and no
palette. So a picker that opens onto nothing is not an edge case, and it must read as
"no colours yet, add one" rather than as broken. REQ-133's popup already carries that
empty state, and manage-editing lives in the same surface, so the recovery is one gesture.

## 7. Dead site removal

`storage/sites/1stcontact` and `storage/sites/harbor-cafe` are dead examples and are
deleted here (confirmed by the operator).

Two test suites use them as **fixtures for real properties**, so the claims survive and only
the fixture changes — neither assertion is dropped:

- `tests/reconciliation-colour-palette-overlay.test.ts` — "a site with no L1 colour axes
  carries no palette at all and remains valid".
- `tests/reconciliation-colour-census-and-retrofit.test.ts` — the census over a site with no
  colour literals writes nothing.

Both are re-pointed at a synthesised bare site rather than a stored one. That is the better
arrangement independently: a stored site kept alive only so a test can read it is a fixture
wearing a site's clothes, and it made an unrelated deletion look like a test failure.

`tests/generate.test.ts` and `tests/req22-storage.test.ts` name
`storage/sites/1stcontact/site.json` in **gitignore-pattern** assertions — string checks that
never open the file. They are re-pointed at a live slug so they stop naming a path that
cannot exist.

## 8. Acceptance criteria

1. Clicking a text segment offers a text-colour field; choosing a palette entry writes
   `{ref, shade}` into the `color` axis and the re-render paints it.
2. Clicking a painted panel segment offers a background-colour field writing `surfaceFill`
   the same way.
3. A colour value naming an entry the site's palette does not hold is REFUSED by
   `applyCopyFields`, with the field named — a stale client cannot write it.
4. A `shade` outside `[-1, +1]` is refused.
5. The text modal shows the inherited panel fill read-only and can navigate to the panel's
   own modal; a dirty modal saves before it navigates.
6. A site with an empty palette opens the picker in its "no colours yet" state rather than
   an empty or broken control.
7. `1stcontact` and `harbor-cafe` are gone from the store — neither has a site definition
   or any revisions — and the full suite passes without them. Stated against the definition
   rather than the directory: git tracks files, so a site directory outlives its own
   deletion whenever something untracked is inside it (`.DS_Store`, on any checkout Finder
   has visited), and a directory holding only that is not a site. See §9.

## 9. A directory entry is not a site

Found by running the suite after the merge: the deletion in §7 left
`storage/sites/1stcontact/` standing, because a `.DS_Store` was inside it and git tracks
files rather than directories. Two criteria read that leftover as a site, in opposite
directions:

- AC-7 asserted the **directory** was absent, so it failed on a machine holding the
  leftover while nothing had in fact come back — and would have passed on one without it.
  It now asks for the site definition and the revisions.
- REQ-137's store walk (`test_UAT_FC_REQ-137_no_stored_site_carries_a_step`) had already
  anticipated `.DS_Store` as a *file* and filtered it from the site list, but then treated
  the directory containing one as a site and read a `site.json` that was never there. A
  stored site is now selected as a directory that holds a definition.

Neither claim is weakened: one still proves the sites are gone, the other still walks every
site on disk. Both were the same mistake — taking a directory entry for a site — which is
why the fix is the same predicate in both places.

## 10. Verification

Full suite, foreground, on the merged `xgd-working`: **zero regressions**. The failing set
is a strict subset of `main`'s pre-existing baseline (74 vs 75 failing tests), with one
`main` failure — `reconciliation-l1-navigation` AC-845 — now passing. The pre-existing
failures are unrelated to this ticket (the REQ-122/126/127/129/130 tool-surface suites) and
fail identically on `main`.


---

## REQ-139: Editor: lock controls that cannot express what the element holds

## What changed

When a segment holds something richer than the simple control can express, the
editor offered the control anyway — and it either did nothing or quietly
destroyed what was there. It is now shown **visibly unavailable, with the
reason**.

The mechanism half-existed. `L1FieldDescriptor.locked` (REQ-135) did exactly
this for one case (italic on a family that declares no italic face), and
`applyCopyFields` already refused a locked field on the write side. This
generalises that one trigger to a family of them.

## The rule

> A control is offered only when it is **faithful**: the value it shows is the
> whole truth about what the element holds, and setting it produces exactly the
> change the operator expects. When it is not, the control is shown **locked with
> the reason** — never hidden, never quietly lossy.

Three ways faithfulness breaks. Same treatment, different cause:

| | Cause | Example |
|---|---|---|
| **Inert** | Another axis on the node overrides the one the control writes, so setting it paints nothing | `gradientFill` emits `color: transparent`; a colour picker writes a value that never appears |
| **Lossy** | The node holds a *structure* where the control offers a *scalar* — showing it is a projection, writing it a flattening | a gradient reduced to one swatch; a mask carrying shape parameters |
| **Unsupported** | Expressible, but the site cannot honour it | italic with no italic face (REQ-135) |

The test is **"is the write observable and complete?"**, NOT "is another axis
present". `gigabytealchemy/home` carries a background image under an `overlay`,
and the picker there is still good — a scrim tints an image, it does not hide it.
A sibling axis is not occlusion.

Never hide the row. Absence reads as "this build has no such feature" rather than
"not for this element", and the two have very different fixes — REQ-135's own
argument for `locked` over dropping the field.

## What was built

**Derivation** (`packages/site-schema/src/l1/edit.ts`)

- `L1FieldDescriptor.reason` — the sentence that accompanies every `locked`.
  Plain English, naming the escape hatch ("Ask me in chat to change it"), never
  an axis name. It travels to the modal, the CLI and the AI's tool surface,
  because all three read these descriptors.
- A lock is derived as a **pair** (`{locked, reason}`), so one cannot be produced
  without the other.
- **`GLYPH_GRADIENT_LOCK`** — a `text` run carrying `gradientFill` locks its
  `color` row. The renderer paints a glyph gradient by clipping the background
  layers to the text, which requires `color: transparent`; the axis the picker
  writes is still valid and paints nothing. Measured: one run across every stored
  site — the Gigabyte Alchemy wordmark, which carries `color: {ref: 'neutral'}`
  *under* its gradient, so the row withdrawn is one that showed a real, editable,
  meaningless colour.
- **`NO_ITALIC_FACE_LOCK`** — REQ-135's existing lock, now with its reason.

**Write side** — `lockError` joins `typeError` / `rangeError` / `colorError` in
the refusal chain, and refuses with the descriptor's own `reason`, so the
sentence a greyed-out control shows and the sentence a refused write returns are
one string with one definition site.

**Client** (`apps/control-app/src/builder/`)

- `mountColorField` honours `locked`: the button is `disabled` (not merely
  dimmed — a class closes neither the keyboard nor the screen reader), the row
  carries `is-locked`, and the swatch still reports what the element paints.
- `annotateLocks` in `editor.js` draws the reason under the row it explains, once
  per sheet, for **both** control families — `mountFields` marks its own locked
  rows `is-locked` but has no vocabulary for a reason, and the colour row is
  drawn by the dialog.
- `builder.css` styles `.is-locked` and `.builder-lock`. Nothing styled either
  before: the italic lock REQ-135 shipped was enforced and invisible.

**CLI** — `1c copy get`'s listing appends `(locked: <reason>)` to a locked field.

## Design decisions made during implementation

- **A lock refuses a CHANGE, never the status quo.** The same rule `rangeError`
  and `colorError` already state, and it bites harder here: the modal posts every
  staged field, not only the touched ones, so a locked colour is re-posted on any
  Save — including one that only rewrote the words. Refusing it would have made
  an unavailable control freeze the *whole segment*, and the one node carrying a
  gradient is a headline. (This also fixes the latent form of the same bug in
  REQ-135's italic lock, which would have refused any Save on a run whose family
  declares no italic face.)
- **The colour row now carries `data-field`**, the same attribute `mountFields`
  stamps, so one pass finds a locked row and hangs its reason on it whichever
  control drew it — one selector, one CSS rule, one place that renders reasons.
  REQ-140's UAT asserted the colour row had *no* `data-field` as a proxy for "the
  component did not claim this field"; it now names `.fields-row[data-field=...]`,
  which is what only the component emits and what that assertion was always
  about.
- **`surfaceGradient` on a panel does NOT lock its fill.** A surface gradient is
  a background *layer* over the background colour, so a translucent one shows the
  fill through: the write stays observable. Only the definitively inert case is
  locked.
- **Responsive font size stayed out of scope.** Operator call, 2026-08-13:
  `scaleTrack` scales the whole track proportionally, so the fold's measured
  shape survives — the honest generalisation of "make it bigger", not a loss.
  (Measured, for the record: varying size tracks appear on 8 runs of
  `gigabytealchemy/home`, 14 of `xgd/home`, 7 of `xgd/whitepapers`.)
- **Was blocked on colour controls** (`depends_on: REQ-133`, `REQ-135`), which
  landed with REQ-140. Building the gate before the control it guards would have
  shipped nothing visible.

## Test plan

`tests/test_UAT_FC_REQ-139_locked_controls.test.ts` — the real `1c` commands, the
page `1c render --edit` wrote, and the real `defaultModal`:

- `..._a_gradient_painted_run_locks_its_colour_and_says_why` — locked with a
  reason naming the gradient and the chat, still offered, still in position,
  still reporting the axis; the identical control on the run below is untouched.
- `..._every_locked_control_carries_a_reason` — structural sweep over every
  segment: no `locked` without a `reason`, and the run in a family declaring no
  faces keeps a working italic.
- `..._a_scrim_over_a_photograph_is_not_occlusion` — a band carrying image +
  overlay + fill keeps both controls open, and the write lands.
- `..._a_change_to_a_locked_control_is_refused_with_its_reason` — refused at the
  field, message identical to the descriptor's reason, draft byte-unchanged.
- `..._a_locked_control_does_not_freeze_the_rest_of_the_segment` — the status-quo
  carve-out: the words save while the locked colour rides along.
- `..._the_cli_listing_marks_a_locked_field`.
- `..._a_locked_control_is_drawn_unavailable_and_shows_why` — `is-locked` on both
  families, the swatch disabled, clicking it reaches no picker, reason rendered.
- `..._an_ordinary_run_keeps_a_working_colour_control` — no note where there is
  nothing to explain.

Regression scope run: the full suite. 211 files / 1538 tests pass; the 12 files
that fail (assistant / chat / tool-surface suites) fail identically on the
unmodified base.


---

## REQ-123: 1st contact system KB

# 1st contact system KB

Stand up the **system knowledge base**: the design-doc corpus, its index, its
generated awareness map, and the wiring that makes the builder AI know what
exists and able to pull the rest. REQ-122 renders the chat UI; this ticket gives
that session something to know.

## Status

**Unblocked — the framework peers have landed.** All three JS components are
built and already extracted into the shared artifact store, so consumption needs
no new mechanism: `sharedModuleUrl('knowledge')` resolves today, the same route
`host.ts` already uses for `@lagrangefoundry/ai`.

| | Ticket | State | Delivers |
|---|---|---|---|
| FW-1 | REQ-99 | `ready_to_reconcile` | `components/knowledge/js` — config, corpus, embedding, doc + chunk index, chunking, search, ranking, landscape, priming; a `DocDirStore` peer |
| FW-2 | REQ-100 | `free_coded` | `components/ai_knowledge/js` — `KnowledgeToolbox` over the shared `knowledge_surface.json`, `KnowledgeDocs` priming `ContextSource`, the `describe` seam |
| FW-3 | REQ-101 | `free_coded` | Awareness *build* in JS (cluster → describe → derived map) |

FW-3 landed ahead of plan, which is what lets the map be **generated** rather
than authored — see decision 3.

## Scope

**The D1 ticket store is not in this ticket.** It was scoped here on the
assumption that the builder AI runs in `apps/control-app`, and it does not: the
AI host runs in the Node builder origin (`1c serve`), because every tool bottoms
out in `edit.ts` over the file-backed site store, and sessions persist through the
framework's `FileArchive`. The host moves to workerd *with the store*, at
DOC-12 §7 phase 2 — whose trigger is a server-side builder needing to read and
write the store, still open in DOC-8 §13. A D1 store built now would have no
consumer and a tenancy model with nothing to scope. The tenancy analysis below is
kept because it is the design that ticket inherits, not because it is built here.

**The system KB needs no D1 and no tenancy.** A shipped corpus is a directory
read by `DocDirStore`; the index is a release artefact beside it.

### 1. The corpus

- **Corpus = files that ship with the release**, not seeded tickets. Every `doc`
  ticket (33 at the time of writing, and deliberately not pinned — the export
  reconciles against the store on every run) exported to a corpus directory of
  frontmatter-bearing
  markdown, which is the shape `DocDirStore` reads.
- The export is **repeatable** — it re-runs whenever the design docs move.
- Filenames derive from the doc's human id, not its title: `DocDirStore`'s uid
  *is* the path, so the filename is the retrieval identity and must survive a
  retitle.

### 2. The index and the map

- `knowledge_bases.yaml` declaring the KB with `source: shipped`.
- A build step producing the index beside the corpus, and **generating** the
  awareness map (cluster → describe → validate).
- Composed from the library's public exports (`buildIndex`, `buildChunkIndex`,
  `buildAwareness`, `nodeIndexSource`, `writeIndexModule`) rather than the
  upstream `build-shipped-kb` CLI, which is not in the packed artifact —
  `@lagrangefoundry/knowledge` declares `files: ["src"]` and no `bin`. Reported
  upstream; not worked around here beyond calling the same functions the CLI does.

### 3. Wiring

- `KnowledgeDocs` as the builder chat session's priming source — landscape
  first, so the AI gets a map of what exists plus the means to pull the rest,
  rather than a context stuffed with documents.
- `KnowledgeToolbox` granted to that session (read-only), so search and retrieval
  are declared surface operations with the ordinary guardrails, provenance
  marking and audit.

## What was built

`1c kb build` — export, index, chunk, map, in that order.

| Piece | Where |
|---|---|
| The command (`build` / `export` / `status`) | `tools/generate/src/cli/kb.ts`, dispatched from `cli/index.ts` |
| Corpus export from the ticket store | `exportCorpus` — one `xgd ticket list --view` call, one file per doc |
| KB declaration (authored, scaffolded once) | `kb/knowledge_bases.json` |
| Corpus + both indexes + the map | `kb/system/` (gitignored — all of it is derived) |
| Two surfaces in one Toolbox | `cli/ai/toolbox.ts` — L1 controls plus `KnowledgeToolbox`, read-only, scoped to the system KB on both axes |
| Landscape-first priming | `cli/ai/host.ts` — `KnowledgeDocs` with the projected tool manual as its `mechanism` |

**Credentials.** The index needs `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN`
(the pair the repo already deploys with) because the embedder is Workers AI over
REST. The map needs none: the describe seam resolves `['claude', 'claude_code']`
in order and falls through to the authenticated Claude Code CLI.

**Degradation, not failure.** With no KB built, `openKnowledgeRuntime` returns
`null` and the session is the pre-REQ-123 assistant — tools but no documents. A
KB that was built and then *failed to open* says so on stderr rather than
silently dropping the whole knowledge surface.

### Two things found along the way

- **The packed `@lagrangefoundry/knowledge` has no `bin`.** It declares
  `files: ["src"]`, so `build-shipped-kb` is absent from the shared artifact
  store. Every function that CLI calls is exported, so `kb.ts` composes the same
  pipeline in the same order. Worth reporting upstream; when the `bin` is packed,
  `kb.ts` shrinks to a call.
- **`DocDirStore` ignores frontmatter `created_at` / `updated_at`.** Its module
  comment says a document's frontmatter "wins except `uid`", but `_record` takes
  both stamps from the file entry. The index's incremental manifest keys on
  `updated_at`, so a re-export that rewrote every file would re-embed the whole
  corpus every build. The export therefore writes a file only when its bytes
  actually change, and the two frontmatter timestamps are provenance for a human
  reader rather than something the store reads.

## What already exists (and is not rebuilt here)

| Need | Component | Language |
|---|---|---|
| The Toolbox (declaration, policy, manual, provenance, audit) | `@lagrangefoundry/ai` | JS |
| Chat sessions persisted as transcripts | `@lagrangefoundry/ai` — `FileArchive` | JS |
| Shipped-KB model — corpus from a directory, index and map as release artefacts, **no tickets created** | framework REQ-71 / REQ-99 | Py + JS |
| Ticket store on D1 | `@lagrangefoundry/ticketing` | JS (unused here yet) |

## Decisions taken

1. **The JS knowledge components are built in the framework**, not here — FW-1/2/3
   above. This repo stands up, builds, and consumes.
2. **Membership is opt-in, per document, on the document.** A `doc` ticket is in
   the system KB when it carries `fields.system_kb: true`, and the export skips
   every ticket that does not. Every doc carries it today, so the corpus is
   unchanged — but the mechanism is now the one that decides, rather than the
   absence of one.

   **Inclusion and not exclusion**, deliberately. An exclusion list answers "what
   did we throw out", which nobody asks; inclusion answers "what does the
   assistant know", which is the question that matters and the one a reviewer
   should be able to settle by reading a document's own frontmatter. It also
   fails safe: a new document is outside the KB until somebody says otherwise, so
   nothing reaches the assistant by default. The opposite default would put every
   new document in front of a client-facing agent the moment it was written.

   The decision lives on the TICKET rather than in a list in the KB declaration,
   because it is a fact about the document and has to move with it. An id list
   drifts silently — the document is retired or renamed and the list still names
   it, with nothing to notice.

   The system must still scale to thousands of documents, so the answer to a
   large corpus remains chunk search and an awareness map, not a hand-picked
   subset. This is the dial that makes an editorial pass possible when there is
   retrieval data to justify one; it is not an instruction to curate now.
3. **The awareness map is generated at build time. There is no hand-authored
   map.** Generating it is the point: a map over a corpus this size, spanning product,
   framework and process is exactly what goes stale when hand-maintained.

   The KB nevertheless declares `landscape: authored` at RUNTIME, and that is not
   a contradiction — it is the shipped-KB contract. `authored` means "this map is
   a fixed artefact that ships, read and never refreshed on a cadence", which is
   exactly true of one built by `1c kb build`. Declaring `derived` at runtime
   would invite a rebuild against a corpus store that is structurally read-only.
   The build flips the KB to `derived` for its own duration — upstream's own
   manoeuvre, and the reason its script puts it this way: derived for the build,
   authored on disk. What makes the result authored is *where it is written*.
4. **Build-time and query-time vectors come from one model.** Workers AI
   `@cf/baai/bge-small-en-v1.5`, reachable from a Worker's `AI` binding and from
   Node over REST — so vector-space parity holds by construction rather than by a
   numeric-equivalence argument. The Node origin uses the REST transport with
   `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN`, the secrets the repo already
   deploys with; the binding takes over when the host moves into the Worker. No
   local stand-in embedder: it would make laptop vectors incompatible with
   production ones.
5. **The describer needs no credentials.** The `describe` seam resolves
   `['claude', 'claude_code']` in order, so it falls back to the authenticated
   Claude Code CLI when no API key is set.
6. **KM runs over both stores.** A corpus is a stored ticket query resolved
   against a *named* source (`store_for`), so "a shipped read-only directory" and
   "this tenant's D1 store" are the same code path with different sources. The
   system KB uses the former; tenant KBs will use the latter.
7. **The system KB sits above tenancy.** It is not inside anyone's store, it
   takes the scope parameters, and it runs the same queries for everyone.
8. **Index residency follows from FW-1.** A shipped corpus at this scale is a
   bundle-sized artefact; the loader takes its source from the host, so R2 or
   Vectorize remains available without a library change when the corpus grows.

## Tenancy (design inherited by the D1 store ticket, not built here)

### The tenant is the account

`tenant_id` is not a column the product sets; it is the axis the store is built
on. `Accessor.forTenant(id)` returns a handle that injects `WHERE tenant_id = ?`
on every read and stamps it on every write, and human-readable ids are allocated
per `(tenant, type)`. Tenancy is bound into the handle at construction and is
never ambient, so crossing tenants means explicitly building a second handle.
That is why the grain is expensive to change later: it decides what "cannot be
seen across" means structurally, what a ticket's number is scoped to, and what a
knowledge base can span.

The account is where the hard barrier belongs, because that is the boundary
between unrelated businesses. Below it, a site is an object inside the tenant —
one client's several sites share a store, and therefore share accumulated
knowledge: brand voice, terminology, decisions already made. That sharing is a
feature. The alternative — a tenant per site — would throw it away and make the
second site start as cold as the first.

### What that obliges

Site isolation is a **predicate**, not a property: `fields.site_id = ?`. Within a
tenant, a query that omits it returns another site's content belonging to the
same client. That is far less serious than cross-client leakage, but it is a
discipline rather than a guarantee, so it must not be left to each call site.

**Bind the site scope once**, into the knowledge runtime's KB scope and the
session's store handle, so nothing downstream can forget it — the same shape the
tenant scope already has, one level down.

### The system KB sits above all of it

The system KB is not tenant data and does not live in any tenant's store. It is a
release artefact: shipped corpus, shipped index, read-only, byte-identical
everywhere. Nothing a tenant does can mutate it, and upgrading the software
changes it for everyone at once rather than being a per-tenant migration.

It still **takes** the scope parameters, and may require them — but it does not
vary by them. That is deliberate on two counts:

- **One call signature.** Every knowledge call carries the scope, so there is no
  second, unscoped code path for a tenant-data query to be accidentally routed
  down. The shipped source simply ignores the scope when selecting its corpus,
  exactly as `store_for` already ignores it when a KB names a shipped source.
- **The audit trail stays complete.** Who asked, in what scope, is recorded for
  every query including the ones whose answer does not depend on it.

A useful consequence: because a system-KB query is scope-invariant, identical
query text yields identical results across every tenant, so results are safely
cacheable *across* tenants. It is the only KB where that is true. The cache
boundary is therefore per-KB, not per-search — a search that spans the system KB
and a tenant KB produces a ranked set whose composition is tenant-specific.

## Open

- **Agency accounts.** The account grain assumes an account's sites belong to one
  business. If the product ever sells to agencies — one account, many unrelated
  end-clients — the weak boundary (the site predicate) would sit exactly where a
  strong one is needed. Not a reason to change the grain now; a reason to know in
  advance that agencies would need a tenant per end-client rather than per agency.
- **Corpus editorial pass.** Which documents to drop and which to generate, once
  there is retrieval data to judge by (decision 2).

### Deferred

- **Corpus residency for a deployed Worker.** The KB is read today by the Node
  builder origin on the operator's machine, so `kb/system/` is gitignored and
  built on demand. When the host moves into the Worker (DOC-12 §7 phase 2) the
  index has to reach it — `writeIndexModule` emits it as an importable module,
  and the loader takes its source from the host, so R2 or Vectorize stays
  available without a library change. Nothing about that decision is forced yet.
- **Transcript granularity.** The chat archive homes a session as one file
  holding the whole transcript, rather than a row per message. Fine at builder-
  conversation length; if it stops being fine, the fix is a message-granular
  archive behind the same port in the framework, not a bespoke schema here.
  Recorded in DOC-10 §8.1.

## DOC-10 (chat persistence) — revised, done

DOC-10 predated both the ticket store and KM, and specified bespoke machinery for
each. It has been revised in place rather than annotated, since its design intent
survived intact and only the build-it-here assumption did not. Three sections
replaced:

- **§8's bespoke schema** — `chat_sessions` / `chat_messages` / FTS5 → the ticket
  store: a session is a `chat` ticket, its transcript a `chat_transcript`
  comment, its body the AI-maintained summary. §8.1 records the one real
  divergence (whole-file comment vs message rows).
- **§6's `reference_docs` table + distillation step** → a knowledge base over the
  real documents. Distillation was a workaround for retrieval that did not exist;
  keeping it would have meant a second source of truth that drifts silently.
- **§5.2's four memory tools** — `search_transcripts` / `read_session_range` /
  `list_reference_docs` / `read_reference_doc` → operations on the declared
  knowledge surface, with transcripts and documents as two KBs in one ranked
  search rather than two tool families.

Also corrected: §11's decomposition named REQ-23–REQ-26, numbers that were never
allocated to this work and now belong to unrelated tickets. It points at REQ-122
and REQ-123.

## Related

REQ-122 (builder chat UI) · DOC-10 (chat persistence — revised here) ·
DOC-12 (storage model — §7 phase 2 gates the D1 store) · DOC-8 §13 ·
framework REQ-99 / REQ-100 / REQ-101, REQ-71 (shipped KB),
REQ-40–44 / 49 / 53 / 76 (KM in Python), REQ-30 / 33 (Toolbox + ai_ticketing in JS).


---

## REQ-141: Workers-runtime test project: UATs that run inside workerd against real D1 and R2 bindings

# Workers-runtime test project

The store work that follows — site definitions in D1, asset bytes in R2 — can only be proved where it will run: **inside workerd, against real bindings**. This repository cannot do that today. This ticket makes it able to, and nothing else.

## 1. Why it does not work today

`vitest.config.mts` is a **single** config built on Astro's `getViteConfig`. That is not incidental: it wires the `.astro` transform into Vitest so behavior-module components render through the container API. The transform cannot run in workerd, and `@cloudflare/vitest-pool-workers` requires its own pool. One config cannot be both, so this is a structural change to the test setup rather than a dependency addition.

`@cloudflare/vitest-pool-workers` is also not installed here (lagrange-framework has 0.18.5).

## 2. What it is

Vitest split into **projects**:

- the existing Astro/node project, **unchanged** — same includes, same webui aliases, same timeouts;

- a new **workerd** project with `d1Databases` and `r2Buckets` bindings, reached from tests via `import { env } from 'cloudflare:test'`.

**Precedent to follow, not invent.** `lagrange-framework` already solved this exact split: its root `vitest.config.mts` composes per-component project configs, and `components/ticketing/js/vitest.config.js` is the workerd one (`cloudflareTest({ miniflare: { d1Databases: ['DB'] } })`). It hit the same wall we do — its `DocDirStore` filesystem reader cannot run in workerd — and answered it with a sibling `vitest.node.config.js`. Its 69 tests run in ~1.8s.

## 3. Deliverables

- `@cloudflare/vitest-pool-workers` added to devDependencies.

- Root config becomes `projects: [...]`. The Astro project's behaviour is what it is today — this ticket changes where tests run, never what they assert.

- A workerd project config carrying `D1` and `R2` bindings and its own `include`.

- A file-naming convention that routes a test to the right project, stated once and followed.

- One UAT per project proving it runs where it claims to.

## 4. Acceptance criteria

1. `pnpm test` runs both projects; every test green before this ticket is green after it.

2. A UAT in the workerd project reaches a D1 binding through `cloudflare:test` and applies a schema.

3. A UAT in the workerd project writes and reads back an R2 binding.

4. A test importing `node:fs` runs in the node project and is excluded from the workerd project.

5. The Astro container-render UATs still pass — the `.astro` transform is intact, proving the split did not cost the thing the single config existed for.

6. Clean `pnpm -r build` and typecheck.

## Origin

[[CHAT-25]] — putting the builder on Cloudflare. This blocks the store port and every store UAT after it, so it is first.

---

# What landed

## Files

| File | Role |
|---|---|
| `vitest.config.mts` | **Orchestrator only.** `defineConfig({ test: { projects: [...] } })` — no `include`, no suite of its own. Carries the routing convention as its doc comment, so the rule has one home. |
| `vitest.node.config.mts` | **New file, old content.** The previous `vitest.config.mts` verbatim — same `getViteConfig`, same `webuiAliases()`, same 60s timeouts — plus `name: 'node'` and one `exclude` line handing the marked files over. |
| `vitest.workers.config.mts` | **New.** `cloudflareTest({ miniflare: { d1Databases: ['DB'], r2Buckets: ['SITES'] } })`, `name: 'workers'`, `include: ['tests/**/*.workers.test.ts']`. |

## The routing convention

**`*.workers.test.ts` runs in workerd; every other `*.test.ts` runs in node.**

Stated once, in the root config's doc comment. No per-file opt-in comment, no directory split — a file's runtime is legible from its name alone.

This inverts lagrange-framework's `*.node.test.js`, and deliberately: there, workerd is the default and node is the marked exception; here it is the other way round. The *marked* side is always the minority side, so the convention stays cheap in both repos.

## Bindings mirror the deployed shape

- **`SITES`** (R2) — the bucket `1c deploy` publishes rendered snapshots to (`apps/public-site/wrangler.toml`). Reused rather than renamed, so a store UAT and the deployed Worker are talking about the same thing.
- **`DB`** (D1) — no Worker declares one yet. This is where it gets declared first, which is the point of the ticket.
- `compatibilityDate: '2025-07-01'` / `compatibilityFlags: ['nodejs_compat']` copied from the apps' wrangler.toml, so the test runtime is the *production* runtime — not a newer one that would let a test pass on behaviour the deployed Worker does not have.

## Design decision made during implementation: the pool version is pinned exactly

`@cloudflare/vitest-pool-workers` is `"0.18.5"`, **not** `"^0.18.5"`.

Each pool release pins an exact `miniflare`, and therefore an exact `workerd`. Installing `^0.18.5` (→ 0.18.8 → `workerd@1.20260722.1`) failed in `workerd`'s postinstall with `Expected "2026-07-22" but got "workerd 2026-06-30"`: the lockfile recorded `workerd@1.20260722.1: {}` — its `optionalDependencies` unresolved — so the platform binary was never linked and `install.js` validated against a stale one. 0.18.5 is the version lagrange-framework already runs and installed cleanly, so it was pinned.

> ### ⚠️ CORRECTION (2026-08-15, after promotion) — the diagnosis above was wrong
>
> This ticket originally recorded the cause as *"the platform binary is withheld by the workspace's minimum-release-age gate"*, inferred from a correlation with publish dates (35d old → installed, 23d → not). **That inference was wrong, and the pin does not do what this ticket claimed it does.**
>
> A later `pnpm update` reproduced the identical crash — `Expected "2026-08-11" but got "workerd 2026-07-10"` — this time via `wrangler` (^4.106.0 → 4.123.0 → `miniflare@5.20260811.1-alpha` → `workerd@1.20260811.1`), which the pool pin does not govern at all. Four controlled experiments on the same pnpm 11.9.0 then ruled the original theory out:
>
> | Experiment | Result |
> |---|---|
> | `@cloudflare/workerd-darwin-arm64@1.20260811.1` (3 days old) alone | **installs** — no age gate |
> | `wrangler@4.123.0` in a clean dir | **installs**, binary linked |
> | same, with a `minimumReleaseAgeExclude` list present | **installs** — the exclude list is not the trigger |
> | the *entire post-update dependency set*, resolved from scratch | **installs**, both `workerd@1.20260710.1` and `1.20260811.1` binaries present, postinstall green |
>
> **Actual cause: pnpm 11.9.0's incremental resolution.** When it adds a *new version* of a package that already exists in the lockfile at another version, it can write the new entry with its `optionalDependencies` dropped (`workerd@1.20260811.1: {}`). The binary is then never linked, and `workerd`'s `install.js` resolves a hoisted sibling of the wrong version and throws. A from-scratch resolve of the same manifests never does this. `minimumReleaseAge` is set nowhere in this repo, in a parent, in `~/.npmrc`, or in pnpm's config; there is no `.pnpmfile.cjs`. pnpm self-reports `11.9.0 → 11.22.0` available.
>
> **Consequences for this ticket:**
> - The exact pin *did* hold across `pnpm update` (the lockfile still records `specifier: 0.18.5` while everything around it moved), so it is not harmful — but it is not load-bearing for the reason given, and `^0.18.5` would have been equally fine.
> - **The rationale comment in `vitest.workers.config.mts` states the wrong cause and should be corrected or removed.** Left in the tree pending a decision on whether to reopen this ticket for a comment-only commit or fold it into the dependency-bump work.
> - The real lever, if the workerd postinstall crash recurs, is a from-scratch resolve or a pnpm upgrade — not version pinning.

## Evidence

`tests/test_UAT_FC_REQ-141_workers_runtime.workers.test.ts` (workerd project) — 3 tests, ~2.1s:

- **AC2** — reaches `env.DB`, applies DDL, then reads the schema back out of SQLite's own `sqlite_master` catalogue (a stub that swallowed `exec` cannot answer that), round-trips a row, and confirms the PRIMARY KEY is enforced by SQLite rather than by the test.
- **AC3** — `env.SITES` put/get/list/delete, asserting on R2's *server-computed* `size` and 32-hex `etag` and on `httpMetadata` surviving the round trip, not just on the body echoing back.
- Asserts `navigator.userAgent === 'Cloudflare-Workers'` — the pool is really the pool.

`tests/test_UAT_FC_REQ-141_project_routing.test.ts` (node project) — 4 tests:

- **AC4** — imports `node:fs` at module scope and uses it, so the file could only have loaded in a runtime that has one; asserts the userAgent is *not* the Workers one; asserts its own name carries no `.workers` marker.
- Asserts the two `include`/`exclude` globs agree with each other and that the root config declares no `include` of its own (a suite there would run in neither runtime).
- **AC5 companion** — asserts `vitest.node.config.mts` still routes through `astro/config`'s `getViteConfig`, and that the workerd config does not mention astro at all.

## Suite state (AC1, AC5, AC6)

- `pnpm -r build` — clean. `pnpm -r typecheck` — clean. **AC6 met.**
- Full run: **227 files, 1640 tests — 13 files / 75 tests failing.**
- **Those 75 failures are pre-existing and unrelated.** Verified by re-running the same 13 files against the *old* single config out of `HEAD`: byte-identical result, 13 files / 75 tests. They come from an upstream `@lagrangefoundry/ai` toolbox change — refusals now return an object where the UATs expect a string (`.toMatch() expects to receive a string, but got object`) and the audit trail comes back empty. Nothing in this ticket touches that surface.
- Every Astro container-render UAT is in the passing 1498. **AC5 met.**

So AC1 holds in its delta sense: the failure set is unchanged across the split. Closing those 75 is separate work against whichever ticket owns the toolbox upgrade.

## Test plan

Both new UATs are `test_UAT_FC_REQ-141_*` and become reconciliation's to rename against real ACs. The routing UAT is deliberately structural — it asserts the *convention*, which is the deliverable, and is what will fail if a later change quietly moves a test into the wrong runtime.


---

## REQ-144: Build, deploy and smoke-test scripts, and the [vars] inheritance bug behind the production 503

# Build, deploy and smoke-test scripts — and the `[vars]` bug that makes production 503

One command to build, one to deploy, one to prove the deploy worked. Plus the configuration bug
that means `app.1stcontact.io` cannot currently work at all.

## 1. The bug

`apps/control-app/wrangler.toml` declares `BUILDER_ORIGIN` under a **top-level `[vars]`** and
does not repeat it under `[env.production]`. Wrangler does **not** inherit `vars` into named
environments, so the deployed Worker sees no `BUILDER_ORIGIN` and returns its own 503:

> `BUILDER_ORIGIN is not configured. Start the builder origin with '1c builder' ...`

The repository already knows this rule and states it — `apps/public-site/wrangler.toml` repeats
its R2 binding under `[env.production]` with the comment *"a named environment does not inherit
bindings"*. control-app simply did not follow it.

Note the 503 is **not** the whole problem: `BUILDER_ORIGIN` points at `http://localhost:8790`,
and a deployed Worker cannot reach localhost by any value of that variable. So this ticket makes
the failure *honest and diagnosable*; the origin only stops being a laptop when [[REQ-145]] and
[[REQ-146]] land.

## 2. Why scripts, and what they must not be

`package.json` has `deploy:public` / `deploy:control` / `dryrun:*`. What is missing is
everything around them: nothing builds the builder client, applies D1 migrations, pushes
secrets, or checks afterwards that the thing that deployed actually serves.

The scripts are **one path**, used by the operator and by any future automation alike. A deploy
that is done differently by hand than by script is a deploy whose failures nobody can reproduce.

## 3. Deliverables

- `bin/build` — builds every deployable artifact; fails loudly on a missing shared-store
  component rather than emitting a broken import map.
- `bin/deploy` — deploys the Workers and reports what moved. Takes a target so `--dry-run` and a
  real deploy are the same code path. It provides the **hooks** for migrations and secrets;
  it does not itself know about D1 or any particular key. [[REQ-143]] wires its migrations into
  that hook, [[REQ-146]] wires `ANTHROPIC_API_KEY` into it. **This is deliberate** — it is what
  keeps this ticket free of a dependency on the store chain, so the scripts and [[REQ-147]] are
  not serialised behind it.
- `bin/smoke` — post-deploy assertions against the **live** origin, exiting non-zero on failure.
  Must cover what [[CHAT-11]] verified by hand for `public-site`: apex resolves, the
  trailing-slash 301 holds, a rendered snapshot's referenced assets all return 200 with correct
  content types, `cache-control` and `x-robots-tag` are right on the draft channel, and an
  unknown slug 404s without leaking a distinction.
- A documented mechanism for pushing secrets via `wrangler secret`, never committed. No secret is
  named or required by this ticket; the mechanism is proved with a throwaway value.

## 4. Acceptance criteria

1. `[env.production]` carries every var and binding control-app needs; a dry-run deploy shows
   them resolved rather than absent.
2. A UAT asserts that for each Worker, every top-level `vars`/binding key is also present under
   `[env.production]`. This class of bug does not recur silently — it is the second time
   inheritance has bitten this repo.
3. `bin/build` from a clean checkout produces every artifact the deploy needs.
4. `bin/smoke` passes against the current live `public-site` **before** anything else changes,
   proving the script tests reality rather than encoding hopes.
5. `bin/smoke` fails non-zero, with a message naming the failed assertion, against a
   deliberately broken deploy.
6. No secret value appears in the repository, in `wrangler.toml`, or in script output.

## Origin

[[CHAT-25]] — operator asked explicitly for build/deploy scripts. The `[vars]` bug was found
while reading control-app's config during that conversation; production has been returning 503
since it was deployed.

---

# Implementation (free-coded, commit `cd6f00c6e`)

## What changed

**The `[vars]` fix.** `apps/control-app/wrangler.toml` gained an `[env.production.vars]` block
repeating `BUILDER_ORIGIN`. Before: `wrangler deploy --env production --dry-run` printed the
inheritance warning and `No bindings found.` After: it prints
`env.BUILDER_ORIGIN ("http://localhost:8790")` — AC1, observed rather than asserted.

**The recurrence guard (AC2).** `tests/support/wrangler-toml.ts` reads enough TOML to answer one
question — is everything at the top level repeated under each named environment? — and
`test_UAT_FC_REQ-144_named_environments_repeat_every_top_level_var_and_binding` asks it of every
`apps/*/wrangler.toml`. Two decisions worth keeping:

- **Bindings are identified structurally**: any table declaring `binding = "…"`, keyed
  `<table>:<name>`. A hardcoded list of table names would silently stop covering the first
  binding kind nobody remembered to add to it.
- **The guard is pointed at the config that actually shipped.** A second UAT feeds it
  control-app's pre-fix TOML and asserts it reports `BUILDER_ORIGIN` missing. A guard that has
  never been shown catching its bug is a guard nobody should trust.

**`bin/build`** — `1c preflight`, then `pnpm -r build`, then a per-app
`wrangler deploy --env production --dry-run --outdir dist`. Three notes:

- `--env production` deliberately: a config error that only exists under `[env.production]` is
  the entire subject of this ticket, and building the default environment would miss every one.
- **`1c preflight` is new** (`tools/generate/src/cli/shared-store.ts` + a CLI verb). It reports
  every shared-store component and every declared package, then exits 6 naming what is absent.
  It exists because the shared components are installed out of band: `pnpm install` cannot
  supply them and the lockfile cannot notice them missing — and a missing **browser** component
  yields an import map that loads, renders chrome, and dies at the first `import`, in the
  operator's browser. Resolution goes through `webuiPackageDir`, the single resolution point;
  the scope literal is not restated.
- The bundle in `dist/` is **evidence, not input**: `wrangler deploy` rebuilds from source and
  does not consume it. It becomes a genuinely needed artifact when [[REQ-145]] makes the builder
  client a build output.

**`bin/deploy`** — `--dry-run` is a *target*: the same hooks run and the same command line is
composed, with one flag appended. Hooks are any **executable** file in `bin/deploy.d/migrate/`
or `bin/deploy.d/secrets/`, run in sorted order before the upload, receiving `DEPLOY_APP`,
`DEPLOY_APP_DIR`, `DEPLOY_ENV`, `DEPLOY_WORKER_NAME`, `DEPLOY_DRY_RUN`, `DEPLOY_REPO_ROOT`. A
hook exiting non-zero aborts that app before anything uploads — a migration that fails must stop
the code that assumes it ran, and a UAT asserts exactly that ordering. Non-executable files are
ignored, so each directory's `README.md` lives beside its hooks.

**`bin/smoke`** — a launcher over `tools/generate/bin/smoke.mjs`. Nine checks:
`apex_resolves`, `unknown_slug_not_found`, `unpublished_slug_indistinguishable`,
`published_root_redirects`, `draft_root_redirects`, `draft_index_serves_html`,
`draft_cache_and_robots_policy`, `draft_miss_is_noindex_404`, `draft_assets_resolve`.

- Asset discovery follows attribute references **and one level into CSS**, which is where
  `@font-face` lives; a missing font is invisible in a screenshot and obvious to a reader.
- The 404-leak check compares an unknown slug against a known-but-unpublished one and requires
  identical status *and body*. A 404 that says which would answer questions about sites the
  asker has no business knowing exist.
- Checks with nothing to test against report **skip**, never quiet success.
- Plain JavaScript, no transform, no dependency: it runs straight after a deploy on whatever
  Node is there. Exported, so the UATs drive its failure path against a fake origin rather than
  by breaking a real deploy.

**Secrets (AC6).** `bin/deploy.d/secrets/README.md` documents the mechanism: value piped via
`printf '%s' | wrangler secret put NAME --env production` — piped rather than passed as an
argument, which is visible in `ps` and in shell history; `printf` rather than `echo`, whose
newline would become part of the secret. `wrangler secret list` shows the names, the only half
safe to look at. A UAT scans the scripts, the hook docs and every `wrangler.toml` for credential
shapes and asserts the documented mechanism never echoes a value.

## Design decisions

- **`--dry-run` as a target, not a mode.** A rehearsal that took a different route would prove
  nothing about the real thing, so the flag is appended to a command line composed once.
- **`bin/deploy` knows nothing about D1 or any key.** That is what keeps this ticket shippable
  ahead of the store chain rather than serialised behind it. [[REQ-143]] and [[REQ-146]] each
  add a file to a hook directory and change nothing here.
- **The smoke content-type table is a second statement of the Worker's**, because it runs
  outside the bundle and cannot import it. A UAT pins the pair to `contentTypeFor` — the same
  arrangement `apps/public-site/src/content-type.ts` already records for `1c deploy`.
- **Apps are discovered, not listed.** Both scripts find `apps/*/wrangler.toml`; the failure
  mode of a hand-kept list is an app that silently never gets built.

## Evidence

| AC | Evidence |
|---|---|
| 1 | `wrangler deploy --env production --dry-run` for control-app now resolves `env.BUILDER_ORIGIN`; before it printed the inheritance warning and `No bindings found.` |
| 2 | `test_UAT_FC_REQ-144_named_environments_repeat_every_top_level_var_and_binding` over every app, plus `…_inheritance_guard_catches_the_config_that_shipped` |
| 3 | `bin/build` runs green from the worktree: preflight (9 shared components, 2 packages), `pnpm -r build`, both bundles, artifacts reported |
| 4 | **`bin/smoke --slug xgd --draft fa0344fb47a8` passed against live `https://1stcontact.io` — 9 checks, 11 assets, all 200 with the expected content type — before any change was deployed** |
| 5 | `…_smoke_fails_naming_the_assertion` is table-driven over six distinct breakages: a 404ing asset, a font served as the wrong type, a preview that lost its `noindex`, a lost trailing-slash redirect, a 404 that reveals the site exists, and an apex that stopped resolving |
| 6 | `…_no_secret_value_is_committed_or_echoed` |

18 UATs, all passing. The full node suite has **75 pre-existing failures across 13 files**
(assistant/toolbox surfaces, and `bug32`'s scope check now flagging `kb.ts`); verified identical
at the baseline commit with this work stashed, so none are attributable here.

## Findings from production — not fixed here, deliberately

Investigating AC1 against the live account turned up two facts the ticket's premise did not have:

1. **`app.1stcontact.io` does not resolve at all** — `NXDOMAIN`, not a 503. The route is
   declared as `{ pattern = "app.1stcontact.io/*", zone_name = "1stcontact.io" }`, and a zone
   route needs a DNS record that does not exist. public-site's apex uses `custom_domain = true`
   precisely for this reason, and its wrangler.toml says so: *"the zone has no proxied record for
   the apex, and a route alone would resolve to nothing."*
2. **`1stcontact-control-app` has never been deployed** — `wrangler deployments list --env
   production` answers *"This Worker does not exist on your account"*. So the `[vars]` bug was
   never live; it was a trap set for the first deploy, and it is now sprung harmlessly.

Neither is fixed here, because creating the DNS record and deploying would make the builder
publicly reachable, and [[REQ-147]] (Cloudflare Access) `depends_on` this ticket precisely so it
can gate that. REQ-147 notes the exposure is *"latent rather than live"* — this is why. The
sequence is: this ticket → REQ-147's Access policy and `workers_dev` decision → DNS → deploy.

## Outstanding

- **The secret mechanism is documented and its dry-run path is tested, but has not been proved
  end-to-end with a throwaway value against the live account.** That means running
  `wrangler secret put` against a production Worker, which is an outward-facing change to
  production configuration; it is left for the operator to authorise. (It is also blocked in
  practice by finding 2 — the Worker does not exist to put a secret on.)
- **CI is not wired to `bin/build`.** It cannot be: `1c preflight` requires the shared component
  store, which is installed out of band and is absent in CI. `bin/build --skip-preflight` exists
  for that case, but CI was left alone rather than half-wired. This becomes load-bearing at
  [[REQ-145]], when the browser artifacts stop being served off disk and CI genuinely needs the
  store to build them.


---

## REQ-142: An async SiteStore port, with the filesystem behind it

# An async `SiteStore` port, with the filesystem behind it

Every write the builder performs bottoms out in `node:fs`. A Worker has no filesystem, so the
store must become an **interface** before it can become a Cloudflare one. This ticket
introduces that interface and moves the existing filesystem behaviour behind it — **with no
behaviour change at all**.

The D1/R2 adapter is [[REQ-143]] and is deliberately not in scope here. Splitting them is what
makes this ticket's correctness claim checkable: if the port is right, the whole existing suite
passes unchanged.

## 1. The seam that exists, and the one that does not

[[DOC-12]] §7 says "the Worker reaches storage through a single `SiteStore` accessor; phase 2
swaps only its implementation." That is **true on the read path and false on the write path**:

- `preview.ts` already declares a `DraftStore` interface with an `fsDraftStore` implementation —
  the seam DOC-12 describes, for reads.
- `edit.ts` calls `writeJson`, `removePath`, `copyFileSync` and `writeFileSync` **directly**.

So the doc describes an intention, not the code. Closing that gap is this ticket.

## 2. Why it is smaller than `edit.ts`'s size suggests

`edit.ts` is ~79KB, but its store surface is **four verbs**, at ~25 write sites and ~15 read sites:

| Verb | Sites |
|---|---|
| write a page | `writeJson(file.abs, page)` |
| write `site.json` | `writeJson(siteJsonPath(...), newBase)` |
| delete a path | `removePath(...)` |
| put an asset | `ensureDir` + `copyFileSync` / `writeFileSync` |

## 3. The real cost: sync to async

**This is the budget line, and it is not the port.** `edit.ts` exports **31 functions, none
async**. D1 and R2 are async, so those 31 become async and it propagates outward — into
`builder.ts`'s route handlers and into the `1c` CLI, which dispatches to the same functions.
That mechanical conversion touches more of the tree than the port itself does.

## 4. Two adapters, one port — and why that is not a legacy mode

`CLAUDE.md` forbids legacy/fallback modes. This is not one. Both adapters are **live and
current**: the `1c` CLI edits `storage/sites/` on the operator's machine (git-tracked per
[[DOC-12]] §3.1, a property we are deliberately keeping), and the Worker will reach D1/R2.
Neither is a preserved old path; there is no mode detection, and no caller chooses between them
at runtime — the adapter is injected at construction.

**Precedent:** `@lagrangefoundry/ticketing`'s `docs_store.js` splits the *reader* from the store
for exactly this reason, keeping `node:fs` behind a separate `./node` entry point so the
Worker-safe path never imports it. Follow that shape.

## 5. Deliverables

- An **async** `SiteStore` port: read/write/delete page, read/write `site.json`, list pages,
  put/delete/list asset. Small and total — no path-shaped escape hatches (an `asset()` that
  returns an absolute filesystem path is a filesystem leak, not a port).
- An `FsSiteStore` implementation carrying today's behaviour, including its atomicity
  characteristics — this ticket does not improve them, and does not regress them.
- `edit.ts`'s 31 exported functions converted to async; call sites in `builder.ts` and the CLI
  updated.
- The existing `DraftStore` read seam reconciled with the port rather than left beside it as a
  second, narrower one.

## 6. Acceptance criteria

1. The full existing suite passes with no assertion changed. This is the whole correctness claim.
2. No `node:fs` or `node:path` import remains in `edit.ts`.
3. `1c copy set`, `1c palette`, and the asset commands behave identically at the CLI, including
   their error envelopes — `CommandError` still reaches the modal as a 400 with code/path/hint.
4. A UAT drives the port through a fake in-memory adapter, proving no caller depends on the
   filesystem.
5. A multi-file write (`site.json` plus N pages, as at `edit.ts:1760-1765`) is expressed as one
   port call, so the D1 adapter can make it atomic later without revisiting callers.
6. Clean `pnpm -r build` and typecheck; no new lint warnings.

## Origin

[[CHAT-25]]. Depends on [[REQ-141]] for the harness the fake-adapter UAT runs in.
## 7. Decisions taken during implementation (2026-08-15)

These were underdetermined by §5 and are recorded here because they are the shape
REQ-143 builds on.

**Injection.** The store is a required `store: SiteStore` field on the options object
every `edit*` function already takes (`EditOptions extends GlobalOptions`). `edit.ts`
imports the port's *types* only; `fsSiteStore(ctx)` lives in a Node-only entry
(`store/fs-store.ts`) so the Worker-safe path never pulls `node:fs`, following
`docs_store.js`'s `./node` split. Required rather than optional so the compiler
finds every call site.

**Port width.** §5's eight verbs are not sufficient for AC-2: `edit.ts` also reaches
the change journal (`appendChange`/`changesSince`/`draftCounter`) and computes
`status` by diffing the live revision against `draft/`. Both are port verbs —
`counter`/`appendChange`/`changesSince` and a single `pendingChanges(slug)` — rather
than left for REQ-143.

**Asset sources.** `editAssetAdd` read a path on the operator's own disk, which is not
the store and has no meaning in a Worker. The source read moves out to its two callers
(the CLI and the AI toolbox adapter); the function takes bytes. `1c asset add <file>
--as` and the tool's declared `file` parameter are unchanged, and the NOT_FOUND
envelope for a missing source file is raised at the call site with identical
code/path/hint.

**Preview assets.** `DraftStore.asset()` returning an absolute path is the leak §5
rules out, so it becomes `readAsset(slug, rel): Promise<Uint8Array | null>` and
`PreviewFile`'s `{ kind: 'file' }` carries bytes. This trades `sendFile`'s streaming
for a buffered read on the dev builder's asset path.

**Scope held.** `commands.ts` (`new`/`publish`/`checkout`/`render`/history) stays on the
filesystem directly; `FsSiteStore` delegates `loadDraft` to the existing `loadSite`.

## 8. The site factory

REQ-141 delivered the vitest project split and nothing else — there is no reusable site
fixture. Every test that needs a site still rolls its own `mkdtemp` + `cmdNew` +
`writeFileSync` preamble, and that preamble is precisely the thing that cannot cross
into workerd.

So this ticket also ships **one site factory, two backends behind the port**:

- `makeFsSite(...)` — a temp-directory site plus its `FsSiteStore`, replacing the
  hand-rolled preamble, with disposal.
- `makeMemorySite(...)` — the same site over the in-memory adapter, no filesystem at
  all. This is what AC-4 drives.

Both return the same handle (`{ slug, store, opts }`), so a test written against one
runs against the other unchanged. That equivalence is the factory's whole point: it is
what makes "no caller depends on the filesystem" a property a test can assert rather
than a claim.

## 9. Acceptance criteria added

7. A site factory under `tests/support/` yields the same handle over the filesystem
   adapter and the in-memory adapter, and a UAT drives the same body of assertions
   through both.

## 10. What landed

**The port** — `store/site-store.ts`: `hasDraft`, `readSiteJson`, `readPages`, `write`, `listAssets`,
`readAsset`, `counter`, `appendChange`, `changesSince`, `pendingChanges`, `loadDraft`. Async
throughout, no verb returns a path. Writes are ONE verb taking a whole change (`site.json` + N
pages + page removals + asset bytes + asset removals).

**Node-free supporting modules**, so the port can be imported without dragging `node:fs` behind it:
`store/assemble.ts` (merge + validate, shared by both adapters — `loadSite` now delegates to it) and
`store/journal-model.ts` (the counter arithmetic and window rule, previously welded to
`.journal.json`).

**Two adapters** — `store/fs-store.ts` (the only module in the port's world importing `node:fs`,
carrying today's behaviour and today's non-atomicity unchanged) and `store/memory-store.ts`.

**`edit.ts`** — all 31 exports async, `EditOptions.store` required, no `node:fs`/`node:path`/`../store`
import left. `preview.ts`'s `DraftStore` is gone: `PreviewRenderer` takes a `SiteStore`, and
`PreviewFile` carries bytes rather than a filename. Call sites updated in `index.ts` (one
`editOptions()` naming the adapter), `builder.ts` (one `builderStore()`), and `ai/toolbox.ts`.

**Test factory** — `tests/support/site-factory.ts`: `makeFsSite` / `makeMemorySite` behind one
handle, `SITE_BACKENDS` for `describe.each`, `recordingStore` for the one-write claim, and `fsOpts`
for suites that make their own temp tree.

## 11. Evidence

`tests/test_UAT_FC_REQ-142_site_store_port.test.ts` — 31 tests. The read/write/copy/L1/palette/asset
bodies run twice, once per adapter; three tests assert a multi-file change crosses as a single
`write`; one asserts both adapters answer identically for the same seed.

Full suite: **56 failures in 11 files, which is exactly the pre-existing set on `xgd-working`** —
same files, same counts. No assertion was changed. Two suites that were failing before this ticket
(`reconciliation-beyond-l1-authoring`, `test_UAT_FC_REQ-130_beyond_l1`) now pass in full, for the
reason in §12.

`pnpm -r build` and `tsc -p tools/generate` clean.

## 12. Finding: the toolbox suites were already broken, and why some of them recovered

Eleven suites fail on `xgd-working` today, independently of this ticket. The cause is upstream:
`@lagrangefoundry/ai`'s `Toolbox.run` is `async` and awaits `surface.invoke`, but these tests call
`box.run(...)` without awaiting and assert on the returned value — so they assert against a Promise.

That was *invisible* while `edit.ts` was synchronous: an un-awaited `box.run` still landed its write
in the first microtask, so a test reading the site straight afterwards usually won. Making the write
genuinely async loses that race. Two suites were repaired here because this ticket caused them to
regress and leaving new failures was not acceptable — their `Box.run` type was corrected to
`Promise<string>` and their call sites awaited. The other nine are untouched: they were broken
before this ticket and their repair is not its business.

Also recorded because it hid a consumer during this work: `builder.ts` and `fidelity.ts` contain NUL
bytes (deliberate `\0` cache-key separators), so a plain `grep -r` classifies them as binary and
skips them silently. `builder.ts` is a heavy consumer of `edit.ts` and is invisible to any survey
that does not pass `grep -a`.