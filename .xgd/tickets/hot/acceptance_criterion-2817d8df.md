---
uid: acceptance_criterion-2817d8df
id: AC-2353
type: acceptance_criterion
title: An invite's call-to-action is a redeemable invite link for that contact that
  signs them in without an Access challenge
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T08:23:17.183645+00:00'
updated_at: '2026-11-07T21:04:39.786001+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e0ca0a36
  kind: behavior
  regression_only: false
---

## Criterion
When an operator invites a contact, the invite message's call-to-action URL is a `/sign-in/<token>` link issued for that contact. It is never the bare origin. The link stays redeemable for 30 days. Pressing Continue on it (a POST) sets a session cookie for that contact. Every step, from GET to POST to cookie, completes with no Cloudflare Access token present.

## Verification
Drive the people invite route, capture the invite message, and assert its link matches `/sign-in/<token>` and differs from the origin. GET and then POST that link with no Access header and assert a session cookie. With the clock advanced past 30 days, assert that a fresh invite link gets the refusal page.