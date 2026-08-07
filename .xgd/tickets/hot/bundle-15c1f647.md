---
uid: bundle-15c1f647
id: BUNDLE-16
type: bundle
title: REQ-117 + REQ-115 + REQ-44
created_by: xgd
created_at: '2026-08-07T01:30:25.518467+00:00'
updated_at: '2026-08-07T04:16:33.258360+00:00'
completed_at: '2026-08-07T04:16:33.258360+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  commits:
  - working_sha: null
    reconcile_sha: null
    main_sha: 1741ee5d1d20eb5ff9bb81564ed3c088ff47731f
  auto_merge_back: true
  priority: medium
  merged_at_commit: 1741ee5d1d20eb5ff9bb81564ed3c088ff47731f
---

# Bundle

This ticket bundles the following source tickets:


---

## REQ-117: Copy editing end-to-end: click segment → fields modal → validated diff → re-render

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


---

## REQ-115: Builder shell: webui consumption, `site` tab, multi-mode display panel + toolbar

## What this builds

The builder's chrome: the `@gendevlabs/webui-*` components wired into this repo, the
shell mounted inside `control-app` with the **`site` tab**, and the **multi-mode
display panel** showing a real rendered site in View mode.

Phase 1 ticket **T1** of [[DOC-28]] §12. Design: [[DOC-8]] §3, §9.

## Deliverable 0 — how `@gendevlabs/webui-*` is consumed  ✅ SETTLED

**The route is the shared artifact store that `lagrange-framework`'s `bin/install`
populates.** Neither of the two routes the original scope proposed was taken, and
copying stays rejected.

`bin/install` packs each component and extracts it into a flat `node_modules` under
a directory the consumer lives in, so ordinary Node upward resolution finds it — no
registry, no workspace link, no submodule. Two properties come from upstream and are
why this is right: a consumer runs against a packed **snapshot** (never an editable
install), so it keeps working while the framework repo is mid-edit; and updates only
happen when the operator deliberately re-runs the command.

The decisive fact is that upstream has already **designed and shipped** this
mechanism for exactly this purpose. Standing up publishing or pinning a submodule
would fork a decision that has already been made one repo over.

`tools/generate/src/cli/webui.ts` is this repo's single resolution point. It resolves
through each package's own `exports` map (never a hardcoded `src/index.js`), and its
failure supplies the diagnostic upstream explicitly noted was missing — naming the
component and the command that installs it.

**Known cost, accepted and made visible.** The dependency is *implicit*: nothing in
our `package.json` records it, so a fresh clone (CI, another machine) gets nothing.
The webui-mounting suites therefore **skip with a stated reason** rather than fail,
and the skip is reported. A green run that silently proved nothing would be worse
than a reported gap. A private registry is the eventual fix; upstream names it as
such.

### Blocker cleared before implementation

The first session on this ticket stopped: every pushed ref of the framework carried
only `chat`, `markdown`, `shell` — `split` existed solely on an unpushed local
branch. `origin/xgd-working` now carries all eight components, and `bin/install` has
placed them in the shared store, so the work proceeded.

## Serving — why Node, with `control-app` in front

Everything the builder needs beyond its own chrome is filesystem-bound: the rendered
draft under `storage/dist/…`, the `storage/sites/` listing behind the site selector,
and `publish`. A Worker has no filesystem, and both bundler routes that could inline
the bytes were spiked and rejected:

| Mechanism | Result |
|---|---|
| baseline `unstable_dev`, no bindings | passes, 6.9s |
| `[assets]` binding (Workers Static Assets) | never becomes ready — 3 × 60s timeouts |
| `rules = [{ type = "Text", … }]` over browser `.js`/`.css` | never becomes ready — same hang |

Taking either would cost the ability to test `control-app` at all. So the origin runs
in Node (`1c builder`) and the Worker is a single same-origin front that proxies to
it. That is precisely the "T1 static serving" [[DOC-28]] §12 **T5** replaces with
request-time renders inside the Worker; T5 deletes the proxy and nothing above it
changes.

## What was built

- **`tools/generate/src/cli/webui.ts`** — component resolution + the missing-install
  diagnostic.
- **`tools/generate/src/cli/builder.ts`** — the dev origin: chrome document,
  `/webui/<pkg>/*`, `/api/sites`, `/api/publish`, and
  `/preview/<slug>/<channel>/*` for all three channels. Wired as `1c builder`.
  The browser **import map is derived from each component's `exports` map**, so an
  upstream file move surfaces as a throw here rather than a 404 in the browser.
- **`apps/control-app/src/index.ts`** — the same-origin front. Forwards verbatim;
  the origin owns routing, status and content types.
- **`apps/control-app/src/builder/`** — the browser composition, plain ESM with no
  build step (matching the components' own philosophy):
  - `config.js` — `APP_ID`, `SITE_TAB`, storage keys. **The one definition site for
    the tab label.**
  - `panel.js` — the display panel. A mode is an **entry in a map**; there is no
    switch to thread a new mode through, and `setMode` changes the frame's `src`
    rather than rebuilding the pane. A mode may supply `mount(host)` instead of
    `src(state)` for non-document content.
  - `toolbar.js` — renders the controls the **active mode declares**. A mode that
    shows no document simply does not list `open-new-tab`, so the strip never
    assumes an iframe beneath it.
  - `app.js` / `main.js` / `api.js` / `builder.css`.
- **`tools/generate/src/cli/serve.ts`** — the confinement / directory-index /
  extensionless-`.html` resolution is factored into `resolveStaticFile` and shared.
  The builder serves three static trees; one implementation means a traversal guard
  cannot be present on one and missing on another.

### Design decisions made during implementation

- **Edit mode ships registered, not absent.** It points at the `edit` channel and the
  pane switches to it; the edit *render* is T2 (REQ-116) and the editing is T3
  (REQ-117). Registering it now is what proves the mode contract with two real modes.
- **The site-selector's accessible name is injected, not written in `toolbar.js`.**
  The naming UAT caught a second `'Site'` literal there on first run — exactly the
  drift AC 3 exists to prevent. `toolbar.js` stays free of app-specific naming.
- **`initialSplit: 65`** — the display panel is the primary pane; chat is secondary
  and collapsible to a rail.

## Non-goals (unchanged, all held)

No editing of any kind · no chat (placeholder pane) · no request-time rendering ·
**no changes to any `lagrange-framework` component**.

## Superseded

`test_UAT_FC_REQ-1_control_app_returns_placeholder` and its file are removed. `/` on
`control-app` is the builder now; the placeholder existed only until something real
occupied the route. `test_UAT_FC_REQ-115_control_app_fronts_the_builder_same_origin`
replaces it.

## Test plan / evidence

19 UATs across two files, all passing. No webui component is mocked — mocking them
would prove nothing about the consumption route, which was most of this ticket's risk.

`tests/req115-builder-shell.test.ts` — the origin over HTTP and the Worker under
`unstable_dev`:
- `..._site_selector_lists_the_store` (AC 6)
- `..._view_mode_serves_a_real_rendered_site` — asserts byte-identity with the
  rendered file on disk (AC 6)
- `..._webui_components_are_served_not_vendored` — served bytes are byte-identical to
  what Node resolves, and the resolved path is outside this repo (AC 1)
- `..._chrome_import_map_is_derived_from_package_exports` (AC 1)
- `..._publish_creates_a_revision_through_the_existing_path` — history appended,
  revision locked, published channel rendered and served (AC 9)
- `..._static_trees_refuse_traversal`
- `..._control_app_fronts_the_builder_same_origin` (AC 2, AC 6)
- `..._absent_component_names_the_install_command` (AC 1)
- `..._no_webui_source_is_vendored_into_this_repo` (AC 1)
- `..._tab_label_has_exactly_one_definition_site` — greps `apps/`, `tools/`,
  `packages/` and asserts the single hit is the `SITE_TAB` declaration (AC 3)

`tests/req115-builder-composition.test.ts` — the real components mounted in jsdom:
- `..._shell_mounts_one_site_tab_and_hosts_the_panel` (AC 2)
- `..._split_shows_panel_and_chat_placeholder` — divider, collapse-to-rail, reopen to
  prior width (AC 4)
- `..._layout_state_persists_under_the_app_namespace` — every key prefixed
  `{appId}:`, and state survives a fresh mount (AC 5)
- `..._mode_switch_swaps_the_source_without_remounting` — pane and frame are the same
  nodes across View↔Edit↔View (AC 7)
- `..._registering_a_mode_is_an_entry_not_a_branch` — a mode the panel has never
  heard of, added from outside, works end to end (AC 7)
- `..._open_in_new_tab_matches_the_iframe_exactly` — across mode and site changes (AC 8)
- `..._site_selector_switches_the_displayed_site` (AC 6)
- `..._toolbar_controls_follow_the_active_mode`
- `..._publish_button_calls_publish_for_the_shown_site` (AC 9)

Regression scope run: `generate`, `public-site`, `naming`, `ci-workflow`,
`deploy-workflow`, `reconciliation-1c-cli-output-hygiene`, `req113-*` — all pass.
Typecheck clean for `apps/control-app`, `tools/generate`, `packages/framework`,
`packages/site-schema`.

**Pre-existing failures, not from this work** (verified identical on a clean tree):
`reconciliation-l1-fold-full-language`, `reconciliation-3probe-gate`,
`reconciliation-3probe-gate-evaluator`, `reconciliation-1c-astro-free-render` — four
tests failing on an unexpected `slot` leaf.

## Follow-up outside this ticket

- **[[DOC-8]] §9.5 / §13 Q1** should record the settled consumption route (doc-only
  change, no ticket needed).
- The installed snapshot is slightly behind `origin/xgd-working` — it predates
  `webui-split`'s vertical orientation. Not needed by T1 (the builder split is
  horizontal); a re-run of `bin/install` refreshes it when it is.

## Acceptance criteria

1. ✅ Route chosen (shared artifact store via upstream `bin/install`), implemented in
   `webui.ts`, no source copied — asserted by two UATs. Recording it in [[DOC-8]]
   §9.5 is a doc follow-up.
2. ✅ Shell mounts in `control-app` with a single tab id `site`; panel host-filled
   through `shell.getPanel('site')`.
3. ✅ Tab label defined in exactly one place, enforced by a repo-wide grep UAT.
4. ✅ Split renders display panel | chat placeholder, draggable divider,
   collapse-to-rail, reopen to prior width.
5. ✅ Split width, mode and collapsed side persist through a namespaced
   `shell.storage` handle; every key prefixed `{appId}:`.
6. ✅ View mode displays a real rendered site same-origin; the selector switches
   between all sites in `storage/sites/`.
7. ✅ A mode is an added entry; switching preserves the pane (same nodes).
8. ✅ "Open in new tab" href equals the iframe's src, across mode and site changes.
9. ✅ Publish produces a new revision via the existing `publish` path and the
   rendered result is served.


---

## REQ-44: Tooling hygiene: pnpm install after lockfile change; fail loud on out-of-sync node_modules

## Problem

`node_modules` can drift from the committed `pnpm-lock.yaml`, silently breaking the `1c` browser tooling. Observed this session: the REQ-38 `1c diff` work added `sharp` to `tools/generate/package.json` + the lockfile (commit `b76cf7f`), but the operator's working tree was never re-installed. `node_modules` lagged the lockfile, a reconcile pruned `playwright` (a *declared* dep), and `1c shot` / `1c diff` / `1c capture` all failed with `Cannot find module 'playwright'` (Vite logged "lockfile has changed"). A manual `pnpm install` fixed it and changed **no** tracked file — confirming the manifests were correct all along; only the on-disk install was stale.

Root cause: **declaring a dependency (package.json + lockfile) does not materialize it** — that needs `pnpm install`. When a dep lands via a workflow commit but no install follows, `node_modules` silently drifts.

## Scope

The original ask spanned two systems. It is split:

- **This ticket (1stcontact)** — the fail-loud preflight in the `1c` CLI. Defence in depth: it catches a stale tree whatever caused it (a workflow commit, a plain `git pull`, an interrupted install), and needs nothing from XGD.
- **XGD** — the "re-install after a commit changes the dependency manifests" rule. Filed separately against the xgd repo. XGD core must stay language-agnostic: it detects that *some* declared manifest path changed and delegates the actual install to the language plugin, which owns `pnpm`/`npm`/`pip`/`swift` knowledge.

## Ask (this ticket)

A cheap preflight in the `1c` CLI that runs before any command which needs a declared runtime dependency (`playwright`, `sharp`), and **fails loudly** with a clear "run `pnpm install`" message rather than crashing mid-render inside Playwright or Vite.

Two independent checks, both reported:

1. **Unresolvable declared dependency** — a package listed in `tools/generate/package.json` `dependencies` does not resolve from disk. This is the exact `Cannot find module 'playwright'` failure, caught before the browser launches.
2. **Lockfile drift** — `pnpm-lock.yaml` differs from the snapshot pnpm wrote at last install (`node_modules/.pnpm/lock.yaml`). This is an exact oracle, not an mtime heuristic: pnpm copies the lockfile verbatim on install, so byte-inequality means the tree was never installed at the committed lockfile.

Commands gated (each declares only what it actually loads, so an offline verb is never blocked by a dep it does not use):

| command | requires |
|---|---|
| `capture`, `shot`, `values-diff`, `adopt-gaps` | `playwright` |
| `crop` | `sharp` |
| `diff`, `gate`, `aligned-crops` | `playwright`, `sharp` |

`render`, `serve`, `builder`, `repro`, `refold`, `l1-gate`, `responsive-diff` and the structured-edit verbs are offline and stay ungated.

## Behaviour

- The failure is a `CommandError` with a new `ENVIRONMENT` code → exit **6**, so an AI caller branches on the outcome without parsing prose (the REQ-11 contract). In `--json` mode it is the standard `{"ok":false,"error":{code,message,hint}}` envelope.
- The message names *which* check failed and *which* packages, and the hint is the literal command to run.
- Drift alone fails: an install that is merely behind the lockfile is reported even when every dep still happens to resolve, because that is precisely the state that lets the next prune remove a declared package.
- Both checks are pure functions of `(repoRoot, resolver)`, so the UATs exercise them against synthetic trees with no install to mutate.

## Evidence
Surfaced during the faelan reproduction ([[REQ-21]]); related tooling: [[REQ-38]] (`1c diff`, added `sharp`), the generate CLI.


## XGD-side ticket

The install-after-manifest-change half is filed as **REQ-745** in the `lagrangefoundry/xgd` repo: "Re-install dependencies after a workflow commit changes a manifest (plugin-delegated, core stays language-agnostic)". It proposes two new `TestFrameworkPlugin` methods — `dependency_manifest_paths()` and `sync_dependencies()` — so XGD core detects the change from plugin-declared paths and delegates the install, learning nothing about pnpm.


## Plugin-side ticket

Also filed: **REQ-22** in `lagrangefoundry/xgd-plugin-sdk` — the plugin contract half of REQ-745. Note for this project: the worktree install runs `pnpm install --frozen-lockfile --prefer-offline --ignore-scripts`, so `sharp` and `playwright` postinstall steps (native binary, browser download) are skipped in XGD worktrees. That produces a tree where the package directory exists and its artifact does not — which the preflight above cannot see, because the module still resolves. REQ-22 carries that decision.