---
uid: bug-3658c1aa
id: BUG-283
type: bug
title: 'Preview: external links (''Get directions'' to Google Maps) open inside the
  preview frame and show ''refused to connect'' — open them in a new tab'
created_by: EPIC-19
created_at: '2026-10-25T18:32:20.796498+00:00'
updated_at: '2026-10-25T19:54:01.872120+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  parent_uid: epic-95bc3b15
  story_points: 1
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-2f367bf5
  commits:
  - working_sha: 3803820e3ca1fe835796192ef8ff4b004ea5874e
    reconcile_sha: null
    main_sha: null
  - working_sha: 942408bf179a1dfd9e0e4e03166ca4c6a1b0113b
    reconcile_sha: null
    main_sha: null
  version: 0.2.641
---

## Symptom

On First-Draft-Test Dina's Diner 2, the operator: "The get directions link is
broken." All three "Get directions" links (header `header-directions`, hero
`hero-directions`, find-us `findus-directions`) carry a correct, well-formed URL:
`https://www.google.com/maps/dir/?api=1&destination=1140+Olive+Dr+Davis+CA+95616`.

They break only **inside the builder's preview**. The preview iframe
(`apps/control-app/src/builder/panel.js` `makeFrame`) is same-origin and
unsandboxed. Clicking an external link navigates the frame itself to Google Maps,
which refuses to be framed (`x-frame-options: SAMEORIGIN`), so the preview shows
"refused to connect". On the published site the link works.

To the client this looks exactly like a broken site, and it affects every external
link (maps, booking, social, review sites) on every site.

## Fix

- **In the preview, an external link opens in a new browser tab.** Any link
  whose target is not one of the site's own pages opens with `target=_blank` and
  `rel=noopener`, through the preview's existing link handling. The preview frame
  never navigates away from the draft.
- Internal links keep navigating inside the preview, as now.
- The published site is unchanged. Whether site links open in a new tab is the
  site's own choice (the link's `newTab`).

## What landed

- `panel.js` `makeFrame`: on every frame `load` (shown frame, spares, refresh
  frames alike) the frame's document gets a bubble-phase `click` handler,
  `openExternalInNewTab`.
- **"External" means an `http:`/`https:` link to another origin.** Every page of
  the site is served from the builder's own origin, so another origin is exactly
  "not one of the site's own pages". Such a click is cancelled and opened with
  `window.open(url, '_blank', 'noopener')`; the frame stays on the draft.
- **Left alone (the browser's default applies):** links to the site's own pages
  (absolute or relative); non-web links (`tel:`, `mailto:` — they hand off to the
  OS and never replace the frame); non-primary-button clicks; and any click whose
  default something else already prevented — Edit mode's capture-phase handlers
  decide what a click on a link means there.
- There was no prior link-interception code in the preview; this handler is it.

## Test plan

- `tests/test_UAT_FC_BUG-283_external_links_leave_the_preview.test.ts` (jsdom,
  real `createDisplayPanel`):
  - clicking a Google Maps link opens a new tab (`window.open(MAPS, '_blank',
    'noopener')`), its navigation is cancelled, and the frame's `src` is unchanged;
  - clicking a link to another page of the site (absolute and relative) is not
    cancelled and opens no tab;
  - a click Edit mode already claimed (`preventDefault` in capture phase) opens no tab;
  - a `tel:` link opens no tab and is not cancelled.
- Re-ran BUG-248 preview refresh, REQ-248 page control, REQ-115 builder
  composition, BUG-192 preview-follows-draft: all pass.