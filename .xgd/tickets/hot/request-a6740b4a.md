---
uid: request-a6740b4a
id: REQ-115
type: request
title: 'Builder shell: webui consumption, `site` tab, multi-mode display panel + toolbar'
created_by: xgd
created_at: '2026-07-31T20:43:18.854053+00:00'
updated_at: '2026-08-03T00:00:26.961494+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 0647b9de313d710ae188ba491f0d660f83f23e2f
    reconcile_sha: null
    main_sha: null
  version: 0.1.15
---

## What this builds

The builder's chrome: the `@gendevlabs/webui-*` components wired into this repo, the
shell mounted inside `control-app` with the **`site` tab**, and the **multi-mode
display panel** showing a real rendered site in View mode.

Phase 1 ticket **T1** of [[DOC-28]] §12. Design: [[DOC-8]] §3, §9.

## Deliverable 0 — settle how `@gendevlabs/webui-*` is consumed

**This decision is most of the ticket's risk and must be made first**
([[DOC-8]] §13 Q1). `xgd-framework` is a peer project, not a third-party dependency:
gaps are closed upstream, never worked around here ([[DOC-8]] §9.4). Copying the
components into this repo is **rejected** — it forks the shell and guarantees
divergence.

Two routes:

- **Publish as versioned packages** (they are `private: true`, `0.0.0`, no registry
  config today) → depend on `@gendevlabs/webui-shell@^x` like any dependency. The
  proper destination; needs publishing stood up in `xgd-framework`.
- **Git submodule**, pinned by commit, read-only here — structurally enforces
  "never edited in this repo". The clean interim.

Two facts that inform it: every package we need (shell, split, fields, chat,
markdown, scroll) has an **empty** dependency set — only `list-detail`, which we do
not need, uses `workspace:*`. And unpublished packages already cause friction
upstream (`xgd-framework`'s showcase routes around a `pnpm` 404 with a Python
server), which argues *for* standing publishing up rather than against it.

**Record the choice in [[DOC-8]] §9.5 and close §13 Q1** as part of this ticket.

## Scope

- **Shell** — `mountShell` inside `control-app`, `appId` declared, one tab with
  **id `site`**.
  - **The tab label is a single configuration value, default `"Site"`.** The id is
    stable and is what code addresses (`shell.getPanel('site')`, mode routing,
    persistence keys); the label is declared **once** and referenced from there.
    It must never appear as a repeated string literal — the name is provisional and
    changing it must be a one-line edit. The same rule applies to any later tab.
- **Split** — `mountSplit` with the display panel as primary and a **chat
  placeholder** as secondary. Collapse-to-rail, layout modes, per-instance
  persistence.
- **Display panel + its mode contract** ([[DOC-8]] §3.2) — the pane is *not* "the
  preview". Register a mode; switch modes **without tearing down the pane**
  (View↔Edit swaps the iframe source, it does not rebuild the split or lose scroll
  context); modes are additive entries, not new branches. View mode ships; Edit mode
  registers as a stub that T3 fills.
- **Toolbar — mode-aware**, its controls varying with the active mode, never a fixed
  strip assuming an iframe beneath it: site selector · View/Edit toggle ·
  open-in-new-tab · Publish.
  - **Open in new tab** points at the *same* URL the iframe loads ([[DOC-8]] §4.3).
  - **Publish** is a thin call over [[DOC-12]] §5's existing `publish` — snapshot,
    diff, append to history, render. No new publish semantics.
- **Storage seam** — mount the shell with the builder's `appId` and pass
  `shell.storage(...)` handles into the split (and later into fields). Namespacing
  from the start; retrofitting it once several panels persist state is materially
  more expensive ([[DOC-8]] §9.2).
- **Serving** — View mode shows the **already-rendered** draft from
  `storage/dist/…/draft/`, served same-origin. No new render work; T5 replaces this
  with request-time rendering later.

## Non-goals

- **No editing of any kind** — Edit mode is a registered stub. T2/T3 fill it.
- **No chat** — the secondary pane is a placeholder.
- **No request-time rendering** — that is T5, deliberately last.
- **No changes to `xgd-framework` components.** If one is missing something, raise a
  REQ upstream ([[DOC-8]] §9.4.1); do not wrap, patch, or reimplement here.

## Acceptance criteria

1. The consumption route is chosen, implemented, and recorded in [[DOC-8]] §9.5;
   §13 Q1 is closed. No `webui-*` source is copied into this repo.
2. The shell mounts in `control-app` with a single tab whose **id is `site`**, and
   the panel is host-filled through `shell.getPanel('site')`.
3. **The tab label is defined in exactly one place.** A grep for the label string
   across the repo returns exactly one definition site; changing it there changes
   every rendered occurrence.
4. The split renders display panel | chat placeholder, with a draggable divider,
   collapse-to-rail, and reopen to the prior width.
5. Split width, collapsed side and layout mode persist across reload, through a
   **namespaced** `shell.storage` handle (keys prefixed `{appId}:`).
6. View mode displays a real rendered site in a same-origin iframe; the site
   selector switches between all sites in `storage/sites/`.
7. Registering a second mode requires adding an entry, not editing a switch in the
   panel's internals; switching to it and back preserves the pane (no remount).
8. "Open in new tab" opens the identical URL the iframe is displaying.
9. Publish produces a new revision via the existing `publish` path and the rendered
   result is served.