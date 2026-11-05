---
uid: request-f9bf7c59
id: REQ-474
type: request
title: 'Library: import a client''s existing-site images and documents from a captured
  site'
created_by: EPIC-19
created_at: '2026-10-27T18:01:24.364097+00:00'
updated_at: '2026-10-27T19:21:26.616154+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-7e1b0375
  commits:
  - working_sha: b8189b59930dc141e4d69eb14127c350efa32356
    reconcile_sha: null
    main_sha: null
  - working_sha: 8f761f6b135a9ae45cc0eed6e16756318cb21453
    reconcile_sha: null
    main_sha: null
  version: 0.2.678
  story_points: 5
---

## What

Let the Site consultant bring a client's **existing site's images and other assets** into their
**Library**, from a captured site, so they can be placed on the new site like anything the client
uploaded. This serves cohort 2: "has a website, wants to improve it" ([[DOC-71]] §2, §12.1).

## Why

An existing site is the richest material a client can bring (DOC-71 §12.1): their photos, logo,
documents and voice are already on it. Today the Site consultant can capture a site
(`capture_site`) and read it (`describe_reference`, `list_references`). But what it captures stays
attached to the **reference** (as attachments on the reference ticket, under
`t/<tenant>/ref/<host>/…/assets/`) and never becomes material. `place_on_site` only places Library
items, so the consultant can read the client's own photos but not use them. It has to ask the
client to download and re-upload pictures from their own website. For the beta's existing-site
test (Sarah's site), that's the gap.

## The change

1. **An import step from a captured reference into the Library.**
   - **Pictures** (photos, logo, graphics) and **documents** linked from the site (PDF menus, price
     lists, brochures) become Library material. Each item records where it came from: the site and
     page URL, and the original file name.
   - **Skip the noise:** tracking pixels, icons under a minimum size, stylesheets, scripts, fonts,
     and duplicates (same bytes, or the same image at a smaller size; keep the largest).
2. **Choose, don't flood.** The consultant proposes what to bring in (for example "the 14 photos
   and your logo from the home and about pages") and imports those. It doesn't bulk-import
   hundreds of files. Imported items arrive in the Library like uploads, with the usual description
   step (what the picture shows, photo or graphic, focal point per BUG-282), so placing them works
   as for anything else.
3. **The client's own site only.** The import is for a site the client says is theirs (recorded on
   the reference). A **comparison site's** assets are never imported: they belong to someone else,
   and a comp is captured to be looked at, not copied.
4. **Quality follows the material spectrum** (DOC-71 §12.1–12.2). Imported pictures are evidence of
   their brand, not a commitment to use them. Small or low-quality images are flagged in the
   description so the consultant asks for better originals rather than placing a blurry copy.
5. **Tell the client.** One line, with a link to the Library: "I've brought the photos and logo from
   your site into your Library: [Library]".

## Notes

- **Reuse what exists:** the reference capture store, the material and attachment model, the
  upload description pipeline. No second asset store.
- **Rights:** the client confirms it's their site. Images they don't own (stock photos on their
  site) are still theirs to use only as they already do; the consultant doesn't claim otherwise.

## Test plan

UATs named `test_UAT_FC_REQ-474_*`:
- a captured reference of the client's own site, then the import: the chosen pictures and a linked
  PDF appear as Library items with their source page recorded, and `place_on_site` can place one;
- tracking pixels, tiny icons, stylesheets and fonts aren't imported, and a picture present at two
  sizes is imported once, at the larger size;
- importing from a reference marked as a comparison site is refused;
- imported pictures get the usual description (photo or graphic, focal point).

Related: [[DOC-71]], [[DOC-73]], [[EPIC-28]] (beta), [[BUG-282]], [[EPIC-19]].

## What was built

**Whose site it is.** The client's own site is the existing site their plan brief records
(`brief.existing_site.url`, set with `update_brief`) — that is the client saying it is theirs. A
captured page on that host (or a subdomain, `www.` included) is theirs; any other page is somebody
else's and nothing from it is offered or imported (`NOT_CLIENT_SITE`). With no existing site in the
brief, no page is the client's own. When a page of the client's own site is used, its `reference`
ticket is marked `rights: owned, republishable: true, exportable: false`, and a capture adopted after
the brief names the site is adopted as owned from the start (adoption reads every plan brief's
existing site). A comparison site is excluded by the same rule: it is not on the client's site.

**Two Library operations** (consultant's `library` surface):
- `site_material` (read, `ReadLibrary`) — `reference` (bundle name or reference number). Answers the
  pictures and documents the page offers: each with an `id`, its own file name, source address,
  page, width × height, `low_resolution` when its longer edge is under 1000px, and `in_library`
  (its Library number) when it was already brought in. Plus `skipped` counts by reason.
- `import_from_site` (write, its own `ImportFromSite` group) — `reference` and `items` (ids, 1–30).
  Each chosen file goes through the upload pipeline and arrives as an ordinary Library item:
  described (photo or graphic, focal point), labelled, indexed and placeable with `place_on_site`.
  Each records `origin: captured`, `source_url` (its address), `source_page` (the page) and its
  original file name. A file already brought in from the same address is reported under `already`,
  not added twice. A file that can't be brought in (dead link, too large) is reported under `failed`
  and the rest still arrive. The answer carries a one-line `note` for the client naming what arrived
  by Library number ("I've brought them from your site into your Library: IMAGE-12, IMAGE-13, DOC-4.").
  Asking for an id the page does not offer is refused (`SCHEMA_INVALID`) and nothing is stored.

**What counts as noise:** stylesheets, scripts, fonts and other non-picture files; pictures whose
longer edge is under 64px (icons, tracking pixels); the same bytes twice; and a smaller copy of a
picture the page also has larger — same name once size markers are removed (`?w=300`, `-300x200`,
`@2x`, `-scaled`, `-thumb`…) and the same shape within 3%. The largest is kept.

**Documents** are the PDFs the page links to (`href` in the captured `raw.html`), fetched through the
existing guarded fetch (https only) at import time. Only those on the client's own site or on a host
the page's offered pictures come from (a site builder's file store); a PDF on another site is skipped.

**Low resolution** pictures are offered and importable, flagged in the listing, and their Library
description ends with a line giving the size and saying to ask for the original before using it large.

**Talker and announcement:** `site_material` is allowed to the talker; `import_from_site` is withheld
(every Library write is). `import_from_site` is a slow tool (about a minute), so the client sees a
working line while it runs.

## Design decisions

- **No second store, no new pipeline:** pictures are read from the capture's own bundle; files enter
  the Library through `ingestFromSite`, a third entry point beside `ingestUpload` and `ingestFetch`
  that shares `ingest`. A new provenance `captured` classifies as owned / republishable / role `site`.
- **"The client says it's theirs" = the brief's existing site.** No new client-facing question; it
  replaces the router's old "every capture is third-party" placeholder.
- **The link to the Library is the Library numbers** in the one-line note: a label in the chat already
  opens the item. No separate tab-link mechanism was added.
- **Propose, then import** is two operations, so the read can be granted without the write.

## Tests

`tests/test_UAT_FC_REQ-474_existing_site_into_library.workers.test.ts` (real D1/R2 stores; the
describers and the network for the PDF are the only doubles):
- chosen pictures and a linked PDF arrive with source page/address and file name, the unchosen one
  doesn't, one is placed with `place_on_site`, and a second import adds nothing;
- icons, a tracking pixel, stylesheet, font, script, duplicate bytes, a smaller copy and an off-site
  PDF are not offered; an id the page does not offer is refused with nothing stored;
- a comparison site is refused (and every page is refused when the brief names no existing site);
- the reference of the client's own site is recorded as owned, and later adoptions are owned;
- imported pictures get the usual description (photo with focal point, logo as graphic), and a small
  one is flagged in its description.

Updated expectations: REQ-228 (the travelling grant gains `ImportFromSite`), REQ-386 (slow-tool list).