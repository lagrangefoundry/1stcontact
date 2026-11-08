---
uid: bug-c960af0a
id: BUG-383
type: bug
title: 'Legal pages: footer links always present, and the consultant never writes
  legal pages'
created_by: EPIC-29
created_at: '2026-11-08T17:34:03.144213+00:00'
updated_at: '2026-11-08T19:44:46.253983+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  priority: medium
  parent_uid: epic-e3db69b8
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-7233c5c3
  commits:
  - working_sha: 35fefe8ef39c0fa001248e43afc96a692985e7c0
    reconcile_sha: null
    main_sha: null
  - working_sha: e7092fce616353192e427da38dd9a445ad03cad4
    reconcile_sha: null
    main_sha: null
  version: 0.2.829
---

## Symptom

Two ways a site can end up without trustworthy legal pages, both found while reviewing REQ-665 (EPIC-29, operator 2026-11-08: "I want to make sure that the consultant does not do so by accident").

1. **Footer links can silently disappear.** `tools/generate/src/render/render.ts` (REQ-665) adds the "Legal" link row to a page's footer with `footer.html.replace(/<\/footer>$/, …)`. If the footer's HTML does not end exactly in `</footer>` (trailing whitespace, a comment, a wrapper), the replace matches nothing and the page is published **with no legal links**, with no error.
2. **The consultant can invent legal pages.** Nothing stops the Site consultant writing its own "Privacy policy" or "Terms" page with made-up text, or adding footer links of its own that duplicate or contradict the platform's. The `/legal/...` addresses are not reserved, so a site page could also take one.

## Fix

1. **The legal links are always present on every web page.** If they cannot be placed inside the page's footer, the renderer writes its own footer holding them, as it already does for a page with no footer. Never silently drop them.
2. **Consultant rule** (a `consultantRules()` provider, the established pattern): every site's legal pages and footer legal links are provided by the platform; never write legal text, legal pages or legal links; send the owner to Paperwork → Legal for anything legal. The consultant's guidance on footers says the platform adds the legal row.
3. **`/legal/` is reserved.** Creating or renaming a site page to a path under `/legal/` is refused, with a message pointing to Paperwork → Legal.

No owner switch to hide the links (operator 2026-11-08: if an owner wants to hide them "that's on them"; not built).

## What changed

1. **Renderer** (`render.ts`): the legal link row is handed to `renderPart`, which writes it as the last child *inside* the `<footer data-l1-part="footer">` element it writes itself. Nothing is spliced into finished HTML, so no shape of the footer's markup can lose the row. A web page that does not carry the site's footer (no footer page, or opted out) still gets `<footer data-legal-footer>` holding just the row. Every web page gets the row exactly once: site pages, their grid continuation pages, product pages, checkout and order pages, and the legal pages themselves. In the builder the row sits inside the inert footer like the rest of it.
2. **Consultant rule 15** (`priming.json` `templates.rules`, rendered by `consultantRules()`): "**Legal pages are the platform's.** Every site's privacy policy, terms and other legal pages, and the legal links in its footer, are provided by the platform from the business's documents. Never write legal text, a legal page or a legal link yourself; for anything legal, send them to Paperwork → Legal." It is there whether or not filing is on.
3. **Footer guidance** (`l1-surface.json`, `add_page`'s description of a shared footer): "The platform adds the site's legal links (privacy policy, terms) at the bottom of the footer on every page: never add legal links of your own."
4. **`/legal` reserved** (`edit.ts`, `refuseLegalPagePath`): `add_page`, `copy_page` and `update_page` refuse a page path of `legal`, or one under `legal/` (any case, with or without a leading `/`, and the page id when no path is given), with `CONFLICT` and a message that the address is reserved for the legal pages the platform publishes from Paperwork → Legal and to send the owner there. Nothing is written. A path that only starts with the word (`legal-services`, `legal-advice`) is still an ordinary page.

## Design decisions

- **Refused in the page tools, not the site schema.** A schema rule would make a stored site that already has a page at `legal` fail validation on every later write. In the tools, such a site still loads and its page can be renamed out of the way. Nested slugs (`legal/privacy`) were already refused by the schema's one-segment rule (BUG-92), but its message suggested `legal-privacy`, which is exactly the made-up legal page this ticket prevents; the new refusal runs first and points to Paperwork → Legal instead.
- **No regex fallback.** The row is written by the same code that writes the footer element, rather than spliced in and checked afterwards. The old pattern happened to match today, because `renderPart` always ended the element with `</footer>`; the fix removes the dependency instead of guarding it.

## Test plan

`tests/test_UAT_FC_BUG-383_legal_pages_are_the_platforms.test.ts`, through the real renderer over a real shop site with a shared footer, the real `editPageAdd`/`editPageCopy`/`editPageUpdate` (what `add_page`/`copy_page`/`update_page` call), and the real consultant rule set:
- Every web page of a built site (home, shop, contact, product, checkout, order and the legal pages themselves) has exactly one legal row; it is the last child of the site's footer element and links to each legal page by title.
- A page that opts out of the site's footer gets a `data-legal-footer` footer holding just the row.
- `consultantRules()` (filing on and off) carries rule 15's wording, including Paperwork → Legal.
- `add_page`'s footer guidance says the platform adds the legal row.
- Creating (`legal/privacy`, `/legal/privacy`, `Legal`, `legal`, and an id of `legal` with no path), copying to `legal/terms`, and renaming to `legal/privacy` are each refused with `CONFLICT`, "is reserved" and Paperwork → Legal, and the page list is unchanged.
- `legal-services` / `legal-advice` are accepted as ordinary pages.