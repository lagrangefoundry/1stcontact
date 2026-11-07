---
uid: acceptance_criterion-1f2125d9
id: AC-2347
type: acceptance_criterion
title: Opening an emailed link shows a Continue page and leaves the link unused
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T08:23:12.936566+00:00'
updated_at: '2026-11-07T21:04:42.690542+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e0ca0a36
  kind: behavior
  regression_only: false
---

## Criterion
A GET (or HEAD) of `/sign-in/<token>` returns 200 and a page with a single Continue control that posts to the same `/sign-in/<token>` path. The page says what the link is for and does not depend on looking up the token. The GET sets no cookie and does not mark the token used, and it can be repeated any number of times. After any number of GETs, the link still redeems successfully on POST.

## Verification
Issue a link, GET it several times, and assert that each response is 200 with a form posting to the same path and no Set-Cookie header, and that the token's used marker is still empty. Then POST and assert that the redemption succeeds.