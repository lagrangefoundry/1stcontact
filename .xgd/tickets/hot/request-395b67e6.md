---
uid: request-395b67e6
id: REQ-117
type: request
title: 'Copy editing end-to-end: click segment → fields modal → validated diff → re-render'
created_by: xgd
created_at: '2026-07-31T20:43:32.395678+00:00'
updated_at: '2026-08-07T04:16:36.935056+00:00'
completed_at: '2026-08-07T04:16:36.935056+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  depends_on:
  - request-a6740b4a
  - request-41796766
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 2b71c662f6db0cc2f2a6f540f9dcceabf19f55c1
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - bb0954bfe62cf07af5981390c9bcf77ada041f09
  - working_sha: b7e5519aaa57ce4730cfd23434fc31c9662f79c1
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - 94ae6feed6e5a07bc1074c2ac4ed38b3388e0874
  - working_sha: c1023ddd4b7ceb821774f630ceed3f10a687f7ea
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - cda7fe4dba15b7da70cdbad837517e3a68af1fff
  - working_sha: a21f9e4d89ccb62718f6b5e957b9ce33f0361d54
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - 2119b6dd59a389d3471b1ff0a87de6c32297908b
  - working_sha: 34fe00649fa085765460e30577570e8da3daf50a
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - 887010bf4e7b2f13fdd393c60c5a48dbcf1f40b8
  - working_sha: f24952a477cca9bf0bd9ae285358359f650aec09
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - fd22712bc733620d3276180a0c0bc7380ae59d17
  - working_sha: f1f46c73e5071499d0963d55e957f2d8894b31eb
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - 65b9be7a143da0bfb1eed1b23b4104e3bc46a240
  - working_sha: bfa18fbab9e51801fe7b980a9a7e565d0e37ea99
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - 38e43c7dbfdc044314ce96297ae7b318c3301f3a
  version: 0.1.23
  story_points: 4
  bundled_in: bundle-15c1f647
  chat_comment: comment-40779c8d
---

## What this builds

The **first end-to-end edit**: click a segment, edit its copy in a modal, and see the
page re-render with the change saved. This is the ticket where the chrome (T1) and the
edit render (T2) meet, and where the editor becomes a *second producer of structured
edits* rather than a viewer.

Phase 1 ticket **T3** of [[DOC-28]] §12. Design: [[DOC-28]] §4, §9.1, §11;
[[DOC-8]] §5, §7.

## The loop

```
click segment → resolve to its structured target via the stamped address (T2)
  → modal form over that segment's exposed fields
  → Save → structured diff
  → validate (the shared validator — [[DOC-8]] §7 layer 1)
       ├─ invalid: surface the error, revert; nothing is applied
       └─ valid:   apply to the draft definition
  → re-render (edit channel) → refresh the iframe
```

This is **the same loop the AI drives** — only the first two steps differ.

## Scope

### 1. Click → target

Edit-mode click handling in the same-origin iframe: read the segment address off the
clicked element and resolve it to the node in the definition. Innermost-wins for
nested segments. Hover treatment (brighter outline, small movement) on top of T2's
rendered outlines.

### 2. The modal — `webui-fields`, not hand-rolled

The modal is `mountFields` ([[DOC-8]] §9.3), which supplies typed controls, per-field
validation and a settled confirm/cancel gesture model. **This ticket's job is to
derive a field descriptor list from a segment**, not to build forms.

- **`buffered` commit**, so the modal's Save is the flush point and **one modal
  produces exactly one structured diff**. (`auto` would emit a diff per field.)
- Copy fields render as plain text/textarea controls. **The full string is always
  legible in the form field** regardless of what the render does to it — see §4.
- **No WYSIWYG, no contenteditable, no inline HTML editing.** The modal is a form
  over structured fields; that is what keeps the invariant below true.

### 3. The write path

- **Validate before applying**, through the **same validator the AI's edits use**.
  One validator, one set of rules — sharing it is what makes the editor a second
  producer rather than a second path.
- Apply the validated diff to the **draft definition** ([[DOC-12]] §3 — the draft
  *is* the working copy; the builder introduces no separate draft concept).
- Re-render the edit channel and refresh the iframe.
- Invalid never lands: surface the error, revert, apply nothing.

**The invariant, and the test to apply to every control:**

> **Could the AI have produced this exact edit through its tool surface?**
> If no, it does not ship as a control — it goes to the AI.

No raw HTML or CSS, no "raw" mode, ever ([[DOC-2]], [[DOC-7]] §6.2).

### 4. Copy that no longer fits — accepted, with one guard

L1 pins a run's width and can pin `nowrapFromPx`; vertical position is flow-based, so
longer copy generally pushes content down, but a no-wrap headline can run out of its
box. **This is accepted** — the goal is to let the user enter the text they want; if
the result looks ugly they work with the AI to tidy it ([[DOC-28]] §9.1).

The one guard is free and required: because the modal edits the text in a plain form
field, **the full string is always legible there**. Ugly is acceptable; *silently
clipped so the user cannot see what they typed* is not.

## Non-goals

- **Text properties** (size, colour, weight, family, background) — phase 2. The modal
  is single-stage in phase 1; the parameters stage comes later.
- **Per-run in-text restyling** — stays with the AI. Doing it properly needs a
  semantic rich-text engine, which is not day one.
- **Images** — T4.
- **Structural editing** — no add/remove/reorder/resize/reposition ([[DOC-28]] §7.3).
- **Undo beyond the modal's Cancel** — the Design-view undo affordance is an open
  question ([[DOC-28]] §13 Q6).

## Acceptance criteria

1. Clicking a copy segment in Edit mode opens a modal listing that segment's copy
   fields; clicking a segment with no editable fields opens nothing.
2. Editing text and saving updates the draft definition, re-renders, and the iframe
   shows the new copy.
3. **One modal Save produces exactly one structured diff**, regardless of how many
   fields were edited in it.
4. An edit that fails validation is **not applied**: the error is surfaced, the draft
   is unchanged, and the iframe still shows the pre-edit state.
5. The editor's edits pass through the **same validator function** the AI's edits do —
   demonstrated by test, not by inspection.
6. No editor path can produce raw HTML or CSS; there is no raw-editing mode.
7. Copy inside a behavior module's slot is editable through the same loop.
8. Text longer than its box still shows in full in the modal's form field after
   reopening the modal.
9. Nested segments resolve innermost-first.
10. View mode is unaffected: no handles, no click interception, no modal.


---

## What landed (2026-08-01, commit `1dd851d`)

The **definition half** of the loop, complete and driven by real entry points.
The **modal and the shell wiring are blocked on T1**, not descoped — see below.

### The edit-address contract moved to `site-schema`

`packages/site-schema/src/l1/edit.ts` is new and now owns the attribute names
(`data-l1-path`, `data-l1-segment`, `data-fc-edit`, `data-fc-module`,
`data-l1-slot`, plus the hover class), the segment vocabulary, the address type,
and the **one** resolution rule — index the render's root node LIST, then
`children` at each later step. REQ-116 had these in the renderer; they are the
*contract*, not the rendering of it, so the emitter that writes the stamp and the
client that reads it now share one definition site and cannot drift.
`packages/framework` re-exports the names it used to own, so nothing downstream
moved.

The same module derives a segment's exposed fields (`copyFieldsOf`) and applies a
change map (`applyCopyFields`). `type` is `'string'` and only `'string'` — DOC-28
§3's exposure rule expressed as a type.

### The write path is the AI's surface, not a second one

`1c copy get|set` lands in `tools/generate/src/cli/edit.ts` beside
`page`/`config`/`asset`. DOC-28 §4's invariant is that the editor and the chat AI
are **peers, not two mechanisms** — peers share a surface. A copy edit therefore
inherits that module's atomicity (assemble and validate the *resulting*
definition before a byte hits disk) and runs the same `validateSite` +
`validateL1` call the other commands run.

- `1c copy get <slug> <pageId> <path> [--module <id> --slot <name>]` → the
  `mountFields` descriptors + current values. An empty field list is the answer
  for a segment with no phase-1 control, which is what makes "clicking it opens
  nothing" a property of the derivation.
- `1c copy set … --values '<json>'` → **one change map is one diff**: applied,
  validated and written together, then the edit channel is re-rendered so the
  host has only to refresh the iframe.

### The client half reads the stamp

`packages/framework/src/l1/edit-client.ts` — `resolveEditTarget` (innermost-wins
via `closest`, module/slot scoping) and `mountL1EditBridge` (click + hover, and a
guard that **refuses to bind on anything without `data-fc-edit`**, so a host that
forgets to unmount on a mode switch still cannot break View mode). It answers one
question — *which segment is this, and where in the definition does it live?* —
and hands the answer to a host.

### Two gaps the consumer revealed

- **`contact-form` marked no seam.** Copy in its `form` slot carried an address
  with no scope, and instance-rooted and document-rooted paths reuse the same
  short forms by design — so it was unresolvable. It now marks the slot the way
  `carousel` already marked its slide. Only the module knows which of its
  elements is which seam.
- **The hover treatment had no home.** The rule joins the outline it strengthens
  in `L1_EDIT_CSS`; the client only says which segment is hot. The "small
  movement" is the outline lifting *off* the box — moving the element itself
  would reflow the page under the pointer and make the edit render's geometry
  differ from the draft's.

### Evidence

`tests/req117-copy-editing.test.ts` — 10 UATs, one per AC, across both real entry
points: jsdom over the bytes `1c render --edit` actually wrote, and `1c` itself
(argv in, `{ok,data}` envelope and exit code out).

AC5 is demonstrated by consequence: an unrelated part of the page's L1 is pushed
past the envelope, and `copy set` and `config set` refuse for the *identical*
reason — which `copy set` could not do if it validated only what it touched.

AC3's "one Save, one diff" is demonstrated by atomicity: a change map whose
second entry is bad writes neither half, and `1c status` reports zero modified
files after it; a well-formed map moves exactly one.

## Blocked on T1 (REQ-115), not descoped

Two pieces of this ticket's scope cannot be built yet:

1. **The `mountFields` modal.** The ticket is explicit that it is `mountFields`
   and not hand-rolled — and REQ-115's Deliverable 0, *how `@gendevlabs/webui-*`
   is consumed*, is unsettled. Nothing in `node_modules`, no submodule, no
   published package. Hand-rolling a form to fill the gap is exactly what the
   ticket forbids.
2. **The shell wiring** — mounting the bridge on the iframe's document, refreshing
   it after a save, and the View/Edit toggle. REQ-115 is still `draft`:
   `apps/control-app` is a "Hello from app.1stcontact.io" stub, so there is no
   host, no iframe and no mode to bind to.

What T1 has to wire is small and named: `mountL1EditBridge(iframe.contentDocument,
hit => …)`, then `1c copy get` for the descriptors, `mountFields` in **buffered**
commit so Save is the flush point, then `1c copy set` with the confirmed values,
then reload the iframe. Every piece but the modal itself is landed and tested.


## Follow-up: the builder did not fill the browser window (94ae6fee)

Found on first operator use of the T1 chrome. The preview pane rendered about
**four lines tall at any window size** — both View and Edit, every site.

**Cause.** An iframe's intrinsic height is 150px, and nothing inside it can
recover a height its ancestors never had. The height chain from the viewport to
the frame had one `auto` link: `.shell` ships `min-height: 100%` and *no*
height, so every `flex: 1` beneath it resolved against **content**. The frame
sat at exactly its intrinsic 150px.

**Fix** — the shell's own `tabs[].fill` opt-in, which exists for precisely this
case (a tab hosting an app-shaped thing that scrolls internally). No override
and no reaching into shell internals; the alternative would have meant
re-styling three of the shell's own elements.

Two changes were needed, because declaring the option was not sufficient:

- `config.js` — `SITE_TAB` declares `fill: true`.
- `app.js` — the mount was rebuilding each tab as `{id, label}` and **silently
  dropping `fill`**. Nothing threw and nothing warned. `TABS` now passes
  straight through: a `TABS` entry *is* a shell tab spec.
- `builder.css` — `.builder-layout` grows as a flex item instead of depending on
  a percentage against the fill panel; `body` forbids a page-level scrollbar,
  since one appearing means the chain has leaked again.

**Evidence** — `tests/req117-builder-viewport-fill.test.ts`, 3 UATs:

- `test_UAT_FC_REQ-117_site_panel_opts_into_the_shell_fill_chain`
- `test_UAT_FC_REQ-117_tab_spec_reaches_the_shell_unnarrowed` — guards the exact
  regression above, asserting on *every* declared tab key so the next option
  added cannot be dropped the same silent way.
- `test_UAT_FC_REQ-117_preview_frame_tracks_the_window_height` — a real browser,
  because jsdom does no layout and cannot tell a filled pane from a collapsed
  one. Measures 789/1089/489px frames at 900/1200/600px viewports, follows a
  live resize, and asserts the page itself never scrolls.

Mutation-checked: with `fill: true` removed all three fail, the measurement
reporting the collapsed `expected 150 to be greater than 700`. Where no browser
can be launched the measurement **warns loudly** rather than skipping silently —
a quiet skip is indistinguishable from a pass.

Also widened the REQ-115 naming test's `config.js` parser, which anchored on the
closing brace and so turned any added tab option into a *naming* failure.

**Scope note.** This is T1 (REQ-115) chrome, not copy editing. It was committed
against REQ-117 because that is this session's scope ticket; move it if the
reconcile wants the fix attributed to T1.


## The loop is closed (cda7fe4d) — "blocked on T1" no longer applies

Both blockers recorded above are gone. `@gendevlabs/webui-fields` is in the
shared artifact store, and T1 (REQ-115) shipped the shell the bridge had nothing
to bind to. Everything the section above described as "small and named" is built.

**What now works, in a real browser**: hover brightens a segment's outline →
click resolves it to its definition node → a `mountFields` modal opens over that
segment's derived fields → Save posts one change map → the origin validates,
writes the draft and re-renders → the frame refreshes showing the edit.

### What was added

- **`L1_EDIT_PAGE_ATTR`** (`data-fc-page`, stamped on `<body>` in the edit
  channel). An address is only half a coordinate. `index.html` is an *alias* for
  the home page, so the file name is not the page id, and deriving it client-side
  would mean re-implementing the renderer's home-page rule and drifting from it.
  It is the `id`, never the `slug` — `findPageFile` matches on `id`.
- **`/api/copy` GET/POST** on the builder origin — a thin transport over
  `editCopyGet`/`editCopySet`, the *same* functions `1c copy get|set` dispatch
  to. A `CommandError` is the **expected** answer to a bad edit, so it returns
  **400** carrying the validator's own `code`/`path`/`hint`; a 500 would read as
  "the builder broke" and throw away the message naming the field.
- **`/framework/edit-client.js`** — the bridge served to the browser by
  type-stripping the TypeScript source. It stays **one** implementation: it reads
  the stamp the renderer writes, and a hand-written browser copy would be free to
  drift from the markup. Type-stripping suffices because both files' only runtime
  import is each other.
- **`editor.js`** — the host half: modal, save, refresh. The bridge is
  **injected**, not imported: its URL is browser-only, so a module-scope import
  would make the file unloadable in any test. `main.js` is the sole module that
  resolves those URLs.
- **`mountFields` in `buffered` commit** — one modal is one diff. `auto` would
  post per field and re-render the site on every settled keystroke.

### Two shape bugs the browser found

- `hit.target.path` is the parsed **index array**; the wire speaks the dotted
  form. A bare `String(path)` yields `0,0,0,0`, which the parser correctly
  refuses. Now formatted through `formatL1Path` — one definition of an address.
- The bridge calls it `moduleId`, the CLI flag is `--module`. The rename happens
  in one place. Getting it wrong is **silent**: an instance-rooted address
  resolved against the document root still lands on *a* node, just the wrong one.

### Evidence

- `tests/req117-edit-loop.test.ts` — 6 UATs over the real origin.
- `tests/req117-edit-loop-browser.test.ts` — 4 UATs in a real browser, because
  jsdom does no layout and cannot click inside an iframe.

Mutation-checked: unbinding the bridge fails 3 of the 4 browser UATs; the
View-mode UAT correctly still passes, since it asserts *absence*. A skip where no
browser can launch warns loudly rather than passing quietly.

Also widened two REQ-116 assertions that pinned `<body data-fc-edit>` as a whole
tag and so broke on the added page stamp.

### Known, not fixed here

A copy edit rewrites the whole page JSON with different unicode escaping
(`—` → `—`), so a one-word change produces a large diff. Pre-existing in
`writeJson`, cosmetic, and worth its own ticket.

-

-

-

-

-

-