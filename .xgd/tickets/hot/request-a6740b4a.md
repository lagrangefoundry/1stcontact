---
uid: request-a6740b4a
id: REQ-115
type: request
title: 'Builder shell: webui consumption, `site` tab, multi-mode display panel + toolbar'
created_by: xgd
created_at: '2026-07-31T20:43:18.854053+00:00'
updated_at: '2026-08-07T04:16:36.057091+00:00'
completed_at: '2026-08-07T04:16:36.057091+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: fb4b08e99c5ccc54ac289aad74fcca4797a501cc
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - 4cb83ec68b9d4dd7d5090a8ed1aae97b39392e7e
  version: 0.1.15
  story_points: 8
  bundled_in: bundle-15c1f647
  chat_comment: comment-fe2ff8e0
---

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