---
uid: bundle-e59210c5
id: BUNDLE-17
type: bundle
title: REQ-119 + REQ-122 + REQ-121 + REQ-126 + REQ-128 + 3 more
created_by: xgd
created_at: '2026-08-10T07:12:40.891360+00:00'
updated_at: '2026-08-10T11:03:16.292754+00:00'
completed_at: '2026-08-10T11:00:50.583051+00:00'
last_field_updated: result
status: free_and_reconciled
fields:
  commits:
  - working_sha: null
    reconcile_sha: null
    main_sha: 0198704b7e29db3c53cf569070042cec0eb467bc
  auto_merge_back: true
  priority: medium
  merged_at_commit: 0198704b7e29db3c53cf569070042cec0eb467bc
result: pass
---

# Bundle

This ticket bundles the following source tickets:


---

## REQ-119: Request-time draft and edit renders inside control-app

## What this builds

Move rendering from "already on disk" to **request time** — the draft preview and
edit channels rendered on demand from the definition, replacing T1's static serving.

Phase 1 ticket **T5** of [[DOC-28]] §12. Design: [[DOC-8]] §4.1.

## Why last

This changes **where** the render runs, not **what** it produces. Everything above is
built and proven against a real rendered page first, so if the runtime move surfaces
problems they are isolated to this ticket rather than tangled with the editor's own
correctness.

## Scope

- **Request-time render** of the draft preview and edit channels, reading the draft
  definition.
- **One render implementation, not two.** The seam where the L1/module render path is
  shared between the build-time renderer and the request-time path is the substance of
  this ticket ([[DOC-8]] §13 Q2). Two renderers would reintroduce exactly the drift the
  server-side-only decision exists to prevent.
- The heavy Node/Vite/Container-API compilation stays at **build time**.
- **Publishing is unchanged** — published sites still render at publish time and are
  served by `public-site`. This ticket touches the draft and edit channels only.
- Swap the iframe's source; **the display panel and toolbar must not change**
  ([[DOC-8]] §3.2 — a mode change swaps the source, it does not rebuild the pane).

## Non-goals

- **No change to published rendering or to `publish` semantics.**
- **No storage migration.** Moving the canonical store to D1 is [[DOC-12]] §7's phase 2
  and is its own work, even though this ticket is what makes it pressing.
- **No new editor capability.** If this ticket changes what the user can do, its scope
  has leaked.

---

## What was built

### 1. One render, in memory — `renderSiteFiles`

`tools/generate/src/render/render.ts` now exposes `renderSiteFiles(loaded, opts)`,
which touches no filesystem and returns every text artifact a channel contains
(`theme.css`, `capabilities.js`, `<slug>.html`, `index.html`) keyed by its path
relative to the channel root.

- `renderSite(loaded, outDir, opts)` — the build-time path — is now a **thin writer**
  over it. Same signature, same return value, same bytes.
- The request-time path is a **reader** of it.

There is nowhere left for the two to disagree: a byte is decided in exactly one
function, so adding an L1 axis or a head tag moves both paths together. `index.html`
also became a genuine alias of the home page's bytes rather than a second render of
them — deterministic before, identical by construction now, and half the work on the
request the iframe makes most.

### 2. Request-time serving — `tools/generate/src/cli/preview.ts`

`PreviewRenderer` resolves one preview URL to one artifact, rendering the channel on
demand. It reads definitions through a `DraftStore` seam — the same shape
`apps/public-site/src/site-store.ts` already uses, and the one [[DOC-12]] §7 names for
the D1 phase, so phase 2 replaces an implementation and nothing else.

- Renders are memoised per `(slug, channel)` and invalidated by a stamp over the
  definition's files, so a page view costs one render rather than one per file it
  pulls, and a change made **outside** the builder (`1c copy set`, a hand-edited page)
  is picked up on the next request.
- Path resolution mirrors the static server it replaces: directory → `index.html`,
  extensionless → sibling `.html` (REQ-113).
- Assets stay bytes: served from the definition's own `assets/`, confined to it.
- An **invalid draft now surfaces** as a 500 page naming the offending field. Serving
  off disk hid this — a broken edit left the last good render in place, so the iframe
  went on showing a page that no longer described the definition, indefinitely and
  with nothing to signal it.

### 3. The save path lost its render step

`POST /api/copy` used to call `cmdRender` **twice** — both channels, to disk — before
replying, because whichever one it skipped would go on serving the page as it used to
be. That is gone. There is no artifact left for a save to have to keep in step.

### 4. `published` is untouched

`/preview/<slug>/published/` still serves the build-time artifact off disk, from
exactly the bytes `public-site` will serve from R2. Deriving it from today's draft —
the easy way to make one path serve all three channels — would put unpublished work on
the published URL.

---

## Deviation from AC-1, and why

**AC-1 as written ("served by `control-app` at request time") is not reachable while
the non-goals hold, and was not attempted.** Stated plainly rather than quietly
narrowed:

- A Worker has no filesystem and no Vite/Astro transform. The render path resolves the
  framework's behavior modules from `.astro` sources through `bin/1c.mjs`'s Vite SSR
  server; workerd can run neither that nor a read of `storage/sites/`.
- Making the render execute *inside* workerd therefore requires the store to be
  reachable from workerd — which is [[DOC-12]] §7's **phase 2**, and this ticket's own
  non-goals say "no storage migration".
- So the ticket contains an internal tension: AC-1 needs phase 2; the non-goals forbid
  it. The part that is both reachable and load-bearing — request-time rendering, one
  implementation, no disk artifact, byte-identical — is what landed.

What remains of T5 is the **runtime relocation only**, and it is now a small change:
`control-app` gains a store binding and mounts the same preview handler. Recorded in
`apps/control-app/src/index.ts` and `wrangler.toml` so the next reader is not told the
proxy is about to disappear for reasons that no longer apply.

This also answers the contingency the ticket carried: **v1 runs against the file-backed
store locally** — all four sites live in `storage/sites/`, there is no D1, and `1c` is
the renderer per [[DOC-12]] §7 phase 1. That question was said to live at [[DOC-8]]
§13 Q3; [[DOC-8]]'s open questions are §10 and none of them is this one, so the
decision was not recorded anywhere. It is recorded here.

---

## Supersession — declared explicitly

REQ-119 deliberately changes behaviour two existing matrix entries pin, at the same
surface. **Intent conflict, not implementation conflict**: the intent below is
preserved; only its mechanism is superseded.

| AC | Pinned | Now |
|---|---|---|
| **AC-992** (`story-37a3921b`) | "a successful save re-renders BOTH ways of viewing the page **before it reports success**" — read off `storage/dist` | The save writes the draft and replies. Both channels render on request, so both show the edit. The claim — *an edit changes the page, not one rendering of it* — is unchanged; it is now observed at the origin, which is the bytes the operator's browser is actually shown. |
| **AC-1026** | "...and the **re-rendered page** shows it", read off `storage/dist` | Same: observed at the origin. |

Their UATs were updated in place to assert the surviving claim at the new observable:
`tests/reconciliation-copy-edit-write-path.test.ts` and
`tests/reconciliation-copy-edit-image-selection.test.ts`.

## Test plan

`tests/req119-request-time-render.test.ts` — 8 UATs, driven through the builder origin
over HTTP against a **real site** (`storage/sites/xgd`: two pages, an L1 document, a
`contact-form` behavior module, real assets). The scaffold was rejected as a fixture:
it has no module and no asset, so it would exercise neither the Astro container path
nor asset serving.

| UAT | AC |
|---|---|
| `one_render_implementation_backs_both_paths` | 3 — the writer's output on disk equals the render's output in memory, file set and every byte, for both channels |
| `request_time_bytes_are_the_build_time_bytes` | 2 — every artifact `1c render` writes, compared to what the origin serves |
| `channels_render_with_no_artifact_on_disk` | 1 — `storage/dist` deleted, both channels still answer, and nothing is written back |
| `a_definition_change_needs_no_render_step` | the staleness class, closed — an out-of-band edit shows on the next request, and unwinds |
| `an_invalid_draft_is_reported_not_papered_over` | the failure that used to be invisible |
| `published_still_comes_from_the_publish_render` | 4 — published tracks the revision, not the draft |
| `the_iframe_source_contract_is_unchanged` | 5 — same two URLs, built the same way, from untouched builder source |
| `a_preview_url_cannot_reach_outside_the_channel` | traversal, on the one path still resolved on disk |

AC-6 (editing works end to end) is covered by the existing REQ-117 / REQ-118 suites,
which now exercise the request-time path unchanged.

Full suite green apart from five pre-existing failures unrelated to this ticket
(`reconciliation-copy-edit-gesture-modal.test.ts` ×5, `req115-builder-composition.test.ts`
×1), confirmed against a clean tree.


---

## REQ-122: Builder chat panel: AI session, declared tool surface, per-site sessions

# Builder chat panel — AI session, declared tool surface, per-site sessions

Replace the `builder-chat-placeholder` in the builder's split with a live chat
panel backed by a Claude API session whose tool surface is the site's existing
structured edit functions.

## Behaviour

**The panel.** The split's secondary pane hosts `webui-chat` instead of the
placeholder text. It streams assistant turns, renders markdown, and shows tool
activity in the collapsible tool pane. The existing rail-collapse and
drag-to-resize behaviour is unchanged.

**One session per site.** Selecting a different site in the toolbar swaps the
chat to that site's session. The pane follows the display panel's site and has
no selector of its own to disagree with the toolbar's. Each site's conversation
is persisted and survives a browser reload: on mount, and on every site switch,
the panel is rehydrated from the session's stored transcript, so what the AI
remembers is what the operator can see.

A switch is a **remount, not a clear** — a fresh `mountChat` keyed
`builder-chat:<slug>`. That is not a workaround for the missing clear: it also
keys the composer's draft per site, so a half-typed message survives a trip to
another site and back.

**The AI can only change the site through declared tools.** It cannot write HTML,
CSS, JavaScript, or framework source, because no tool accepts them — the
forbidden list is enforced by absence (DOC-8 §5.2). No filesystem tool is offered
either. Every write goes through the same `edit.ts` functions the CLI and the
click-to-edit modal dispatch to, so validation, atomicity and the re-render are
unchanged and cannot be bypassed.

**Failures are reported, not swallowed.** A tool call the validator refuses
returns its `CommandError` code, path and hint to the model as a string, and the
model corrects within the turn. A missing API key, an unreachable origin, or a
model failure mid-turn surfaces in the panel as a message rather than a silent
no-op — and never at the cost of the stored conversation, which is read before
the backend is touched and returned alongside the reason it is frozen.

## The tool declaration

Tools are declared once, as data, in this project. Two renderings, both local:

- **`Tool[]`** for `FilesystemTools(policy, extraTools)` — the wire schema plus a
  model-facing description **composed** from the declaration rather than authored
  beside it. Enums are written once, in the schema, and rendered into the prose,
  so the restatement DOC-8 §5.3 requires cannot drift from the schema it restates.
- **Markdown** for the priming document — the surface described as a surface:
  what exists, what sequences work, what the errors mean, and a declared
  `absent:` list naming what deliberately has no tool and what to say instead.

The framework supplies the seams and none of the content: `Tool.description` is
an opaque string, `extraTools` is the registration seam, and `ContextSource` is
duck-typed, so the generated manual is a `ContextSource` implementation here
returning strings in memory. No upstream change is required for any of this.

### Core declarations

Read: `describe_site`, `list_pages`, `describe_page`, `get_copy`, `list_assets`,
`get_config`. Write: `set_copy`, `add_page`, `update_page`, `remove_page`,
`set_config`, `publish`.

These are the surface that exists today. Expansion is expected and the
declaration format is built for it.

## Priming: three layers, one hand-written

1. **The system preamble** (`ai/roles.ts`) — who the assistant is and how it
   works. It deliberately does not enumerate the tools: a hand-written inventory
   is the text that is still describing last month's surface six weeks later.
2. **The tool manual** — generated from the declarations, supplied through the
   `ContextSource` seam. The system KB, when it lands, arrives through this same
   seam without any of this changing shape.
3. **The reminder** — re-applied every turn through the backend's system channel,
   never written to the transcript. It carries only what decays over a long
   conversation: which site this is, no framework vocabulary, act rather than
   narrate.

## Site binding is structural

Three things are bound to a site, and none of them is a value the model could get
wrong:

- the **tools** close over the slug, so no tool can name another site;
- the **backend** is registered under `claude+site:<slug>`, because the registry
  is global and a backend instance carries its tool set — the shape the reference
  host uses for its `+fs` variant;
- the **session id** is derived (`site-<slug>`), so a reload resumes with no index
  to keep in step and nothing to lose.

## Transport

Three routes on the builder origin (Node), mirroring the reference host contract
in `components/ai/py/showcase/ai_host.py`:

- `GET  /api/ai/roles`   — the role and whether the assistant can run
- `POST /api/ai/session` — `{slug}` → the stored transcript, `ready`, and why not
- `POST /api/ai/prompt`  — `{slug, text}` → SSE of `text` / `tool_activity` / `done`

`/api/ai/prompt` takes the **slug, not a session id**. The id is derivable, so
carrying one over the wire would only add a value the client could send stale —
it would have to sequence "open, then send" correctly across every site switch
and get it wrong exactly once. Naming the site makes a turn self-sufficient.

A failure mid-turn is delivered **in** the stream: the headers are long gone by
the time a model call can fail, and a stream that simply stops leaves the panel
spinning forever.

The Node origin is where this lives because the *tools* are — every one bottoms
out in `edit.ts` over the operator's store. The `claude` backend is fetch-based
and its node built-ins are inside what `nodejs_compat` reaches, so the backend and
the tool loop move to workerd unchanged with the store at DOC-12 §7 phase 2.

The AI library is resolved through `sharedModuleUrl` (`webui.ts`), the same single
resolution point the components use — a bare specifier would find the shared store
from the main checkout and nothing from a linked worktree.

## Storage

Transcripts live at `storage/chat/<session>.md`, beside the store they are about
rather than in the library's machine-global default. Gitignored: operator-local,
and often verbatim business detail.

## Evidence

`tests/test_UAT_FC_REQ-122_chat_host.test.ts` — real HTTP against a real
`startBuilder`: real session manager, real role assembly, real tool loop, real
`edit.ts` writes, real SSE. One double, the Anthropic client, injected at the
`client` seam the library's backend is written to have injected. Covers: a turn
that calls a tool changes the draft and streams what it did; a refused call comes
back correctable within the turn and leaves the draft byte-identical; the
conversation persists and replays after a host restart; two sites are two
conversations over two tool surfaces; the model is primed with the generated
manual, bound to this site, offered no filesystem tool and no `slug` parameter; a
missing API key is explained without losing the conversation; a mid-turn failure
arrives in the stream.

`tests/test_UAT_FC_REQ-122_chat_panel.test.ts` — the installed `webui-chat`
mounted in the real builder composition, transport injected (jsdom cannot serve
HTTP, and the routes are proven above). Covers: the secondary is a live panel
bound to the shown site; switching site switches conversation and replays the new
site's transcript; a turn is sent for the site on screen; an unavailable assistant
and an unreachable origin are both explained in the panel.

## Adjacent changes

- `WEBUI_PACKAGES` gains `webui-chat` and its `webui-markdown` peer, so both reach
  the browser import map and stylesheet links.
- REQ-115's AC-4 UAT and story-e674c60a's AC-973 asserted on
  `.builder-chat-placeholder`. Both criteria are about the split's two halves, not
  what fills the second; the selector is updated to the live pane. This is REQ-122
  implicitly superseding the placeholder those criteria incidentally named.
- A route-coverage guard (AC-977) requires every route the origin declares to have
  a probe; the three new routes are probed in the shapes that need no model.
- Two pre-existing violations of the one-scope-literal guard (AC-960) are cleared:
  prose in `ai/declare.ts` (this ticket's own earlier commit) and a comment in
  `req121-copy-modal-elegance.test.ts`. Comment-only, no behaviour.

## Not in this ticket

- **Knowledge-base retrieval.** The priming path goes through the `ContextSource`
  seam so a KM-backed source drops in behind it, but no corpus exists yet — the
  system KB is a separate ticket. Until then priming is the role preamble plus
  the generated tool manual.
- **Structural L1 edits.** No tool sets an axis, adds a node or moves anything,
  because no such write path exists yet. The chat can change words, swap images,
  add and rename pages, set config and publish. "Make the hero darker" needs an
  L1 write tool, which is its own design. The declared `absent:` list says so, so
  the assistant answers cleanly instead of flailing.

## Requirements

`ANTHROPIC_API_KEY` must be present in the builder process environment. Absent,
the panel mounts, shows the site's history, and says exactly what is missing.


---

## REQ-121: The copy-edit modal, made elegant: themed chrome, app typeface, page-faithful editing box

# REQ-121 — The copy-edit modal, made elegant

Builds on REQ-117 (copy editing end-to-end). REQ-117 proved the loop works;
this makes it something you would want to use. Everything below is one intent —
the modal is one surface, and items 1–5 share a single root-cause fix.

## The root cause behind half of it

`defaultModal` finishes with `document.body.append(host)`
(`apps/control-app/src/builder/editor.js`). The shell mounts into `#app`, and
**every** design token plus the font family live on `.shell`:

    .shell { --shell-bg: …; --shell-accent: …; font-family: system-ui, …; }

The modal is therefore a *sibling* of the themed subtree. It inherits no font
(hence the browser default serif) and resolves none of its `var(--shell-*)`
references, silently falling through to the hardcoded hex fallbacks in
`builder.css`. The modal is not themed today; it merely resembles the theme, and
it does not follow a theme switch. Mounting inside the shell root fixes the font
and the palette together.

## Behaviour

1. **The modal is inside the theme.** It mounts within the shell root, so it
   takes the theme's palette and the app font, and it re-colours when the theme
   changes. No `--shell-*` fallback hex is load-bearing any more.

2. **One app typeface, theme-independent.** A single `--1c-font-ui` constant set
   once at mount via the shell's `font` token (upstream lagrange-framework
   REQ-68). Colour stays a theme token (`--shell-fg`/`--shell-muted`); family
   does not — a theme swaps a palette, not a typeface. Self-hosted from the
   Worker, two weights (400/600).

3. **No redundant chrome.** The `Edit text` heading is dropped for the `fields`
   modal — the dialog keeps its `aria-label`, which is what the heading was
   really for. The heading survives for the `error` and `message` modals, where
   it *is* the content. The `Text` field label is suppressed for the same reason
   (the modal names the segment; the column consumed ~40% of the width to say
   `Text`). The label stays in the descriptor — the CLI and the AI surfaces read
   the same `label`, and it remains the control's accessible name.

4. **CTAs follow the theme.** Cancel and Save take the app font, the theme
   accent, `--shell-radius`, and real hover/focus/disabled states.

5. **The editing box shows the copy as it appears on the page.** The bridge
   already hands the host the live element (`hit.element` in `edit-client.ts`),
   and the preview iframe is same-origin by construction — so the modal reads
   the truth rather than inferring it:

   - **Typography** from `getComputedStyle(hit.element)`: family, weight, style,
     letter-spacing, colour. The site's `@font-face` rules live in the *iframe's*
     stylesheet, invisible to the parent document; same-origin lets us enumerate
     `doc.styleSheets` and copy **only** the `@font-face` rules into a parent
     `<style>` — precise, bounded, and no leakage of the site's layout rules into
     the chrome.
   - **Background** by walking ancestors for the first non-transparent
     `background-color`. If that ancestor also carries a `background-image`, the
     image, its `background-size` and an offset `background-position` are
     mirrored so the real background lines up behind the text. Computed `url()`
     resolves absolute and same-origin. Falls back to the colour, then to the
     document background.
   - **No contrast fallback.** If the text is readable on the page it is readable
     in the box; that is the whole argument for mirroring rather than choosing.
   - **Size is clamped, deliberately.** Family/weight/style/colour/background are
     reproduced exactly, but the rendered size is clamped into an editing range.
     A 72px display headline reproduced faithfully is unusable in a dialog. The
     box previews *style*, not layout — the page is right there behind it for
     layout.
   - **The box is a box.** A visible border in the theme accent, slightly
     rounded (less than the chat entry's 24px), generous padding, a focus ring.

6. **The modal is sized for copy.** Today's `min(520px, …)` is too small for any
   real chunk of text. The panel grows substantially and the editing area is
   tall and resizable, while still never outgrowing the window — the footer, and
   therefore Save, must stay reachable (the existing `max-height` guard holds).

## Dependencies (upstream, lagrange-framework)

Blocking, by the operator's decision — implementation waits on both:

- **REQ-68** — `webui-shell`: `font`/`fontMono` design tokens. The shell pins
  `font-family` in its stylesheet and its token vocabulary has no typographic
  entry, so a host cannot set its own application font through the component's
  own extension point.
- **REQ-69** — `webui-fields`: host-settable control typography
  (`font-size` is pinned at 13px on `.fields`, so `font: inherit` on the control
  can never deliver a size; control radius and textarea `min-height` are
  likewise literals) plus a `layout: 'stacked'` option to drop the label column.

Both are needed for items 2, 3, 5 and 6 to be done *through* the components
rather than by out-specifying their stylesheets. Per DOC-8 §9.4.1 a gap is
closed upstream, never worked around.

## Out of scope

- The image modal's picker behaviour (REQ-118) — it inherits the chrome, font
  and CTA treatment here, but page-typography preview is not applied to `src`
  or `alt`, neither of which is page copy.
- Any change to `copyFieldsOf` field derivation, beyond leaving `label` alone.
- `webui-chat` and the chat pane placeholder.

## Verification

UATs named `test_UAT_FC_REQ-121_*`, against a real edit render in jsdom:

- `..._modal_mounts_inside_shell_and_resolves_theme_tokens`
- `..._fields_modal_has_no_heading_and_no_label_column`
- `..._error_modal_keeps_its_heading`
- `..._control_mirrors_page_typography_and_background`
- `..._control_font_size_is_clamped_to_editing_range`
- `..._font_face_rules_are_copied_from_the_preview_document`


---

# As built

Every item above landed. The decisions and discoveries that changed the shape of
it, recorded because the reasons are not recoverable from the diff:

## The typeface

**IBM Plex Sans**, self-hosted from the builder origin — two weights, latin +
latin-ext, four `.woff2` files totalling ~59KB in
`apps/control-app/src/builder/fonts/`. Served by the existing `/builder/` route,
so no routing change was needed; `serve.ts`'s MIME map gained `.woff2`/`.woff`/
`.ttf`, which it had no entry for. No CDN: nothing to be offline for, and no
third party told which sites the operator is editing.

Applied once, as `tokens: { font: APP_FONT }` on `mountShell` — the shell's own
token path (upstream REQ-68), never a stylesheet override of `.shell`.

## The background is NOT an ancestor walk

The first implementation climbed `parentElement` until something painted. That
is the textbook answer and it is **wrong for this renderer**: an L1 fold emits
absolutely positioned boxes (REQ-88), so a hero photograph is routinely a
*sibling* layer beneath the copy rather than an ancestor of it. On
`gigabytealchemy/home` the walk sailed past the photograph and landed on a
neutral wrapper carrying a cream fill — gold copy over a dark photograph
previewed as **gold on cream**, which is both wrong and unreadable. A preview
whose purpose is showing contrast must never produce that.

It now uses `document.elementsFromPoint` at the run's centre, which asks the
question actually being asked — *what is under this pixel* — and answers it in
paint order. The stack is collected down to the first opaque fill and rendered
as one absolutely-positioned layer per painting element, bottom-most first, each
at its own element's dimensions and offset back by the text's position within
it, clipped by the box.

Sizing each layer to its *source* element (rather than copying the shorthand
onto a differently-sized box) is what makes it exact: every layer resolves
against the dimensions it resolved against on the page, so a `cover` photo's
crop and a gradient's stops are the real ones, with no intrinsic-size maths and
correct for layer stacks this code never has to understand. Verified in Chrome
against `gigabytealchemy/home`: two layers — an opaque `rgb(3,7,23)` base, then
a `linear-gradient(...) , url(...)` scrim-over-photograph — composited in the
page's own order.

The ancestor walk survives as the fallback, which is correct when nothing is
absolutely positioned and is the only thing available with no layout at all (a
headless run measures every rect as zero).

## The form opens ready to type

`mountFields` renders a view that becomes a control on click. For a one-field
editing dialog that is a wasted click, and — more to the point — it undercuts
the reason the heading could go: a box you can obviously type in needs no label
saying "Edit text", and until the control exists the box is not one. The modal
now fires the component's own click-to-edit gesture on a lone field. Guarded to
exactly one field: with two (an image's `src`/`alt`) there is no "the" field.

## Known gap — upstream REQ-70 (filed, not blocking)

`.fields` flips to a two-column grid at 44rem, and REQ-69's `stacked` drops only
the *label* column. So in an 880px box a single field lays out at 409px with
425px of nothing beside it (measured). The modal is otherwise complete; the box
will fill its width when that lands. REQ-70 also carries the `autoEdit` ask that
would retire the synthetic click above.

## Incidental fixes made here

- `reconciliation-copy-edit-gesture-modal.test.ts` (REQ-117) was failing all
  five criteria on `main` before this ticket, in isolation and under load. Cause:
  `settle()` waited one macrotask for what is a real HTTP round trip, and late
  dialogs then leaked into the next test (AC-1001 read AC-994's form). Replaced
  with a bounded poll for the dialog. AC-994's "shows the words" assertion now
  reads the control's value rather than the dialog's `textContent`, because those
  words are a form value now instead of a span — the criterion is unchanged.
- `serve.ts` MIME map: `.woff2`, `.woff`, `.ttf`.

## Not fixed here (pre-existing, unrelated, reported)

- `req115-builder-composition.test.ts` →
  `test_UAT_FC_REQ-115_open_in_new_tab_matches_the_iframe_exactly` fails on
  `main` and still fails: the toolbar link does not follow `panel.setSite()`.
  Different surface, different ticket.
- `GET /preview/1stcontact/draft/` answers 500 in the running builder. A data or
  render problem in that site, not the editor.

## Verification

`tests/req121-copy-modal-elegance.test.ts` — 9 UATs against real rendered bytes,
a real builder origin and the installed components. Plus a real-browser pass
(Chrome via Playwright) against `gigabytealchemy`, which is where the ancestor-walk
defect and the two-column defect were both found — neither is visible headlessly,
because jsdom lays nothing out.


---

## REQ-126: Build the L1 control surface API: declared schemas, error taxonomy, addressing contract, version

# Build the L1 control surface API

Bring the L1 control surface up to what **DOC-30** (`doc-aca10bce`) specifies. Scope comes from
that document's gap list and is not fully knowable until it is written — this request is
deliberately created ahead of its own scope so the work is not absorbed silently into the
tooling configuration request, where it would be invisible.

## Behaviour

The operations that change or describe a site become an API: stable names, declared input and
output schemas expressed as data, a published error taxonomy with caller-facing meanings,
declared read/write classification, a stated addressing contract, maintained per-operation
documentation, declared absences, and a version.

Consumers — the `1c` CLI, the click-to-edit modal, and the AI tool surface — continue to reach
the same single write path. This is a formalisation of `edit.ts`, not a second surface beside
it, and no consumer should gain a way to bypass validation, atomicity or re-render.

## Dependency note

Blocks the tooling configuration request, which projects its entire surface from this API.

---

## Scope, as settled from DOC-30

Since DOC-30 was written the upstream Toolbox has **shipped** (lagrange-framework DOC-20 /
REQ-74), and its JS peer is in the shared artifact store at `@lagrangefoundry/ai/core`. So this
is no longer "invent an API discipline"; it is **declare the L1 control surface as a Toolbox
surface**. Most of the machinery — schema validation, policy gating, group expansion, manual
projection, wire projection, provenance marking, audit — is upstream and is not written here.

The irreducibly local work:

1. **`ai/l1-surface.json`** — the declaration, as data on disk. Envelope (`surface: l1`,
   format `version`, `title`, `overview` carrying the worldview and the render-scoped
   addressing rule), 16 operations covering **everything `edit.ts` can do** (not only the
   AI-facing subset), parameter types (`l1_address`, `page_id`, `config_key`), return shapes,
   the six `ErrorCode`s with `ERROR_MEANINGS`' text promoted to the surface, effect-homogeneous
   capability groups, sequences, and absences.
2. **`ai/toolbox.ts`** — `L1Toolbox`, a thin class over `edit.ts`, constructed with slug +
   store context. One method per declared operation. No validation, no error rendering, no
   policy: all of that is the Toolbox's.
3. **`ai/instances.json`** — the instance configuration for the builder chat role. The grant
   narrows the surface: copy, pages, config and publish are granted; **asset add/remove is
   declared but not granted**, which is what lets it be documented and validated while staying
   out of the chat session.
4. **Provenance and audit** — every read declares `provenance: untrusted` (site copy is other
   people's prose re-entering the model's context, and `inproc` would default it *trusted*);
   an audit sink records every call against the site.
5. **CI** — the SDK-free standalone validator checks the declaration and the configuration at
   author time, in this repository.
6. **Deletions** — `ai/declare.ts` in full, `tools.ts`'s declaration bodies, the local manual
   renderer, and `guarded()`'s error rendering.

### Decisions taken

- **Site binding stays construction-time** (DOC-30's option 2). No `slug` parameter exists on
  any operation, so there is no bad value to refuse — strictly stronger than a scope predicate,
  and it is the guarantee REQ-122 already bought. Construction-scoped bindings are a finding to
  raise upstream, not a reason to weaken this.
- **The surface declares its own version** (`surface_version`) beside the format `version`.
  DOC-20's envelope has no field for it, so it is carried as data and read locally; raised
  upstream as R6.
- **Worked examples move into operation `description`.** DOC-20 has no `examples:` field, so
  their testability is lost — recorded as a residual, not worked around with a parallel format.

### What must not regress

`edit.ts` stays the single write path. A toolbox class is a caller like any other; the CLI, the
click-to-edit modal and the AI surface continue to reach the same functions, and nothing gains
a way past validation, atomicity or re-render.

## Test plan

`tests/test_UAT_FC_REQ-126_l1_surface.test.ts` — the declaration validates through the
framework's own validator; the whole surface is declared while the chat grant is narrower; a
read-only grant cannot reach a write and its manual never mentions one; parameters are
validated before any value reaches `edit.ts`; site content comes back provenance-marked; every
call is audited; the addressing contract is stated once; real edits land on the draft through
the Toolbox and a refusal leaves it byte-unchanged.

`tests/test_UAT_FC_REQ-122_tool_surface.test.ts` — rewritten onto the Toolbox (its `declare.ts`
unit assertions go with `declare.ts`; its behavioural workflows stay).


---

## REQ-128: Background image selection: the container segment's backgroundImageUrl in the phase-1 picker

## What this builds

**Background image selection** — click a painted container, pick which image sits behind
it. The same "which image goes here" question [[REQ-118]] answered for `image` nodes,
asked of the `backgroundImageUrl` axis.

Follows [[REQ-118]] (T4 of [[DOC-28]] §12). Reuses that ticket's derivation, its enum
control, its asset listing, its `1c copy get|set` / `/api/copy` surface. No new command,
no new route, no editor change.

## Why this is a separate ticket, not REQ-118 finishing

REQ-118 delivered its scope in full: 7 ACs, 11 UATs, `free_and_reconciled`. Background
images were never in it. [[DOC-28]] §6.2's segment table puts the container segment's
"background colour/image" in **phase 2**, and §12 records that "phase 1 is functionally
complete at T4" — REQ-118 closed phase 1 as specified. Its own test suite even took the
painted container as its example of *a segment with nothing to edit yet*.

So this is not a gap in REQ-118. It is a **re-phasing**: phase 2's gate turns out to be
about *colour*, not images.

- Background **colour** needs the site palette ([[REQ-114]]) and a colour-valued control
  (`xgd-framework` [[REQ-55]]), neither of which exists. Genuinely phase 2.
- Background **image** needs neither. It is a handle from a closed list of site assets —
  the exact control REQ-118 built, over the exact listing REQ-118 built.
- [[DOC-28]] §13 **Q5** (still open, and the blocker on framing) asks about image
  *params* — crops and scrims — against the capture/fold vocabulary. A background image
  *handle* is not a param, so Q5 does not gate this.

## Today's behaviour (before this change)

`backgroundImageUrl` is one axis of the shared surface group (`l1/schema.ts`, REQ-98),
carried by every box-rendering kind. A node painting one stamps as a **container**
segment, not an image one:

```ts
// packages/framework/src/l1/render.ts — segmentKind()
case 'box':
case 'container':
  return surfaceDecls(node.axes ?? {}).length > 0 ? 'container' : null
```

`copyFieldsOf` returned `null` for those kinds, so the segment outlined on hover and the
click landed on `editor.js`'s "Nothing to edit on this container segment yet."

## Acceptance criteria

- **AC-1** — Clicking a container segment whose node carries `backgroundImageUrl` opens a
  picker of the site's image assets, exactly as an image segment does.
- **AC-2** — Choosing an asset updates `node.axes.backgroundImageUrl` and the re-rendered
  page's `background-image`.
- **AC-3** — The edit travels the same `copy get`/`copy set` surface and the same
  whole-definition validator as REQ-118's image edit and the AI's `config set`. No second
  write path.
- **AC-4** — The node's **current** handle is always among the options, for REQ-118's
  reason: a folded reproduction can hold a handle the mirror never got, and a `<select>`
  whose options omit its own value renders with the first option selected.
- **AC-5** — A handle outside the offered options is refused at the field, whole-or-
  nothing, by `applyCopyFields` — not merely by the client widget.
- **AC-6** — Choosing a background bakes nothing: every other axis on the node, and every
  byte in `draft/assets/`, is unchanged across the edit.
- **AC-7** — A container segment carrying paint but **no** `backgroundImageUrl` still
  reports nothing to edit. Adding a background where there was none is out (see below).

## Design decisions

**Selection only — no "none" option.** If a box's only paint *is* its background image,
offering removal means `surfaceDecls` drops to zero on the next render, the node stops
being a segment, and it vanishes from the editor with no way to re-add it. A `required`
enum with no empty option makes that unreachable by construction rather than by a special
case. Removal stays the AI's job, which already addresses the axis directly.

**Change, never add.** An unpainted container is not a segment at all, so it has no
address to click — the picker can only ever *change* a background on a box that already
paints something. That is derived segmentation's known edge ([[DOC-28]] §6.4) seen from
the other side; widening what counts as a container segment is a bigger question than
this ticket and is deliberately not opened here.

**The container segment gains a field; the copy and image segments do not.** Since REQ-98
a `text` or `image` node can carry `backgroundImageUrl` too. Exposing it there would make
the copy modal a paint surface and blur DOC-28 §6.2's kind→segment map. The axis is
offered on the segment the user actually clicks to mean "this panel".

## Implementation as it stands

Three source files. The whole change is in the **derivation**; the claim that this is not
a second mechanism is structural, not asserted.

**`packages/site-schema/src/l1/edit.ts`** — the derivation and the write.

- `backgroundHandleOf(node)` — the handle a painted surface carries, or `undefined`.
  Gates on `kind` being `box`/`container` and on the value being a **non-empty** string.
  The empty string is deliberately not a background: the renderer's `cssUrl` emits nothing
  for it, so offering a picker there would be offering to *add* one (AC-7's rule seen from
  the value side rather than the segment side).
- `copyFieldsOf` gains a branch returning **one** field — `backgroundImageUrl`, label
  `Background image`, `type: 'enum'`, `required: true`, options from the shared
  `imageChoices(assets, current)` REQ-118 already uses. `imageChoices` is what delivers
  AC-4: it unions the site's handles with the node's own, so an off-disk handle is always
  in its own picker. Nothing else of the surface group is exposed.
- `applyCopyFields` gains a matching branch that assigns into the **existing** `axes`
  object rather than replacing it — which is what makes AC-6 true of the whole node, not
  just of the asset store. AC-5 needs no new code: the pre-existing enum-membership check
  refuses any handle the derivation did not offer, including the empty string, a
  `.woff2`, and `javascript:`.

**`tools/generate/src/cli/edit.ts`** — `segmentOptions` now supplies the asset listing for
`PICKER_KINDS = {image, box, container}` instead of `image` alone. One listing serves both
pickers, so what a segment can sit *in front of* and what it can sit *behind* cannot
disagree about what the site has. Text runs still skip the directory read.

**`tools/generate/src/cli/ai/l1-surface.json`** — the L1 control-surface declaration
([[DOC-30]]) is documentation of this same write path, so three strings are corrected to
stay true: `set_copy`'s `values` description, the `WriteCopy` group description, and the
"changing how something looks" absence, which now carves out the background handle and
states plainly that *adding* a background is still not possible.

**No client change.** `editor.js` already branches on `loaded.fields.length`, so a
container that now returns a field opens the fields modal instead of the "nothing to edit"
message, with no edit there. `previewOf` correctly returns `null` for a non-copy segment —
a background handle is metadata about the page, not words on it.

**No renderer change.** `segmentKind` already stamps `container` for any box that would
emit a surface declaration, and `backgroundImageUrl` is one of those. The address the
picker writes to is the address the render already hands out.

## Test plan and results

`tests/req128-background-image-selection.test.ts`, mirroring REQ-118's two-suite shape:
the definition + CLI half over the bytes `1c render --edit` writes, and an origin half
against a real `startBuilder`. **10 UATs**, all named `test_UAT_FC_REQ-128_*`, all passing.

Coverage is one-per-AC plus the origin re-checks:

| UAT | AC |
|---|---|
| `clicking_a_painted_container_offers_a_picker_of_the_sites_images` | AC-1 |
| `choosing_an_asset_updates_the_axis_and_the_rerendered_background` | AC-2 |
| `background_edits_run_the_same_whole_definition_validator_as_the_ai_surface` | AC-3 |
| `an_offdisk_handle_is_still_among_its_own_options` | AC-4 |
| `a_handle_the_site_does_not_have_is_refused_and_nothing_is_applied` | AC-5 |
| `choosing_a_background_bakes_nothing_and_moves_one_structured_field` | AC-6 |
| `a_painted_container_without_a_background_still_exposes_nothing` | AC-7 |
| `the_modal_reads_its_background_picker_from_the_same_copy_transport` | AC-1/AC-3 at the origin |
| `saving_a_background_choice_rerenders_both_channels` | AC-2/AC-3 at the origin |
| `a_rejected_background_comes_back_as_a_field_scoped_400` | AC-5 at the origin |

**Discrimination checked**, not assumed: with the two source changes stashed, 9 of the 10
fail. The one that still passes is AC-7 — correctly, since it asserts the behaviour that
did **not** change.

The origin suite is deliberately **ungated** on `WEBUI_INSTALLED`, for REQ-118's reason:
every test in it is a plain fetch and `startBuilder` binds a port without touching a
component.

**Regression scope run**: `req118-image-selection`, `req117-copy-editing`,
`req117-edit-loop`, `req117-modal-dismiss`, `req116-edit-render`,
`reconciliation-copy-edit-{write-path,image-selection,gesture,gesture-modal}`,
`chat9-edit-hooks`, `test_UAT_FC_REQ-126_l1_surface`, `test_UAT_FC_REQ-122_tool_surface`.
Then the **full suite**: `192 files, 1364 tests — 14 failed, 1283 passed, 67 skipped`.

**All 14 failures are pre-existing and unrelated**, verified by re-running the four
failing files with this ticket's source changes stashed and getting an identical
baseline (3 + 1 + 2 + 8):

- `reconciliation-copy-edit-gesture.test.ts` — 3, browser timeouts on
  `.builder-modal .fields-value`
- `req115-builder-composition.test.ts` — 1
- `req117-edit-loop-browser.test.ts` — 2
- `test_UAT_FC_REQ-122_chat_host.test.ts` — 8

**Correction to this ticket's earlier note**: the predicted pre-existing failure at
`reconciliation-edit-render-channel.test.ts:316` (`<body data-fc-edit>` vs
`<body data-fc-edit data-fc-page="home">`) is **not** failing on this tree — that file
passes. The four files above are the actual baseline.

`pnpm -r typecheck` clean across all three packages.

## Non-goals — carried forward from REQ-118, still deferred

- **Framing controls** (crop, scale, scrim, rotation, edge effects, free positioning) —
  still blocked on [[DOC-28]] §13 Q5, verified open as of this ticket. The editor must
  write the fields the capture/fold pipeline already folds into L1, not a parallel
  vocabulary. AC-6 pins the surrounding axes through a swap — the fixture's node carries
  a fill, radius, opacity and an `overlay` precisely so "nothing else moved" is measurable
  — so the place those parameters will live stays protected.
- **Asset upload** — the picker lists what exists.
- **Background colour** — genuinely phase 2, gated on [[REQ-114]] + `xgd-framework`
  [[REQ-55]].
- **`pattern`, `overlay`, `surfaceGradient`** and the rest of the surface group — same
  phase-2 reasoning as colour; this ticket adds one axis, not a paint panel.

## Known limitation — inherited, and more acute here

`webui-fields`' enum control renders each option as its value verbatim, so the picker
shows `/assets/hero.png` rather than a name or a thumbnail. Per [[DOC-8]] §9.4 a component
gap is closed upstream, never wrapped here. It bites harder for backgrounds than for
inline images — a background is exactly the case where the user is choosing by *look* and
the filename tells them least — which strengthens the existing upstream ask alongside
REQ-55 rather than changing what this ticket does.


---

## REQ-127: L1 tooling configuration over the control surface API (deletes declare.ts)

# L1 tooling configuration over the control surface API

Replace the builder's hand-built AI tool surface with a **configuration** over the L1 control
surface API, dispatched through the framework tooling object.

Depends on the L1 API (DOC-30, `doc-aca10bce`) and on the framework tooling object
(`ticket://lagrangefoundry/lagrange-framework/DOC-20`, and its build request REQ-74 there).
Best sequenced after at least one framework refactor has landed, so the tooling object has been
proven against a second consumer rather than shaped by this one.

## Behaviour

The builder's AI reaches the site through operations selected from the declared L1 API, under a
declared policy, bound to an in-process call type — shelling out to reach a store the process
is already holding is not acceptable.

Configuration carries **selection, policy and binding only**. Descriptions, schemas, enums,
error meanings and declared absences project from the API. No prose is written in the config;
if any is needed, that is a finding against the API declaration, not a licence to write it here.

Existing guarantees are unchanged and must be demonstrably so: the AI still cannot write HTML,
CSS, JavaScript or framework source, because no operation accepts them; every write still goes
through the same validated path as the CLI and the modal; a refused call still returns its code,
path and hint so the model corrects within the turn.

Two things get **stronger**. The site binding, today a closed-over slug, becomes a declared
scope predicate the tooling object enforces. And the read/write split, today a `writes` flag
that nothing checks, becomes enforced classification.

## Removal

`tools/generate/src/cli/ai/declare.ts` is **deleted**. Its renderer half becomes the framework's
projection; its handler-binding half becomes configuration; nothing remains. Per no-legacy-modes
this is a removal, not a parallel path — there must not be a second way to declare a tool
surface in this project when the work lands.

`tools.ts` is reduced to declaration and configuration, with no hand-written `Tool` construction
and no hand-written manual.


## Scope correction (2026-08-09)

REQ-126 (commit `02a9af06`) delivered almost all of the above: the declaration as data
(`ai/l1-surface.json`), the binding (`ai/toolbox.ts`), the configuration (`ai/instances.json`),
enforced read/write classification, and the deletion of both `declare.ts` and `tools.ts`. Nothing
in the tree still references the old declaration machinery.

One clause was left: "the site binding becomes a declared scope predicate the tooling object
enforces". **That clause is withdrawn, and replaced by the work below.**

A scope predicate would give the model a `slug` parameter it must get right on every call —
re-opening an error class that today does not exist, because no operation declares a `slug` at
all. DOC-30 makes the same argument (its option 1 "trades a real safety property for a
declarative one"). The binding does not need declaring; it needs **locating**.

### Behaviour

The site binding lives in the **session**, established once when the session is created, and no
layer above the host names a site.

Neither dependency asked for a slug. `mountChat` takes an opaque `id` and `sendPrompt(text)`;
`SessionManager` takes a `sessionId`. Both are single-session by design. The slug was inserted by
this project in four places, on a rationale recorded twice — `host.ts` and `builder.ts:270`:
"carrying a session id over the wire would add a value the client could send stale". Avoiding a
stale id by giving the browser a **site identity** inverted the layering: every turn re-asserts
which site it is for, and `chat.js` carries a `generation` token whose only job is to stop a late
answer landing in a window that has since switched sites.

After this ticket:

- `createChatPanel` is handed a session and knows nothing else. No `setSite`, no `site`, no slug,
  no `openSession` call of its own — and no generation token, because it receives an already-open
  session synchronously instead of performing the async open.
- `POST /api/ai/prompt` takes `{sessionId, text}`. The host resolves that id against sessions it
  minted; an id it did not mint is refused rather than treated as a free-form key. A session id
  is exactly the kind of value that invites being trusted as one.
- `POST /api/ai/session {slug}` is unchanged, and is the ONLY place a site becomes a session. This
  is 1c triggering session creation: the toolbar owns the site selector, so `app.js` legitimately
  knows the slug, opens the session on a site change, and swaps it into the panel. The async guard
  moves there, where the async now is.
- `sessionIdFor` stops being a mapping three layers recompute and becomes the host's own.

Unchanged and demonstrably so: the model still cannot write HTML, CSS or JS; every write still
goes through `edit.ts`; refusals still carry code and hint; the audit still records every call.

Consequence worth stating: the panel's draft-persistence key moves from `builder-chat:<slug>` to
`builder-chat:<sessionId>`, so an unsent draft typed before the upgrade is not found after it.
Transcripts are server-side and unaffected.

### Not in scope

The upstream Toolbox finding stands as REQ-126 raised it: construction-scoped bindings are not
declarable in DOC-20's field set. This ticket makes that irrelevant here rather than fixing it
there.


### Folded in: the transcript-archive migration

Verifying the above surfaced a PRE-EXISTING breakage, confirmed at HEAD with this ticket's work
stashed: all 8 `test_UAT_FC_REQ-122_chat_host` UATs failed with `lib.FileStore is not a
constructor`. Upstream `@lagrangefoundry/ai` had replaced the whole-object session store with an
incremental transcript-archive port. It is a dependency migration rather than this ticket's
subject, but REQ-127's origin half is unverifiable without it, so it is deliberately carried here
(operator's call) rather than split out:

- `FileStore` → `FileArchive`; `manager.store` → `manager.archive`, with `load` / `list` async.
- `attach` uses `getSession` rather than `resume`. `resume` reconciles the junction and is no
  longer idempotent, so re-resuming an already-live session re-folds a record stream that has
  already been folded ("fold started mid-stream"). `getSession` resumes only when the session is
  not live.
- **`logDir` is now passed explicitly.** A session has two tiers — the junction is canonical while
  it runs, the archive is what it drains into — and `logDir` defaults to `~/.xgd/sessions/live`, a
  MACHINE path. Left alone, one conversation lives half in the workspace and half in the home
  directory, and two checkouts share a junction keyed only by slug. That is exactly what
  `sessionsDir` was written to prevent, so both tiers now sit under it.

Three REQ-122 host assertions were also stale against REQ-126 and are updated to the behaviour
REQ-126 intended: the refusal text (per-call `path` / `hint` no longer reach the model — the
Toolbox renders the declared class meaning, which REQ-126 raised upstream), and two manual /
tool-description literals that now project from the declaration rather than from a local renderer.

### Evidence

- `test_UAT_FC_REQ-127_session_binding` — 7 UATs, real HTTP against a real `startBuilder`.
- `test_UAT_FC_REQ-127_session_panel` — 7 UATs, real `webui-chat` in jsdom.
- `test_UAT_FC_REQ-122_chat_host` / `chat_panel` / `tool_surface`, `test_UAT_FC_REQ-126_l1_surface`
  — 44 passing across the six AI suites, up from 8 failing before this work.
- Full suite: 1307 passed. The 6 remaining failures (`req115-builder-composition`,
  `req117-edit-loop-browser`, `reconciliation-copy-edit-gesture`) are byte-identical at HEAD with
  this work stashed — pre-existing, in the edit-modal/browser area, untouched by this ticket.


---

## REQ-129: L1 authoring on the control surface: verbatim get_l1 / set_l1 (click-to-edit modal unchanged)

# L1 authoring on the control surface: verbatim `get_l1` / `set_l1`

The AI can change words in an L1 tree it cannot compose. Give the control surface read and write
symmetry around one address, so the assistant can author L1 the way Claude already authors it in
the repository — and leave the operator's click-to-edit modal exactly as it is.

Depends on the declared surface (REQ-126) and the envelope validator on the authoring path
(REQ-107). Neither needed changing.

## Why

REQ-126 declared the control surface faithfully: 16 operations covering everything `edit.ts` can
do. `edit.ts` contains no reference to `axes`, `children`, `splice` or `insert` — its entire L1
reach is `editCopySet`, over the four fields `copyFieldsOf` exposes (`text`; `src`/`alt`;
`backgroundImageUrl`). So the AI inherited a four-field copy editor, accurately.

That was the right surface for the gesture it was modelled on — a person clicking a heading and
typing words. It is the wrong surface for composing a page.

Measured on `storage/sites/xgd/draft/pages/home.json`:

| | |
|---|---|
| L1 nodes in the tree | 122 |
| visible through `describe_page` | 67 (54%) |
| nodes carrying `axes` | 86 — exposed nowhere |

xgd.dev was built by Claude writing this JSON directly and extending L1 itself when it hit a
ceiling. Its nav bar is three L1 nodes carrying the REQ-106 link role. Nothing reachable from the
chat could produce that, which is why the assistant correctly refused to add a menu.

## What was built

### The read side — two tiers, because this is a context-economy problem

xgd's home page is 3,872 lines; gigabytealchemy's is 7,292. The model must not pull a document to
change a heading.

- **`describe_page(page)` widened to emit every node.** `walkSegments` no longer filters on
  `copyFieldsOf`. Each entry is `{path, kind, label}` plus `{module, slot}` when scoped. No axes
  reach the model here at all, so the map's size is bounded by node count rather than by how
  richly the page is styled. Its job changed from "what can I edit" to "where is everything".
  - `Segment.values` (a field map) is replaced by `Segment.label` (a string) — the text for a
    text run, the alt or src for an image, the control name, the slot name, or
    `"row, 3 children"` for a container. Enough to recognise a node among its siblings, and no
    more.
- **`get_l1(page, path)`** — `editL1Get`. The subtree at an address, verbatim: `axes`, `children`,
  `link` role, everything, exactly as stored.

### The write side

- **`set_l1(page, path, node)`** — `editL1Set`. Replaces the subtree at that address. Adding and
  removing are replacing a group with a group that has one child more or fewer; there is no
  insert or delete operation, and the surface's `sequences` say so.
- **`replaceL1Node(roots, path, replacement)`** lands in `packages/site-schema/src/l1/edit.ts`
  beside `resolveL1Node`, so the one addressing rule stays stated once. Two walks would be two
  chances for "the address a listing hands out is the address a write resolves" to stop holding.
- **`writeSegmentRoots`** in `edit.ts` is `segmentRoots`' pair: `segmentRoots` returns a live
  array for a repeated slot and a fresh one-element list for `[doc.root]` or a single slot, so a
  caller that replaced an entry cannot know whether its page already reflects the change.

**Verbatim is a decision, not a default.** `get_l1` returns what is stored, unresolved: palette
refs stay refs, responsive tracks stay tracks. The model must be able to write back what it read,
and a resolved view cannot be written back. Meaning comes from `describe_site`, which already
returns the whole base.

Addressing is REQ-126's contract unchanged. Validation is `validateOrThrow` unchanged — no new
validation was written.

### The declaration

`get_copy`/`set_copy` retire from the AI surface (`l1-surface.json` + `toolbox.ts` bindings):
`get_l1`/`set_l1` subsume them, and two ways to do one thing on one surface is what
no-legacy-modes forbids. Consequent changes:

- shape `copy_target` → `element`; `page_map`'s `segments` re-described;
- group `WriteCopy` → `AuthorPages`, and `instances.json`'s caretaker grant with it;
- `sequences` rewritten around read-then-replace, plus an explicit add/remove sequence;
- the "changing how something looks" and "adding, removing, moving or reordering" **absences are
  deleted** — they are no longer true. A new absence records that whole-document submission is
  deliberately absent;
- `surface_version` 1 → 2;
- `roles.ts`'s preamble no longer says "no tool will accept them" (a tool now accepts an object);
  it says the vocabulary is closed and a malformed change is refused whole.

## The operator's editor is untouched — demonstrated, not assumed

`editCopyGet`, `editCopySet` and `copyFieldsOf` are unchanged. Both invariants are exercised over
the real `/api/copy` transport, on subtrees the assistant authored:

1. The modal opens on an AI-authored `text` node, derives the same descriptors, saves — and the
   assistant's `axes` survive the operator's edit.
2. An AI-authored `container` yields an empty field list, not a form.

## Security — the guarantee moved, deliberately

"The AI cannot write HTML, CSS or JavaScript" used to hold because **no operation accepted them**.
It now holds because **L1's schema is closed**: `.strict()` objects, closed enums, hex-only
colours, a URL-scheme allowlist, no raw-CSS hole by policy, and the renderer's independent
`isSafeUrl` at every URL sink. Any hole found in L1's closure is a security finding against this
ticket, not a capability gap.

Measured rather than argued — each of these is refused whole, with the draft byte-unchanged: a
markup field, a style field, `javascript:` through the link role's `href`, `javascript:` through
an `image.src`, an undeclared kind (`iframe`), and a mistyped axis value.

## Upstream finding — refusal specificity

`validateOrThrow` reports the offending JSON pointer, and a `1c` user sees it. A Toolbox caller
does not: `Toolbox._renderHostError` renders a *declared* code as `code + the surface's declared
meaning` and drops the host error's own message, with no per-call detail channel. That was
harmless while the only write was a four-field copy edit; it is not harmless for a subtree, where
"that field is not accepted" without naming the field is not correctable.

Not fixable here (it is `@lagrangefoundry/ai`). Mitigated by making the declared `SCHEMA_INVALID`
meaning carry the *recovery strategy* rather than a promised hint it cannot deliver, and recorded
in a comment on `editL1Set`. REQ-122's chat-host suite already documents the same loss for
`NOT_FOUND`, so this is a second instance of one known gap, not a new one.

## Test plan

`tests/test_UAT_FC_REQ-129_l1_authoring.test.ts` — 13 UATs, nothing mocked:

- the map emits every node (compared against an independent walk of the seed, so it cannot pass
  by agreeing with the implementation about which nodes are interesting); labels are
  recognisable; no axis reaches the map;
- `get_l1` returns a subtree carrying a palette ref and a responsive track exactly as stored;
- **read → write → nothing changed** (asserting the write was *accepted*, since a refused write
  also leaves the page unchanged; compared as a document rather than as bytes, because the
  Toolbox renders results key-sorted);
- `set_l1` replaces one subtree and leaves its siblings alone;
- **acceptance**: through the Toolbox, `describe_page` → `get_l1(root)` → `set_l1(root)` composes
  a nav bar of text nodes carrying the REQ-106 link role at a page and an anchor — and it renders
  as real `<a>` elements (document-relative, per DOC-12 §7 relocatable artifacts);
- the six security cases above, plus a correctable refusal and a bad address;
- the retired pair is gone from declaration, implementation, tool list and manual, and the grant
  names a group the surface declares;
- the two modal invariants, over `/api/copy`.

Updated for the retired pair: `test_UAT_FC_REQ-126_l1_surface`, `test_UAT_FC_REQ-122_tool_surface`,
`test_UAT_FC_REQ-122_chat_host`, `test_UAT_FC_REQ-127_session_binding`.

Regression scope run green (111 tests across the 11 surface/edit/modal suites). Full suite: 1318
passed, 8 failed — 6 of those (`reconciliation-copy-edit-gesture`, `req117-edit-loop-browser`,
`req115-builder-composition`) verified pre-existing on the clean tree by stashing; the other 2
were REQ-127's, and are fixed.

## Not in scope

Whole-document submission. Bounding the payload by address is what keeps this affordable; a
document PUT would also have the model rewriting regions it never intended to touch.

`site.json`'s `nav: {pattern, entries}` is vestigial on both sites and nothing reads it.
Navigation is L1, and this ticket does not change that. That the model is shown a config key
nothing renders, and reasons from it, is a separate defect worth its own ticket.


---

## REQ-130: Beyond L1: structured config, module instantiation, page metadata and generated assets

# Beyond L1: structured config, module instantiation, page metadata and generated assets

REQ-129 closes the L1 half of authoring. This closes the rest — everything a real site carries
that is *not* the element tree — so that "rebuild the actual site through the chat" becomes a
checkable end state rather than a slogan.

Sequenced after **REQ-129** (`get_l1` / `set_l1`). Licensed binary fonts are **REQ-101**'s
(font registry + provenance) and are deliberately excluded here.

## Why

Take `storage/sites/xgd/` as the target — the real site, not a site of similar quality. Its L1
needs nothing new: the 122-node tree is already valid against today's schema, loads through
`validateSite` and renders. Today's L1 vocabulary expresses the actual site completely, and
REQ-129 makes it writable.

What remains is all outside L1:

| what | where | why unreachable today |
|---|---|---|
| `palette` (6 families with steps), `theme` (6 sub-objects) | `site.json` | `set_config`'s `value` is typed `string` |
| `contact-form` instance, on both pages | `page.modules` | no declared operation touches `modules` |
| `seoMeta` (title, description) | per page | `add_page` / `update_page` take only `page`/`title`/`path` |
| 4 generated `.svg` files | `draft/assets/` | `add_asset` takes a **file path**; nothing writes bytes |

The same `set_config` string limit is what stopped the assistant adding nav entries in the
conversation that produced this ticket. It is one defect with several faces.

## Behaviour — as built

### 1. Structured config

`set_config` takes `settings`, a typed **object**, and an optional `key` naming the group to
write in (omitted → the top level). The Toolbox's declared base types are
`string|integer|number|boolean|object|array` with no union, so an object-valued parameter was
the whole of the available design space — and that made the write semantics the real decision.

**It merges; it does not replace.** Two objects merge at every depth; a list or a scalar
replaces. Replace-at-key — what `editConfigSet` did before — is what would have made an
object-only parameter dangerous: changing one colour in a palette would mean resending the
whole palette, and any family omitted would be silently deleted, invisibly until someone
looked at the site. Merging also keeps single scalars reachable (`key: "config"`,
`settings: {businessName: …}`) without a second operation.

Nothing new is validated. `validateOrThrow` already runs `siteSchema` over the whole resulting
definition, and the palette, theme and nav shapes were always described there. The gap was
never the validator — it was that no parameter could carry the value.

Reads already worked: `describe_site` returns `config`, `theme`, `nav`, `assets`, `palette`, so
the model sees the group before amending it. A `sequences:` entry now says to.

The CLI keeps `1c config set <slug> <key> <value>` and JSON-parses the value, because argv is
the one place a setting genuinely arrives as text. That parse moved out of `edit.ts` into the
CLI (`parseConfigValue`), so no tool caller re-reads a string as syntax (DOC-20 S2).

### 2. Component instantiation

`add_component` / `configure_component` / `remove_component`, plus a read `list_behaviors`.
`describe_page` now also lists the instances already on a page with their config.

Two decisions worth recording:

- **`presentation` (the slots) is optional.** A `contact-form` requires a `form` slot holding a
  `control` node per field, which is a whole form's design — demanding it before the form
  exists would make instantiation a multi-turn negotiation. L2 already held that design
  (`l2/contact-form.ts`); what was missing was a way to ask for it *by behavior id*, so
  `l2/presets.ts` adds `presetSlots(behaviorId, config)`. Without it every caller creating an
  instance grows the same `if (type === 'contact-form')` — the literalism CLAUDE.md forbids.
  The result is ordinary L1, refined afterwards by `set_l1`.
- **`config` is validated against the behavior's own contract**, not just the site schema:
  `validateBehaviorInstance` runs before `validateOrThrow`. `validateSite` lives in
  `site-schema` and cannot see the framework's behavior metas, so without this a caller could
  write a form with no `action` and find out at render.

Authoring a new behavior **type** is not reachable and is declared as an absence. The catalog
is closed; a miss names what it holds.

### 3. Page metadata

`add_page` / `update_page` take `seo`. Merged, so improving a description does not clear the
title. Asserted through to the rendered `<title>` and `<meta name="description">`.

### 4. Generated assets

`write_image` writes an SVG the assistant composed. Its own capability group (`DrawImages`),
separate from `ManageAssets`, so it can be withheld: every other image in a site was chosen by
a person, and this is the one that was not.

## ⚠️ Security: generated SVG was the risk, and this is how it is closed

`IMAGE_EXTENSIONS` already accepts `svg`, and the renderer's `isSafeUrl` guards URL **schemes**
at every sink. Nothing sanitised SVG **contents**, and that was sound while an asset was a file
an operator placed on their own machine — a human vouched for the bytes.

Once a model authors them, unsanitised SVG is stored XSS: `<script>`, `onload=`,
`<foreignObject>`, external `xlink:href`. The URL-scheme allowlist does not help — the file is
same-origin and legitimately referenced.

The ticket said this ships with a convincingly-closed validator or is dropped. It ships.
`packages/site-schema/src/svg.ts`:

- **Closed by construction, not by blocklist.** The document is consumed by a strict scanner
  and *every byte must be accounted for* by a token the grammar names. There is no
  skip-what-we-do-not-recognise branch, so a construct nobody anticipated is a refusal rather
  than a pass. That property is what makes an allowlist worth having, and it is tested
  directly rather than by a sample of payloads.
- **Never rewritten.** Accepted whole or refused whole, like a site definition — not
  stripped-and-continued.
- Element and attribute allowlists; `url(#local)` only for reference attributes; no `style`
  (raw CSS is DOC-2's line); no DOCTYPE/ENTITY (XXE); only the five XML entities.
- 64 KiB and 2000-element caps, mirroring L1's envelope.
- **Generated filename**: one lowercase word → `<stem>.svg`. There is no path to traverse
  because there is no path. Conflict unless `replace`.
- **Text formats only.** A model cannot produce a `.woff2` and must not be handed a channel
  that looks as though it could. Fonts stay REQ-101's, with provenance attached.

Scanning uses sticky regexes over an index rather than per-character `slice()`; the naive form
is quadratic and the byte cap alone does not save it.

## ⚠️ The operator's editor must not break

As REQ-129: `editCopyGet` / `editCopySet` / `copyFieldsOf` are the click-to-edit modal's
contract (REQ-117 / REQ-118 / DOC-28 §4) over `/api/copy`, and also back `1c copy get|set`.
Untouched.

Additionally proven rather than assumed: copy inside a component the **assistant** instantiated
is addressable and editable in the modal, over the same `/api/copy` transport the browser uses.

## Acceptance — all four, evidenced

1. the XGD palette (warm bone + petrol teal, with steps) and theme written as structured
   config, and a second write that changes one family without losing the others;
2. a `signup` contact-form bound into the `signup-form` slot, validated against the behavior
   contract, rendering a real `<form action="/api/lead">` with an `email` control;
3. `seoMeta` written on add, merged on update, and present in the rendered HTML;
4. a wireframe mark written as SVG, referenced from an L1 image node, shipping unaltered into
   the render — and 15 hostile documents (script, event handlers, `foreignObject`, external
   `href`/`use`, stylesheet, `style` attribute, external paint reference, `<!ENTITY>`, numeric
   entities, CDATA, unquoted attribute, `<a href="javascript:">`, no `<svg>` root) each refused
   with no byte written.

With REQ-129, that leaves only the two licensed font families (REQ-101) between the chat and
the real site.

## Test plan

`tests/test_UAT_FC_REQ-130_beyond_l1.test.ts` — 17 UATs across the four capabilities, the
declaration/implementation/grant correspondence, the declared absences, and the modal
invariant. Nothing mocks `edit.ts` or stubs the Toolbox.

`tests/test_UAT_FC_REQ-126_l1_surface.test.ts` updated: it enumerates the declared write set so
a new write cannot appear unnoticed. Four were added; that guardrail firing is it working.

Regression scope run green: REQ-122 (tool surface, chat host), REQ-126, REQ-127, REQ-129,
REQ-121, REQ-128, `generate`, `naming`, `public-site`, `chat9-edit-hooks`, `req85-conformance`,
`framework-*`.

## Not in scope

- **Authoring new behavior module types** — development, with DOC-26's vetting bar.
- **Extending L1** — the sandbox's expressive ceiling is raised by developers adding typed
  primitives (CLAUDE.md), never by the production tool.
- **Binary asset upload**, including fonts — REQ-101.