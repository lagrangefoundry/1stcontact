---
uid: request-130aae02
id: REQ-653
type: request
title: 'Builder: hide the build-stage progress banner once the site has been published'
created_by: EPIC-19
created_at: '2026-11-05T00:55:21.904135+00:00'
updated_at: '2026-11-05T15:24:13.301093+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-6122ba2a
  commits:
  - working_sha: f5d26b08e259eb445de85cd044f9dc9e16c45017
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 0054ec33d9b495a7ee09215730eb86933dccabd3
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  version: 0.2.781
  story_points: 2
---

## Why

The progress banner at the head of the chat column's progress area (REQ-390/398, "Where the build is", `plan-stages` in `apps/control-app/src/builder/plan-panel.js`) tracks the first build through its stages. It's very useful while the site is being made. Once the site has been published it's redundant: every stage reads done, and it takes space at the top of every session for the life of the site.

## What

- **Once the site has been published for the first time** (the site has a first `published_at`), the stage banner is no longer shown, in every later session and for the rest of the site's life.
- **What stays in the progress area:** the live status of running work (BUG-244's status widget, the workers row, and BUG-348's handling of consultant-started turns) and "How you can help" (REQ-431). Only the stage banner goes.
- **It doesn't come back** if the site is later unpublished or republished. First publish is the switch.
- **The plan itself stays reachable** wherever it is shown today (the plan panel); only the banner leaves the progress area.
- **Before the first publish nothing changes.**

## Coordination with REQ-638 (unmerged)

REQ-638 replaces the stages with nine plan pieces, whose last piece is **Live** (done when the site is published). If REQ-638 lands first, "published for the first time" is the same fact as its Live piece being done, and the banner it draws is the one hidden. If this lands first, REQ-638's merge carries the rule over to its banner. Either way the rule is driven by the site's first publish, not by a stage or piece's state.

## Test plan

`test_UAT_FC_<ID>_*` (builder plan panel, jsdom):
- A site never published: the stage banner shows as today.
- A site with a first `published_at`: on load the banner isn't rendered. The status slot and "How you can help" are still present and work (a running turn shows its status).
- The banner disappears in the open session when the first publish completes, without a reload.
- A published site that was later unpublished still shows no banner.

## What landed

- **The plan view says whether the site has ever been published.** `GET /api/plan` (and every plan write that answers the view: `/api/plan/ask`, `/api/plan/comp`, `/api/plan/board`) carries `published: true` once the plan's `milestones.published_at` is stamped (REQ-638's `sitePublished`, set once and never cleared). A site published before plans stamped it reads `published: true` from its published revisions; that revisions read happens only while the plan carries no stamp.
- **The panel stops drawing the stages.** Once a view says `published`, the progress banner hides its stage list and its "Progress" title for that site. The banner itself and its status row stay: the idle line, the running-work status widget (BUG-244), and the consultant-started-turn handling (BUG-348). "How you can help" (REQ-431) stays beside it in the progress area. A later view that says `published: false` doesn't bring the stages back, and neither does a redraw on busy/idle. Switching to another site resets the switch.
- **Without a reload.** After a successful publish the builder re-reads the plan, so the stages go in the open session.
- The plan panel on the Input board is unchanged.

## Design decisions

- REQ-638 landed first, so the banner hidden is its nine-piece banner. The switch is the site's first publish, not the Live piece's state.
- The rule lives in the view (a fact from the server), not in the client: "unpublished later" can't flip it, because the stamp is never cleared and revisions are never deleted.

## UATs

- `tests/test_UAT_FC_REQ-653_published_site_drops_the_stage_banner.test.ts` (jsdom): a site never published shows its stages; a published site loads with no stages or title, and its status row is idle and then shows a running turn; a later unpublished view still shows no stages; publishing from the real builder takes the stages off without a reload, with the status row and How you can help still in the progress area.
- `tests/test_UAT_FC_REQ-653_published_site_drops_the_stage_banner.workers.test.ts` (Worker): the plan view says `published: false` before the first publish and `true` after; a site whose plan lacks the stamp still reads published from its revisions.