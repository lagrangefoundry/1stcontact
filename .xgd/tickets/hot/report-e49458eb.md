---
uid: report-e49458eb
id: REPORT-1452
type: report
title: 'Reconciliation Plan: BUNDLE-14 (BUG-31 + REQ-114 + REQ-116)'
created_by: xgd
created_at: '2026-08-06T20:12:29.411088+00:00'
updated_at: '2026-08-06T20:17:03.670877+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-0385746c
  anchor_uid: bundle-0385746c
  items:
  - index: 1
    component: 'Deploy: store-root isolation in shared storage'
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: 'The operator half of BUG-31. Every stored key now carries the store
      root the definition came from (`sites/<slug>/…` vs `sandbox/<slug>/…`): the
      deploy index key, the preview/revision snapshot prefixes and the prune listing
      are all built from `ctx.root`. A sandbox deploy consequently reports no shareable
      URL — the report prints its storage prefix and says the snapshot is not publicly
      reachable — and each root keeps its own deploy index, so a sandbox deploy cannot
      overwrite a real site''s published bytes, move its live pointer, append to its
      index, or have its prune walk the real site''s keys.'
    justification: 'STORY-94 already owns ''shipping a site to shared storage'': its
      ACs cover content addressing, the index, the report''s terminal URL and prune.
      What is missing is that shipping is scoped to the store tree the site came from
      — an isolation property of the same act, expressed as a change to keys already
      described by AC-892/AC-899 and to the URL already described by AC-900. No new
      capability bucket: this is the same command, same index, same report, with the
      root threaded through. Extending STORY-94 keeps one story describing what a
      deploy writes rather than creating a parallel ''sandbox deploy'' story.'
    story_uid: story-5349d01f
    target_story_ids:
    - story-5349d01f
    intent_delta_summary: 'Shipping becomes root-scoped: the store tree a site was
      loaded from is part of the address it ships to, and a snapshot in a non-servable
      root truthfully reports no URL instead of one that cannot resolve.'
    acceptance_criteria_changes:
      add:
      - Every key a deploy writes carries the store root the definition came from,
        so shipping the sandbox tree never writes into a real site's keyspace even
        when the two share a slug
      - 'A deploy from a non-servable root reports no shareable URL: the report terminates
        in the snapshot''s storage prefix and says it is not publicly reachable'
      - 'Each store root keeps its own deploy index: a sandbox deploy leaves a real
        site''s index byte-identical, and each index references only its own root''s
        snapshots'
      - Prune enumerates only the root being pruned, so an orphan in one root is never
        deleted by a prune of the other
      modify:
      - 'AC-892 — the returned shareable URL is qualified by the root: a draft deploy
        from the servable root returns its URL; one from the sandbox root ships and
        indexes normally but returns none'
      - AC-899 — prune's 'stored snapshot objects the deploy index does not reference'
        is scoped to the root being pruned, not to the slug prefix shared across roots
      remove: []
  - index: 2
    component: 'Public serving: one servable root, never derived from the request'
    item_type: upgrade
    story_points: 1
    dependencies:
    - 1
    description: The visitor half of BUG-31. The Worker's store root is the named
      constant `SERVABLE_ROOT = 'sites'`, used for the manifest key and for both snapshot
      key forms; no component of a request ever contributes a root. A slug deployed
      only under the sandbox root is therefore not-found on every URL the routing
      grammar admits — including one whose path names the sandbox key itself — by
      construction rather than by a check that could be missed.
    justification: 'STORY-95 already owns what a URL can reach: AC-905 makes the deploy
      index the authority on servability and AC-907 covers malformed components. Root
      confinement is the same guarantee one level up — the key space a request may
      address at all — so it belongs in that story''s AC set. No new capability bucket
      and no second server; the reachability rules simply gain their outermost gate.'
    story_uid: null
    target_story_ids:
    - story-d34eccd8
    intent_delta_summary: 'Reachability is gated twice: the server addresses exactly
      one store root, fixed in the server and never derived from a request, before
      the deploy index is consulted at all.'
    acceptance_criteria_changes:
      add:
      - 'The server addresses exactly one servable store root, fixed in the server
        and never derived from any part of a request: a site deployed only to the
        non-servable root is not-found on every URL the routing grammar admits, including
        one whose path names its stored key'
      modify:
      - 'AC-905 — servability is gated by the root before the index: a snapshot is
        reachable only if it lies in the servable root AND the site''s index references
        it'
      remove: []
  - index: 3
    component: 'L1 colour model: literal base, palette overlay'
    item_type: upgrade
    story_points: 3
    dependencies: []
    description: Colour takes the shape geometry already has. A site declares an arbitrary-size
      `palette` of kebab-case entries, each an opaque hex `value` plus optional named
      `steps`; the single `l1Color` alias widens from hex-only to `hex | { ref, step?,
      alpha? }`, so all twelve colour axes (gradient stops, shadows, borders, textures,
      link states, surface fills…) inherit the overlay at once. Translucency rides
      on the reference, not the entry, so one conceptual colour stays one entry (xgd's
      `#2e86a3` / `#2e86a3a6` / `#2e86a355` collapse to one entry at three alphas).
      A dangling reference is a validation failure — `validateL1` rejects it and `resolveL1Color`
      throws — never a render-time fallback. References resolve in one pass at the
      `loadSite` boundary, so nothing downstream can tell which form was authored
      and literal→reference conversion is pixel-identical by construction. The retrofit
      landed xgd at 6 entries from 16 distinct RGB and gigabytealchemy at 8 from 30,
      colour-lossless.
    justification: 'STORY-80 is the absolute-or-overlay value system, and its own
      title records the missing half: ''named overlay parked in L2''. This ticket
      un-parks it and lands it in L1, which is precisely a change to that story''s
      intent rather than a new capability. Its one AC (AC-716) says leaf axes carry
      the absolute literal — still true, now as the base of a two-form model. Creating
      a separate ''palette'' story would split one value model across two stories
      and leave STORY-80 asserting a parking decision that no longer holds.'
    story_uid: null
    target_story_ids:
    - story-c490f1cf
    intent_delta_summary: 'The overlay half of the value model lands, for colour,
      in L1 rather than L2: a hex literal remains the always-valid base and a palette
      reference is the optional refinement, resolving to a hex so both forms render
      identically.'
    acceptance_criteria_changes:
      add:
      - A site declares a palette of arbitrary size whose entries are free-form kebab-case
        names carrying an opaque hex value and optional named steps, and every colour
        axis accepts either a hex literal or a reference to one
      - A reference naming an entry or step the palette does not declare fails validation,
        and a consumer that skips validation gets a loud failure rather than a substituted
        default
      - Translucency is an axis of the reference rather than a property of the entry,
        so one colour used at several opacities is one entry plus its alphas
      - References resolve once at the load boundary, so a document authored with
        references renders byte-identically to the same document authored with the
        literals they resolve to, and a literal-only document is unaffected by the
        widening
      - A retrofitted site's palette is materially smaller than its distinct colour
        count, with no colour lost in the conversion
      modify:
      - AC-716 — leaf axes carry the absolute literal as the BASE of the colour model,
        with the palette reference as the optional overlay over it, rather than the
        literal being the only admissible form
      remove: []
  - index: 4
    component: 'One colour system: the legacy theme palette retired, page colour re-homed
      on the document'
    item_type: upgrade
    story_points: 2
    dependencies:
    - 3
    description: The closed 15-slot `paletteTokensSchema`, the `PaletteTokens` type,
      the required `theme.palette` key, and the second closed colour-role enum `layerColorRoleSchema`
      (with its two layer use sites) are deleted, not deprecated. With them go `paletteVars()`,
      the unused dark-mode palette override, and the colour-role resolvers in `dials.ts`
      / `text-style.ts` / `markdown.ts`. No rendered page emits a `--color-*` custom
      property and no stylesheet references one; the page's background and inherited
      text colour now come from the L1 document's own `background` and new `textColor`
      fields, validated as ordinary colour axes. The non-colour token groups (typography,
      spacing, radius, shadow, breakpoints) are untouched and emit exactly as before,
      and all four `storage/sites/*` definitions drop `theme.palette`.
    justification: 'STORY-83 owns the L1 substrate and its single safe emitter — what
      a rendered page may contain and which document-level fields carry it. ''The
      page''s colour is a property of the L1 document, and there is exactly one colour
      system'' is an extension of that bucket, not a new one: it adds a document field
      and removes an emission path from the same emitter the story already describes.
      The deleted token palette has no surviving AC of its own (its delivery was already
      superseded by the REQ-79 pivot), so there is nothing to remove elsewhere — but
      the guarantee that a page carries no colour custom property must be asserted
      somewhere, and STORY-83 is where page emission lives.'
    story_uid: null
    target_story_ids:
    - story-d0a8cfad
    intent_delta_summary: 'The substrate carries exactly one colour system: a rendered
      page emits no colour custom property, and the page-level background and inherited
      text colour are document fields on the L1 document rather than theme tokens.'
    acceptance_criteria_changes:
      add:
      - A rendered page emits no colour custom property and no stylesheet it ships
        references one
      - The page's background and its inherited text colour are fields of the L1 document,
        validated as colour axes like any other, and a text leaf that declares no
        colour falls back to the document's
      - 'No closed colour-role vocabulary survives anywhere in the schema: theme tokens
        carry no palette, no site definition declares one, and no layer treatment
        names a colour role'
      - The non-colour token groups still validate and emit exactly as before, so
        removing the colour group leaves typography, spacing, radius, shadow and breakpoint
        tokens intact
      modify: []
      remove: []
  - index: 5
    component: 1c colors — colour census and repeatable palette retrofit
    item_type: feature
    story_points: 2
    dependencies:
    - 3
    description: '`1c colors <slug>` censuses a site''s colours — distinct literals
      with use counts, distinct RGB ignoring alpha, and the alpha families (one RGB
      used at several opacities) — with a `--json` form for scripting. `1c colors
      <slug> --assign` performs the retrofit in two mechanically distinct passes ordered
      by how much they infer: exact alpha collapse first, then hue-family ramp grouping
      using chroma rather than HSL saturation as the neutrality test, with anything
      unclustered keeping its own entry. Families are named from hue and chroma (`slate`,
      `teal`, `sand`), and `--names <derived>=<chosen>` renames them to role vocabulary
      from the command line so the retrofit stays reproducible end to end. It writes
      `site.palette` and rewrites every literal as a reference only after verifying
      each reference resolves back to the byte it replaced, refusing to write otherwise.
      The capture→L1 fold is unchanged and still emits literals only — palette assignment
      is a separate, re-runnable pass over a folded site.'
    justification: 'No existing story covers analysing or transforming a site definition''s
      colours: the CLI stories cover flag/output hygiene, the fold stories cover capture→L1,
      and neither admits a command that rewrites an existing definition''s values.
      This is a genuinely new capability bucket — a measurement-and-migration tool
      over stored site definitions — and it is what makes the palette model adoptable
      on sites that already exist rather than only on new ones.'
    story_uid: null
  - index: 6
    component: 'The edit render: a third channel, deliberately inert, derived segments
      and addresses'
    item_type: feature
    story_points: 3
    dependencies: []
    description: '`1c render <slug> --edit` renders a third channel from the same
      L1 document through the same emitter, into `dist/<slug>/edit/`, always from
      the draft (a revision is immutable, so `--edit` settles the source rather than
      combining with it). The page deliberately does not work: the `<a>` element is
      kept but its href/target/rel are dropped, the contact form drops its action
      and method, no behaviour or motion script is referenced and no client bundle
      is written beside the pages. Content renders in its settled state rather than
      its initial one — the reveal rules AND the reveal class are both suppressed,
      so copy that fades in on scroll is visible, and a carousel''s track wraps instead
      of scroll-snapping (keyed off a document-level edit marker, so each behavior
      module declares its own settled state and the channel needs no knowledge of
      what a carousel is). Segmentation is derived from the tree rather than declared:
      text→copy, image→image, a box/container that would emit a surface declaration→container,
      a mounted slot→module; an unpainted container, an unmounted slot and a control
      leaf get no address and no outline, so the outlines are the user''s map of what
      is editable. Each segment is stamped with a render-scoped structural path of
      the child indices the emitter walked, rooted at the render''s root node list
      so one resolution rule serves documents and fragments alike and slot content
      is addressed relative to its instance. The renderer draws the faint per-segment
      outline itself, using `outline` rather than `border` so becoming a segment cannot
      move a box. Published and draft-preview renders are byte-identical to before,
      and L1''s `id` (REQ-106) is untouched in meaning and emission.'
    justification: 'No existing story describes a render channel that exists to be
      edited rather than served: STORY-83 covers the emitter''s safety and fidelity,
      STORY-94/95 cover the two shipped channels, and none of them can absorb ''the
      page deliberately does not work, and every editable region is addressable''
      without contradicting their own guarantees. This is a new capability bucket
      — the renderer-side foundation the web editor''s UI is built on — and it is
      testable entirely on rendered bytes. The behavior-module obligation it introduces
      (a module declares what its own behaviour-off state looks like) is asserted
      here, with the modules'' settled state, rather than split across the behavior-module
      contract story, so REQ-116''s acceptance criteria stay under one owner.'
    story_uid: null
---

# Reconciliation Plan — BUNDLE-14

**Mode**: commits
**Anchor**: bundle-0385746c (BUG-31 + REQ-114 + REQ-116)
**Commits analysed**: `00d2463` (BUG-31), `c5541f8` (REQ-114, and — per its provenance note — the renderer/pipeline/store/CLI half of REQ-116 swept in by a concurrent `git add -A`), `1ce0cd1` (REQ-116 behavior modules + UATs)

## Intent (Step 0)

Read from the bundle body and its three source tickets.

- **BUG-31** — `--sandbox` was honoured in every local path and then stopped mattering at the bucket, where every key was `sites/<slug>/…`. Declared resolution: **option (b), namespace rather than refuse**. Declared scope: thread the root through `manifestKey`/`readManifest`/`writeManifest`, the snapshot prefixes and the prune listing; make `DeployResult.url` nullable; make the Worker's servable root a named constant; correct DOC-12 §7. Explicitly *not* in scope: letting sandbox exercise the serving path.
- **REQ-114** — the palette colour model (literal base, palette overlay), the retrofit of the existing sites, and the **complete** retirement of the closed 15-slot token palette. Non-goals stated: no colour-picker UI, no change to the capture→L1 fold's literal-only output, no change to the non-colour token groups.
- **REQ-116** — the edit render: renderer-side only, no UI (that is T3). Nine acceptance criteria stated on the ticket, all asserted on rendered bytes.

All three implementations match their declared scope. No behaviour was found in the diffs that the owning intent is silent about (see Observations for the two footprint questions checked).

## Behavior Inventory (Step 1)

```yaml
behavior_inventory:
  source: "free-coded commits 00d2463, c5541f8, 1ce0cd1"
  entry_files:
    - tools/generate/src/deploy/deploy.ts
    - tools/generate/src/deploy/manifest.ts
    - apps/public-site/src/site-store.ts
    - packages/site-schema/src/l1/palette.ts
    - packages/site-schema/src/l1/validate.ts
    - packages/site-schema/src/l1/schema.ts
    - packages/site-schema/src/schema.ts
    - packages/framework/src/l1/render.ts
    - packages/framework/src/tokens/css.ts
    - packages/framework/src/modules/{carousel,contact-form}/index.astro
    - tools/generate/src/cli/colors.ts
    - tools/generate/src/cli/{index,commands}.ts
    - tools/generate/src/render/render.ts
    - tools/generate/src/store/{paths,loadSite}.ts
  features:
    - name: "1c deploy — root-scoped R2 addressing"
      description: "Every stored key is built from ctx.root: manifestKey(root, slug), preview/rev snapshot prefixes, the prune listing and the report's shortKey. DeployResult gains `root` and `url: string | null`."
      behaviors:
        - "A sandbox deploy writes no key under the servable root; bytes land under sandbox/<slug>/"
        - "A sandbox deploy returns url=null; formatDeployReport prints the prefix and '(sandbox — not publicly reachable)'"
        - "readManifest/writeManifest are per-root, so the two roots keep separate deploy indexes"
        - "unreferencedKeys lists `${root}/${slug}/` only, so a prune is root-scoped"
      entry_point: cmdDeploy
    - name: "Public site Worker — SERVABLE_ROOT"
      description: "The Worker's only root is the constant SERVABLE_ROOT='sites', used for the manifest key and both snapshot key forms. No root is derived from a request."
      behaviors:
        - "A slug deployed only to sandbox 404s on every route the grammar admits, including a path naming the sandbox key"
      entry_point: SiteStore / fetch
    - name: "L1 palette colour model"
      description: "l1Color = hex | {ref, step?, alpha?}; site.palette is an arbitrary-size record of kebab-case names to {value, steps?} with opaque-hex-only entry values."
      behaviors:
        - "One alias widened reaches all 12 colour axes"
        - "validateL1(input, {palette}) rejects a reference naming a missing entry or step; resolveL1Color throws rather than falling back"
        - "alpha rides on the reference; alphaByteHex is exact, so #rrggbbaa round-trips"
        - "resolveL1Palette runs once at loadSite (and at renderL1Document's entry), so downstream sees a literal-only document"
        - "collectL1PaletteRefs walks structurally rather than touring named axes"
      entry_point: validateSite / loadSite / renderL1Document
    - name: "Token colour-palette retirement"
      description: "paletteTokensSchema, PaletteTokens, theme.palette, layerColorRoleSchema (+2 use sites), paletteVars(), the dark-mode override and the colour-role resolvers in dials/text-style/markdown are deleted."
      behaviors:
        - "No --color-* custom property is emitted or referenced"
        - "body{} no longer sets background/color; the L1 document's background and new textColor carry them"
        - "All four storage/sites/*/draft/site.json drop theme.palette"
        - "Typography, spacing, radius, shadow and breakpoint token groups are untouched"
      entry_point: generateThemeCss / renderPage
    - name: "1c colors <slug> [--json] [--assign] [--names a=b,…]"
      description: "Colour census and repeatable retrofit over a stored site definition."
      behaviors:
        - "Census: distinct literals with counts, distinct RGB ignoring alpha, alpha families"
        - "--assign: exact alpha collapse, then hue-family ramp grouping (chroma, not HSL saturation, as the neutrality test)"
        - "Unclustered colours keep their own entry"
        - "Writes site.palette + rewrites literals as references only after verifying byte-for-byte round-trip; refuses otherwise"
        - "--names renames derived families to role vocabulary from the command line"
      entry_point: cmdColors / cmdColorsAssign
    - name: "1c render <slug> --edit — the edit channel"
      description: "RenderChannel gains 'edit' → dist/<slug>/edit/; --edit settles source to draft; renderSite/renderPage/renderL1Document thread `edit`."
      behaviors:
        - "Links keep the <a> element but drop href/target/rel; contact-form drops action/method"
        - "No behaviour or motion script referenced; no capabilities.js written into the edit directory"
        - "reveal rules AND the l1-rv class are both suppressed, so revealed copy is visible"
        - "pointer-accent rules are dropped (inert without their script), leaving identical pixels"
        - "carousel wraps its track via a rule keyed on the document-level data-fc-edit marker"
        - "segmentKind derives copy/image/container/module; unpainted container, unmounted slot and control return null — no address, no outline"
        - "'carries paint' is answered by asking surfaceDecls, so future paint axes are covered automatically"
        - "data-l1-path (dot-joined child indices from the render's root node list) + data-l1-segment stamped together, segments only"
        - "L1_EDIT_CSS draws one faint outline per segment; `outline`, not `border`, so geometry is unchanged"
        - "published/draft renders unchanged; L1 id (REQ-106) untouched"
      entry_point: cmdRender / renderSite / emitNode
```

## Coverage Map (Step 3)

```yaml
coverage_map:
  - feature: "1c deploy — root-scoped R2 addressing"
    status: partial
    existing_stories: [story-5349d01f]   # STORY-94
    existing_acs: [AC-892, AC-899, AC-900]
    gaps:
      - "No AC states that a deploy's stored keys are scoped to the store root the definition came from"
      - "AC-892/AC-900 assume a deploy always terminates in a URL; a sandbox deploy now returns none"
      - "AC-899's prune scope is the slug prefix, which spans both roots"
      - "Nothing states the two roots keep separate deploy indexes"
  - feature: "Public site Worker — SERVABLE_ROOT"
    status: partial
    existing_stories: [story-d34eccd8]   # STORY-95
    existing_acs: [AC-905, AC-907]
    gaps:
      - "AC-905 makes the index the authority on servability but says nothing about the key space the server may address at all"
  - feature: "L1 palette colour model"
    status: partial
    existing_stories: [story-c490f1cf]   # STORY-80
    existing_acs: [AC-716]
    gaps:
      - "The story's own title parks the named overlay in L2; it has landed, in L1, for colour"
      - "No AC admits any colour form but a hex literal"
      - "Nothing states that a dangling reference fails validation with no render-time fallback"
      - "Nothing states that literal→reference conversion is pixel-identical"
  - feature: "Token colour-palette retirement"
    status: partial
    existing_stories: [story-d0a8cfad]   # STORY-83
    existing_acs: []
    notes:
      - "The deleted token palette has no surviving AC of its own — its delivery was already superseded by the REQ-79 pivot (see STORY-80's technical note), and an AC sweep for palette/token/colour-role found none. So there is nothing to remove; what is missing is the positive guarantee."
    gaps:
      - "No AC states that a rendered page emits no colour custom property"
      - "No AC states that the page's background and inherited text colour are document fields"
      - "No AC states that the non-colour token groups survive the colour cut intact"
  - feature: "1c colors <slug> [--assign]"
    status: uncovered
    existing_stories: []
    gaps:
      - "No story covers measuring or transforming an existing site definition's colours"
  - feature: "1c render <slug> --edit"
    status: uncovered
    existing_stories: []
    gaps:
      - "No story covers a render channel that exists to be edited rather than served"
      - "No story covers derived segmentation or render-scoped addressing"
      - "STORY-85's behavior-module contract has no obligation covering a module's behaviour-off state"
```

## Scope vs Footprint (Step 3b)

Two places where the code reaches beyond the ticket that names it were checked:

1. **REQ-114 touches `modules/dials.ts`, `text-style.ts`, `markdown.ts` and eleven older test files** (req20/32/33/36/50/62/103/104/105/107, framework-tokens). This is **Case 2 — explicit supersession**: REQ-114 §4 names each of these as a retirement target by file and line. The affected older stories (STORY-82's AC-718/719 in particular) assert L1-leaf-axis delivery, not colour-role delivery, so none of them needs an upgrade item — the resolvers being deleted are residue the pivot already superseded.
2. **REQ-116's renderer/pipeline/store/CLI half sits in REQ-114's commit** (`git add -A` collision, disclosed on both tickets). Both intents are inside this bundle, so no third intent's territory is involved; item 6 covers that code regardless of which commit carries it.

One footprint item is **content, not capability**: `storage/sites/xgd/draft/pages/whitepapers.json` (+1776) adds a page to the xgd site definition. Site content is not a capability; no plan item.

## Plan Items

| # | Component | Type | Points | Deps | Target |
|---|-----------|------|--------|------|--------|
| 1 | Deploy: store-root isolation in shared storage | upgrade | 2 | – | STORY-94 (story-5349d01f) |
| 2 | Public serving: one servable root, never derived from the request | upgrade | 1 | 1 | STORY-95 (story-d34eccd8) |
| 3 | L1 colour model: literal base, palette overlay | upgrade | 3 | – | STORY-80 (story-c490f1cf) |
| 4 | One colour system: legacy theme palette retired, page colour re-homed | upgrade | 2 | 3 | STORY-83 (story-d0a8cfad) |
| 5 | 1c colors — colour census and repeatable palette retrofit | feature | 2 | 3 | – |
| 6 | The edit render: third channel, inert, derived segments and addresses | feature | 3 | – | – |

**Totals**: 6 items — 2 feature, 4 upgrade — 13 points.

## Observations

- **BUG-31 splits along an existing seam, so it splits into two upgrade items.** The capability matrix already models delivery as two halves — the operator shipping (STORY-94) and the visitor reaching (STORY-95) — and the fix genuinely changes both: keys on the write side, addressable key space on the read side. Folding both into one item would have put an AC about the Worker inside the story about `1c deploy`.
- **REQ-114 splits into three items along what each one guarantees**, not along code units: the colour *model* (item 3, an upgrade to the value-system story whose title literally parks this work), the *retirement* and its consequence for page-level colour (item 4, an upgrade to the substrate/emitter story), and the *tooling* that makes the model adoptable on existing sites (item 5, the only genuinely new bucket). Items 3 and 4 could have been one, but they answer different questions — 'what forms may a colour take' versus 'how many colour systems exist' — and the second is the one a regression suite must keep true after every future change.
- **The behavior-module settled-state obligation is asserted in item 6, not as a separate upgrade to STORY-85.** It is defensible either way: it does extend the module contract. Keeping REQ-116's nine acceptance criteria under one owner avoids ACs 1 and 3 being duplicated across two stories, and the obligation is unintelligible without the channel that gives it meaning. Flagging it so a reviewer can move it if they disagree.
- **No test-only item appears in this plan.** The three commits carry 956 lines of new UAT (`bug31-sandbox-r2-namespace`, `req114-palette-model`, `req116-edit-render`); those are evidence for the items above and are written formally during each story's UAT generation.
- **The four failing tests REQ-116's body reports do not reproduce here.** Its provenance note says four fold/gate reconciliation tests were failing and 'arrived with REQ-114's commit'. Run on this reconcile branch, `reconciliation-l1-fold`, `reconciliation-l1-fold-full-language`, `reconciliation-l1-fold-seams-and-refold`, `req83-capture-to-l1-fold`, `reconciliation-3probe-gate`, `reconciliation-3probe-gate-evaluator`, `reconciliation-cross-gate-reconciliation` and `req94-cross-gate-reconciliation` are all green (44 tests, 8 files). Either the failures were local to the working branch or they live in a suite outside this set; nothing in this plan depends on it, but it is worth knowing the fold/gate surface is clean where REQ-114's colour resolution would have shown up.
- **Uncertainty worth naming**: item 4's guarantee ('no colour custom property is emitted') is a *negative* about the whole rendered output, which is easy to assert once and hard to keep true. It is stated as an AC deliberately so regression enforces it, rather than left as a one-off grep in the ticket body.