---
uid: request-66e4c630
id: REQ-118
type: request
title: 'Image selection: click image segment → asset picker → structured src edit'
created_by: xgd
created_at: '2026-07-31T20:43:35.481921+00:00'
updated_at: '2026-08-07T05:34:53.826337+00:00'
completed_at: '2026-08-07T05:32:37.570786+00:00'
last_field_updated: result
status: free_and_reconciled
fields:
  priority: medium
  depends_on:
  - request-395b67e6
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: null
    reconcile_sha: null
    main_sha: b2b9208c301ca2740d337c363cc6cc0b077c9783
  version: 0.1.24
  story_points: 3
  merged_at_commit: b2b9208c301ca2740d337c363cc6cc0b077c9783
  chat_comment: comment-64cb2bfb
result: pass
---

## What this builds

**Image selection** — click an image on the page, pick a different one. The second half
of phase 1's promise (copy *and* images), reusing T3's edit loop end to end.

Phase 1 ticket **T4** of [[DOC-28]] §12. Design: [[DOC-28]] §9.2.

## What changed

The ticket's claim is that this is the *second half of phase 1*, not a second mechanism.
Everything landed accordingly: there is **no `image set` command and no `/api/image`
route**. An image edit travels the same `1c copy get|set` / `/api/copy` surface, through
the same whole-definition validator, in the same write-then-re-render order. The whole
of REQ-118 lives in the **derivation** — an image segment now exposes which image goes
here — plus the asset listing that feeds it.

### 1. The field vocabulary widened by exactly one shape

`packages/site-schema/src/l1/edit.ts` — `L1FieldDescriptor.type` was `'string'` and only
`'string'`, deliberately, as the exposure rule expressed as a type. It is now
`'string' | 'enum'`, with `enum` carrying a closed option list.

This is not a loosening. An enum control can only return one of the options the
derivation put in front of the user, so it is *narrower* than a string, and neither can
carry markup. It is also the shape every later phase needs (a colour from the site
palette, a module `config` value), so it is the axis the vocabulary grows along rather
than a one-off for images.

`copyFieldsOf` now returns, for `kind: 'image'`:

- `src` — `type: 'enum'`, `required: true`, options = the site's image assets **plus the
  node's current handle**.
- `alt` — a plain string field, with the same textarea rule copy uses.

A new `L1SegmentFieldOptions` argument carries the site's asset handles in. The module
stays pure data — it never reads a directory — while the picker stays a closed list.

**Why the current handle is always an option**: a folded reproduction can hold a handle
the mirror never got (a remote URL). A `<select>` whose options omit its own value
renders with the *first* option selected — so a user editing only the alt text would
silently swap the image. This is the one non-obvious correctness detail in the ticket.

### 2. Enum membership is enforced on the write side too

`applyCopyFields` refuses a value outside its descriptor's `enum`, at the field, before
the shared validator runs. This catches the case the validator structurally cannot:
`/assets/ghost.png` is a perfectly *safe* URL, so the envelope would accept it and the
page would render a broken image with no error. A stale client is the realistic source.

### 3. One asset listing, three consumers

`tools/generate/src/cli/edit.ts` — new exported `listSiteAssets(slug, opts)`, free of any
UI. It is the **union** of two sources that genuinely disagree:

- the registry (`site.json.assets`) has metadata but is **empty on every real site in
  `storage/`** — a registry-only picker offers nothing on the sites we actually build;
- the directory (`draft/assets/`) has the bytes but no metadata.

Each entry reports `{id, src, alt, kind, onDisk, registered}`. `kind` is derived from the
extension, so the picker can narrow to images while an asset browser mode still sees
fonts and stylesheets.

`src` is always `/assets/<name>` — the same vocabulary the capture fold writes
([[DOC-28]] §13 Q5's "the same fields, not a parallel vocabulary"), normalised by the
same leading-`./`-or-`/` strip `l1/assets.ts` uses.

`editAssetList` (`1c asset list`) now returns this union rather than the registry alone.
That replaces the partial truth rather than adding a second listing.

### 4. The listing is reachable independently (AC-7)

- `GET /api/assets?slug=` in `tools/generate/src/cli/builder.ts`
- `fetchAssets(slug)` in `apps/control-app/src/builder/api.js`

**The modal does not use either.** `editCopyGet` already embeds the choices in the `src`
descriptor, so a picker costs zero extra round trips and cannot show options that
disagree with what the write path will accept. The route exists because the listing is
the asset *store's* surface: [[DOC-28]] §9.2's asset browser mode is the same store as a
tab, and it reaches it here rather than growing its own.

### 5. No editor changes were needed

`editor.js` passes `loaded.fields` straight to `mountFields`, which already supports
`type: 'enum'`. The loop turned out to be genuinely kind-agnostic — a good sign for the
T3 design, and worth recording as evidence rather than a coincidence.

## Design decisions made during iteration

- **Extend `copyFieldsOf`, do not rename it.** The T3 seam comment said each new kind
  "arrives by extending this one function". Renaming to `segmentFieldsOf` would have
  churned the CLI verb, the route and every caller — for a claim (AC-3, no separate write
  path) that is better proved by *sharing the surface* than by renaming it. Doc comments
  were corrected to say "exposed fields" rather than "copy" where they now overstate.
- **Union listing over registry-only.** Considered leaving `editAssetList` alone and
  adding a second "pickable" listing. Rejected: two ideas of what a site's assets are is
  exactly the duplication the project forbids, and the registry-only view was already
  wrong on every real site.
- **Membership check server-side, not just in the widget.** `mountFields` validates enum
  membership client-side. Relying on that alone would make the guarantee a property of
  the UI rather than of the surface the AI shares.

## Non-goals — deliberately deferred, not forgotten

**Framing controls** (crop, scale, scrim, rotation, edge effects, free positioning) are
**not in this ticket**, blocked on [[DOC-28]] §13 Q5: the capture/fold pipeline already
folds crops and scrims into L1, and the editor must write **the same fields**, not a
parallel vocabulary. AC-6's test pins the node's `axes` through an image swap, so the
place those parameters will live is already protected.

Also out: asset **upload** (the picker lists what exists), and any image processing.

## Known limitation (upstream, not worked around)

`webui-fields`' enum control renders each option's text as the value verbatim — there is
no per-option label — so the picker shows `/assets/hero.png` rather than a friendly name
or a thumbnail. Per [[DOC-8]] §9.4, a component gap is closed upstream, never patched or
wrapped here. Left as-is for phase 1; a labelled/thumbnail option list is an upstream ask
alongside REQ-55.

## Test plan

`tests/req118-image-selection.test.ts` — 11 UATs, two suites:

**Definition + CLI half** (always runs; jsdom over the bytes `1c render --edit` wrote,
writes through the real `1c` entry point):

| Test | AC |
|---|---|
| `..._clicking_an_image_segment_offers_a_picker_of_the_sites_assets` | 1 |
| `..._choosing_an_asset_updates_the_node_and_the_rerendered_page` | 2 |
| `..._image_edits_run_the_same_whole_definition_validator_as_the_ai_surface` | 3 |
| `..._alt_text_is_editable_alongside_the_image_and_saved_in_the_same_diff` | 4 |
| `..._an_asset_the_site_does_not_have_is_refused_and_nothing_is_applied` | 5 |
| `..._choosing_an_asset_bakes_nothing_and_changes_only_a_structured_field` | 6 |
| `..._the_asset_listing_is_callable_independently_of_the_modal` | 7 |

**Origin half** (`skipIf(!WEBUI_INSTALLED)`; real `startBuilder` server, real fetch):
picker descriptors over `/api/copy`; a save re-rendering both channels; a rejected choice
as a field-scoped 400; `/api/assets` reachable without a modal.

Notable fixture choices: a second image points **off-disk** (proving the current handle
survives in its own picker); `draft/assets/` holds a `.woff2` and a `.css` (proving the
picker excludes what no `image.src` can use); the registry declares **one** of five files
(mirroring the real-site state that made a registry-only picker useless).

AC-3 is proved by consequence rather than by assertion: an unrelated L1 range violation
makes an *image* edit fail with the identical code/message/path as `config set`, which it
could not do if it ran a validator of its own.

AC-6 is proved by fingerprinting every asset file's bytes, size and mtime across the
edit, and deep-comparing the node to `{...before, src}`.

### Regression scope

`req117-copy-editing`, `req117-edit-loop`, `req117-modal-dismiss`,
`req117-stale-edit-render`, `req116-edit-render`, `req11-structured-edit`,
`reconciliation-edit-render-channel`, `chat9-edit-hooks` — plus the full suite.

**One REQ-117 test was deliberately updated.** `req117-copy-editing`'s AC1 used the image
as its example of "a segment with nothing to edit", with the comment "its asset and
framing are T4". T4 took that role away, so the test now uses the painted **container**
(whose background is phase 2). The property under test — a segment with no fields offers
none, by derivation — is unchanged.

## Pre-existing failure, not caused by this ticket

`tests/reconciliation-edit-render-channel.test.ts:316` expects `<body data-fc-edit>` but
the render emits `<body data-fc-edit data-fc-page="home">`. The `data-fc-page` stamp is
REQ-117's; the regex was never widened. Verified failing identically on a clean tree with
this ticket's changes stashed. Left alone — it belongs to REQ-117's reconciliation, not
here.