---
uid: acceptance_criterion-e73c9a31
id: AC-2286
type: acceptance_criterion
title: The three default templates name no business in their copy, declare only cta_url,
  carry a button plus the same URL as pasteable text; invite names '1st Contact <invite@1stcontact.io>'
  as sender, signin and lapsed fall back
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:32:27.537397+00:00'
updated_at: '2026-11-08T04:11:33.179912+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7d255580
  kind: behavior
  regression_only: false
---

## Criterion
The default templates a business is given exist for `invite`, `signin` and `lapsed`. Each has a non-empty subject, declares exactly one token, `cta_url`, and names no business in its copy: neither its subject nor its body contains "1st Contact" or any business-name token. Each body contains a call to action as a button (a styled link whose href is `{{cta_url}}`), followed by the same `{{cta_url}}` again as visible text, with wording telling the reader to copy it and paste it into their browser if the button does not work. The `invite` body also opens with a welcome stating the reader has been invited.

Sending addresses: the default `invite` template names `1st Contact <invite@1stcontact.io>` as its sending address. The default `signin` and `lapsed` templates name none, so they are sent from the deployment's fallback address. The address is a separate field from the copy, so it does not affect the copy's business neutrality.

## Verification
Seed all three templates in a fresh business store. For each one, assert:
- the subject is non-empty;
- `placeholders` equals `["cta_url"]`;
- the body contains an anchor with `href="{{cta_url}}"` and contains `{{cta_url}}` outside that anchor;
- the body contains "copy" and "paste" wording;
- neither the body nor the subject contains "1st Contact".

Also assert:
- the invite body contains a welcome/invitation sentence;
- the seeded `invite` template's `from` equals `1st Contact <invite@1stcontact.io>`;
- the seeded `signin` and `lapsed` templates carry no `from`;
- each template, rendered with a URL, renders without refusal.
