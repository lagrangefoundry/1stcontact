---
uid: report-9ba5bbf3
id: REPORT-1513
type: report
title: 'Reconciliation Plan: BUNDLE-16 (REQ-117 + REQ-115 + REQ-44) — builder chrome,
  the copy-edit loop, install preflight'
created_by: xgd
created_at: '2026-08-07T01:38:01.780482+00:00'
updated_at: '2026-08-07T02:58:17.902645+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-15c1f647
  anchor_uid: bundle-15c1f647
  items:
  - index: 1
    component: Builder shell, display panel and dev origin
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'The builder''s chrome and the origin that serves it. The @gendevlabs/webui-*
      components are consumed from the shared artifact store populated by lagrange-framework''s
      bin/install — resolved through each package''s own exports map at a single resolution
      point, never vendored, with an absent component naming the install command.
      `1c builder` is a Node dev origin serving: the chrome document (import map derived
      from those exports maps), the installed components at /webui/<pkg>/, the builder''s
      own browser source at /builder/, a rendered channel at /preview/<slug>/<channel>/,
      GET /api/sites and POST /api/publish. Every static tree resolves through one
      confinement/index/extensionless implementation, so a traversal guard cannot
      be present on one and missing on another; every response, including the hand-written
      shell document, carries a no-store freshness directive because the origin rewrites
      the bytes underneath the browser. The control-app Worker fronts the origin verbatim
      so everything is same-origin. In the browser: the shell mounts exactly one tab
      whose id is `site` and whose label has a single definition site in the repo;
      the tab opts into the shell''s `fill` chain and the tab spec reaches the shell
      unnarrowed, so the preview frame tracks the window height instead of collapsing
      to an iframe''s intrinsic 150px; a display panel holds a mode REGISTRY (a mode
      is an added entry, never a branch) where switching swaps the frame''s src without
      rebuilding the pane; a toolbar renders only the actions the active mode declares
      (site selector over the real store, View/Edit toggle, open-in-new-tab whose
      href equals the frame''s src across mode and site changes, publish through the
      existing publish path); a split shows panel | chat placeholder with a draggable
      divider, collapse-to-rail and reopen-to-prior-width; and all layout state persists
      under one shell-namespaced appId.'
    justification: 'No capability or story covers the builder''s chrome. CAP-84 (Edit
      Render Channel) explicitly states that the editor UI built on top of the edit
      render — hover treatment, modals, click handling — is a separate capability,
      and no such capability exists yet. The nearest serving stories (STORY-95 deployed
      serving, STORY-96 clean page URLs) describe the visitor-facing and local-preview
      servers, not a builder origin, a shell, a mode registry or a toolbar. This is
      a genuinely new capability bucket: the operator-facing surface on which a site
      is edited.'
    story_uid: story-e674c60a
  - index: 2
    component: Structured copy-edit write path (`1c copy`, /api/copy)
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'One validated, atomic write path for a copy edit, with two producers
      and no second mechanism. The edit-address contract lives in @1stcontact/site-schema:
      the stamp vocabulary, a strict address parser/formatter (a malformed address
      is refused, never resolved to a neighbouring node), the single resolution rule
      (index the render''s root node LIST, then `children`), the derivation of a segment''s
      exposed fields (plain strings only — a copy segment offers its words, a container
      or module instance offers none), and a whole-or-nothing change-map applier that
      refuses unknown or non-string fields. `1c copy get <slug> <pageId> <path> [--module
      --slot]` returns the modal''s descriptors and current values; `1c copy set …
      --values <json>` applies one change map as ONE diff, validates the RESULTING
      whole definition through the same validator `1c page`/`config`/`asset` run,
      writes only if it validates, then re-renders. A rejected edit leaves the draft
      and the rendered bytes byte-unchanged and travels the CLI''s structured failure
      envelope (code/path/hint, --json). Copy inside a behavior module''s slot addresses
      through the same commands via --module/--slot scoping. The builder origin''s
      GET/POST /api/copy is a thin transport over the identical functions — not a
      parallel implementation — answering a rejected edit with 400 carrying the validator''s
      own code/path/hint, and re-rendering BOTH the edit and draft channels after
      a save so the edit is visible in either mode. No path through this surface can
      express raw HTML or CSS.'
    justification: The structured-edit surface (`1c page|config|asset`, REQ-11) has
      no story in the matrix, and the copy verbs added here have none either. This
      documents a distinct user-visible capability — making a validated copy change
      to a site's draft — that no existing story describes. It is separated from item
      3 because the write path is independently useful and independently proven (driven
      by `1c` itself, argv in / envelope and exit code out) and is the surface the
      AI shares; item 3 is the browser gesture that produces its input.
    story_uid: story-37a3921b
  - index: 3
    component: Click-to-edit loop in the builder
    item_type: feature
    story_points: 3
    dependencies:
    - 1
    - 2
    description: 'The operator''s end-to-end edit gesture, in a real browser. Hovering
      a segment in the edit render brightens its outline; clicking resolves the clicked
      element to its definition address — innermost segment wins for nested regions,
      with a behavior-module instance and slot scoping the address when the click
      lands inside a module''s seam — and opens a modal derived from that segment''s
      fields. The modal is `mountFields` in BUFFERED commit, so one Save is one change
      map and one diff regardless of how many fields were edited; Save posts to the
      origin, and on success the frame reloads showing the new copy, re-binding the
      bridge against the replaced document. Invalid never lands: the modal stays open
      holding what the user typed and shows the validator''s own message, and the
      draft and the displayed page are unchanged. A segment with no phase-1 control
      gets a plain ''nothing to edit here'' message that is dismissible by button,
      Escape and backdrop alike. An edit render built before the page stamp existed
      is refused client-side, naming the re-render to run, rather than posting a null
      page and getting back a truthful but useless ''page not found''. Copy wider
      than its box still reads back in full in the form field. The bridge reaches
      the browser as ONE implementation — the renderer-side TypeScript source served
      type-stripped, never a hand-written copy free to drift from the markup it reads
      — and refuses to bind on any document without the edit marker, so View mode
      is not intercepted, marked or editable even if a host forgets to unmount.'
    justification: 'No story covers the editor UI; CAP-84 defers it explicitly. This
      is the user-visible capability the whole phase exists for — ''click the words
      on my page and change them'' — and it is distinct from both the chrome that
      hosts it (item 1) and the write path it drives (item 2): its failure modes (stale
      render, fieldless segment, undismissable modal, View-mode interception, innermost
      resolution) are observable only at the gesture.'
    story_uid: story-3bf94bd4
  - index: 4
    component: Edit render channel — page stamp, hover vocabulary, module seams
    item_type: upgrade
    story_points: 2
    dependencies: []
    target_story_ids:
    - story-af36c2cb
    intent_delta_summary: 'The edit render now carries the second half of a coordinate
      and the vocabulary a client needs. `<body>` is stamped with the definition `id`
      of the page it was rendered from (never the slug — index.html is an alias for
      the home page, so the file name is not the id and a client cannot derive it
      without re-implementing the renderer''s home-page rule). The hover-state class
      name joins the outline rule it strengthens in the edit stylesheet, so the renderer
      owns what a hot segment looks like and the client only says which one is hot.
      The whole stamp contract — attribute names, address type, resolution rule —
      moves to the schema package so the emitter that writes it and any client that
      reads it share one definition site. And a behavior module''s seam is marked
      by the module itself: contact-form now marks its `form` slot the way carousel
      already marked its slide, so copy inside it carries a resolvable scoped address
      rather than a bare path that is ambiguous between the instance and document
      address spaces.'
    acceptance_criteria_changes:
      add:
      - The edit render stamps the definition id of the page it was rendered from
        on the document body, in the attribute NAME as well as its value, so an address
        rendered from it resolves without the client inferring the page from the URL
      - The stamp vocabulary — attribute names, address form, and the hot-segment
        class — has one definition site shared by the renderer that writes it and
        any client that reads it
      modify:
      - 'AC-954 (content inside a behavior module''s seam is addressable, rooted at
        the instance): holds for every catalog module that exposes a slot, not only
        carousel — contact-form''s form slot included — because only the module knows
        which of its elements is the seam'
      remove: []
    description: 'Extends existing story story-af36c2cb (STORY-98, the edit render)
      with the renderer-side additions these commits made: the page-id body stamp,
      the hot-segment class in the edit stylesheet, the relocation of the stamp contract
      to a single shared definition site, and contact-form declaring its slot seam.'
    justification: Extends existing story story-af36c2cb within capability-25f7e486;
      every change here is renderer-side and observable on rendered output, which
      is exactly that capability's stated boundary. No new capability bucket is introduced
      — the editor UI that consumes these stamps is items 1–3, and the edit render
      itself gains no new purpose, only the remaining coordinate and vocabulary its
      own ACs (AC-953, AC-954) already presuppose.
    story_uid: story-af36c2cb
  - index: 5
    component: L1 geometry — a nowrap run's captured width is a floor
    item_type: upgrade
    story_points: 2
    dependencies: []
    target_story_ids:
    - story-d0a8cfad
    intent_delta_summary: 'Geometry emission changes for one case: a text-like run
      that cannot wrap. The fold pins width to what the reference text measured, which
      is correct while the text is the reference text and silently destructive once
      it is edited — a longer string overflows a box painted by a gradient clipped
      to its glyphs, where the overflow is not clipped or ellipsised but never drawn
      at all. Such a run now emits its captured width as a floor (`min-width`) with
      `width: auto` on the same rung, so the box and its paint area grow with the
      content. Gated on the width from which the reference stopped wrapping: below
      that threshold the fixed width still decides line breaks, and a container''s
      width is structure and is never relaxed. The `width: auto` reset is load-bearing
      — the rungs are cumulative overrides of the same property, and without it the
      lowest rung''s interpolation stays live far outside the segment it was fitted
      to.'
    acceptance_criteria_changes:
      add:
      - A run that cannot wrap emits its captured width as a floor that grows with
        its content, while a wrapping run keeps the fixed width that decides its line
        breaks
      - The floor applies only at and above the width from which the run stopped wrapping,
        and a container's width is never relaxed
      - Relaxing a rung to a floor also resets the fixed width on that rung, so the
        ladder's cumulative overrides keep holding and no lower rung's interpolation
        stays live outside the segment it was fitted to
      - With text unedited, every node's bounding box is identical before and after
        the change at every ladder width
      modify: []
      remove: []
    description: Extends existing story story-d0a8cfad (STORY-83, the L1 layout substrate)
      with the geometry-emission rule for unwrappable runs.
    justification: 'Extends existing story story-d0a8cfad within capability-ae9d65d6.
      Per-viewport geometry keyframes and their emission are already that story''s
      subject; this changes which CSS property one keyframe axis emits under one stated
      condition. No new capability bucket: no new axis, node kind or authoring concept
      is introduced, and the change is invisible for unedited text by construction.'
    story_uid: story-d0a8cfad
  - index: 6
    component: 1c CLI install preflight
    item_type: upgrade
    story_points: 2
    dependencies: []
    target_story_ids:
    - story-e15a19ef
    intent_delta_summary: 'Adds a third CLI-correctness guarantee alongside flag parsing
      and --json hygiene: a command that loads a declared runtime dependency refuses
      to start on an installed tree that does not match what is declared, instead
      of dying deep inside a browser launch. Two independent checks, both reported
      together: each package the command actually loads resolves from disk, and the
      committed lockfile still matches the verbatim copy pnpm writes at install (an
      exact oracle, not an mtime heuristic). Drift fails even while every dependency
      still resolves, because that is precisely the state the next prune turns into
      the crash. Gating is per command on what each actually loads, so an offline
      verb is never blocked by a dependency it does not use. The refusal travels the
      existing failure contract as a new ENVIRONMENT code with its own exit status
      and the standard --json error envelope, naming which check failed, which packages,
      and the literal command to run.'
    acceptance_criteria_changes:
      add:
      - A command that needs a declared runtime dependency refuses before doing any
        work when that dependency does not resolve, naming the packages and the install
        command to run
      - An install that lags the committed lockfile is reported as a distinct fault
        even when every dependency still resolves, and a tree that was never installed
        counts as drift while a project with no lockfile does not
      - Both faults are reported together in one refusal rather than one at a time
      - The refusal carries the environment failure code, its own exit status, and
        the standard machine-readable error envelope
      - 'Each command is gated on exactly what it loads: the offline verbs — including
        the structured-edit commands, render, serve and the builder — are never gated'
      modify: []
      remove: []
    description: Extends existing story story-e15a19ef (STORY-79, the 1c CLI contract)
      with the pre-command install preflight.
    justification: Extends existing story story-e15a19ef within capability-aa030c83.
      That story's subject is the correctness guarantees that make the CLI safe to
      compose and script — flag parsing, output hygiene, a quiet bootstrap, and structured
      failures an AI caller can branch on without parsing prose. Refusing loudly with
      a structured code instead of crashing mid-render is the same guarantee applied
      to the environment; no new capability bucket and no parallel command surface
      is introduced.
    story_uid: null
---

# Reconciliation Plan — BUNDLE-16 (REQ-117 + REQ-115 + REQ-44)

**Mode**: commits
**Anchor**: bundle-15c1f647 (BUNDLE-16)
**Source**: 11 free-coded commits on `reconcile-BUNDLE-16`

## Step 0 — the intent

The bundle carries three intents:

- **REQ-115 (T1)** — the builder's chrome: settle how `@gendevlabs/webui-*` is consumed, mount the shell with a `site` tab, and stand up a multi-mode display panel showing a real rendered site. Declared non-goals: no editing, no chat, no request-time rendering, no changes to any upstream component.
- **REQ-117 (T3)** — the first end-to-end edit: click a segment → `mountFields` modal → one structured diff → the SHARED validator → draft write → re-render → refresh. The ticket's own invariant: the editor is a second *producer* of structured edits, never a second write path, and "could the AI have produced this exact edit through its tool surface?" is the test every control must pass. Explicit non-goals: text properties, per-run restyling, images, structural editing, undo beyond Cancel.
- **REQ-44** — a cheap fail-loud preflight in `1c` for a `node_modules` that lags the lockfile. The ticket splits itself: only the preflight is in this repo; the install-after-manifest-change rule is filed against xgd (REQ-745) and the plugin SDK (REQ-22).

The ticket bodies also record the mid-flight corrections that the commits then made: REQ-117's "blocked on T1, not descoped" section and its later "the loop is closed" section, and REQ-115's Deliverable 0 landing on the shared artifact store rather than either originally proposed route.

## Behavior inventory

```yaml
behavior_inventory:
  source: "free-coded commits: 2b71c662, fb4b08e9, b37afa2c, 6493570b, b7e5519a, c1023ddd, a21f9e4d, 34fe0064, f24952a4, f1f46c73, bfa18fba"
  entry_files:
    - tools/generate/src/cli/index.ts
    - tools/generate/src/cli/builder.ts
    - tools/generate/src/cli/webui.ts
    - tools/generate/src/cli/preflight.ts
    - tools/generate/src/cli/edit.ts
    - tools/generate/src/cli/serve.ts
    - apps/control-app/src/index.ts
    - apps/control-app/src/builder/{main,app,panel,toolbar,editor,api,config}.js
    - packages/site-schema/src/l1/edit.ts
    - packages/framework/src/l1/edit-client.ts
    - packages/framework/src/l1/render.ts
    - packages/framework/src/modules/contact-form/index.astro
  features:
    - name: "webui component consumption"
      description: "Components resolved from the shared artifact store bin/install populates, through each package's own exports map; nothing vendored; one resolution point whose failure names the install command."
      behaviors:
        - "served bytes are byte-identical to what Node resolves, from outside this repo"
        - "chrome import map + stylesheet links derived from exports, not hardcoded paths"
        - "absent component throws naming `bin/install --lang js --component <name>`"
        - "the dependency is implicit: webui-mounting suites skip with a stated, reported reason on a fresh clone"
      entry_point: tools/generate/src/cli/webui.ts
    - name: "1c builder — the dev origin"
      description: "Node origin serving the chrome, the components, the builder source, the rendered channels, and the site/publish/copy APIs."
      behaviors:
        - "GET / → chrome document, no-store"
        - "GET /api/sites → the store listing; POST /api/publish → a revision through the existing publish path"
        - "GET/POST /api/copy → thin transport over editCopyGet/editCopySet; CommandError → 400 with code/path/hint"
        - "a POST /api/copy re-renders BOTH the edit and draft channels before answering"
        - "GET /preview/<slug>/<channel>/… for draft|published|edit, unknown channel 404"
        - "GET /framework/{edit-client,site-schema-edit}.js → the TypeScript sources type-stripped"
        - "GET /webui/<pkg>/… and /builder/… ; every static tree through one confinement/index/extensionless resolver; traversal 403"
        - "every response carries no-store, including the hand-written shell"
      entry_point: handleBuilderRequest
    - name: "control-app Worker front"
      description: "Forwards verbatim to BUILDER_ORIGIN so everything is same-origin; 503 unconfigured, 502 unreachable. Supersedes the REQ-1 placeholder route."
      entry_point: apps/control-app/src/index.ts
    - name: "builder chrome composition"
      description: "Shell + display panel + toolbar + split, mounted in the browser with no build step."
      behaviors:
        - "one tab, id `site`, label with exactly one definition site in the repo"
        - "tab spec passes through to the shell unnarrowed; `fill: true` puts the panel on the viewport-height chain and the preview frame tracks the window (measured 789/1089/489px at 900/1200/600px) with no page-level scrollbar"
        - "panel mode registry: registering is an entry not a branch; switching swaps src, same pane and frame nodes"
        - "toolbar renders only the active mode's declared actions; open-in-new-tab href === frame src across mode and site changes"
        - "site selector lists the real store and switches the displayed site; publish calls publish for the shown site"
        - "split: panel | chat placeholder, draggable divider, collapse-to-rail, reopen to prior width"
        - "split width, mode, site and collapsed side persist under `{appId}:` keys and survive a fresh mount"
      entry_point: mountBuilder
    - name: "the edit-address contract"
      description: "Stamp vocabulary, address parse/format, the one resolution rule, field derivation and change-map application — in site-schema, shared by emitter, client and write path."
      behaviors:
        - "a malformed address fails closed rather than resolving to a neighbour"
        - "one rule: index the render's root node LIST, then children — covers a document and a module slot alike"
        - "a text run derives one plain-string field (textarea past a width threshold); anything else derives none"
        - "applying a change map is whole-or-nothing; unknown or non-string fields are refused, not ignored"
      entry_point: packages/site-schema/src/l1/edit.ts
    - name: "1c copy get|set"
      description: "The editor's write path, beside page/config/asset on the same structured-edit surface."
      behaviors:
        - "get returns descriptors + current values; an empty field list is the answer for a segment with no control"
        - "set applies one change map as one diff, validates the whole resulting definition through the shared validator, writes only then, and re-renders the edit channel"
        - "--module/--slot scope an address rooted in a behavior-module instance"
        - "failures are structured (code/path/hint, --json envelope, exit code); a rejected edit leaves the draft byte-unchanged"
      entry_point: tools/generate/src/cli/index.ts case 'copy'
    - name: "the edit bridge (client half)"
      description: "Turns a clicked pixel back into an address; refuses to bind without the edit marker."
      behaviors:
        - "innermost segment wins via closest(); module/slot scope derived from the nearest markers inside the instance"
        - "hover sets the hot class; click preventDefault + hands the hit to the host"
        - "View mode: no binding, no interception, no modal"
      entry_point: mountL1EditBridge
    - name: "the editor host (the loop)"
      description: "Modal, save, refresh — everything after the bridge answers."
      behaviors:
        - "mountFields in buffered commit: one Save, one change map, one diff"
        - "save → POST → frame reload → rebind on the new document"
        - "invalid keeps the modal open with the validator's own message and the user's text"
        - "a fieldless segment gets a plain message dismissible by button, Escape and backdrop"
        - "a render with no page stamp is refused client-side, naming the re-render"
        - "nothing staged → close without posting"
      entry_point: mountEditor
    - name: "nowrap width floor"
      description: "A run that cannot wrap emits its captured width as min-width with width:auto on the same rung, gated on the wrap threshold; boxes never floored."
      entry_point: geometryRules / emitNode
    - name: "install preflight"
      description: "Per-command dependency resolution + lockfile-drift oracle, reported together, refusing with the ENVIRONMENT code before any work."
      entry_point: assertInstall / checkInstall
```

## Coverage map

```yaml
coverage_map:
  - feature: "webui consumption, 1c builder origin, control-app front, chrome composition, viewport fill"
    status: uncovered
    existing_stories: []
    gaps: ["no capability or story describes the builder's chrome or its origin"]
    notes:
      - "CAP-84 states outright that the editor UI on top of the edit render is a separate capability; that capability does not exist yet"
      - "STORY-95/STORY-96 own the visitor-facing and local-preview servers, not a builder origin"
  - feature: "the edit-address contract, 1c copy get|set, /api/copy"
    status: uncovered
    existing_stories: []
    gaps: ["the structured-edit surface (REQ-11 page/config/asset) has no story either; the copy verbs extend an unreconciled surface"]
    notes:
      - "classified feature, not upgrade: there is no existing story to extend. The reuse-first bias applies to the matrix, and the matrix is silent here."
  - feature: "click → modal → save → refresh, and its failure modes"
    status: uncovered
    existing_stories: []
    gaps: ["no story covers the editor gesture"]
  - feature: "page-id body stamp, hot-segment class, stamp contract relocation, contact-form slot seam"
    status: partial
    existing_stories: [story-af36c2cb]
    existing_acs: [AC-951, AC-952, AC-953, AC-954, AC-957]
    gaps:
      - "AC-953/AC-954 presuppose an address that resolves, but the page half of the coordinate was never stamped"
      - "AC-954 held for carousel only; contact-form's form slot was unmarked and therefore unresolvable"
      - "the hot-segment class name is new renderer-owned vocabulary"
  - feature: "nowrap width floor"
    status: partial
    existing_stories: [story-d0a8cfad]
    gaps: ["geometry emission is that story's subject; the floor rule and its width:auto reset are new"]
  - feature: "install preflight"
    status: partial
    existing_stories: [story-e15a19ef]
    gaps: ["the CLI-contract story covers flag parsing, --json hygiene and quiet bootstrap; environment refusal is a new guarantee in the same bucket"]
  - feature: "serve.ts refactor into resolveStaticFile/sendFile"
    status: covered
    existing_stories: [story-66115f6b]
    notes: ["pure extraction; the extensionless rule AC-holder is unchanged. See Observations for the one behavioural side effect."]
```

## Plan items

| # | Component | Type | Points | Deps | Description |
|---|-----------|------|--------|------|-------------|
| 1 | Builder shell, display panel and dev origin | feature | 3 | – | webui consumption route, `1c builder` origin, Worker front, shell/panel/toolbar/split, viewport fill, no-store, traversal confinement |
| 2 | Structured copy-edit write path | feature | 3 | – | address contract, `1c copy get\|set`, `/api/copy`, shared validator, one-save-one-diff, both-channel re-render |
| 3 | Click-to-edit loop in the builder | feature | 3 | 1, 2 | hover/click resolution, `mountFields` buffered modal, invalid-never-lands, fieldless + stale-render guards, View untouched |
| 4 | Edit render channel — page stamp, hover vocabulary, module seams | upgrade | 2 | – | extends story-af36c2cb (STORY-98) |
| 5 | L1 geometry — nowrap width is a floor | upgrade | 2 | – | extends story-d0a8cfad (STORY-83) |
| 6 | 1c CLI install preflight | upgrade | 2 | – | extends story-e15a19ef (STORY-79) |

Total: 15 points — 3 feature, 3 upgrade.

## Step 3b — intent scope vs implementation footprint

**Case 1 (matches intent).** Items 1–3 and 6 are the three tickets' declared scope, including the two corrections the tickets record themselves: REQ-115's Deliverable 0 settling on the shared artifact store, and REQ-117's modal + shell wiring landing once T1 shipped.

**Case 2 (explicit supersession).** Item 4 is REQ-117 knowingly extending what REQ-116/STORY-98 established — the page stamp and the hot-segment class are additions to the edit render, and contact-form's slot marker makes an existing AC (AC-954) true for a module it silently missed. Also: `test_UAT_FC_REQ-1_control_app_returns_placeholder` and its file were deliberately removed because `/` is the builder now; that supersession is stated in the ticket and carries no matrix debt (no story owned the placeholder).

**Case 3 (code beyond the declared intent).** Two, both flagged rather than absorbed:

1. **`1c serve` now sends `no-store`.** The freshness directive was added to the shared `sendFile`, which the local preview server also uses. REQ-117 declares the change for *builder preview responses*; the local preview server is owned by story-66115f6b (STORY-96) / story-d34eccd8 (STORY-95), and neither says anything about caching. The effect is benign for a dev server over live-rebuilt artifacts, and no plan item absorbs it — the matrix for those stories follows their own intents.
2. **The nowrap floor changes rendered CSS for every site, not just an edited one.** REQ-117's scope is copy editing; this is a renderer change reached through it. It is documented against the L1 substrate story (item 5) where it belongs, not against the editor stories, and the "no pixel moves with text unedited" property is made an AC precisely because that is the boundary the change must not cross.

## Observations

- **Two version-bump commits carry no capability.** `6493570b` (0.1.16) and the `package.json` bumps riding on the later fixes are release plumbing; no plan item.
- **Six of the eleven commits are post-first-use defect fixes** on REQ-117/115 — collapsed preview pane, stale-render `page: null`, undismissable fieldless modal, View channel not re-rendered, one uncached response left on the origin, nowrap width. Each is folded into the story that owns the behaviour rather than given its own item; several are the *only* evidence for an AC (the fieldless modal is the sole proof that a no-control segment is a legitimate answer and not a trap).
- **Item 2 is classified `feature` under protest of the reuse-first bias.** The natural reuse target would be a story covering `1c page|config|asset` — the surface these verbs deliberately joined — but that surface is unreconciled and has no story. Creating an upgrade with no target would be rejected, so it is a feature; if the REQ-11 surface is reconciled later, these two stories will want merging into one bucket.
- **The webui dependency is implicit and the suites skip on a fresh clone.** That skip is reported loudly rather than passing silently, which is the right call, but it means items 1 and 3's browser evidence is unverifiable in CI until a private registry exists. Worth carrying as a known coverage caveat on those stories.
- **`test_UAT_FC_REQ-117_*` names span three plan items.** The FC→AC rename downstream will need care: `..._an_unwrappable_run_emits_min_width_*` and `..._the_floor_begins_only_where_the_run_stops_wrapping` belong to item 5, `..._edit_render_stamps_*` to item 4, `..._site_panel_opts_into_the_shell_fill_chain` / `..._tab_spec_reaches_the_shell_unnarrowed` / `..._preview_frame_tracks_the_window_height` to item 1 (they are T1 chrome committed under REQ-117, as the ticket itself notes), and the rest to items 2 and 3.
- **One known defect is recorded and deliberately not fixed here**: a copy edit rewrites the whole page JSON with different unicode escaping, so a one-word change produces a large diff. Pre-existing in `writeJson`, cosmetic, and the ticket says it wants its own ticket — no plan item.