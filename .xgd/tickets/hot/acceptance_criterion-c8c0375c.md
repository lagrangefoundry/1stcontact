---
uid: acceptance_criterion-c8c0375c
id: AC-2015
type: acceptance_criterion
title: A promotion that lands records exactly the site it landed on in the material's
  placement list, once per site, listing every site it is on
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-26T01:26:33.033491+00:00'
updated_at: '2026-10-26T01:35:17.703175+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-aacb7060
  kind: behavior
  regression_only: false
---

## Criterion

A promotion that lands records the site it landed on in the material's placement list — the list
of the client's sites the material is on, carried on the material as listed by the platform. The
site is added only after the asset is in that site's asset library, and exactly that site is
added.

The list is a set: promoting the same material onto a site it already lists leaves the site listed
once. A material promoted onto two of the client's sites lists both. Material that has never been
placed anywhere lists no sites (an empty list, not an absent or unknown value).

## Verification

Through the platform's material entry point:

- hand over a file for the site, naming a site that can be written to; list the account's material
  and observe that material's placement list is exactly that one site;
- promote the same material onto the same site again and observe the site still appears once;
- promote it onto a second site of the same client and observe both sites listed;
- observe a material that was never promoted lists no sites.