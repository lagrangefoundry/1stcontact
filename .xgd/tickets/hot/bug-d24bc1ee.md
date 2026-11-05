---
uid: bug-d24bc1ee
id: BUG-281
type: bug
title: 'L1: text with a heading type role (display/h1/h2/h3) renders as <p>, so first
  drafts have no headings at all — a heading role must render the heading element'
created_by: EPIC-19
created_at: '2026-10-25T18:32:01.744187+00:00'
updated_at: '2026-11-04T20:58:04.769098+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  parent_uid: epic-95bc3b15
  story_points: 3
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-d64035b0
  commits:
  - working_sha: c93459ea2a2a755ff0a505e57a781831c337f0a2
    reconcile_sha: null
    main_sha: null
  - working_sha: 54e7195003f0639c6478d5bd5abdf324d0890387
    reconcile_sha: null
    main_sha: null
  version: 0.2.643
---

## Symptom

First-Draft-Test Dina's Diner 2's home page has **no `<h1>`–`<h6>` elements**.
Every heading, including the hero's "The perfect stop between the Bay and Tahoe."
and every section heading ("The same counter since 1981", "The menu", …), renders
as a `<p>`. The page has 17 text nodes with `role: "h1" | "h2" | "h3" |
"display"` and no `heading` field on any of them.

For a real site this is serious:
- **SEO:** search engines read the page's structure from headings;
- **accessibility:** screen-reader users navigate by headings;
- REQ-429/BUG-256's heading checks match `h1`–`h6`, so they go silent;
- the critic's text of the page (BUG-271) marks no headings.

## Cause

Two separate fields describe one idea:
- REQ-447's **type role** (`role: "h2"`) sets how the text **looks**;
- REQ-269's **`heading`** level sets which element it **is** (`render.ts` ~4979,
  "the renderer is the sole `<h1>`…`<h6>` sink").

Builders set the role and never the level, and nothing connects the two.

## Fix

- **A heading role is a heading.** Text with `role` `display` or `h1` renders as
  `<h1>`, `h2` as `<h2>`, and `h3` as `<h3>`, unless the node sets `heading`
  explicitly, which wins. Body, lead, quote, small and caption roles stay
  non-headings.
- **One `<h1>` per page.** If a page would get several `<h1>`s from roles, the
  first (in reading order) keeps it and later ones become `<h2>`. A layout/structure
  check reports a page with no `<h1>`, or with skipped levels (an `h3` with no `h2`
  before it).
- Migration: existing pages gain heading elements where their roles say so. This
  is a semantic change only; computed sizes are unchanged (the existing
  `font-size: inherit` reset).

## Test plan

`tests/test_UAT_FC_BUG-281_a_heading_role_is_a_heading.*`:
- A page with `role: h1` and `role: h2` text renders `<h1>` and `<h2>`, with
  computed sizes from the roles unchanged.
- Explicit `heading: 3` on a `role: h2` node renders `<h3>`.
- Two `role: h1` nodes: the second renders `<h2>`.
- The structure check reports a page with no `<h1>`, and an `h3` before any `h2`.
- The REQ-429 heading checks now see the headings on a role-only page.
- Re-run the REQ-269, REQ-447 and l1 render UATs.

## What landed

- **Where the link is made.** `resolveL1Type` (`packages/site-schema/src/l1/text-style.ts`)
  — the single pass that resolves type roles for the renderer, rhythm, the checks and
  the critic — now gives a text run with its *own* heading role a `heading` level
  (`display`/`h1` → 1, `h2` → 2, `h3` → 3) before the role is dropped. A run's own
  `heading` wins. A role a *container* sets for what it contains (`type.role`) does not
  make anything a heading, and a `control` never becomes one.
- **One `<h1>` per document.** An explicit `heading: { level: 1 }` anywhere in the
  document takes the `<h1>`; otherwise the first `display`/`h1` run in reading order
  does, and every later one becomes `<h2>`.
- **A shared part never holds the page's `<h1>`.** In the site's header or footer
  document (`resolveL1Design`'s `place.part`), `display`/`h1` roles become `<h2>`; the
  page itself owns its main heading.
- **The structure check** is a new layout check, `heading_outline`
  (`tools/generate/src/cli/ai/layout-check.ts`), reporting at page level:
  - `no_h1` — the page has no `<h1>`;
  - `skipped_heading` — a heading more than one level below the heading before it
    (the outline starts at level 1, so an `h3` straight after the `h1` is reported,
    and an `h2` with no `h1` before it is not).
  Like REQ-422's header check it runs only on a site page (one that states
  `<meta name="application-name">`); a bare fixture is not a whole page.

## Design decisions

- **Heading behaviour follows the element, not just the tag.** Because the level is set
  at resolution rather than only at the renderer's tag choice, a role-only heading is a
  heading everywhere a `heading` level is read: REQ-420 rhythm (a role heading no longer
  takes the design `body`'s space, and takes the heading's default space when its role
  states none) and REQ-269's keep-with-next grouping (`aria-labelledby` wrapper). Font
  sizes are unchanged (the existing `font-size: inherit` reset).
- BUG-237's "visibly labelled contact form has no findings" UAT now also sets aside
  `no_h1`, on the same terms as it sets aside the page-level brand findings: a bare form
  page has no main heading.

## Test results

`tests/test_UAT_FC_BUG-281_a_heading_role_is_a_heading.test.ts` (6 UATs, real Chromium via
`cmdNew`/`cmdRender`/`checkLayoutAt`): role headings render h1/h2/h3 at the roles' sizes;
an explicit level wins; a later h1 role becomes h2; a shared header's display role is an
h2 while the page keeps its h1; the outline check reports `no_h1` and `skipped_heading`
(and neither on a sound outline); REQ-429's loose-heading check sees a role-only heading.
All pass; 5 fail without the fix (the explicit-level one pins existing precedence). Node project (3 batches) and the related workers suites show
no new failures against the unpatched tree.