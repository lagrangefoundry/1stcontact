---
uid: request-8296241f
id: REQ-396
type: request
title: 'Draft pages: a frame plus separately stored sections, assembled at render'
created_by: EPIC-24
created_at: '2026-10-10T18:27:41.339414+00:00'
updated_at: '2026-10-15T16:37:27.250653+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  epic_parent: epic-f43a7c98
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-dc31c6dc
  commits:
  - working_sha: 663c28be6321f14e442d44d8100076a742a78a87
    reconcile_sha: null
    main_sha: null
  - working_sha: af14d110ef7c4aea09a8ae61eaad93007e02720b
    reconcile_sha: null
    main_sha: null
  version: 0.2.504
---

## Status

Draft. Child of EPIC-24, piece 1 of the operator's simplified plan (2026-10-03). Independent of the lock ticket and of lagrange-framework REQ-207. It is useful on its own because a builder reads one section instead of a whole 29–41KB page.

## Intent

A page can be stored as a **frame** plus **one stored unit per section**, assembled by concatenation at render. Writing one section can never renumber, overwrite or invalidate another. A page that isn't decomposed keeps working exactly as it does today.

## Where we are, verified

- One D1 row per page: `site_pages(site_id, name, page TEXT)`. The whole L1 document is `page.l1.root` (`db/migrations/0001_baseline.sql:151`, `tools/generate/src/store/d1r2-store.ts` `readPagesOf` ~L613 and `write` ~L718).
- Addresses are positional child-index paths (`packages/site-schema/src/l1/edit.ts` `parseL1Path` ~L85, `resolveL1Node` ~L106, `replaceL1Node` ~L136). `set_l1` warns that *"every address on the page is regenerated"* after a write.
- `editL1Set` (`tools/generate/src/cli/edit.ts` ~L1243) reads all pages, replaces the subtree, validates the whole site and writes the whole page row.
- Charlie's Plumbing 2's home page is already a root `stack` whose 12 children are meaningfully-id'd sections (`emergency-bar`, `header`, `hero-section-outer`, … `footer`).

## What changes

1. **Storage.** A decomposed page's frame holds the document-level keys (`widths`, `background`, `textColor`, `resources`/fonts, `column`), the page's `modules`, SEO/metadata, and the **ordered list of section ids**. Each section is stored separately, keyed by its stable node `id` and never by index. Use D1 rows alongside `site_pages`; the exact table shape is the implementer's call. Each stored unit (the site file, a page frame, a section, or a whole undecomposed page) has a stable **file name**. The lock ticket locks by these names.
2. **Assembly.** Reads that need the whole page (render, validate, capture, publish, the builder preview) assemble frame + sections in order into today's single L1 document. The renderer and the validator are unchanged and still run on the assembled document, so node/depth caps, keyframe widths ⊆ declared widths, and every other site-wide check still hold.
3. **Addressing.** L1 tools take an optional `section` id. With it, `path` is relative to that section's root, `get_l1` returns only that section, and `set_l1`/`group_l1`/`flow_l1` write only that section's stored unit. A write to one section leaves every other section's addresses valid. Without `section`, tools behave as today, whether the page is decomposed or not; a decomposed page is assembled, edited, and its changed section(s) written back.
4. **Section conditions, checked on write and refused with a clear message:**
   - the page root is a flow stack, so sections don't position or overlap relative to each other (no cross-section negative margins or absolute geometry);
   - ids that must be unique across the page (node ids, in-page anchors such as `#quote-form-section`) are unique on the assembled page;
   - frame keys can't be changed through a section write;
   - a module instance belongs to the section that hosts its slot, or to the frame if no section does.
5. **Frame operations.** These cover adding, removing and reordering sections and changing frame keys.
6. **Decompose / recompose.** A tool (in the consultant's and builder's surfaces, and exposed through `1c`) splits an existing page mechanically by root child, refusing a page whose root isn't a flow stack (capture-derived reproduction pages typically, which stay whole). The reverse joins it back into one file. New pages may be created decomposed. No bulk migration of existing sites; pages are split on demand.
7. The `set_l1` / `get_l1` descriptions explain sections and stop telling a builder that a section write regenerates other sections' addresses.

## Out of scope

Locks (sibling ticket). Header and footer as site-wide shared sections: they stay per-page sections for now (EPIC-24's "nothing more until proven").

## Test plan

UATs through the real toolbox / `1c` entry points and the D1 store: decompose Charlie-shaped page → assembled render is byte-identical to before; write section B by its id → section A's previously read addresses still resolve to the same nodes; non-flow-stack page refuses decomposition and keeps working; duplicate-id write refused; frame-key change through a section refused; recompose round-trips; an undecomposed page's tool behaviour is unchanged.


## Implementation decisions (2026-10-15, free-coding session)

- **Assembly lives in the store.** `SiteStore.readPages` always returns the assembled page, so render, validate, capture, publish, revisions and the builder preview are unchanged. A decomposed page also reports `StoredPage.sections` (its ordered section ids). Revisions freeze assembled pages and carry no storage form.
- **Stored units and file names.** Undecomposed page: `home.json` (one unit). Decomposed page: the frame `home.json` plus one unit per section, `home.json#<section-id>`. `site.json` is the site file. The frame is the page with `l1.root.children` emptied, a `sections` list of ids, and section-owned module instances replaced by `{id, section}` stubs (so module order survives). A section unit is `{node, modules?}`.
- **D1:** new table `site_page_sections(site_id, page_name, section_id, unit)` (migration 0028); the frame stays in `site_pages.page`. **fs:** `pages/home.sections/<id>.json`. **memory:** same shape in memory. All three share one pure planner (`store/sections.ts`).
- **Writes.** A whole-page write keeps the page's current form: a decomposed page is re-split by root child and only the units that changed are written. If the written page no longer splits (only reachable outside the tools, e.g. a checkout of an older revision), it is stored whole. Explicit form changes use `form: 'whole' | 'sections'`. `SiteWrite.sections` writes exactly one section unit and nothing else.
- **Section conditions**, checked by the edit layer on every write to a decomposed page and on decompose: root is a `container` with `layout: stack` and no non-stack responsive layout; each section has an id of letters, digits, `-` or `_`; no section carries `geometry` (absolute or flow offsets); node ids in the page tree are unique. A module instance belongs to the section whose subtree holds the slot it mounts into, otherwise to the frame.
- **Section-scoped writes.** `get_l1`/`set_l1`/`group_l1`/`flow_l1` (and `describe_page`) take an optional `section`; `path` is then relative to the section root (`0` = the section). After the edit, the page is re-split. If anything other than that one section's unit changed (frame keys, page settings, the section list, another section, or a module owned elsewhere), the write is refused with a message naming what it would have changed. Otherwise only that unit is written, so every other section's addresses stay valid.
- **Frame operations:** `add_section` (node, optional `before`), `remove_section`, `move_section` (optional `before`; omitted means last). Frame keys go through the existing `set_page_style`/`use_font`/`update_page`/component tools, which write only the frame.
- **Decompose / recompose:** `decompose_page` / `recompose_page` ops in the ManagePages group (consultant and builder), plus `1c page decompose|recompose`. `add_page` takes `sections: true` to create a page already decomposed. The CLI also gets `1c section add|rm|move` and `--section` on `1c structure group|flow`.
- Charlie's Plumbing 2's real home page (local D1 copy) is the UAT fixture.


## What landed (2026-10-15)

Built as the "Implementation decisions" above describe, with these details settled during the build:

- **Removing a section removes the components it hosts.** A component belongs to the section whose subtree holds its slot, so `remove_section` takes it with the section. The answer names the components removed.
- **A section write is checked on its result.** The edited page is split exactly as the store would split it. If any unit other than the named section differs, the write is refused with a message naming what it would have changed: the page's list of sections (so a section's id can't be renamed through a section write), a component the page itself owns, the page's own settings, or `section '<id>'` (for example a write scoped to `story` that reaches the contact form owned by `quote-form-section`).
- **Every write to a decomposed page** goes through `validateOrThrow`, which re-checks the section conditions. A change that would make the root a non-stack, place a section by geometry, drop a section id or duplicate an id is refused, and the page stays decomposed.
- **The store refuses a section unit write** to a page that isn't stored as sections, or that names a section the frame doesn't list.
- **Removing a page removes its section units** (D1 rows, the fs `.sections/` directory). A page later re-added under the same name is stored whole.
- **The draft snapshot carries no storage form,** so decomposing a page is not an unpublished change. `1c copy-to-cloud` and site import copy page content, and pages land whole on the destination (pages are split on demand there).
- `describe_page` with `section` maps only that section, with section-relative addresses. Without `section`, a decomposed page also reports its `sections`. `1c page get`/`list` report `sections` too.
- The surface overview, the `l1_address` type, `describe_page`, `get_l1` and `set_l1` explain sections. `set_l1` now says that without `section` every address is regenerated, and that with `section` only that section's addresses can move. The surface version is now 19.

## UATs

- `tests/test_UAT_FC_REQ-396_page_sections.test.ts` (consultant toolbox and `1c`, fs store, Charlie's Plumbing 2's real home page):
  - decompose stores 12 section files plus the frame, and the render is byte-identical;
  - recompose round-trips;
  - a root that isn't a flow stack, or a section placed by position, is refused and the page keeps working;
  - `add_page` with `sections: true`;
  - a write to `story` leaves the frame and every other section file byte-identical, and the hero's previously read addresses still resolve;
  - a duplicate id is refused;
  - renaming a section through a section write, or reaching another section's component, is refused, and `set_page_style` writes only the frame;
  - an unscoped write rewrites only the changed section;
  - an undecomposed page behaves as before;
  - add/move/remove section, including removing hosted components.
- `tests/support/page-sections-contract.ts`, run by `tests/test_UAT_FC_REQ-396_section_storage.test.ts` (memory and fs) and `tests/test_UAT_FC_REQ-396_section_storage.workers.test.ts` (D1):
  - assembled reads are identical, with no change to the outline or snapshot;
  - a section write changes that section alone;
  - a section unit write is refused for an undecomposed page or an unknown section;
  - a whole-page write keeps the form, recompose joins the page, and a removed page takes its sections.
  - The D1 suite also checks one row per section, and that a section write rewrites only its row.
- The pinned write sets in `tests/test_UAT_FC_REQ-126_l1_surface.test.ts` and `tests/reconciliation-assistant-control-surface.test.ts` gain the five new ops.