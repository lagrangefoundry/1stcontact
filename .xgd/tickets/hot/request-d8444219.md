---
uid: request-d8444219
id: REQ-658
type: request
title: 'Site header/footer: the logo links to the home page by default'
created_by: EPIC-19
created_at: '2026-11-06T19:37:48.077584+00:00'
updated_at: '2026-11-06T20:25:27.352995+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-b878e9e5
  commits:
  - working_sha: 253c57455403bcc0f808d260bf6b6ded9cf2a6d5
    reconcile_sha: null
    main_sha: null
  - working_sha: 650a61fe3265f64b1f9c8e6b19a244a0234e00aa
    reconcile_sha: null
    main_sha: null
  version: 0.2.804
  story_points: 3
---

## What changes

On every site, clicking the logo in the header (and in the footer, if it shows one) takes the visitor to the site's home page. This is the near-universal web convention and visitors expect it. Today the logo only links if the consultant happens to give it a link, so on many pages it is a dead picture.

## Behaviour

1. **Default link.** On the site's header and footer parts, the logo, found the same way as for the brand-size default (`l1LogoPath`, BUG-276: the image named `logo`, else the first image in the part), links to the site's home page when the page gives it no link of its own. The link is relative (`/`, emitted as `./` like the menu's home entry), so it works on preview builds and on the published domain.
2. **An explicit link wins.** If the consultant deliberately gives the logo a different link, that link is kept. The same holds when a group holding the logo carries a link (no link nested inside a link), and when the logo acts or zooms (one element cannot be two controls).
3. **On the home page itself** the logo still links to the home page, as is usual. Clicking it just reloads the top of the page.
4. **Accessible.** The link has an accessible name, "<business name> home page" — the business name from the site's config, else the logo's alt text, else "Home page" — so a screen reader doesn't announce an unnamed link.
5. **No visual change.** Adding the link doesn't add an underline, change colour, or move the logo. The linked-picture wrapper is `<a style="display:contents;color:inherit">`: it adds no box, and a picture drawn in its text colour (an inlined drawing's `currentColor`) keeps that colour instead of taking the browser's link blue. This applies to every linked picture, not only the logo. Only the cursor changes to a pointer.
6. **Applies to every site,** existing and new, at the next build, with no consultant action, with or without a design. Only parts drawn for a page of the site get it; a page that is not a part, and the reads that check a stored part's own nodes, are left as given. The builder's brief (`GOAL_LOGO_NOTE`, which rides every Delegate goal) says the header and footer logo links home by itself, so the builder doesn't add a duplicate link.

## Where

- `packages/site-schema/src/l1/design.ts`: `applyHomeLink`, next to `applyLogo` (BUG-276), run first in `resolveL1Design` when `place.home` is given. New `L1DesignPlace.home: { name? }`. `applyLogo`'s path walk is factored into a shared `replaceAt`.
- `packages/framework/src/l1/render.ts`: `L1RenderOptions.businessName`; `renderL1Document` passes `home` for any part. The linked-image wrapper gains `color:inherit`.
- `tools/generate/src/render/render.ts`: `renderPart` passes `site.config.businessName`.
- `tools/generate/src/cli/ai/account-core.ts`: `GOAL_LOGO_NOTE` mentions the default link.

## Design decisions

- **No Python peer.** The ticket originally called for one, but `site-schema`/`framework` in 1st Contact have no Python counterpart (the JS/Python sync rule is for lagrange-framework), so this is JS only.
- **Accessible name prefers the business name over the alt text.** Alt text is often "X logo", which would read "X logo home page"; the business name gives the "<business> home page" the ticket asks for. Alt is the fallback when no business name reaches the renderer.
- **Gated on `place.home`, as REQ-462's `arrange` is,** so validation and audit reads of a stored part don't bake a default link (with a weaker name) into what they check.
- **Colour fix found by the real-browser UAT:** the wrapper took the UA link colour. A bitmap logo looks the same, but an inlined SVG logo drawn in `currentColor` would have turned blue. The fix changes the wrapper string, so three existing pins (REQ-222, REQ-335, reconciliation-l1-navigation) were loosened to the `display:contents` prefix, and REQ-447's recorded Dina layout had four linked icons' inherited colour updated from `rgb(0,0,238)` to the text colour (position and size unchanged).
- Known limit, unchanged by this ticket: a `display:contents` link is not a keyboard tab stop in Chromium (see REQ-650), so the logo link is reachable by mouse and screen-reader link lists but not by Tab.

## Test plan

`tests/test_UAT_FC_REQ-658_the_logo_links_home.test.ts`:
- a site whose header logo has no link renders the logo wrapped in a link to the home page with the accessible name, on the home page and on another page; alt text names it when no business name is given; a non-part page is left unlinked;
- a logo with an explicit link keeps that link, and a logo inside a linked group is not linked again;
- the footer logo gets the same default;
- the builder brief says the logo links home by itself;
- in real Chromium at 375 and 1280, the linked logo's position, size, colour, decoration and outline, and the header's size, equal those with the link unwrapped; the cursor is a pointer.

Regression: BUG-276, REQ-462, REQ-222, REQ-335, BUG-199, reconciliation-l1-navigation, REQ-447 and the header/footer/part suites (BUG-235/260/281/282/286/289/323, REQ-422 ×2, REQ-448/456/463/657). The one red case, `BUG-276 … a_design_without_a_brand_is_refused…` (workers), fails the same way on clean xgd-working.