---
uid: acceptance_criterion-e73c9a31
id: AC-2286
type: acceptance_criterion
title: The three default templates name no business, declare only cta_url, and carry
  a button plus the same URL as pasteable text
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:32:27.537397+00:00'
updated_at: '2026-11-04T18:00:32.832463+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7d255580
  kind: behavior
  regression_only: false
---

## Criterion
The default templates a business is given exist for `invite`, `signin` and `lapsed`; each has a non-empty subject, declares exactly one token, `cta_url`, and names no business (it does not contain "1st Contact" or any business-name token). Each body contains a call to action as a button (a styled link whose href is `{{cta_url}}`), followed by the same `{{cta_url}}` again as visible text with wording telling the reader to copy and paste it into their browser if the button does not work. The `invite` body additionally opens with a welcome stating the reader has been invited.

## Verification
Seed all three templates in a fresh business store. For each, assert the subject is non-empty, `placeholders` equals `["cta_url"]`, the body contains an anchor with `href="{{cta_url}}"`, contains `{{cta_url}}` outside that anchor, and contains "copy" and "paste" wording; assert no body or subject contains "1st Contact". Assert the invite body contains a welcome/invitation sentence. Render each with a URL and assert it renders without refusal.