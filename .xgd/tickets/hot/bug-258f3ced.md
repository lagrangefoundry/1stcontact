---
uid: bug-258f3ced
id: BUG-260
type: bug
title: 'Shared header/footer: fonts load only from each page, so a part opened on
  its own (or on a page without that font) falls back to a plain sans-serif'
created_by: EPIC-19
created_at: '2026-10-24T00:04:21.405660+00:00'
updated_at: '2026-10-24T00:44:37.692050+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  parent_uid: epic-95bc3b15
  story_points: 3
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-c5d7d7df
  commits:
  - working_sha: 8d21a99b19195d0e4980b245e4a67cbba810b621
    reconcile_sha: null
    main_sha: null
  - working_sha: 151ad9126e362693b25f09b35089b5bc589567d6
    reconcile_sha: null
    main_sha: null
  version: 0.2.605
---

## Symptom

On Ariel's site the builder now lists the shared **header** and **footer** as
pages (REQ-422). Opened on its own, the header looks quite different from the
header on the site's pages: a different font. The operator asked whether it is
used at all.

## Cause

It is used: `header.json` (`kind: header`) is drawn above every web page
(`packages/site-schema/src/parts.ts` `carriedParts`; `tools/generate/src/render/render.ts`
~307–367). The difference is fonts:

- `header.json` sets `fontFamily: "Bebas Neue, sans-serif"` (the name) and
  `"Barlow, sans-serif"` (the links), but its `l1.resources` is `null`: it
  declares no fonts. `footer.json` is the same (Barlow, no resources).
- `@font-face` rules are emitted only from **each document's own**
  `doc.resources` (`packages/framework/src/l1/render.ts` `fontFaceRules` ~270
  and ~5832). The theme adds no fonts for this site.
- On `home.json` and `classes.json` the page's own resources load Bebas Neue,
  IBM Plex Mono and Barlow, so the header borrows them by accident. Rendered
  standalone (`render.ts` ~473–484), the header has nothing to borrow and falls
  back to a generic sans-serif.
- The same accident can break the live site: any page that does not itself load
  a font the header or footer names shows the shared part in a fallback font.

## Fix

**Fonts are the site's, so wherever a document is drawn, every font it names is
loaded.**

- When a page is rendered with its shared parts, the `@font-face` rules cover the
  fonts of the page **and** of every part it carries. When a part is rendered on
  its own, its own fonts are loaded.
- Whether that is done by putting the site's font set in one place every document
  draws from, or by unioning the carried parts' resources into the page's, is for
  the child session to decide. The rule is that no document's look depends on
  which other document happens to load a font.
- **Nothing names a font it does not get.** A check reports any document,
  including a part, that names a web font (`fontFamily`, text styles) that is
  not loaded for it. It is reported where the builder sees layout faults, so
  this cannot recur silently.
- Making a part (`editShareSection`, the starter scaffold, `use_font` with no
  page) leaves it with the fonts it names. Fix whichever path left this header
  with none.
- Ariel's header and footer render in their real fonts both standalone and on
  every page, with no hand edit to the site.

## Test plan

`tests/test_UAT_FC_BUG-260_shared_parts_load_their_fonts.*`, real Chromium:

- A site whose header names a font only the header uses: on a page that does not
  itself load that font, the header's text computes to that font (FontFace
  loaded), not a fallback. Standalone, the header also uses it.
- A part with no resources that names a page font gets that font standalone.
- The check reports a document that names a web font it does not get, and stays
  quiet when every named font is loaded.
- Re-run the REQ-422 shared-part UATs and the font/`use_font` UATs.


## What changed (implementation, 2026-10-23)

**The site's font set, in one place every document draws from.** `siteFontFaces(pages, first?)`
(`packages/site-schema/src/parts.ts`) is every face any non-email document of the site serves
(served pages, alternatives, header, footer), one per (family, weight, style), the drawn
document's own faces first so a family a page serves from its own files wins for that page.

- **Render** (`tools/generate/src/render/render.ts` `renderPage`): the site's set is bound with
  `@font-face` once per HTML document — on the page's own body, or (a page with no L1 body) on the
  part that leads it; the carried parts bind none of their own. So a header loads every font it
  names on every page, whether or not that page serves it, and a part rendered on its own (the
  builder's preview of `header`/`footer`) loads them too. Ariel's header and footer pick up the
  home page's Bebas Neue / Barlow with no edit to the site. New `L1RenderOptions.fonts`
  (`packages/framework/src/l1/render.ts`) carries the faces in place of `doc.resources.fonts`;
  absent, a lone document binds its own as before.
- **The check** — `unserved_font` site-structure finding (`siteStructureFindings`,
  `tools/generate/src/cli/edit.ts`; walker `unservedWebFonts` in `site-schema/src/l1/validate.ts`):
  any served page **or part** whose painted stack (read with text styles resolved) LEADS with a
  web font nothing on the site serves is reported — even when a generic fallback makes it
  validate. "Web font" = a family the platform font library holds; a system face
  (`Georgia, serif`) is never reported. It rides in the host's post-build report where layout
  faults are shown (`host-core.ts`), now for shared parts too, owed like the other structure lines.
  Quiet once any document serves the family.
- **Write-time rule (REQ-175)** follows the same model: a family is "served" for a document when
  the SITE serves it, so a part may paint a font another page serves, even with no generic fallback;
  a family nothing serves is still refused.
- **The editor's font field** offers the site's faces for a run on any document (it offered only
  the page's own, so a header's run showed none).
- **Write paths** (`share_section`, `add_page kind:header|footer`, `use_font`): no per-part copying
  was added. Ariel's header came from `add_page kind:header` (the starter part declares no fonts)
  followed by `set_l1` painting Bebas Neue/Barlow with a generic fallback. With fonts being the
  site's, a part needs no faces of its own, so that path is now correct as it stands; duplicating
  faces into each part would be a second copy of the same fact.

## Tests (as landed)

`tests/test_UAT_FC_BUG-260_shared_parts_load_their_fonts.test.ts` — store + `l1Operations` + real
renderer + real Chromium (`CHROMIUM_LAUNCH_ARGS=--single-process` in the sandbox):
- `header_font_loads_on_a_page_that_does_not_serve_it` — only the header serves Bebas Neue; on
  home, art and the header alone, the name's computed font is Bebas Neue and the FontFace is loaded.
- `part_with_no_fonts_of_its_own_gets_the_site_font` — Ariel's shape: header serves nothing, home
  serves Barlow; header standalone, art and home all paint a loaded Barlow.
- `a_font_another_page_serves_may_be_painted_without_a_fallback` — `fontFamily: 'Barlow'` on the
  header is accepted when home serves it; `Oswald` (served nowhere) is still refused.
- `the_check_names_a_web_font_nothing_serves` — one `unserved_font` finding naming 'Bebas Neue'
  and `use_font` on the header; none for Georgia; none once a page serves Bebas Neue.

Pre-fix, the last three fail. Regression: 216 font/render/REQ-422 suites re-run; every remaining
failure reproduced on clean xgd-working (BUG-48, REQ-101, AC867, AC1333, REQ-51, REQ-349, REQ-350,
REQ-371, REQ-148 workers, and the known capture set).